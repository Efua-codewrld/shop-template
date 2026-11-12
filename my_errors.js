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
function renderCatalog(productsArray = catalogData){
    // Clear out the grid container first so we don't duplicate cards
    gridContainer.innerHTML="";

    // ⚡ Gracefully handles zero search matches
    if (productsArray.length === 0) {
        gridContainer.innerHTML = `<p style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #777;">No matching archive items found.</p>`;
        return;}

     // Loop through your data list array one by one
     productsArray.forEach(item => {
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

//Event listener for my mobile toggle button ( the filter search stuff)
//======================================================================
const mobileToggleBtn = document.getElementById("mobileFilterToggle");
const filterSidebar = document.getElementById("filterSidebar");

//eventlistener for my toggle button
mobileToggleBtn.addEventListener("click", ()=>{
    // .classList.toggle() checks if ".active" is there:
    // If it's missing, it adds it (slides the drawer open).
    // If it's already there, it removes it (hides the drawer).
    filterSidebar.classList.toggle("active")
})

//=========handling live search input=============
const searchBar=document.querySelector('#searchBar');
const resultsContainer = document.querySelector('#catalogGrid');

// We customize how Fuse.js will evaluate string matching distance calculations.
const fuseOptions={
    keys : ['title'], // Look at the "name" property inside our product data structures
    threshold : 0.4 // 0.4 allows typing errors (like Levenshtein distance edits) 
                  // but blocks completely irrelevant terms.
};


// Instantiating Fuse. It maps our inventory according to our rules in the background
const fuse= new Fuse(catalogData, fuseOptions);

// This tracking variable lives in the global scope outside the event function.
// It allows our code to remember, track, and destroy active timers across keystrokes.
let debounceTimer;

// ============================================================================
// 5. THE LIVE CAPTURE INPUT EVENT LISTENER
// ============================================================================
// We assign a listener tracking 'input' events (capturing letters as they are punched in).
// The bracket parameter is explicitly named '(event)' because we must grab the 
// tracking folder generated by the browser containing the text values.
searchBar.addEventListener('input', (event)=>{
    // Extracting the live text string sitting in the input field right now.
    const rawInputText = event.target.value;
    console.log(rawInputText)

    // DEBOUNCE MECHANISM RESET BUTTON:
  // Instantly destroys the previous countdown timer if the user continues typing.
  // This keeps your search completely silent until the user takes a natural break.
  clearTimeout(debounceTimer);

  // Set a fresh 300 millisecond timer. 
  debounceTimer = setTimeout(()=>{
    // DIAGNOSTIC BREADCRUMB:
    // Proves in your browser's Inspect Console that the debounce worked exactly once.
    console.log(`Debounce pause achieved. Processing fuzzy query: "${rawInputText}`);

    // Pass the stable text string down to the filtering core.
    filterAndDisplayProducts(rawInputText) 
  }, 300);
});

searchBar.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault(); // Stops the browser from refreshing or submitting
    }
});

// 6. FILTERING LOGIC AND NORMALIZATION LAYER
// =======================================================
function filterAndDisplayProducts(inputText) {
    // STRING NORMALIZATION:
  // .trim() cuts away accidental space-bar hits hanging on the outer edges.
  // Note: Fuse.js naturally flattens letter casings (.toLowerCase) internally!
  const cleanSearchText = inputText.trim();

  // CONDITION CHECK A: Empty Input Handler
  // If a user completely empties out the input field, bypass search math entirely 
  // and load all original products back onto the screen, then abort early with 'return'.
  if (cleanSearchText === "") {renderCatalog(catalogData);
    return;
  }
  // CONDITION CHECK B: Typo Matching via Fuse Search Calculation
  // Fuse runs Levenshtein edit distance logic and outputs a custom object array structure.
  const fuseResults = fuse.search(cleanSearchText);
  // ARRAY RECONSTRUCTION (.map):
  // Fuse returns matching products formatted inside nested items: [{ item: productObj }].
  // .map() loops through and extracts just the product objects back into a clean list.
  const matchedProducts = fuseResults.map(result => result.item);

  // Send the extracted array of survivors to the rendering engine.
  renderCatalog(matchedProducts);

}
// 7. GRID RENDER ENGINE (Wiping and Appending to UI)
// ===================================================
/*function renderToScreen(productsArray) {

  // CLEARING THE GRID:
  // By targeting .innerHTML, we instantly drop a clean slate into <div id="results">,
  // deleting any old layouts left behind by previous searches.
  resultsContainer.innerHTML = "";

  // ARRAY RENDERING VIA TRANSFORMATION LOOP (.map & .join):
  // .map() iterates through our products array, wrapping data points inside HTML tags.
  // .join('') merges the array of separate text blocks into a single string.
  const htmlTemplates = productsArray.map(p => `
    <div class="shop-card product-card">
        <div class="card-media">
            <img src="${p.image}" alt="${p.title}">
        </div>
        <div class="card-info">
            <h3>${p.title}</h3>
            <p>GH₵${p.price}</p>
        </div>
    </div>
    `).join('');
    // Drops the freshly filtered items straight back into your original container
    resultsContainer.innerHTML= htmlTemplates;
}*/


// ==========================================================================
// MILESTONE 3: MASTER FILTER, SEARCH & SORT PIPELINE
// ==========================================================================

// 1. THE STATE OBJECT (Single Source of Truth)
// This object tracks what the user is currently filtering by. 
// Having one central place for this data stops the search bar, category dropdown, 
// and price selector from fighting or overriding each other.
const activeFilters = {
    searchQuery: "",
    category: "All",
    priceSort: "default" // Options: "default", "low-high", "high-low"
};


// 2. THE MASTER PIPELINE FUNCTION
// Think of this function like an assembly line in a factory:
// Raw Catalog Data -> Fuse.js Search -> Category Filter -> Price Sort -> Screen Renderer
function applyAllFilters() {
    
    // Step A: Create a working copy of your master data array 
    // (using [...catalogData] ensures we don't accidentally mutate or destroy the original list)
    let workingArray = [...catalogData];

    // Step B: Apply Fuse.js Fuzzy Search (if the user has typed something)
    if (activeFilters.searchQuery.trim() !== "") {
        const fuseResults = fuse.search(activeFilters.searchQuery);
        // Fuse returns an object wrapper, so we map out just the original product item object
        workingArray = fuseResults.map(result => result.item);
    }

    // Step C: Apply Category Filter (if a specific category is selected)
    if (activeFilters.category !== "All") {
        workingArray = workingArray.filter(item => {
            // Convert both strings to lowercase so capitalization mismatches never cause bugs
            return item.Category.toLowerCase() === activeFilters.category.toLowerCase();
        });
    }

    // Step D: Apply Price Sorting (Low-to-High or High-to-Low)
    if (activeFilters.priceSort === "low-high") {
        // Sort ascending: smallest price comes first (a minus b)
        workingArray.sort((a, b) => a.price - b.price);
    } 
    else if (activeFilters.priceSort === "high-low") {
        // Sort descending: largest price comes first (b minus a)
        workingArray.sort((a, b) => b.price - a.price);
    }
    // If priceSort is "default", we skip sorting and keep the current arrangement!

    // Step E: Send the final, perfectly processed list straight to your screen renderer
    renderCatalog(workingArray);
}


// ==========================================================================
// 3. EVENT LISTENERS (Connecting HTML UI Elements to our State)
// ==========================================================================

// A. Search Bar Listener (Listens for real-time typing with a 300ms debounce delay)
const searchInput = document.querySelector("#searchBar"); // Make sure this matches your HTML ID
let debounceTimer;

if (searchInput) {
    searchInput.addEventListener("input", (event) => {
        // 1. Update the search query state with whatever the user typed
        activeFilters.searchQuery = event.target.value;

        // 2. Clear the previous timer so it waits for typing to briefly pause
        clearTimeout(debounceTimer);
        
        // 3. Run the master filter pipeline after 300 milliseconds
        debounceTimer = setTimeout(() => {
            applyAllFilters();
        }, 300);
    });
}


// B. Category Dropdown Listener (Fires whenever a user selects a category)
const categoryDropdown = document.querySelector("#categoryFilter"); // Make sure this matches your HTML ID

if (categoryDropdown) {
    categoryDropdown.addEventListener("change", (event) => {
        // 1. Update the category state to the newly selected dropdown value
        activeFilters.category = event.target.value;
        
        // 2. Instantly run the master pipeline to update the screen grid
        applyAllFilters();
    });
}


// C. Price Sort Dropdown Listener (Fires whenever a user selects a price order)
const priceSortDropdown = document.querySelector("#pricesort"); // Make sure this matches your HTML ID

if (priceSortDropdown) {
    priceSortDropdown.addEventListener("change", (event) => {
        // 1. Update the price sort state to "low-high", "high-low", or "default"
        activeFilters.priceSort = event.target.value;
        
        // 2. Instantly run the master pipeline to rearrange the product cards
        applyAllFilters();
    });
}


// 8. INITIAL LAUNCH ROUTINE
// ============================================================================
// Executing this engine block blindly once on page load ensures that when the site 
// opens up, all available stock displays immediately before a user clicks anything.
renderCatalog(catalogData);
