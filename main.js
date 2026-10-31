const catalogData=[{image:"images/image1.jpg",
    title:"Archive leather bag",
    price:"GH₵350"
}, {
    image:"images/image11.jpg",
    title:"Plaid sweater",
    price:"GH₵200"
},
{ image:"images/image8.jpg",
    title:" camo sweater and sweatpants set",
    price:"GH₵430"
},
{
    image:"images/image4.jpg",
    title:"Archive jorts",
    price:"GH₵280"

}]

const gridContainer = document.getElementById("catalogGrid");

function renderCatalog() {catalogData.forEach(item=>{
    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
    <img src="${item.image}" alt="${item.title}">
    <div class="card-overlay">
    <span class="product-title">${item.title}</span>
    <span class="product-price">${item.price}</span>
    </div>
    `;

    gridContainer.appendChild(card);
});
}

renderCatalog();

