// ==========================================
// MASTER_PRODUCTS.JS (Shared Storefront Data Bridge)
// ==========================================

const CATALOG_DB_KEY = "atelier_products_db";

const defaultCatalog = [
    {
        id: "prod001",
        imageUrl: "images/image1.jpg",
        image: "images/image1.jpg",
        title: "Archive Leather Bag",
        name: "Archive Leather Bag",
        price: 350,
        category: "Bags",
        Category: "Bags",
        colors: ["Espresso", "Black"],
        stockCount: 5,
        description: "Handcrafted vintage-finish leather bag designed for daily archival utility.",
        isAvailable: true,
        inStock: true,
        isNew: true,
        createdAt: 1700000001000
    },
    {
        id: "prod002",
        imageUrl: "images/image18.jpg",
        image: "images/image18.jpg",
        title: "Archive Essential Bag",
        name: "Archive Essential Bag",
        price: 500,
        category: "Bags",
        Category: "Bags",
        colors: ["Olive", "Black"],
        stockCount: 4,
        description: "Minimalist essential carry-all built with heavy-duty weather-resistant canvas.",
        isAvailable: true,
        inStock: true,
        isNew: false,
        createdAt: 1700000002000
    },
    {
        id: "prod003",
        imageUrl: "images/image9.jpg",
        image: "images/image9.jpg",
        title: "Plaid Sweater",
        name: "Plaid Sweater",
        price: 200,
        category: "tops",
        Category: "tops",
        colors: ["Burgundy", "Charcoal"],
        stockCount: 6,
        description: "Heavyweight winter plaid sweater with a relaxed, vintage boxy fit.",
        isAvailable: true,
        inStock: true,
        isNew: true,
        createdAt: 1700000003000
    },
    {
        id: "prod004",
        imageUrl: "images/image8.jpg",
        image: "images/image8.jpg",
        title: "Camo Sweater and Sweatpants Set",
        name: "Camo Sweater and Sweatpants Set",
        price: 430,
        category: "tops",
        Category: "tops",
        colors: ["Forest Camo"],
        stockCount: 3,
        description: "Matching tactical camo fleece set. Ultra-soft interior lining.",
        isAvailable: true,
        inStock: true,
        isNew: true,
        createdAt: 1700000004000
    },
    {
        id: "prod005",
        imageUrl: "images/image4.jpg",
        image: "images/image4.jpg",
        title: "Archive Jorts",
        name: "Archive Jorts",
        price: 280,
        category: "bottoms",
        Category: "bottoms",
        colors: ["Washed Indigo"],
        stockCount: 0,
        description: "Distressed denim jorts featuring relaxed utility pockets and raw hems.",
        isAvailable: false,
        inStock: false,
        isNew: true,
        createdAt: 1700000005000
    }
];

// Normalizes items from localStorage so both Admin fields (name, imageUrl, category, inStock)
// and Storefront fields (title, image, Category, isAvailable) work seamlessly together.
function normalizeProduct(item) {
    const resolvedName = item.name || item.title || "Untitled Item";
    const resolvedImage = item.imageUrl || item.image || "images/image5.jpg";
    const resolvedCategory = item.category || item.Category || "General";
    const resolvedStock = typeof item.stockCount === "number"
        ? item.stockCount
        : (item.isAvailable === false ? 0 : 1);
    const resolvedAvailable = typeof item.inStock === "boolean"
        ? item.inStock
        : (typeof item.isAvailable === "boolean" ? item.isAvailable : resolvedStock > 0);

    return {
        ...item,
        id: item.id || ("prod_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6)),
        name: resolvedName,
        title: resolvedName,
        imageUrl: resolvedImage,
        image: resolvedImage,
        category: resolvedCategory,
        Category: resolvedCategory,
        price: Number(item.price) || 0,
        colors: Array.isArray(item.colors) ? item.colors : [],
        stockCount: resolvedStock,
        inStock: resolvedAvailable,
        isAvailable: resolvedAvailable,
        isNew: Boolean(item.isNew),
        description: item.description || "",
        createdAt: item.createdAt || Date.now()
    };
}

function getCatalogProducts() {
    const raw = localStorage.getItem(CATALOG_DB_KEY);
    if (!raw) {
        const seeded = defaultCatalog.map(normalizeProduct);
        localStorage.setItem(CATALOG_DB_KEY, JSON.stringify(seeded));
        return seeded;
    }

    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return defaultCatalog.map(normalizeProduct);
        return parsed.map(normalizeProduct);
    } catch (err) {
        console.error("Failed to parse catalog from localStorage:", err);
        return defaultCatalog.map(normalizeProduct);
    }
}

// Global variable that shop_grid.js, product_detail.js, or main.js can read
const catalogData = getCatalogProducts();