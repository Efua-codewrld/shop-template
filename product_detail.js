// ==========================================
// PRODUCT_DETAIL.JS (Product Detail Page)
// ==========================================

function getCatalogList() {
    if (Array.isArray(window.catalogData)) return window.catalogData;
    if (typeof catalogData !== "undefined" && Array.isArray(catalogData)) return catalogData;
    return [];
}

function sendProductWhatsAppOrder(productId) {
    const list = getCatalogList();
    const selectedProduct = list.find((item) => item.id === productId);
    if (!selectedProduct) return;

    const sizeElement = document.getElementById("selectedSizeText");
    const selectedSize = sizeElement ? sizeElement.textContent : "Standard";

    const phoneNumber = "233508532866";
    const colorText = Array.isArray(selectedProduct.colors) && selectedProduct.colors.length > 0
        ? selectedProduct.colors.join(", ")
        : "Standard";

    const message = `Hello Archive! I would like to order:\n\n` +
                    `Item: ${selectedProduct.title || selectedProduct.name || "Untitled Item"}\n` +
                    `Size: ${selectedSize}\n` +
                    `Color: ${colorText}\n` +
                    `Price: GH₵${selectedProduct.price}\n\n` +
                    `Is this item available?`;

    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
}

const detailContainer = document.getElementById("productDetailContainer");

function renderProductDetail() {
    if (!detailContainer) return;

    const list = getCatalogList();
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get("id");
    const product = list.find((item) => item.id === productId);

    if (!product) {
        detailContainer.innerHTML = `
            <div style="text-align: center; padding: 80px;">
                <h2>Product not found</h2>
                <p>The item you're looking for doesn't exist or has been removed.</p>
                <a href="shop.html" style="color: inherit; text-decoration: underline; margin-top: 20px; display: inline-block;">Return to Shop</a>
            </div>
        `;
        return;
    }

    const title = product.title || product.name || "Untitled Item";
    const image = product.image || product.image_url || product.imageUrl || "images/image5.jpg";
    const category = product.category || product.Category || "General";
    const stockQty = Number(product.stock_count ?? product.stockCount ?? 0);
    const isAvailable = typeof product.isAvailable === "boolean"
        ? product.isAvailable
        : (typeof product.is_available === "boolean" ? product.is_available : stockQty > 0);

    detailContainer.innerHTML = `
        <div class="pdp-grid">
            <div class="pdp-image-wrapper">
                <img src="${image}" alt="${title}">
            </div>
            <div class="pdp-info">
                <h1>${title}</h1>
                <p class="pdp-price">GH₵${product.price}</p>
                <p class="pdp-category">Category: <strong>${category}</strong></p>
                <p class="pdp-desc">${product.description || "No description provided for this archive piece."}</p>
                <p class="pdp-stock">
                    ${stockQty > 0 ? `In Stock (${stockQty} available)` : "Out of Stock"}
                </p>
                ${Array.isArray(product.colors) && product.colors.length > 0 ? `
                    <div class="pdp-colors">
                        <span class="colors-label">Colors:</span>
                        ${product.colors.map((color) => `<span class="color-pill">${color}</span>`).join(" ")}
                    </div>
                ` : ""}

                <div class="custom-dropdown-container">
                    <button type="button" class="dropdown-trigger" id="sizeDropdownTrigger">
                        <span id="selectedSizeText">Small (S)</span>
                        <span class="arrow">▼</span>
                    </button>

                    <div class="dropdown-menu" id="sizeDropdownMenu">
                        <div class="dropdown-item active" data-value="Small (S)">Small (S)</div>
                        <div class="dropdown-item" data-value="Medium (M)">Medium (M)</div>
                        <div class="dropdown-item" data-value="Large (L)">Large (L)</div>
                        <div class="dropdown-item" data-value="Extra Large (XL)">Extra Large (XL)</div>
                    </div>
                </div>

                <div class="pdp-actions" style="margin-top: 25px; display: flex; flex-direction: column; gap: 15px;">
                    <button class="order-btn"
                        onclick="sendProductWhatsAppOrder('${product.id}')"
                        ${!isAvailable ? "disabled" : ""}>
                        ${isAvailable ? "Order via Whatsapp" : "SOLD OUT"}
                    </button>

                    <button class="add-to-cart-btn" ${!isAvailable ? "disabled" : ""}>
                        ${isAvailable ? "Add to Cart" : "SOLD OUT"}
                    </button>
                </div>
            </div>
        </div>
    `;

    const addToCartBtn = detailContainer.querySelector(".add-to-cart-btn");
    if (addToCartBtn && isAvailable) {
        addToCartBtn.addEventListener("click", () => {
            const sizeElement = document.getElementById("selectedSizeText");
            const selectedSize = sizeElement ? sizeElement.textContent : "Standard";

            if (typeof addToCart === "function") {
                addToCart({
                    id: product.id,
                    name: title,
                    price: product.price,
                    image,
                    size: selectedSize
                });
            }
        });
    }
}

document.addEventListener("click", (e) => {
    const trigger = document.getElementById("sizeDropdownTrigger");
    const menu = document.getElementById("sizeDropdownMenu");
    const selectedText = document.getElementById("selectedSizeText");

    if (!trigger || !menu) return;

    if (trigger.contains(e.target)) {
        e.stopPropagation();
        menu.classList.toggle("show");
        return;
    }

    const item = e.target.closest(".dropdown-item");
    if (item && menu.contains(item)) {
        if (selectedText) selectedText.textContent = item.getAttribute("data-value");

        menu.querySelectorAll(".dropdown-item").forEach((i) => i.classList.remove("active"));
        item.classList.add("active");

        menu.classList.remove("show");
        return;
    }

    menu.classList.remove("show");
});

if (detailContainer) {
    detailContainer.innerHTML = `<div style="text-align: center; padding: 80px;"><p>Loading item details...</p></div>`;
}

if (typeof catalogReadyPromise !== "undefined" && catalogReadyPromise && typeof catalogReadyPromise.then === "function") {
    catalogReadyPromise.then(() => {
        renderProductDetail();
    });
} else {
    document.addEventListener("DOMContentLoaded", renderProductDetail);
}