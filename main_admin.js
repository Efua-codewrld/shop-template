/* =========================================================================
1. DOM ELEMENT REFERENCES
   ========================================================================= */
const loginScreen = document.getElementById("loginScreen");
const adminDashboard = document.getElementById("adminDashboard");
const passwordInput = document.getElementById("adminPassword");
const loginBtn = document.getElementById("loginBtn");
const errorMessage = document.getElementById("errorMessage");

const currentPassInput = document.getElementById("currentPassword");
const newPassInput = document.getElementById("newPassword");
const confirmPassInput = document.getElementById("confirmPassword");
const updatePassBtn = document.getElementById("updatePassBtn");
const passMessage = document.getElementById("passMessage");
const logoutBtn = document.getElementById("logoutBtn");

const menuBtn = document.getElementById("menuBtn");
const backdrop = document.getElementById("backdrop");
const slideMenu = document.getElementById("slideMenu");
const menuClose = document.getElementById("menuClose");

const navLinks = document.querySelectorAll(".nav-link");
const inventoryView = document.getElementById("inventoryView");
const addItemView = document.getElementById("addItemView");
const quickAddBtn = document.getElementById("quickAddBtn");
const backToInventoryBtn = document.getElementById("backToInventoryBtn");

const inventoryGrid = document.getElementById("inventoryGrid");
const addProductForm = document.getElementById("addProductForm");
const productImageInput = document.getElementById("productImageInput");
const imagePreview = document.getElementById("imagePreview");

const formTitle = document.getElementById("formTitle");
const formSubmitBtn = document.getElementById("formSubmitBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");

/* =========================================================================
2. AUTHENTICATION & SESSION STATE
   ========================================================================= */
function applyAuthState() {
    if (!localStorage.getItem("adminPassword")) {
        localStorage.setItem("adminPassword", "secretPassword123");
    }

    const isLoggedIn = localStorage.getItem("isAdminLoggedIn") === "true";
    if (isLoggedIn) {
        if (loginScreen) loginScreen.style.display = "none";
        if (adminDashboard) adminDashboard.style.display = "block";
    renderInventory();
    } else {
        if (loginScreen) loginScreen.style.display = "flex";
        if (adminDashboard) adminDashboard.style.display = "none";
    }/*else {
        if (loginScreen) loginScreen.style.display = "flex";
        if (adminDashboard) adminDashboard.style.display = "none";
    }*/
}

function attemptLogin() {
    if (!passwordInput) return;
    const enteredValue = passwordInput.value;
    const currentSavedPassword = localStorage.getItem("adminPassword");

    if (enteredValue === currentSavedPassword) {
        localStorage.setItem("isAdminLoggedIn", "true");
        if (loginScreen) loginScreen.style.display = "none";
        if (adminDashboard) adminDashboard.style.display = "block";
        renderInventory();
        passwordInput.value = "";
        if (errorMessage) errorMessage.style.display = "none";
    } else {
        if (errorMessage) {
            errorMessage.textContent = "Incorrect passcode. Please try again.";
            errorMessage.style.display = "block";
        }
        passwordInput.value = "";
    }
}

if (loginBtn) {
    loginBtn.addEventListener("click", attemptLogin);
}

if (passwordInput) {
    passwordInput.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            attemptLogin();
        }
    });
}

if (updatePassBtn) {
    updatePassBtn.addEventListener("click", () => {
        const currentVal = currentPassInput ? currentPassInput.value : "";
        const newVal = newPassInput ? newPassInput.value : "";
        const confirmVal = confirmPassInput ? confirmPassInput.value : "";
        const savedPassword = localStorage.getItem("adminPassword");

        if (!passMessage) return;

        if (currentVal !== savedPassword) {
            passMessage.textContent = "Current password is incorrect.";
            passMessage.style.color = "#b33a3a";
            return;
        }

        if (newVal !== confirmVal) {
            passMessage.textContent = "New passwords do not match.";
            passMessage.style.color = "#b33a3a";
            return;
        }

        if (newVal.length < 6) {
            passMessage.textContent = "Password must be at least 6 characters long.";
            passMessage.style.color = "#b33a3a";
            return;
        }

        localStorage.setItem("adminPassword", newVal);
        passMessage.textContent = "Password updated successfully!";
        passMessage.style.color = "#2d5a27";

        if (currentPassInput) currentPassInput.value = "";
        if (newPassInput) newPassInput.value = "";
        if (confirmPassInput) confirmPassInput.value = "";
    });
}

if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("isAdminLoggedIn");
        closeMenu();
        if (adminDashboard) adminDashboard.style.display = "none";
        if (loginScreen) loginScreen.style.display = "flex";
        if (passwordInput) passwordInput.value = "";
    });
}

/* =========================================================================
3. PAIRED DATABASE SETUP ('atelier_products_db' in localStorage)
   ========================================================================= */
const DB_KEY = "atelier_products_db";

const starterProducts = [
    {
        id: "prod_101",
        name: "Structured Mini Tote",
        title: "Structured Mini Tote",
        category: "Bags",
        Category: "Bags",
        price: 280.00,
        imageUrl: "images/image5.jpg",
        image: "images/image5.jpg",
        colors: ["Espresso", "Butter Yellow", "Black"],
        stockCount: 5,
        inStock: true,
        isAvailable: true,
        isNew: true,
        description: "",
        createdAt: Date.now()
    }
];

function getProductsDB() {
    const rawData = localStorage.getItem(DB_KEY);
    if (!rawData) {
        localStorage.setItem(DB_KEY, JSON.stringify(starterProducts));
        return starterProducts;
    }

    try {
        const parsed = JSON.parse(rawData);
        return Array.isArray(parsed) ? parsed : starterProducts;
    } catch (err) {
        console.error("Failed to read products DB:", err);
        return starterProducts;
    }
}

function saveProductsDB(productsArray) {
    try {
        localStorage.setItem(DB_KEY, JSON.stringify(productsArray));
        return true;
    } catch (err) {
        console.error("Failed to save to localStorage (likely image size quota):", err);
        alert("Could not save product—the uploaded image may be too large for browser storage. Try a smaller photo or local image.");
        return false;
    }
}

/* =========================================================================
4. SLIDE-OUT DRAWER & BACKDROP LOGIC
   ========================================================================= */
function toggleMenu() {
    if (!slideMenu || !backdrop || !menuBtn) return;
    const isOpen = slideMenu.classList.toggle("open");
    backdrop.classList.toggle("open", isOpen);
    menuBtn.setAttribute("aria-expanded", isOpen);
}

function closeMenu() {
    if (slideMenu) slideMenu.classList.remove("open");
    if (backdrop) backdrop.classList.remove("open");
    if (menuBtn) menuBtn.setAttribute("aria-expanded", "false");
}

if (menuBtn) menuBtn.addEventListener("click", toggleMenu);
if (menuClose) menuClose.addEventListener("click", closeMenu);
if (backdrop) backdrop.addEventListener("click", closeMenu);

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && slideMenu && slideMenu.classList.contains("open")) {
        closeMenu();
    }
});

/* =========================================================================
5. VIEW SWITCHING & FORM MODE MANAGEMENT
   ========================================================================= */
let editingProductId = null;
let uploadedImageDataUrl = "images/image5.jpg";

function resetFormMode() {
    editingProductId = null;
    if (addProductForm) addProductForm.reset();
    if (productImageInput) productImageInput.value = "";
    uploadedImageDataUrl = "images/image5.jpg";
    if (imagePreview) imagePreview.src = "images/image5.jpg";

    if (formTitle) formTitle.textContent = "Add New Product";
    if (formSubmitBtn) formSubmitBtn.textContent = "Save to Master Inventory";
    if (cancelEditBtn) cancelEditBtn.hidden = true;
}

function switchView(targetViewId) {
    if (!targetViewId) return;

    if (targetViewId === "addItemView") {
        if (inventoryView) inventoryView.hidden = true;
        if (addItemView) addItemView.hidden = false;
    } else {
        if (addItemView) addItemView.hidden = true;
        if (inventoryView) inventoryView.hidden = false;
    }

    navLinks.forEach((link) => {
        const isMatch = link.dataset.target === targetViewId;
        link.classList.toggle("active", isMatch);
    });

    closeMenu();
}

navLinks.forEach((link) => {
    link.addEventListener("click", () => {
        if (!link.dataset.target) return;
        if (link.dataset.target === "addItemView") {
            resetFormMode();
        }
        switchView(link.dataset.target);
    });
});

if (quickAddBtn) {
    quickAddBtn.addEventListener("click", () => {
        resetFormMode();
        switchView("addItemView");
    });
}

if (backToInventoryBtn) {
    backToInventoryBtn.addEventListener("click", () => {
        resetFormMode();
        switchView("inventoryView");
    });
}

if (cancelEditBtn) {
    cancelEditBtn.addEventListener("click", () => {
        resetFormMode();
        switchView("inventoryView");
    });
}

/* =========================================================================
6. GALLERY IMAGE PICKER & LIVE PREVIEW (FileReader)
   ========================================================================= */
if (productImageInput) {
    productImageInput.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            uploadedImageDataUrl = e.target.result;
            if (imagePreview) imagePreview.src = uploadedImageDataUrl;
        };
        reader.readAsDataURL(file);
    });
}

/* =========================================================================
7. ADD / UPDATE PRODUCT FORM SUBMISSION (Writes to 'atelier_products_db')
   ========================================================================= */
if (addProductForm) {
    addProductForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const name = document.getElementById("productName").value.trim();
        const category = document.getElementById("productCategory").value.trim();
        const price = parseFloat(document.getElementById("productPrice").value) || 0;
        const stockCount = parseInt(document.getElementById("productStock").value, 10) || 0;
        const description = document.getElementById("productDescription")
    ? document.getElementById("productDescription").value.trim()
    : "";

        const rawColors = document.getElementById("productColors").value;
        const colorsArray = rawColors
            .split(",")
            .map((color) => color.trim())
            .filter((color) => color !== "");

        const products = getProductsDB();
        const finalImage = uploadedImageDataUrl || "images/image5.jpg";

        if (editingProductId) {
            const index = products.findIndex((item) => item.id === editingProductId);
            if (index !== -1) {
                const existing = products[index];
                products[index] = {
                    ...existing,
                    name: name,
                    title: name,
                    category: category,
                    Category: category,
                    price: price,
                    imageUrl: finalImage,
                    image: finalImage,
                    description: description,
                    Description: description,
                    colors: colorsArray,
                    stockCount: stockCount,
                    inStock: stockCount > 0,
                    isAvailable: stockCount > 0
                };
            }
        } else {
            const newProduct = {
                id: "prod_" + Date.now(),
                name: name,
                title: name,
                category: category,
                Category: category,
                price: price,
                imageUrl: finalImage,
                image: finalImage,
                description: description,
                Description: description,
                colors: colorsArray,
                stockCount: stockCount,
                inStock: stockCount > 0,
                isAvailable: stockCount > 0,
                isNew: true,
                description: "",
                createdAt: Date.now()
            };
            products.unshift(newProduct);
        }

        const saved = saveProductsDB(products);
        if (!saved) return;

        resetFormMode();
        renderInventory();
        switchView("inventoryView");
    });
}

/* =========================================================================
8. RENDER INVENTORY MASTER LIST & OWNER ACTIONS (Edit / Stock / Delete)
   ========================================================================= */
const categoryLabels = {
    tops: "Tops & Sweaters",
    bottoms: "Bottoms & Jorts",
    bags: "Bags & Accessories"
};

function renderInventory() {
    const products = getProductsDB();
    if (!inventoryGrid) return;

    inventoryGrid.innerHTML = "";

    if (products.length === 0) {
        inventoryGrid.innerHTML = `<p class="section-subtext">No items in inventory yet. Click "+ Add Item" to add your first product.</p>`;
        return;
    }

    products.forEach((product) => {
        const displayName = product.name || product.title || "Untitled Item";
        const rawCategory = (product.category || product.Category || "General").toLowerCase();
        const displayCategory = categoryLabels[rawCategory] || (product.category || product.Category || "General");
        const displayImage = product.imageUrl || product.image || "images/image5.jpg";
        const displayPrice = Number(product.price) || 0;
        const displayStock = typeof product.stockCount === "number"
            ? product.stockCount
            : (product.isAvailable === false ? 0 : 1);
        const displayColors = Array.isArray(product.colors) ? product.colors : [];

        const colorPillsHTML = displayColors
            .map((color) => `<span class="color-tag">${color}</span>`)
            .join("");

        const stockText = displayStock > 0 ? `${displayStock} in stock` : "Sold Out";
        const badgeClass = displayStock > 0 ? "stock-badge" : "stock-badge out-of-stock";

        const card = document.createElement("article");
        card.className = "product-card";
        card.innerHTML = `
            <div class="card-media">
                <img src="${displayImage}" alt="${displayName}">
                <span class="${badgeClass}">${stockText}</span>
            </div>
            <div class="card-body">
                <span class="card-category">${displayCategory}</span>
                <h3 class="card-title">${displayName}</h3>
                <p class="card-price">GHS ${displayPrice.toFixed(2)}</p>
                <div class="color-list">${colorPillsHTML}</div>
                <div class="card-actions">
                    <button type="button" class="btn-card" onclick="startEditProduct('${product.id}')">Edit</button>
                    <button type="button" class="btn-card" onclick="updateStock('${product.id}', 1)">+1 Stock</button>
                    <button type="button" class="btn-card" onclick="updateStock('${product.id}', -1)">-1 Stock</button>
                    <button type="button" class="btn-card btn-delete" onclick="deleteProduct('${product.id}')">Delete</button>
                </div>
            </div>
        `;

        inventoryGrid.appendChild(card);
    });
}

function startEditProduct(productId) {
    const products = getProductsDB();
    const target = products.find((item) => item.id === productId);
    if (!target) return;

    editingProductId = target.id;

    document.getElementById("productName").value = target.name || target.title || "";
    document.getElementById("productCategory").value = target.category || target.Category || "";
    document.getElementById("productPrice").value = Number(target.price) || 0;
    document.getElementById("productColors").value = Array.isArray(target.colors) ? target.colors.join(", ") : "";
    document.getElementById("productStock").value = typeof target.stockCount === "number"
        ? target.stockCount
        : (target.isAvailable === false ? 0 : 1);
    if (document.getElementById("productDescription")) {
    document.getElementById("productDescription").value = target.description || target.Description || "";
    }

    if (productImageInput) productImageInput.value = "";
    uploadedImageDataUrl = target.imageUrl || target.image || "images/image5.jpg";
    if (imagePreview) imagePreview.src = uploadedImageDataUrl;

    const labelName = target.name || target.title || "Product";
    if (formTitle) formTitle.textContent = `Edit Product: ${labelName}`;
    if (formSubmitBtn) formSubmitBtn.textContent = "Update Product";
    if (cancelEditBtn) cancelEditBtn.hidden = false;

    switchView("addItemView");
}

function updateStock(productId, change) {
    const products = getProductsDB();
    const target = products.find((item) => item.id === productId);
    if (!target) return;

    const currentStock = typeof target.stockCount === "number"
        ? target.stockCount
        : (target.isAvailable === false ? 0 : 1);

    const nextStock = Math.max(0, currentStock + change);
    target.stockCount = nextStock;
    target.inStock = nextStock > 0;
    target.isAvailable = nextStock > 0;

    if (saveProductsDB(products)) {
        renderInventory();
    }
}

function deleteProduct(productId) {
    const products = getProductsDB();
    const updatedProducts = products.filter((item) => item.id !== productId);
    if (saveProductsDB(updatedProducts)) {
        renderInventory();
    }
}

/* =========================================================================
9. INITIALIZE AUTH & DASHBOARD ON PAGE LOAD
   ========================================================================= */
applyAuthState();
/*renderInventory();*/