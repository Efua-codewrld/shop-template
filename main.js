// ==========================================
// MAIN.JS (Home Page New Arrivals Renderer)
// ==========================================

const gridContainer = document.getElementById("catalogGrid");

function renderNewArrivals() {
    if (!gridContainer) return;
    
    gridContainer.innerHTML = "";

    // catalogData comes directly from products.js / localStorage
    const newArrivalsList = catalogData.filter(item => item.isNew === true);

    if (newArrivalsList.length === 0) {
        gridContainer.innerHTML = `<p style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #777;">No new arrivals at the moment.</p>`;
        return;
    }

    newArrivalsList.forEach(item => {
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
                ${!item.isAvailable ? '<span class="badge-sold">Sold out</span>' : ''}
            </div>
            <div class="card-overlay">
                <span class="product-title">${item.title}</span>
                <span class="product-price">GH₵${item.price}</span>
            </div>
        `;
        gridContainer.appendChild(card);
    });
}

renderNewArrivals();