
// LOAD CART
async function loadCart() {
  try {
    const res = await fetch('/api/cart');
    if (!res.ok) throw new Error('Not logged in or DB error');
    const items = await res.json();
    renderCart(items);
  } catch (err) {
    console.error('Error loading cart:', err);
    const cartContainer = document.getElementById('cart-items');
    const cartCount = document.getElementById('cart-count');
    if (cartContainer) cartContainer.innerHTML = '<p>Please log in to view your cart.</p>';
    if (cartCount) cartCount.textContent = '0';
  }
}

// RENDER CART
function renderCart(items) {
  const cartContainer = document.getElementById('cart-items');
  if (!cartContainer) return;

  cartContainer.innerHTML = '';
  let total = 0;

  items.forEach(item => {
    total += item.price * item.quantity;

    const cartItem = document.createElement('div');
    cartItem.classList.add('cart-item');
    cartItem.id = `cart-item-${item.id}`;

    cartItem.innerHTML = `
      <img src="${item.image}" alt="${item.name}" />
      <div class="cart-details">
        <h4>${item.name}</h4>
        <p>${item.price} SEK</p>
        <div class="quantity-controls">
          <button onclick="decreaseQuantity(${item.id}, ${item.quantity})">−</button>
          <span>${item.quantity}</span>
          <button onclick="increaseQuantity(${item.id}, ${item.quantity})">+</button>
        </div>
        <p class="item-total">${item.price * item.quantity} SEK</p>
      </div>
      <button class="remove-btn" onclick="removeFromCart(${item.id})">Remove</button>
    `;
    cartContainer.appendChild(cartItem);
  });

  const cartCount = document.getElementById('cart-count');
  if (cartCount) cartCount.textContent = items.length;

  const orderTotalEl = document.querySelector('.order-total span:last-child');
  if (orderTotalEl) orderTotalEl.textContent = total + ' SEK';
}

// ADD TO CART
async function addToCart(productId) {
  try {
    const res = await fetch('/api/cart/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId })
    });
    if (res.ok) await loadCart();
  } catch (err) {
    console.error('Error adding to cart:', err);
  }
}

document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
  btn.addEventListener('click', async (e) => {
    const productId = e.currentTarget.dataset.id;
    btn.disabled = true; // prevent double clicks
    await addToCart(productId);
    btn.disabled = false;
  });
});

// REMOVE FROM CART
async function removeFromCart(cartItemId) {
  try {
    const res = await fetch(`/api/cart/${cartItemId}`, { method: 'DELETE' });
    if (res.ok) await loadCart();
  } catch (err) {
    console.error('Error removing from cart:', err);
  }
}

// INCREASE QUANTITY
async function increaseQuantity(cartItemId, currentQty) {
  await updateQuantity(cartItemId, currentQty + 1);
}

// DECREASE QUANTITY
async function decreaseQuantity(cartItemId, currentQty) {
  if (currentQty > 1) {
    await updateQuantity(cartItemId, currentQty - 1);
  } else {
    await removeFromCart(cartItemId);
  }
}

// UPDATE QUANTITY
async function updateQuantity(cartItemId, quantity) {
  try {
    const res = await fetch(`/cart/update/${cartItemId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `quantity=${quantity}`
    });
    if (res.ok) await loadCart();
  } catch (err) {
    console.error('Error updating quantity:', err);
  }
}

// TOGGLE CART PANEL
function toggleCart() {
  const panel = document.getElementById('cart-panel');
  if (panel) panel.classList.toggle('show');
}

document.addEventListener('DOMContentLoaded', () => {
  loadCart();
});


