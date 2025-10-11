document.addEventListener("DOMContentLoaded", function () {
    loadCartItems();
    updateCartCount(); // Ensure cart count is updated on load
    updateOrderTotal(); // Ensure order total is updated on load
});

// Toggle cart visibility
function toggleCart() {
    document.getElementById("cart-panel").classList.toggle("show");
}

// Function to add a product to the cart
function addToCart(product) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    let existingProduct = cart.find(item => item.id === product.id);
    
    if (existingProduct) {
        existingProduct.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
    loadCartItems();
    updateOrderTotal();
}

// Function to remove an item from the cart
function removeFromCart(productId) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    cart = cart.filter(item => item.id !== productId);

    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
    loadCartItems();
    updateOrderTotal();
}

// Increase item quantity
function increaseQuantity(productId) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    let product = cart.find(item => item.id === productId);

    if (product) {
        product.quantity += 1;
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
    loadCartItems();
    updateOrderTotal();
}

// Decrease item quantity
function decreaseQuantity(productId) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    let productIndex = cart.findIndex(item => item.id === productId);

    if (productIndex !== -1) {
        if (cart[productIndex].quantity > 1) {
            cart[productIndex].quantity -= 1;
        } else {
            cart.splice(productIndex, 1); // Remove item if quantity reaches 0
        }
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
    loadCartItems();
    updateOrderTotal();
}

// Function to load and display cart items
function loadCartItems() {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    let cartItemsContainer = document.getElementById("cart-items");
    let cartCount = document.getElementById("cart-count");

    cartItemsContainer.innerHTML = "";
    cartCount.innerText = cart.reduce((sum, item) => sum + item.quantity, 0);

    cart.forEach(item => {
        let cartItem = document.createElement("div");
        cartItem.classList.add("cart-item");
        cartItem.innerHTML = `
            <img src="${item.image}" alt="${item.name}">
            <div class="cart-details">
                <h4>${item.name}</h4>
                <p>${item.price} SEK</p>
                <div class="quantity-controls">
                    <button onclick="decreaseQuantity(${item.id})">−</button>
                    <span>${item.quantity}</span>
                    <button onclick="increaseQuantity(${item.id})">+</button>
                </div>
                <p class="item-total">${item.price * item.quantity} SEK</p>
            </div>
            <button class="remove-btn" onclick="removeFromCart(${item.id})">Remove</button>
        `;
        cartItemsContainer.appendChild(cartItem);
    });
}

// Function to update the cart count
function updateCartCount() {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    let totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById("cart-count").innerText = totalItems;
}

// Function to calculate and update the order total
function updateOrderTotal() {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    let orderTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    let orderTotalElement = document.querySelector(".order-total span:last-child");
    if (orderTotalElement) {
        orderTotalElement.innerText = `${orderTotal} SEK`;
    }
}

// Proceed to Checkout (Example function)
function proceedToCheckout() {
    alert("Proceeding to checkout...");
    // Add your checkout logic here
}

// Attach event listener to the checkout button
document.addEventListener("DOMContentLoaded", function () {
    let checkoutButton = document.querySelector(".checkout-btn");
    if (checkoutButton) {
        checkoutButton.addEventListener("click", proceedToCheckout);
    }
});