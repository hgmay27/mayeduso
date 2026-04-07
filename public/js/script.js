document.addEventListener("DOMContentLoaded", function () {
    // ---- AÑO DEL COPYRIGHT DINÁMICO ----
    const currentYearEl = document.getElementById("current-year");
    if (currentYearEl) currentYearEl.innerText = new Date().getFullYear();

    // ---- FUNCION TOAST (NOTIFICACIONES) ----
    function showToast(message, type = 'success') {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerText = message;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    // ---- MENU HAMBURGUESA ----
    const menuToggle = document.querySelector(".menu-toggle");
    const navLinks = document.getElementById("nav-links");
    if (menuToggle && navLinks) {
        menuToggle.addEventListener("click", () => {
            navLinks.classList.toggle("active");
        });
    }

    // ---- LÓGICA DEL CARRITO ----
    let cart = [];
    
    // Elementos del DOM
    const cartIconBtn = document.getElementById("cart-icon-btn");
    const cartCount = document.getElementById("cart-count");
    const cartModal = document.getElementById("cart-modal");
    const closeCartBtn = document.getElementById("close-cart");
    const cartItemsContainer = document.getElementById("cart-items");
    const cartTotalPrice = document.getElementById("cart-total-price");
    const openCheckoutBtn = document.getElementById("checkout-btn");

    const checkoutModal = document.getElementById("checkout-modal");
    const closeCheckoutBtn = document.getElementById("close-checkout");
    const checkoutForm = document.getElementById("checkout-form");

    // Botones de añadir al carrito
    const addToCartBtns = document.querySelectorAll(".add-to-cart-btn");
    addToCartBtns.forEach(btn => {
        btn.addEventListener("click", function (e) {
            e.preventDefault();
            const id = this.getAttribute("data-id");
            const name = this.getAttribute("data-name");
            const price = parseFloat(this.getAttribute("data-price"));
            
            // Buscar si existe un input de cantidad para este servicio
            let qty = 1;
            const qtyInput = document.getElementById("qty-" + id);
            if (qtyInput) {
                const parsed = parseInt(qtyInput.value, 10);
                if (isNaN(parsed) || parsed <= 0) {
                    alert("Añade al menos 1 unidad para poder añadirlo al carrito.");
                    qtyInput.value = 1;
                    return;
                }
                qty = parsed;
            }
            
            // Verificar si el producto ya está en el carrito
            const existingItem = cart.find(item => item.id === id);
            if (existingItem) {
                existingItem.qty += qty;
            } else {
                cart.push({ id, name, price, qty });
            }
            
            updateCartUI();
            showToast(`${qty}x ${name} añadido(s) al carrito.`);
        });
    });

    function updateCartUI() {
        if (cartCount) cartCount.innerText = cart.length;
        if (cartItemsContainer) {
            cartItemsContainer.innerHTML = "";
            let total = 0;
            cart.forEach((item, index) => {
                const itemQty = item.qty || 1; // Fallback por si hay algo viejo
                const itemTotalPrice = item.price * itemQty;
                total += itemTotalPrice;
                
                const itemBase = itemTotalPrice / 1.21;
                const itemIva = itemTotalPrice - itemBase;

                const div = document.createElement("div");
                // Añadimos la clase CSS en lugar de estilos en línea
                div.className = "cart-item";

                div.innerHTML = `
                    <div class="cart-item-header">
                        <span class="cart-item-title">${item.name} 
                            <span class="cart-item-qty">
                                <button class="qty-adj-btn qty-minus" data-id="${item.id}">-</button>
                                x${itemQty}
                                <button class="qty-adj-btn qty-plus" data-id="${item.id}">+</button>
                            </span>
                        </span>
                        <button class="remove-btn cart-item-remove-btn" data-index="${index}" title="Eliminar">❌</button>
                    </div>
                    <div class="cart-item-details">
                        <span class="cart-item-base">Base: ${itemBase.toFixed(2)}€</span>
                        <span class="cart-item-iva">IVA: ${itemIva.toFixed(2)}€</span>
                        <span class="cart-item-total">Total: ${itemTotalPrice.toFixed(2)}€</span>
                    </div>
                `;
                cartItemsContainer.appendChild(div);
            });
            // Lógica factura: IVA y subtotal
            const subtotal = total / 1.21;
            const iva = total - subtotal;
            
            const subtotalEl = document.getElementById("cart-subtotal");
            const ivaEl = document.getElementById("cart-iva");
            const invoiceDetails = document.getElementById("cart-invoice-details");

            if (invoiceDetails) {
                if (cart.length > 0) {
                    invoiceDetails.style.display = "block";
                    if (subtotalEl) subtotalEl.innerText = subtotal.toFixed(2);
                    if (ivaEl) ivaEl.innerText = iva.toFixed(2);
                } else {
                    invoiceDetails.style.display = "none";
                }
            }

            if (cartTotalPrice) cartTotalPrice.innerText = total.toFixed(2);

            // Botones de eliminar item
            document.querySelectorAll(".remove-btn").forEach(btn => {
                btn.addEventListener("click", function () {
                    const idx = parseInt(this.getAttribute("data-index"));
                    const itemToRemove = cart[idx];
                    
                    // Resetear el input numérico en la página "servicios.html" a 1
                    if (itemToRemove && itemToRemove.id) {
                        const qtyInput = document.getElementById("qty-" + itemToRemove.id);
                        if (qtyInput) qtyInput.value = 1;
                    }
                    
                    cart.splice(idx, 1);
                    updateCartUI();
                });
            });

            // Lógica para los botones de + y - en el carrito
            document.querySelectorAll(".qty-minus").forEach(btn => {
                btn.addEventListener("click", function () {
                    const id = this.getAttribute("data-id");
                    const item = cart.find(i => i.id === id);
                    if (item && item.qty > 1) {
                        item.qty--;
                        updateCartUI();
                    }
                });
            });

            document.querySelectorAll(".qty-plus").forEach(btn => {
                btn.addEventListener("click", function () {
                    const id = this.getAttribute("data-id");
                    const item = cart.find(i => i.id === id);
                    if (item) {
                        item.qty++;
                        updateCartUI();
                    }
                });
            });
        }
    }

    // Modal Carrito
    if (cartIconBtn) {
        cartIconBtn.addEventListener("click", (e) => {
            e.preventDefault();
            cartModal.classList.remove("hidden");
            cartModal.style.display = "flex";
        });
    }
    if (closeCartBtn) {
        closeCartBtn.addEventListener("click", () => {
            cartModal.classList.add("hidden");
            cartModal.style.display = "none";
            document.querySelectorAll("input[id^='qty-']").forEach(input => input.value = 1);
        });
    }

    // Modal Checkout
    if (openCheckoutBtn) {
        openCheckoutBtn.addEventListener("click", () => {
            if (cart.length === 0) {
                showToast("El carrito está vacío", "error");
                return;
            }
            cartModal.style.display = "none";
            checkoutModal.classList.remove("hidden");
            checkoutModal.style.display = "flex";
        });
    }
    if (closeCheckoutBtn) {
        closeCheckoutBtn.addEventListener("click", () => {
            checkoutModal.classList.add("hidden");
            checkoutModal.style.display = "none";
            document.querySelectorAll("input[id^='qty-']").forEach(input => input.value = 1);
        });
    }

    // --- LÓGICA DE MÉTODOS DE PAGO ---
    const pagoRadios = document.querySelectorAll('input[name="metodo-pago"]');
    const pagoBizum = document.getElementById('pago-bizum-field');
    const pagoBanco = document.getElementById('pago-banco-field');
    const pagoPaypal = document.getElementById('pago-paypal-field');
    
    const inputBizum = document.getElementById('chk-bizum');
    const inputBanco = document.getElementById('chk-banco');
    const inputPaypal = document.getElementById('chk-paypal');

    pagoRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (pagoBizum) pagoBizum.style.display = 'none';
            if (pagoBanco) pagoBanco.style.display = 'none';
            if (pagoPaypal) pagoPaypal.style.display = 'none';
            
            if (inputBizum) inputBizum.removeAttribute('required');
            if (inputBanco) inputBanco.removeAttribute('required');
            if (inputPaypal) inputPaypal.removeAttribute('required');

            if (e.target.value === 'bizum') {
                if (pagoBizum) pagoBizum.style.display = 'block';
                if (inputBizum) inputBizum.setAttribute('required', 'true');
            } else if (e.target.value === 'banco') {
                if (pagoBanco) pagoBanco.style.display = 'block';
                if (inputBanco) inputBanco.setAttribute('required', 'true');
            } else if (e.target.value === 'paypal') {
                if (pagoPaypal) pagoPaypal.style.display = 'block';
                if (inputPaypal) inputPaypal.setAttribute('required', 'true');
            }
        });
    });

    // Enviar Checkout
    if (checkoutForm) {
        checkoutForm.addEventListener("submit", async function (e) {
            e.preventDefault();
            if (cart.length === 0) return showToast("El carrito está vacío.", "error");

            const total = cart.reduce((sum, item) => sum + item.price, 0);

            // Recoger Método de pago seleccionado
            const metodo_pago_radio = document.querySelector('input[name="metodo-pago"]:checked');
            const metodo_pago = metodo_pago_radio ? metodo_pago_radio.value : 'bizum';
            
            let datos_pago = '';
            if (metodo_pago === 'bizum') datos_pago = inputBizum ? inputBizum.value : '';
            else if (metodo_pago === 'banco') datos_pago = inputBanco ? inputBanco.value : '';
            else if (metodo_pago === 'paypal') datos_pago = inputPaypal ? inputPaypal.value : '';

            const data = {
                nombre: document.getElementById("chk-nombre").value,
                apellidos: document.getElementById("chk-apellidos").value,
                edad: parseInt(document.getElementById("chk-edad").value),
                email: document.getElementById("chk-email").value,
                comentarios: document.getElementById("chk-comentarios").value,
                metodo_pago: metodo_pago,
                datos_pago: datos_pago,
                total: total,
                items: cart
            };

            try {
                const response = await fetch('http://localhost:3000/api/checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                if (response.ok) {
                    showToast("¡Pedido realizado con éxito!");
                    cart = [];
                    updateCartUI();
                    checkoutModal.style.display = "none";
                    checkoutForm.reset();
                } else {
                    const err = await response.json();
                    showToast("Error en la compra: " + (err.error || "Desconocido"), "error");
                }
            } catch (error) {
                console.error("Error:", error);
                showToast("Error de conexión. ¿El servidor está encendido?", "error");
            }
        });
    }

    // ---- LÓGICA DEL FORMULARIO DE CONTACTO (Original) ----
    const contactForm = document.getElementById("contact-form");
    if (contactForm) {
        contactForm.addEventListener("submit", function (e) {
            e.preventDefault();
            const formData = new FormData(contactForm);
            const nombre = formData.get("nombre");
            const apellidos = formData.get("apellidos");
            showToast("Gracias por tu mensaje, " + nombre + " " + apellidos + "! Pronto nos pondremos en contacto.");
            contactForm.reset();
        });
    }

    // ---- LÓGICA DE API EXTERNA PÚBLICA (FRASE DEL DÍA) ----
    const apiQuoteBox = document.getElementById("api-quote-box");
    const apiQuoteText = document.getElementById("api-quote-text");
    const apiQuoteAuthor = document.getElementById("api-quote-author");
    const apiLoading = document.getElementById("api-loading");
    const apiRefreshBtn = document.getElementById("api-refresh-btn");

    async function fetchRandomQuote() {
        if (!apiQuoteBox || !apiLoading) return;
        
        apiLoading.style.display = "block";
        apiLoading.innerText = "Cargando frase para reflexionar...";
        apiQuoteBox.style.display = "none";
        
        try {
            // 1. Obtenemos una frase aleatoria de DummyJSON (da frases infinitas pero en inglés)
            const resEn = await fetch("https://dummyjson.com/quotes/random");
            const dataEn = await resEn.json();
            
            if (dataEn && dataEn.quote) {
                // 2. Usamos una segunda API pública (MyMemory) para traducir esa frase al español sobre la marcha
                const textToTranslate = encodeURIComponent(dataEn.quote);
                const resEs = await fetch(`https://api.mymemory.translated.net/get?q=${textToTranslate}&langpair=en|es`);
                const dataEs = await resEs.json();
                
                let finalQuote = dataEn.quote; // Fallback por si falla el traductor
                if (dataEs && dataEs.responseData && dataEs.responseData.translatedText) {
                    finalQuote = dataEs.responseData.translatedText;
                }
                
                apiQuoteText.innerText = `"${finalQuote}"`;
                apiQuoteAuthor.innerText = `- ${dataEn.author || "Anónimo"}`;
                apiLoading.style.display = "none";
                apiQuoteBox.style.display = "block";
                return;
            }
            apiLoading.innerText = "No se pudo cargar la frase hoy :(";
        } catch (error) {
            console.error("Error al conectar con la API externa:", error);
            apiLoading.innerText = "Error de conexión al cargar la frase.";
        }
    }

    // --- LÓGICA DEL BLOG (Rodando por la actualidad) ---
    const newsContainer = document.getElementById("news-container");
    if (newsContainer) {
        // Utilizamos la API pública rss2json para convertir el RSS de Educación a JSON de forma gratuita y sin keys
        const rssUrl = "https://diarioeducacion.com/feed/";
        fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`)
            .then(res => res.json())
            .then(data => {
                if (data && data.status === "ok" && data.items.length > 0) {
                    newsContainer.innerHTML = ""; // Limpiar loader
                    
                    // Mostrar las 6 noticias más recientes
                    data.items.slice(0, 6).forEach(item => {
                        const article = document.createElement("article");
                        article.className = "news-card";
                        
                        // Extraer imagen del closure si existe
                        let imgHtml = "";
                        if (item.enclosure && item.enclosure.link) {
                            imgHtml = `<img src="${item.enclosure.link}" alt="Imagen de la noticia">`;
                        } else if (item.thumbnail) {
                            imgHtml = `<img src="${item.thumbnail}" alt="Imagen de la noticia">`;
                        }
                        
                        // Extraer un resumen sin HTML integrado por seguridad visual
                        let desc = item.description.replace(/<[^>]+>/g, '').substring(0, 140) + "...";

                        article.innerHTML = `
                            ${imgHtml}
                            <h3><a href="${item.link}" target="_blank">${item.title}</a></h3>
                            <p class="news-date">${new Date(item.pubDate).toLocaleDateString("es-ES", { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            <p>${desc}</p>
                            <a href="${item.link}" target="_blank" class="read-more">Leer noticia completa</a>
                        `;
                        newsContainer.appendChild(article);
                    });
                } else {
                    newsContainer.innerHTML = "<p>En estos momentos no hay noticias recientes.</p>";
                }
            })
            .catch(err => {
                console.error("Error cargando noticias:", err);
                newsContainer.innerHTML = "<p>Error de conexión al cargar la actualidad educativa.</p>";
            });
    }

    if (apiRefreshBtn) {
        apiRefreshBtn.addEventListener("click", fetchRandomQuote);
        fetchRandomQuote(); // Cargar la primera frase automáticamente
    }
});