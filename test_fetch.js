const http = require('http');

const data = JSON.stringify({
    nombre: "Mayka",
    apellidos: "Tests",
    edad: 28,
    email: "cliente@mayka.test",
    comentarios: "Prueba de la pasarela",
    metodo_pago: "bizum",
    datos_pago: "654321987",
    total: 30,
    items: [{id: 1, price: 30}]
});

const req = http.request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/checkout',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
    }
}, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Body:', body);
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.write(data);
req.end();
