document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('mayka_token');

    // 🔐 Protección acceso
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // =========================
    // PEDIDOS
    // =========================
    const loadOrders = async () => {
        try {
            const res = await fetch('/api/pedidos', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.status === 401 || res.status === 403) {
                logout();
                return;
            }

            const pedidos = await res.json();
            renderOrders(pedidos);

        } catch (err) {
            console.error("❌ Error pedidos:", err);
            alert("Error cargando pedidos");
        }
    };

    const renderOrders = (pedidos) => {
        const tbody = document.getElementById('pedidos-body');
        tbody.innerHTML = '';

        if (pedidos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7">No hay pedidos</td></tr>`;
            return;
        }

        pedidos.forEach(p => {
            const tr = document.createElement('tr');

            const isPagado = p.estado === 'Pagado';
            const fecha = new Date(p.fecha).toLocaleString('es-ES');

            tr.innerHTML = `
                <td>#${p.id}</td>
                <td>${fecha}</td>
                <td>
                    <strong>${p.nombre} ${p.apellidos}</strong><br>
                    <small>${p.email}</small>
                </td>
                <td>${p.metodo_pago}</td>
                <td><strong>${p.total}€</strong></td>
                <td>${p.estado}</td>
                <td>
                    ${!isPagado ? `<button onclick="marcarPagado(${p.id})">✔</button>` : ''}
                    <button onclick="borrarPedido(${p.id})">🗑</button>
                </td>
            `;

            tbody.appendChild(tr);
        });

        document.getElementById('loader').style.display = 'none';
        document.getElementById('pedidos-table').style.display = 'table';
    };

    // =========================
    // CONTACTOS
    // =========================
    const loadContactos = async () => {
        try {
            const res = await fetch('/api/contactos', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) return;

            const contactos = await res.json();
            renderContactos(contactos);

        } catch (err) {
            console.error("❌ Error contactos:", err);
        }
    };

    const renderContactos = (contactos) => {
        const tbody = document.getElementById('contactos-body');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (contactos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3">No hay contactos</td></tr>`;
            return;
        }

        contactos.forEach(c => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${c.nombre} ${c.apellidos}</td>
                <td>${c.email}</td>
                <td>${c.mensaje}</td>
            `;
            tbody.appendChild(tr);
        });
    };

    // =========================
    // ACCIONES
    // =========================
    window.marcarPagado = async (id) => {
        if (!confirm('¿Marcar como pagado?')) return;

        try {
            const res = await fetch(`/api/pedidos/${id}/pagar`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) loadOrders();
            else alert("Error actualizando");

        } catch (err) {
            console.error(err);
        }
    };

    window.borrarPedido = async (id) => {
        if (!confirm('¿Eliminar pedido definitivamente?')) return;

        try {
            const res = await fetch(`/api/pedidos/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) loadOrders();
            else alert("Error borrando");

        } catch (err) {
            console.error(err);
        }
    };

    // =========================
    // LOGOUT
    // =========================
    const logout = () => {
        localStorage.removeItem('mayka_token');
        window.location.href = 'login.html';
    };

    document.getElementById('logout-btn')?.addEventListener('click', logout);

    // =========================
    // INIT
    // =========================
    loadOrders();
    loadContactos();
});