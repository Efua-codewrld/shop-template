// ==========================================
// MAIN.JS (Home Page New Arrivals Renderer)
// ==========================================

const gridContainer = document.getElementById("catalogGrid");

function normalizeHomeProduct(item) {
    const title = item.title || item.name || "Untitled Item";
    const image = item.image || item.image_url || item.imageUrl || "images/image5.jpg";
    const price = Number(item.price) || 0;

    const stockCount = typeof item.stock_count === "number"
        ? item.stock_count
        : (typeof item.stockCount === "number" ? item.stockCount : null);

    const isAvailable = typeof item.isAvailable === "boolean"
        ? item.isAvailable
        : (typeof item.is_available === "boolean"
            ? item.is_available
            : (stockCount !== null ? stockCount > 0 : true));

    const isNew = typeof item.isNew === "boolean"
        ? item.isNew
        : (typeof item.is_new === "boolean"
            ? item.is_new
            : Boolean(item.isNew ?? item.is_new));

    return {
        ...item,
        title,
        image,
        price,
        isAvailable,
        isNew
    };
}

function renderNewArrivals() {
    if (!gridContainer) return;

    gridContainer.innerHTML = "";

    const sourceList = Array.isArray(window.catalogData)
        ? window.catalogData
        : (typeof catalogData !== "undefined" && Array.isArray(catalogData) ? catalogData : []);

    const newArrivalsList = sourceList
        .map(normalizeHomeProduct)
        .filter((item) => item.isNew === true);

    if (newArrivalsList.length === 0) {
        gridContainer.innerHTML = `<p style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #777;">No new arrivals at the moment.</p>`;
        return;
    }

    newArrivalsList.forEach((item) => {
        const card = document.createElement("div");
        card.className = "product-card";

        if (!item.isAvailable) {
            card.classList.add("sold-out");
        }

        card.innerHTML = `
            <div class="card-media">
                <a href="shop.html">
                    <img src="${item.image}" alt="${item.title}">
                </a>
                ${!item.isAvailable ? '<span class="badge-sold">Sold out</span>' : ""}
            </div>
            <div class="card-overlay">
                <span class="product-title">${item.title}</span>
                <span class="product-price">GH₵${item.price}</span>
            </div>
        `;
        gridContainer.appendChild(card);
    });
}

if (gridContainer) {
    gridContainer.innerHTML = `<p style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #777;">Loading new arrivals...</p>`;
}

if (typeof catalogReadyPromise !== "undefined" && catalogReadyPromise && typeof catalogReadyPromise.then === "function") {
    catalogReadyPromise.then(() => {
        renderNewArrivals();
    });
} else {
    document.addEventListener("DOMContentLoaded", renderNewArrivals);
}