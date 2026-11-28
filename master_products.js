// ==========================================
// MASTER_PRODUCTS.JS (Backend API Data Bridge)
// ==========================================

const API_BASE_URL = "http://127.0.0.1:8000";

let catalogData = [];
window.catalogData = catalogData;

function normalizeBackendProduct(item) {
    const resolvedName = item.name || item.title || "Untitled Item";
    const resolvedImage = item.image_url || item.imageUrl || item.image || "images/image5.jpg";
    const resolvedCategory = item.category || item.Category || "General";
    const resolvedStock = typeof item.stock_count === "number"
        ? item.stock_count
        : (typeof item.stockCount === "number" ? item.stockCount : 0);
    const resolvedAvailable = typeof item.is_available === "boolean"
        ? item.is_available
        : (typeof item.isAvailable === "boolean" ? item.isAvailable : resolvedStock > 0);
    const resolvedNew = item.is_new !== undefined
    ? Boolean(item.is_new === "false" || item.is_new === "0" ? false : item.is_new)
    : Boolean(item.isNew);

    return {
        ...item,
        id: item.id,
        name: resolvedName,
        title: resolvedName,
        image_url: resolvedImage,
        imageUrl: resolvedImage,
        image: resolvedImage,
        category: resolvedCategory,
        Category: resolvedCategory,
        price: Number(item.price) || 0,
        colors: Array.isArray(item.colors) ? item.colors : [],
        stock_count: resolvedStock,
        stockCount: resolvedStock,
        is_available: resolvedAvailable,
        isAvailable: resolvedAvailable,
        inStock: resolvedAvailable,
        is_new: resolvedNew,
        isNew: resolvedNew,
        description: item.description || "",
        created_at: item.created_at || null
    };
}

async function fetchCatalogProducts() {
    try {
        const response = await fetch(`${API_BASE_URL}/products`, { cache: "no-store" });
        if (!response.ok) {
            throw new Error(`Failed to fetch products (${response.status})`);
        }
        const data = await response.json();
        const rawList = Array.isArray(data)
            ? data
            : (Array.isArray(data.products) ? data.products : []);

        catalogData = rawList.map(normalizeBackendProduct);
        window.catalogData = catalogData;
    } catch (err) {
        console.error("Error loading catalog from backend:", err);
        catalogData = [];
        window.catalogData = catalogData;
    }

    document.dispatchEvent(new CustomEvent("catalogLoaded", { detail: catalogData }));
    return catalogData;
}

const catalogReadyPromise = fetchCatalogProducts();
