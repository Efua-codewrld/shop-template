// 1. YOUR MASTER CATALOG DATA (Keep this synchronized with your shop data)
const catalogData = [
    {
        id: "prod001",
        image: "images/image1.jpg",
        title: "Archive Leather Bag",
        price: 350,
        Category: "Bags",
        description: "Handcrafted vintage-finish leather bag designed for daily archival utility.",
        isAvailable: true
    },
    {
        id: "prod002",
        image: "images/image18.jpg",
        title: "Archive essential bag",
        price: 500,
        Category: "Bags",
        description: "Minimalist essential carry-all built with heavy-duty weather-resistant canvas.",
        isAvailable: true
    },
    {
        id: "prod003",
        image: "images/image9.jpg",
        title: "Plaid sweater",
        price: 200,
        Category: "tops",
        description: "Heavyweight winter plaid sweater with a relaxed, vintage boxy fit.",
        isAvailable: true
    },
    {
        id: "prod004",
        image: "images/image8.jpg",
        title: "camo sweater and sweatpants set",
        price: 430,
        Category: "tops",
        description: "Matching tactical camo fleece set. Ultra-soft interior lining.",
        isAvailable: true
    },
    {
        id: "prod005",
        image: "images/image4.jpg",
        title: "Archive jorts",
        price: 280,
        Category: "bottoms",
        description: "Distressed denim jorts featuring relaxed utility pockets and raw hems.",
        isAvailable: false
    }
];

// WhatsApp Order Handler Function (grabs current size from your bubble dropdown)
function sendProductWhatsAppOrder(productId) {
    const selectedProduct = catalogData.find(item => item.id === productId);
    if (!selectedProduct) return;

    // Grab the size from your custom bubble dropdown text element
    const sizeElement = document.getElementById('selectedSizeText');
    const selectedSize = sizeElement ? sizeElement.textContent : 'Standard';

    // Build the dynamic WhatsApp message
    const phoneNumber = "233508532866"; // Replace with your actual WhatsApp phone number
    const message = `Hello Archive! I would like to order:\n\n` +
                    `Item: ${selectedProduct.title}\n` +
                    `Size: ${selectedSize}\n` +
                    `Price: GH₵${selectedProduct.price}\n\n` +
                    `Is this item available?`;

    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

// 2. READ THE URL "BOARDING PASS" (?id=prod00X)
const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get('id');

// 3. FIND THE MATCHING PRODUCT IN OUR DATA ARRAY
const product = catalogData.find(item => item.id === productId);

// 4. TARGET THE PAGE CONTAINER
const detailContainer = document.getElementById("productDetailContainer");

// 5. RENDER THE DETAILS (Or show an error if the ID is broken)
if (!product) {
    detailContainer.innerHTML = `
        <div style="text-align: center; padding: 80px;">
            <h2>Product not found</h2>
            <p>The item you're looking for doesn't exist or has been removed.</p>
            <a href="shop.html" style="color: inherit; text-decoration: underline; margin-top: 20px; display: inline-block;">Return to Shop</a>
        </div>
    `;
} else {
    detailContainer.innerHTML = `
        <div class="pdp-grid">
            <div class="pdp-image-wrapper">
                <img src="${product.image}" alt="${product.title}">
            </div>
            <div class="pdp-info">
                <h1>${product.title}</h1>
                <p class="pdp-price">GH₵${product.price}</p>
                <p class="pdp-category">Category: <strong>${product.Category}</strong></p>
                <p class="pdp-desc">${product.description || "No description provided for this archive piece."}</p>
                
                <div class="custom-dropdown-container">
                    <!-- The trigger pill button -->
                    <button type="button" class="dropdown-trigger" id="sizeDropdownTrigger">
                        <span id="selectedSizeText">Small (S)</span>
                        <span class="arrow">▼</span>
                    </button>

                    <!-- The custom floating menu -->
                    <div class="dropdown-menu" id="sizeDropdownMenu">
                        <div class="dropdown-item active" data-value="Small (S)">Small (S)</div>
                        <div class="dropdown-item" data-value="Medium (M)">Medium (M)</div>
                        <div class="dropdown-item" data-value="Large (L)">Large (L)</div>
                        <div class="dropdown-item" data-value="Extra Large (XL)">Extra Large (XL)</div>
                    </div>
                </div>

                <!-- Action Buttons Container -->
                <div class="pdp-actions" style="margin-top: 25px; display: flex; flex-direction: column; gap: 15px;">
                    <!-- WhatsApp Order Button -->
                    <button class="order-btn" 
                        onclick="sendProductWhatsAppOrder('${product.id}')"
                        ${!product.isAvailable ? 'disabled' : ''}>
                        ${product.isAvailable ? 'Order via Whatsapp' : 'SOLD OUT'}
                    </button>

                   <!-- Add to Cart Button-->
                    <button class="add-to-cart-btn" ${!product.isAvailable ? 'disabled' : ''}>
                        ${product.isAvailable ? 'Add to Cart' : 'SOLD OUT'}
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Custom Dropdown & Size Selection Logic
document.addEventListener('click', (e) => {
    const trigger = document.getElementById('sizeDropdownTrigger');
    const menu = document.getElementById('sizeDropdownMenu');
    const selectedText = document.getElementById('selectedSizeText');

    if (!trigger || !menu) return;

    // 1. If user clicks the trigger bubble, toggle the menu
    if (trigger.contains(e.target)) {
        e.stopPropagation();
        menu.classList.toggle('show');
        return;
    }

    // 2. If user clicks an option inside the menu
    const item = e.target.closest('.dropdown-item');
    if (item && menu.contains(item)) {
        selectedText.textContent = item.getAttribute('data-value');
        
        // Update active highlight class
        menu.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');

        menu.classList.remove('show');
        return;
    }

    // 3. Close menu if user clicks anywhere else on the page
    menu.classList.remove('show');
});