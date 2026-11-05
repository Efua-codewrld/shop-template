const catalogData =[{
    id:"prod001",
    image:"images/image1.jpg",
    title:"Archive Leather Bag",
    price: 350,
    Category: "Bags",
    isAvailable:true

},
{
    id:"prod002",
    image:"images/image18.jpg",
    title:"Archive essential bag",
    price: 500,
    Category:"Bags",
    isAvailable:true
},
{
    id:"prod003",
    image:"images/image9.jpg",
    title:"Plaid sweater",
    price: 200,
    Category:"tops",
    isAvailable:true
},
{
    id:"prod004",
    image:"images/image8.jpg",
    title:"camo sweater and sweatpants set",
    price:430,
    Category:"tops",
    isAvailable:true
},
{
    id:"prod005",
    image:"images/image4.jpg",
    title:"Archive jorts",
    price:280,
    Category:"bottoms",
    isAvailable: false
}
];

//Targetting my html viewport container
//This finds the exact div on my  shop.html documents
const gridContainer= document.getElementById("catalogGrid");

//3. The render function ( printing data into HTML boxes)
function renderCatalog(){
    // Clear out the grid container first so we don't duplicate cards
    gridContainer.innerHTML="";

     // Loop through your data list array one by one
     catalogData.forEach(item => {
        // Create an empty, living HTML div box for this specific item card
        const card = document.createElement("div");
        card.className = "shop-card"

        //Add a special class if the item is sold out to fade it via css
        if(!item.isAvailable){
            card.classList.add("Sold-out")
        }

        // Fill that empty card box with your structured item data templates
        card.innerHTML=`
         <div class="card-media">
        <img src="${item.image}" alt="${item.title}">
        ${!item.isAvailable ? '<span class="badge-sold">Sold out</span>' : ''}
         </div>

        <div class="card-info"> 
        <span class="product-title">${item.title}</span>
        <span class="product-price">GH₵${item.price}</span>

        <!--Tapping this button will fire the whatsapp trigger function-->
        <button class="order-btn"
        onclick="sendWhatsAppOrder('${item.id}')"
        ${!item.isAvailable ? 'disabled' : ''}>
        ${item.isAvailable ? 'Order via Whatsapp' : 'SOLD OUT'}
        </button>
        </div>
    
        `;
        // Append this newly populated card into your main website grid layout
        gridContainer.appendChild(card);
     }
    );
    }
    //Building the whatsapp link trigger 
    function sendWhatsAppOrder(productId){
        // Find the exact item object matching the ID that was clicked
        const product = catalogData.find(item=> item.id === productId);
        
        if (!product) return;

        // Use your own Ghana personal phone number format for testing here!
        const testPhone = "233508532866"

         // Build the clean text body statement using templates

         const orderMessage = ` Hi! I want to order these items from your shop:\n\n`+
                              `*Item:* ${product.title}\n`+
                              `*price:* GH₵${product.price}\n`+
                              `Please let me know if it's available!`;
         // Safely transform spaces/symbols into URL format characters
         const encodedMessage = encodeURIComponent(orderMessage);
         
         // Create the final link string and open a fresh browser tab with it
         const whatsAppUrl = `https://wa.me/${testPhone}?text=${encodedMessage}`;
         window.open(whatsAppUrl, "_blank");

    }

    // Kickstart the function automatically to draw the page cards on load!
renderCatalog();

//Event listener for my mobile toggle button ( the filter search struff)
const mobileToggleBtn = document.getElementById("mobileFilterToggle");
const filterSidebar = document.getElementById("filterSidebar");

//eventlistener for my toggle button
mobileToggleBtn.addEventListener("click", ()=>{
    // .classList.toggle() checks if ".active" is there:
    // If it's missing, it adds it (slides the drawer open).
    // If it's already there, it removes it (hides the drawer).
    filterSidebar.classList.toggle("active")
})