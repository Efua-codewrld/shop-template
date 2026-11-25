// ==========================================
// 1. DOM ELEMENT SELECTIONS
// ==========================================
const cartTriggerBtn = document.querySelector(".cart-trigger-btn");
const cartBadge = document.querySelector(".cart-badge");
const cartDrawer = document.getElementById("cart-drawer");
const cartOverlay = document.getElementById("cart-overlay");
const closeCartBtn = document.getElementById("close-cart-btn");
const cartItemsContainer = document.getElementById("cart-items-container");
const cartSubtotalEl = document.getElementById("cart-subtotal");

// ==========================================
// 2. STATE (THE SOURCE OF TRUTH)
// ==========================================
let cart = JSON.parse(localStorage.getItem("archive_cart")) || [];

// ==========================================
// 3. DRAWER OPEN / CLOSE LOGIC
// ==========================================
function openCart() {
    if (cartDrawer) cartDrawer.classList.add("active");
    if (cartOverlay) cartOverlay.classList.add("active");
}

function closeCart() {
    if (cartDrawer) cartDrawer.classList.remove("active");
    if (cartOverlay) cartOverlay.classList.remove("active");
}

if (cartTriggerBtn) cartTriggerBtn.addEventListener("click", openCart);
if (closeCartBtn) closeCartBtn.addEventListener("click", closeCart);
if (cartOverlay) cartOverlay.addEventListener("click", closeCart);

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && cartDrawer && cartDrawer.classList.contains("active")) {
        closeCart();
    }
});

// ==========================================
// 4. CORE CART ACTIONS
// ==========================================
function saveAndRender() {
    localStorage.setItem("archive_cart", JSON.stringify(cart));
    renderCart();
}

// Accepts product objects using either admin or catalog field names
function addToCart(product) {
    const itemName = product.name || product.title || "Untitled Item";
    const itemImage = product.image || product.imageUrl || "images/image5.jpg";
    const itemPrice = Number(product.price) || 0;
    const itemSize = product.size || product.selectedColor || "Standard";

    const existingItem = cart.find(
        (item) => item.id === product.id && item.size === itemSize
    );

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: itemName,
            image: itemImage,
            price: itemPrice,
            size: itemSize,
            quantity: 1
        });
    }

    saveAndRender();
    openCart();
}

function updateQuantity(index, change) {
    if (!cart[index]) return;
    cart[index].quantity += change;

    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }

    saveAndRender();
}

function removeItem(index) {
    if (!cart[index]) return;
    cart.splice(index, 1);
    saveAndRender();
}

// ==========================================
// 5. THE RENDER LOOP (UI UPDATES)
// ==========================================
function renderCart() {
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
    if (cartBadge) {
        cartBadge.textContent = totalItems;
    }

    if (!cartItemsContainer) return;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `<p class="empty-cart-msg">Your bag is currently empty.</p>`;
        if (cartSubtotalEl) cartSubtotalEl.textContent = `GHS 0.00`;
        return;
    }

    let subtotal = 0;
    cartItemsContainer.innerHTML = "";

    cart.forEach((item, index) => {
        const safePrice = Number(item.price) || 0;
        const safeImage = item.image || item.imageUrl || "images/image5.jpg";
        const safeName = item.name || item.title || "Untitled Item";
        const safeSize = item.size || "Standard";

        subtotal += safePrice * item.quantity;

        const itemEl = document.createElement("div");
        itemEl.classList.add("cart-item");
        itemEl.innerHTML = `
            <img src="${safeImage}" alt="${safeName}">
            <div class="cart-item-details">
                <div>
                    <h4>${safeName}</h4>
                    <small>Option: ${safeSize}</small>
                    <p>GHS ${safePrice.toFixed(2)}</p>
                </div>
                <div class="cart-item-controls">
                    <button type="button" class="qty-btn" onclick="updateQuantity(${index}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button type="button" class="qty-btn" onclick="updateQuantity(${index}, 1)">+</button>
                    <button type="button" class="remove-item-btn" onclick="removeItem(${index})">Remove</button>
                </div>
            </div>
        `;
        cartItemsContainer.appendChild(itemEl);
    });

    if (cartSubtotalEl) {
        cartSubtotalEl.textContent = `GHS ${subtotal.toFixed(2)}`;
    }
}

renderCart();