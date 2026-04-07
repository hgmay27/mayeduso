require('dotenv').config();
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 10000;

// Variables de entorno cargadas
const SECRET_KEY = process.env.JWT_SECRET || 'fallback_secret_key';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.send('¡El servidor está funcionando!');
});

// Inicializar Base de Datos SQLite
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error al abrir la base de datos', err.message);
    } else {
        console.log('Conectado a la base de datos SQLite.');
        db.run(`CREATE TABLE IF NOT EXISTS pedidos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            apellidos TEXT NOT NULL,
            edad INTEGER NOT NULL,
            email TEXT NOT NULL,
            comentarios TEXT,
            metodo_pago TEXT NOT NULL,
            datos_pago TEXT NOT NULL,
            estado TEXT DEFAULT 'Pendiente',
            total REAL NOT NULL,
            items TEXT NOT NULL,
            fecha DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) {
                console.error('Error al crear la tabla pedidos', err);
            } else {
                console.log('Tabla "pedidos" lista.');
            }
        });
    }
});

// Middleware de Autenticación JWT
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ error: 'El token es inválido o ha expirado.' });
        req.user = user;
        next();
    });
}

// --- RUTAS PÚBLICAS ---
app.post('/api/checkout', (req, res) => {
    const { nombre, apellidos, edad, email, comentarios, metodo_pago, datos_pago, total, items } = req.body;

    // 1. Validaciones básicas obligatorias
    if (!nombre || !apellidos || !edad || !email || !metodo_pago || !datos_pago || !total || !items) {
        return res.status(400).json({ error: 'Faltan datos obligatorios del formulario o del carrito' });
    }
    
    // 2. Validación de sólo Letras para Nombre y Apellidos
    const textoRegex = /^[A-Za-zÁÉÍÓÚáéíóúñÑüÜ\s]+$/;
    if (!textoRegex.test(nombre) || !textoRegex.test(apellidos)) {
        return res.status(400).json({ error: 'El nombre y los apellidos sólo pueden contener letras' });
    }

    // 3. Validación estricta de Email (Backend)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'El correo electrónico no tiene un formato válido' });
    }

    // 3. Validación estricta de Pasarelas de Pago
    if (metodo_pago === 'bizum') {
        const bizumRegex = /^[67]\d{8}$/;
        if (!bizumRegex.test(datos_pago)) return res.status(400).json({ error: 'El Bizum requiere 9 números empezando por 6 o 7' });
    } else if (metodo_pago === 'banco') {
        const ibanRegex = /^[a-zA-Z0-9]{9,24}$/;
        if (!ibanRegex.test(datos_pago)) return res.status(400).json({ error: 'El formato cuenta/IBAN debe tener 9 a 24 caracteres' });
    } else if (metodo_pago === 'paypal') {
        if (!emailRegex.test(datos_pago)) return res.status(400).json({ error: 'La cuenta PayPal debe ser un correo válido' });
    } else {
        return res.status(400).json({ error: 'Método de pago malicioso no reconocido' });
    }

    const itemsJson = typeof items === 'string' ? items : JSON.stringify(items);
    const sql = `INSERT INTO pedidos (nombre, apellidos, edad, email, comentarios, metodo_pago, datos_pago, total, items, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.run(sql, [nombre, apellidos, edad, email, comentarios, metodo_pago, datos_pago, total, itemsJson, 'Pendiente'], function(err) {
        if (err) {
            console.error('Error insertando el pedido:', err.message);
            return res.status(500).json({ error: 'Error interno del servidor al procesar el pedido' });
        }
        res.status(201).json({ message: 'Pedido registrado correctamente', pedidoId: this.lastID });
    });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    // Login muy básico estilo Junior Fullstack
    if (username === ADMIN_USER && password === ADMIN_PASS) {
        const token = jwt.sign({ user: username }, SECRET_KEY, { expiresIn: '8h' });
        res.json({ token });
    } else {
        res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
    }
});

// --- RUTAS PRIVADAS (ADMIN) ---
app.get('/api/pedidos', authenticateToken, (req, res) => {
    db.all('SELECT * FROM pedidos ORDER BY fecha DESC', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

app.put('/api/pedidos/:id/pagar', authenticateToken, (req, res) => {
    const { id } = req.params;
    db.run('UPDATE pedidos SET estado = ? WHERE id = ?', ['Pagado', id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Pedido no encontrado' });
        res.json({ message: 'Pedido marcado como pagado' });
    });
});

app.delete('/api/pedidos/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM pedidos WHERE id = ?', [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Pedido no encontrado' });
        res.json({ message: 'Pedido eliminado correctamente' });
    });
});

// --- FALLBACK GENÉRICO (404) ---
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor en puerto ${PORT}`);
});
