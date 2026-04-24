import { db, auth } from './firebase-config.js';
import {
  collection,
  doc,
  deleteDoc,
  setDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

export function initCart() {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = 'login.html?redirect=cart';
      return;
    }

    // Real-time listener — cart updates instantly when Firestore changes
    const cartRef = collection(db, 'users', user.uid, 'cartItems');
    onSnapshot(cartRef, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      renderCart(items, user.uid);
    });
  });
}

function renderCart(items, uid) {
  const container  = document.getElementById('cart-items');
  const emptyMsg   = document.getElementById('cart-empty');
  const summary    = document.getElementById('cart-summary');
  const totalEl    = document.getElementById('cart-total');
  const totalFinal = document.getElementById('cart-total-final');

  if (!container) return;

  if (!items.length) {
    container.innerHTML = '';
    if (emptyMsg)  emptyMsg.style.display  = 'block';
    if (summary)   summary.style.display   = 'none';
    return;
  }

  if (emptyMsg) emptyMsg.style.display  = 'none';
  if (summary)  summary.style.display   = 'block';

  let total = 0;

  container.innerHTML = items.map(item => {
    const subtotal = item.price * item.quantity;
    total += subtotal;
    return `
      <div class="cart-item">
        <img
          src="${item.imageURL}"
          alt="${item.name}"
          onerror="this.src='https://placehold.co/100x100/1a1a1a/ff6b00?text=?'"
        >
        <div class="cart-item-info">
          <h3>${item.name}</h3>
          <p class="cart-item-price">$${item.price.toFixed(2)} each</p>
        </div>
        <div class="cart-item-controls">
          <button class="qty-btn" data-action="dec" data-id="${item.id}" data-qty="${item.quantity}" data-uid="${uid}">−</button>
          <span class="qty">${item.quantity}</span>
          <button class="qty-btn" data-action="inc" data-id="${item.id}" data-qty="${item.quantity}" data-uid="${uid}">+</button>
        </div>
        <span class="cart-item-subtotal">$${subtotal.toFixed(2)}</span>
        <button class="btn-remove" data-id="${item.id}" data-uid="${uid}" title="Remove item">✕</button>
      </div>
    `;
  }).join('');

  const fmt = `$${total.toFixed(2)}`;
  if (totalEl)    totalEl.textContent    = fmt;
  if (totalFinal) totalFinal.textContent = fmt;

  // Remove buttons
  container.querySelectorAll('.btn-remove').forEach(btn => {
    btn.addEventListener('click', () =>
      deleteDoc(doc(db, 'users', btn.dataset.uid, 'cartItems', btn.dataset.id))
    );
  });

  // Quantity buttons
  container.querySelectorAll('.qty-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const current = parseInt(btn.dataset.qty, 10);
      const newQty  = btn.dataset.action === 'inc' ? current + 1 : current - 1;
      const itemDoc = doc(db, 'users', btn.dataset.uid, 'cartItems', btn.dataset.id);

      if (newQty <= 0) {
        await deleteDoc(itemDoc);
      } else {
        await setDoc(itemDoc, { quantity: newQty }, { merge: true });
      }
    });
  });
}
