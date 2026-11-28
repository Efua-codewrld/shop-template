// ==========================================
// SHOP_GRID.JS (Catalog Grid & JS Filter Pipeline)
// ==========================================

const gridContainer = document.getElementById("catalogGrid");

let fuse = new Fuse([], {
    keys: ["title", "category"],
    threshold: 0.4
});

function renderCatalog(productsArray = catalogData) {
    if (!gridContainer) return;
    gridContainer.innerHTML = "";

    if (!productsArray || productsArray.length === 0) {
        gridContainer.innerHTML = `<p style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #777;">No matching archive items found.</p>`;
        return;
    }

    productsArray.forEach((item) => {
        const card = document.createElement("div");
        card.className = "shop-card";

        if (!item.isAvailable) {
            card.classList.add("Sold-out");
        }

        card.innerHTML = `
            <div class="card-media">
                <a href="product.html?id=${encodeURIComponent(item.id)}">
                    <img src="${item.image}" alt="${item.title}">
                </a>
                ${!item.isAvailable
                    ? '<span class="badge-sold">Sold out</span>'
                    : `<button type="button" class="quick-add-btn" data-id="${item.id}" aria-label="Quick add to bag">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                        </svg>
                       </button>`
                }
            </div>
            <div class="card-info">
                <span class="product-title">${item.title}</span>
                <span class="product-price">GH₵${item.price}</span>
                <button class="order-btn"
                    onclick="sendWhatsAppOrder('${item.id}')"
                    ${!item.isAvailable ? "disabled" : ""}>
                    ${item.isAvailable ? "Order via Whatsapp" : "SOLD OUT"}
                </button>
            </div>
        `;
        gridContainer.appendChild(card);
    });
}

function sendWhatsAppOrder(productId) {
    const product = catalogData.find((item) => item.id === productId);
    if (!product) return;

    const testPhone = "233508532866";
    const orderMessage = `Hi! I want to order these items from your shop:\n\n` +
                         `*Item:* ${product.title}\n` +
                         `*price:* GH₵${product.price}\n` +
                         `Please let me know if it's available!`;

    const encodedMessage = encodeURIComponent(orderMessage);
    const whatsAppUrl = `https://wa.me/${testPhone}?text=${encodedMessage}`;
    window.open(whatsAppUrl, "_blank");
}

const mobileToggleBtn = document.getElementById("mobileFilterToggle");
const filterSidebar = document.getElementById("filterSidebar");

if (mobileToggleBtn && filterSidebar) {
    mobileToggleBtn.addEventListener("click", () => {
        filterSidebar.classList.toggle("active");
    });
}

const activeFilters = {
    searchQuery: "",
    category: "all",
    priceSort: "default"
};

function applyAllFilters() {
    let workingArray = [...catalogData];

    if (activeFilters.searchQuery.trim() !== "") {
        const fuseResults = fuse.search(activeFilters.searchQuery);
        workingArray = fuseResults.map((result) => result.item);
    }

    if (activeFilters.category !== "all") {
        workingArray = workingArray.filter((item) => {
            return (item.Category || item.category || "").toLowerCase() === activeFilters.category.toLowerCase();
        });
    }

    if (activeFilters.priceSort === "low-high") {
        workingArray.sort((a, b) => a.price - b.price);
    } else if (activeFilters.priceSort === "high-low") {
        workingArray.sort((a, b) => b.price - a.price);
    }

    renderCatalog(workingArray);
}

const searchInput = document.querySelector("#searchBar");
let debounceTimer;

if (searchInput) {
    searchInput.addEventListener("input", (event) => {
        activeFilters.searchQuery = event.target.value;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            applyAllFilters();
        }, 300);
    });

    searchInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
        }
    });
}

document.addEventListener("click", (e) => {
    const catTrigger = document.getElementById("categoryDropdownTrigger");
    const catMenu = document.getElementById("categoryDropdownMenu");

    const priceTrigger = document.getElementById("priceDropdownTrigger");
    const priceMenu = document.getElementById("priceDropdownMenu");

    if (catTrigger && catTrigger.contains(e.target)) {
        e.stopPropagation();
        if (catMenu) catMenu.classList.toggle("show");
        if (priceMenu) priceMenu.classList.remove("show");
        return;
    }

    const catItem = e.target.closest("#categoryDropdownMenu .dropdown-item");
    if (catItem && catMenu && catMenu.contains(catItem)) {
        const selectedVal = catItem.getAttribute("data-value");
        const selectedCategoryEl = document.getElementById("selectedCategoryText");
        if (selectedCategoryEl) selectedCategoryEl.textContent = catItem.textContent;

        catMenu.querySelectorAll(".dropdown-item").forEach((i) => i.classList.remove("active"));
        catItem.classList.add("active");
        catMenu.classList.remove("show");

        activeFilters.category = selectedVal;
        applyAllFilters();
        return;
    }

    if (priceTrigger && priceTrigger.contains(e.target)) {
        e.stopPropagation();
        if (priceMenu) priceMenu.classList.toggle("show");
        if (catMenu) catMenu.classList.remove("show");
        return;
    }

    const priceItem = e.target.closest("#priceDropdownMenu .dropdown-item");
    if (priceItem && priceMenu && priceMenu.contains(priceItem)) {
        const selectedVal = priceItem.getAttribute("data-value");
        const selectedPriceEl = document.getElementById("selectedPriceText");
        if (selectedPriceEl) selectedPriceEl.textContent = priceItem.textContent;

        priceMenu.querySelectorAll(".dropdown-item").forEach((i) => i.classList.remove("active"));
        priceItem.classList.add("active");
        priceMenu.classList.remove("show");

        activeFilters.priceSort = selectedVal;
        applyAllFilters();
        return;
    }

    if (catMenu) catMenu.classList.remove("show");
    if (priceMenu) priceMenu.classList.remove("show");
});

if (gridContainer) {
    gridContainer.addEventListener("click", (e) => {
        const quickBtn = e.target.closest(".quick-add-btn");
        if (!quickBtn) return;

        const productId = quickBtn.getAttribute("data-id");
        const product = catalogData.find((item) => item.id === productId);

        if (product && product.isAvailable && typeof addToCart === "function") {
            addToCart({
                id: product.id,
                name: product.title,
                price: product.price,
                image: product.image,
                size: "Small (S)"
            });
        }
    });
}

if (gridContainer) {
    gridContainer.innerHTML = `<p style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #777;">Loading archive catalog...</p>`;
}

catalogReadyPromise.then((items) => {
    fuse = new Fuse(items, {
        keys: ["title", "category"],
        threshold: 0.4
    });
    renderCatalog(items);
});