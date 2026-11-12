// 1. DATA SOURCE & FUSE.JS SETUP
const catalogData = [
    {
        id: "prod001",
        image: "images/image1.jpg",
        title: "Archive Leather Bag",
        price: 350,
        Category: "Bags",
        isAvailable: true
    },
    {
        id: "prod002",
        image: "images/image18.jpg",
        title: "Archive essential bag",
        price: 500,
        Category: "Bags",
        isAvailable: true
    },
    {
        id: "prod003",
        image: "images/image9.jpg",
        title: "Plaid sweater",
        price: 200,
        Category: "tops",
        isAvailable: true
    },
    {
        id: "prod004",
        image: "images/image8.jpg",
        title: "camo sweater and sweatpants set",
        price: 430,
        Category: "tops",
        isAvailable: true
    },
    {
        id: "prod005",
        image: "images/image4.jpg",
        title: "Archive jorts",
        price: 280,
        Category: "bottoms",
        isAvailable: false
    }
];

// Targetting HTML viewport container
const gridContainer = document.getElementById("catalogGrid");

// 2. RENDER ENGINE (Prints data into HTML boxes)
function renderCatalog(productsArray = catalogData) {
    gridContainer.innerHTML = "";

    if (productsArray.length === 0) {
        gridContainer.innerHTML = `<p style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #777;">No matching archive items found.</p>`;
        return;
    }

    productsArray.forEach(item => {
        const card = document.createElement("div");
        card.className = "shop-card";

        if (!item.isAvailable) {
            card.classList.add("Sold-out");
        }

        card.innerHTML = `
            <div class="card-media">
            <a href="product.html?id=${item.id}">
                <img src="${item.image}" alt="${item.title}">
                </a>
                ${!item.isAvailable ? '<span class="badge-sold">Sold out</span>' : ''}
            </div>
            <div class="card-info"> 
                <span class="product-title">${item.title}</span>
                <span class="product-price">GH₵${item.price}</span>
                <button class="order-btn"
                    onclick="sendWhatsAppOrder('${item.id}')"
                    ${!item.isAvailable ? 'disabled' : ''}>
                    ${item.isAvailable ? 'Order via Whatsapp' : 'SOLD OUT'}
                </button>
            </div>
        `;
        gridContainer.appendChild(card);
    });
}

// 3. WHATSAPP ORDER TRIGGER
function sendWhatsAppOrder(productId) {
    const product = catalogData.find(item => item.id === productId);
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

// 4. MOBILE DRAWER TOGGLE
const mobileToggleBtn = document.getElementById("mobileFilterToggle");
const filterSidebar = document.getElementById("filterSidebar");

if (mobileToggleBtn) {
    mobileToggleBtn.addEventListener("click", () => {
        filterSidebar.classList.toggle("active");
    });
}

// 5. FUSE.JS SETUP
const fuseOptions = {
    keys: ['title'],
    threshold: 0.4
};
const fuse = new Fuse(catalogData, fuseOptions);

// ==========================================================================
// 6. MILESTONE 3: MASTER FILTER, SEARCH & SORT PIPELINE
// ==========================================================================

const activeFilters = {
    searchQuery: "",
    category: "all",
    priceSort: "default"
};

function applyAllFilters() {
    let workingArray = [...catalogData];

    // Step A: Apply Fuse.js Search
    if (activeFilters.searchQuery.trim() !== "") {
        const fuseResults = fuse.search(activeFilters.searchQuery);
        workingArray = fuseResults.map(result => result.item);
    }

    // Step B: Apply Category Filter
    if (activeFilters.category !== "all") {
        workingArray = workingArray.filter(item => {
            return item.Category.toLowerCase() === activeFilters.category.toLowerCase();
        });
    }

    // Step C: Apply Price Sorting
    if (activeFilters.priceSort === "low-high") {
        workingArray.sort((a, b) => a.price - b.price);
    } else if (activeFilters.priceSort === "high-low") {
        workingArray.sort((a, b) => b.price - a.price);
    }

    // Step D: Render final processed list
    renderCatalog(workingArray);
}

// ==========================================================================
// 7. EVENT LISTENERS (Connecting UI to Master Pipeline)
// ==========================================================================

// Live Search Input
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

    searchInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
        }
    });
}

// Custom Dropdown UI & Filter Logic
document.addEventListener('click', (e) => {
    const catTrigger = document.getElementById('categoryDropdownTrigger');
    const catMenu = document.getElementById('categoryDropdownMenu');
    
    const priceTrigger = document.getElementById('priceDropdownTrigger');
    const priceMenu = document.getElementById('priceDropdownMenu');

    // 1. Toggle Category Dropdown Menu
    if (catTrigger && catTrigger.contains(e.target)) {
        e.stopPropagation();
        catMenu.classList.toggle('show');
        if (priceMenu) priceMenu.classList.remove('show');
        return;
    }

    // Select a Category Item
    const catItem = e.target.closest('#categoryDropdownMenu .dropdown-item');
    if (catItem && catMenu.contains(catItem)) {
        const selectedVal = catItem.getAttribute('data-value');
        document.getElementById('selectedCategoryText').textContent = catItem.textContent;
        
        catMenu.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('active'));
        catItem.classList.add('active');
        catMenu.classList.remove('show');

        // Feed into master filter pipeline
        activeFilters.category = selectedVal;
        applyAllFilters();
        return;
    }

    // 2. Toggle Price/Sort Dropdown Menu
    if (priceTrigger && priceTrigger.contains(e.target)) {
        e.stopPropagation();
        priceMenu.classList.toggle('show');
        if (catMenu) catMenu.classList.remove('show');
        return;
    }

    // Select a Price Sort Item
    const priceItem = e.target.closest('#priceDropdownMenu .dropdown-item');
    if (priceItem && priceMenu.contains(priceItem)) {
        const selectedVal = priceItem.getAttribute('data-value');
        document.getElementById('selectedPriceText').textContent = priceItem.textContent;
        
        priceMenu.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('active'));
        priceItem.classList.add('active');
        priceMenu.classList.remove('show');

        // Feed into master filter pipeline
        activeFilters.priceSort = selectedVal;
        applyAllFilters();
        return;
    }

    // 3. Click anywhere else closes both open dropdowns
    if (catMenu) catMenu.classList.remove('show');
    if (priceMenu) priceMenu.classList.remove('show');
});

// 8. INITIAL LAUNCH
renderCatalog(catalogData);