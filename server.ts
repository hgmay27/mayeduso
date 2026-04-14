require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 10000;

// 🚨 Validación ENV
if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL no definida");
    process.exit(1);
}

// 🔵 Conexión PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// ENV
const SECRET_KEY = process.env.JWT_SECRET || 'fallback_secret';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// =========================
// AUTH MIDDLEWARE
// =========================
function authenticateToken(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Sin token' });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ error: 'Token inválido' });
        req.user = user;
        next();
    });
}

// =========================
// LOGIN
// =========================
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_USER && password === ADMIN_PASS) {
        const token = jwt.sign({ user: username }, SECRET_KEY, { expiresIn: '8h' });
        return res.json({ token });
    }
    res.status(401).json({ error: 'Credenciales incorrectas' });
});

// =========================
// CLIENTES Y PEDIDOS (NORMALIZADO)
// =========================

// GET PEDIDOS: Usamos INNER JOIN para traer los datos del cliente vinculado
app.get('/api/pedidos', authenticateToken, async (req, res) => {
    try {
        const sql = `
            SELECT p.*, c.nombre, c.apellidos, c.email, c.edad 
            FROM pedidos p
            INNER JOIN clientes c ON p.cliente_id = c.id
            ORDER BY p.fecha DESC
        `;
        const result = await pool.query(sql);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CHECKOUT: Lógica de dos pasos (Cliente -> Pedido)
app.post('/api/checkout', async (req, res) => {
    const client = await pool.connect(); // Usamos cliente para manejar la transacción
    try {
        const { nombre, apellidos, edad, email, comentarios, metodo_pago, datos_pago, total, items } = req.body;
        
        await client.query('BEGIN'); // Inicio de transacción

        // 1. Upsert del cliente (Si el email existe, actualiza datos; si no, crea)
        const upsertCliente = `
            INSERT INTO clientes (nombre, apellidos, edad, email)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (email) DO UPDATE SET 
                nombre = EXCLUDED.nombre, 
                apellidos = EXCLUDED.apellidos,
                edad = EXCLUDED.edad
            RETURNING id;
        `;
        const resCliente = await client.query(upsertCliente, [nombre, apellidos, edad, email]);
        const clienteId = resCliente.rows[0].id;

        // 2. Insertar pedido con el ID del cliente
        const insertPedido = `
            INSERT INTO pedidos 
            (cliente_id, comentarios, metodo_pago, datos_pago, total, items, estado)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id;
        `;
        const result = await client.query(insertPedido, [
            clienteId, comentarios, metodo_pago, datos_pago, total, JSON.stringify(items), 'Pendiente'
        ]);

        await client.query('COMMIT'); // Guardar todo
        res.json({ pedidoId: result.rows[0].id });

    } catch (err) {
        await client.query('ROLLBACK'); // Si algo falla, deshacer todo
        console.error(err);
        res.status(500).json({ error: 'Error al procesar el pedido' });
    } finally {
        client.release();
    }
});

// =========================
// CONTACTOS
// =========================
app.get('/api/contactos', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM contactos ORDER BY id DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/contacto', async (req, res) => {
    try {
        const { nombre, apellidos, email, mensaje } = req.body;
        await pool.query(
            'INSERT INTO contactos (nombre, apellidos, email, mensaje) VALUES ($1,$2,$3,$4)',
            [nombre, apellidos, email, mensaje]
        );
        res.status(201).json({ message: 'Contacto guardado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// =========================
// OPERACIONES ADMIN
// =========================
app.put('/api/pedidos/:id/pagar', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('UPDATE pedidos SET estado = $1 WHERE id = $2', ['Pagado', id]);
        res.json({ message: 'Pedido actualizado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/pedidos/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM pedidos WHERE id = $1', [id]);
        res.json({ message: 'Pedido eliminado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor en puerto ${PORT}`);
});