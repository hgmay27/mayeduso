document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('mayka_token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    const loadOrders = async () => {
        try {
            const res = await fetch('/api/pedidos', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.status === 401 || res.status === 403) {
                localStorage.removeItem('mayka_token');
                window.location.href = 'login.html';
                return;
            }

            const pedidos = await res.json();
            renderTable(pedidos);
        } catch (err) {
            console.error(err);
            alert("Error cargando los pedidos.");
        }
    };

    const renderTable = (pedidos) => {
        const tbody = document.getElementById('pedidos-body');
        tbody.innerHTML = '';

        if(pedidos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No hay pedidos todavía.</td></tr>';
        }

        pedidos.forEach(p => {
            const tr = document.createElement('tr');
            
            // Estado Badge
            const isPagado = p.estado === 'Pagado';
            const badgeClass = isPagado ? 'bg-pagado' : 'bg-pendiente';
            
            // Formatear Fecha
            const trDate = new Date(p.fecha).toLocaleString('es-ES');

            tr.innerHTML = `
                <td>#${p.id}</td>
                <td>${trDate}</td>
                <td>
                    <strong>${p.nombre} ${p.apellidos}</strong><br>
                    <small>Edad: ${p.edad} | 📧 ${p.email}</small><br>
                    <small>Notas: ${p.comentarios || '-'}</small>
                </td>
                <td>
                    <strong>${p.metodo_pago.toUpperCase()}</strong><br>
                    <span style="font-family:monospace; font-size:0.9em; background:#f4f4f4; padding:2px 4px; border-radius:4px;">${p.datos_pago}</span>
                </td>
                <td><strong>${p.total}€</strong></td>
                <td><span class="badge ${badgeClass}">${p.estado}</span></td>
                <td>
                    ${!isPagado ? `<button class="action-btn btn-pagar" onclick="marcarPagado(${p.id})">✔ ¿Comprobado?</button>` : ''}
                    <button class="action-btn btn-borrar" onclick="borrarPedido(${p.id})">🗑 Borrar</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        document.getElementById('loader').style.display = 'none';
        document.getElementById('pedidos-table').style.display = 'table';
    };

    window.marcarPagado = async (id) => {
        if (!confirm('¿Marcar este pedido como pagado?')) return;
        try {
            const res = await fetch(`/api/pedidos/${id}/pagar`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) loadOrders();
            else alert("Error al actualizar");
        } catch (err) {
            console.error(err);
        }
    };

    window.borrarPedido = async (id) => {
        if (!confirm('¿Estás segura de que deseas borrar este pedido para siempre?')) return;
        try {
            const res = await fetch(`/api/pedidos/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) loadOrders();
            else alert("Error al borrar");
        } catch (err) {
            console.error(err);
        }
    };

    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem('mayka_token');
        window.location.href = 'login.html';
    });

    // Iniciar carga
    loadOrders();
});
