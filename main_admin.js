/* =========================================================================
1. DOM ELEMENT REFERENCES
   ========================================================================= */
const API_BASE_URL = "http://127.0.0.1:8000";

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
const productIsNewInput = document.getElementById("productIsNew");
const prodDescriptionInput = document.getElementById("prodDescription");

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
    }
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
3. BACKEND API PRODUCT HELPERS
   ========================================================================= */
let adminProductsCache = [];

function formatApiError(errData, fallbackStatus) {
    if (!errData) return `Request failed (${fallbackStatus})`;
    if (typeof errData.detail === "string") return errData.detail;
    if (Array.isArray(errData.detail)) {
        return errData.detail
            .map((item) => {
                const field = Array.isArray(item.loc) ? item.loc.slice(1).join(".") : "";
                return field ? `${field}: ${item.msg}` : (item.msg || JSON.stringify(item));
            })
            .join("\n");
    }
    return errData.message || `Request failed (${fallbackStatus})`;
}

function normalizeAdminProduct(item) {
    const resolvedName = item.name || item.title || "Untitled Item";
    const resolvedCategory = item.category || item.Category || "General";
    const resolvedImage = item.image_url || item.imageUrl || item.image || "images/image5.jpg";
    const resolvedStock = typeof item.stock_count === "number"
        ? item.stock_count
        : (typeof item.stockCount === "number" ? item.stockCount : 0);
    const resolvedAvailable = typeof item.is_available === "boolean"
        ? item.is_available
        : (typeof item.isAvailable === "boolean" ? item.isAvailable : resolvedStock > 0);
    const resolvedNew = typeof item.is_new === "boolean"
        ? item.is_new
        : Boolean(item.isNew);

    return {
        ...item,
        id: item.id,
        name: resolvedName,
        title: resolvedName,
        category: resolvedCategory,
        Category: resolvedCategory,
        price: Number(item.price) || 0,
        image_url: resolvedImage,
        imageUrl: resolvedImage,
        image: resolvedImage,
        colors: Array.isArray(item.colors) ? item.colors : [],
        stock_count: resolvedStock,
        stockCount: resolvedStock,
        is_available: resolvedAvailable,
        isAvailable: resolvedAvailable,
        is_new: resolvedNew,
        isNew: resolvedNew,
        description: item.description || ""
    };
}

async function fetchAdminProducts() {
    const response = await fetch(`${API_BASE_URL}/products`);
    if (!response.ok) {
        throw new Error(`Failed to fetch products (${response.status})`);
    }
    const data = await response.json();
    const list = Array.isArray(data)
        ? data
        : (Array.isArray(data.products) ? data.products : []);
    adminProductsCache = list.map(normalizeAdminProduct);
    return adminProductsCache;
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
let selectedImageValue = "images/image5.jpg";
let isUploadingImage = false;

function resetFormMode() {
    editingProductId = null;
    isUploadingImage = false;
    if (addProductForm) addProductForm.reset();
    if (productImageInput) productImageInput.value = "";
    if (productIsNewInput) productIsNewInput.checked = false;
    if (prodDescriptionInput) prodDescriptionInput.value = "";
    selectedImageValue = "images/image5.jpg";
    if (imagePreview) imagePreview.src = "images/image5.jpg";

    if (formTitle) formTitle.textContent = "Add New Product";
    if (formSubmitBtn) {
        formSubmitBtn.disabled = false;
        formSubmitBtn.textContent = "Save to Master Inventory";
    }
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
6. CLIENT-SIDE IMAGE COMPRESSION & BACKEND UPLOAD
   ========================================================================= */
function compressImageInBrowser(file, maxDimension = 1400, quality = 0.82) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error("Could not read selected image file."));
        reader.onload = (e) => {
            const img = new Image();
            img.onerror = () => reject(new Error("Selected file is not a valid image."));
            img.onload = () => {
                let { width, height } = img;

                if (width > maxDimension || height > maxDimension) {
                    if (width > height) {
                        height = Math.round((height * maxDimension) / width);
                        width = maxDimension;
                    } else {
                        width = Math.round((width * maxDimension) / height);
                        height = maxDimension;
                    }
                }

                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error("Image compression failed."));
                            return;
                        }
                        const compressedFile = new File([blob], "upload.webp", {
                            type: "image/webp"
                        });
                        resolve(compressedFile);
                    },
                    "image/webp",
                    quality
                );
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

if (productImageInput) {
    productImageInput.addEventListener("change", async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        isUploadingImage = true;
        if (formSubmitBtn) {
            formSubmitBtn.disabled = true;
            formSubmitBtn.textContent = "Compressing & uploading image...";
        }

        try {
            const compressedFile = await compressImageInBrowser(file);

            if (imagePreview) {
                imagePreview.src = URL.createObjectURL(compressedFile);
            }

            const formData = new FormData();
            formData.append("file", compressedFile);

            const response = await fetch(`${API_BASE_URL}/upload-image`, {
                method: "POST",
                body: formData
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => null);
                throw new Error(formatApiError(errData, response.status));
            }

            const data = await response.json();
            selectedImageValue = data.image_url;
            if (imagePreview) imagePreview.src = selectedImageValue;
        } catch (err) {
            console.error("Image upload failed:", err);
            alert(err.message || "Image upload failed. Please try another photo.");
            productImageInput.value = "";
        } finally {
            isUploadingImage = false;
            if (formSubmitBtn) {
                formSubmitBtn.disabled = false;
                formSubmitBtn.textContent = editingProductId ? "Update Product" : "Save to Master Inventory";
            }
        }
    });
}

/* =========================================================================
7. ADD / UPDATE PRODUCT FORM SUBMISSION (POST / PATCH to FastAPI)
   ========================================================================= */
if (addProductForm) {
    addProductForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (isUploadingImage) {
            alert("Please wait for the image to finish uploading.");
            return;
        }

        const name = document.getElementById("productName").value.trim();
        const category = document.getElementById("productCategory").value.trim();
        const price = parseFloat(document.getElementById("productPrice").value) || 0;
        const stockCount = parseInt(document.getElementById("productStock").value, 10) || 0;
        const description = prodDescriptionInput ? prodDescriptionInput.value.trim() : "";
        const isNew = productIsNewInput ? productIsNewInput.checked : false;

        const rawColors = document.getElementById("productColors").value;
        const colorsArray = rawColors
            .split(",")
            .map((color) => color.trim())
            .filter((color) => color !== "");

        const finalImage = selectedImageValue || "images/image5.jpg";

        if (formSubmitBtn) formSubmitBtn.disabled = true;

        try {
            if (editingProductId) {
                const payload = {
                    name,
                    title: name,
                    category,
                    price,
                    colors: colorsArray,
                    stock_count: stockCount,
                    is_available: stockCount > 0,
                    is_new: isNew,
                    description,
                    image_url: finalImage
                };

                const response = await fetch(`${API_BASE_URL}/products/${encodeURIComponent(editingProductId)}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const errData = await response.json().catch(() => null);
                    throw new Error(formatApiError(errData, response.status));
                }
            } else {
                const payload = {
                    id: `prod_${Date.now()}`,
                    name,
                    title: name,
                    category,
                    price,
                    colors: colorsArray,
                    stock_count: stockCount,
                    is_available: stockCount > 0,
                    is_new: isNew,
                    description,
                    image_url: finalImage
                };

                const response = await fetch(`${API_BASE_URL}/products`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const errData = await response.json().catch(() => null);
                    throw new Error(formatApiError(errData, response.status));
                }
            }

            resetFormMode();
            await renderInventory();
            switchView("inventoryView");
        } catch (err) {
            console.error("Error saving product:", err);
            alert(err.message || "Could not save product to server.");
        } finally {
            if (formSubmitBtn) formSubmitBtn.disabled = false;
        }
    });
}

/* =========================================================================
8. RENDER INVENTORY MASTER LIST & OWNER ACTIONS (Edit / Stock / New / Delete)
   ========================================================================= */
const categoryLabels = {
    tops: "Tops & Sweaters",
    bottoms: "Bottoms & Jorts",
    bags: "Bags & Accessories"
};

async function renderInventory() {
    if (!inventoryGrid) return;
    inventoryGrid.innerHTML = `<p class="section-subtext">Loading inventory...</p>`;

    try {
        const products = await fetchAdminProducts();
        inventoryGrid.innerHTML = "";

        if (products.length === 0) {
            inventoryGrid.innerHTML = `<p class="section-subtext">No items in inventory yet. Click "+ Add Item" to add your first product.</p>`;
            return;
        }

        products.forEach((product) => {
            const displayName = product.name || product.title || "Untitled Item";
            const rawCategory = (product.category || product.Category || "General").toLowerCase();
            const displayCategory = categoryLabels[rawCategory] || (product.category || product.Category || "General");
            const displayImage = product.image_url || product.image || "images/image5.jpg";
            const displayPrice = Number(product.price) || 0;
            const displayStock = typeof product.stock_count === "number" ? product.stock_count : 0;
            const displayColors = Array.isArray(product.colors) ? product.colors : [];
            const isNewArrival = Boolean(product.is_new);

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
                    <p class="card-new-status" style="font-size: 0.85rem; opacity: 0.8;">
                        New Arrivals: <strong>${isNewArrival ? "Shown" : "Hidden"}</strong>
                    </p>
                    <div class="color-list">${colorPillsHTML}</div>
                    <div class="card-actions">
                        <button type="button" class="btn-card" onclick="startEditProduct('${product.id}')">Edit</button>
                        <button type="button" class="btn-card" onclick="toggleNewArrival('${product.id}')">
                            ${isNewArrival ? "Remove from New" : "Set as New"}
                        </button>
                        <button type="button" class="btn-card" onclick="updateStock('${product.id}', 1)">+1 Stock</button>
                        <button type="button" class="btn-card" onclick="updateStock('${product.id}', -1)">-1 Stock</button>
                        <button type="button" class="btn-card btn-delete" onclick="deleteProduct('${product.id}')">Delete</button>
                    </div>
                </div>
            `;

            inventoryGrid.appendChild(card);
        });
    } catch (err) {
        console.error("Failed to render inventory:", err);
        inventoryGrid.innerHTML = `<p class="section-subtext" style="color: #b33a3a;">Could not load inventory from backend. Check that FastAPI is running.</p>`;
    }
}

function startEditProduct(productId) {
    const target = adminProductsCache.find((item) => item.id === productId);
    if (!target) return;

    editingProductId = target.id;

    document.getElementById("productName").value = target.name || target.title || "";
    document.getElementById("productCategory").value = target.category || target.Category || "";
    document.getElementById("productPrice").value = Number(target.price) || 0;
    document.getElementById("productColors").value = Array.isArray(target.colors) ? target.colors.join(", ") : "";
    document.getElementById("productStock").value = typeof target.stock_count === "number" ? target.stock_count : 0;
    if (prodDescriptionInput) {
        prodDescriptionInput.value = target.description || "";
    }
    if (productIsNewInput) {
        productIsNewInput.checked = Boolean(target.is_new);
    }

    if (productImageInput) productImageInput.value = "";
    selectedImageValue = target.image_url || target.image || "images/image5.jpg";
    if (imagePreview) imagePreview.src = selectedImageValue;

    const labelName = target.name || target.title || "Product";
    if (formTitle) formTitle.textContent = `Edit Product: ${labelName}`;
    if (formSubmitBtn) formSubmitBtn.textContent = "Update Product";
    if (cancelEditBtn) cancelEditBtn.hidden = false;

    switchView("addItemView");
}

async function toggleNewArrival(productId) {
    const target = adminProductsCache.find((item) => item.id === productId);
    if (!target) return;

    const nextIsNew = !Boolean(target.is_new);

    try {
        const response = await fetch(`${API_BASE_URL}/products/${encodeURIComponent(productId)}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ is_new: nextIsNew })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => null);
            throw new Error(formatApiError(errData, response.status));
        }

        await renderInventory();
    } catch (err) {
        console.error("Error toggling New Arrivals:", err);
        alert(err.message || "Could not update New Arrivals status.");
    }
}

async function updateStock(productId, change) {
    const target = adminProductsCache.find((item) => item.id === productId);
    if (!target) return;

    const currentStock = typeof target.stock_count === "number" ? target.stock_count : 0;
    const nextStock = Math.max(0, currentStock + change);

    try {
        const response = await fetch(`${API_BASE_URL}/products/${encodeURIComponent(productId)}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                stock_count: nextStock,
                is_available: nextStock > 0
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => null);
            throw new Error(formatApiError(errData, response.status));
        }

        await renderInventory();
    } catch (err) {
        console.error("Error updating stock:", err);
        alert(err.message || "Could not update product stock.");
    }
}

async function deleteProduct(productId) {
    try {
        const response = await fetch(`${API_BASE_URL}/products/${encodeURIComponent(productId)}`, {
            method: "DELETE"
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => null);
            throw new Error(formatApiError(errData, response.status));
        }

        await renderInventory();
    } catch (err) {
        console.error("Error deleting product:", err);
        alert(err.message || "Could not delete product.");
    }
}

/* =========================================================================
9. INITIALIZE AUTH & DASHBOARD ON PAGE LOAD
   ========================================================================= */
applyAuthState();