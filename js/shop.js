import { db, auth } from './firebase-config.js';
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { PRODUCTS } from './seed.js';

// ── Fetch ─────────────────────────────────────────────────────────────────────

export async function fetchProducts(category = null) {
  try {
    const ref  = collection(db, 'products');
    const q    = category ? query(ref, where('category', '==', category)) : ref;
    const snap = await getDocs(q);
    if (snap.docs.length > 0) {
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
  } catch (err) {
    console.warn('Firestore unavailable, using local product data:', err.message);
  }
  // Fallback: use local seed data if Firestore is empty or inaccessible
  const local = category ? PRODUCTS.filter(p => p.category === category) : PRODUCTS;
  return local.map(({ id, ...rest }) => ({ id, ...rest }));
}

// ── Render ────────────────────────────────────────────────────────────────────

export function renderProducts(products, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!products.length) {
    container.innerHTML = '<p class="no-products">No products found in this category.</p>';
    return;
  }

  container.innerHTML = products.map(p => `
    <div
      class="product-card"
      role="button"
      tabindex="0"
      data-product="1"
      data-id="${p.id}"
      data-name="${encodeURIComponent(p.name)}"
      data-category="${encodeURIComponent(p.category)}"
      data-description="${encodeURIComponent(p.description || '')}"
      data-price="${p.price}"
      data-img="${p.imageURL}"
    >
      <div class="product-img-wrap">
        <img
          src="${p.imageURL}"
          alt="${p.name}"
          loading="lazy"
          onerror="this.src='https://placehold.co/500x400/1a1a1a/ff6b00?text=${encodeURIComponent(p.name)}'"
        >
      </div>
      <div class="product-info">
        <span class="product-category">${p.category}</span>
        <h3 class="product-name">${p.name}</h3>
        <p class="product-desc">${p.description}</p>
        <div class="product-footer">
          <span class="product-price">$${p.price.toFixed(2)}</span>
          <button
            class="btn-add-cart"
            data-id="${p.id}"
            data-name="${encodeURIComponent(p.name)}"
            data-price="${p.price}"
            data-img="${p.imageURL}"
          >Add to Cart</button>
        </div>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.btn-add-cart').forEach(btn =>
    btn.addEventListener('click', handleAddToCart)
  );

  bindProductModalInteractions(container);
}

// ── Cart handler ──────────────────────────────────────────────────────────────

async function handleAddToCart(e) {
  const user = auth.currentUser;
  if (!user) {
    window.location.href = 'login.html?redirect=shop';
    return;
  }

  const btn       = e.currentTarget;
  const productId = btn.dataset.id;
  const name      = decodeURIComponent(btn.dataset.name);
  const price     = parseFloat(btn.dataset.price);
  const imageURL  = btn.dataset.img;

  btn.textContent = 'Adding…';
  btn.disabled    = true;

  try {
    const itemRef  = doc(db, 'users', user.uid, 'cartItems', productId);
    const existing = await getDoc(itemRef);

    if (existing.exists()) {
      await setDoc(itemRef, { quantity: existing.data().quantity + 1 }, { merge: true });
    } else {
      await setDoc(itemRef, { productId, name, price, imageURL, quantity: 1 });
    }

    btn.textContent = '✓ Added!';
    btn.classList.add('added');
    setTimeout(() => {
      btn.textContent = 'Add to Cart';
      btn.classList.remove('added');
      btn.disabled = false;
    }, 1500);
  } catch (err) {
    console.error('Add to cart failed:', err);
    btn.textContent = 'Error — retry';
    btn.disabled = false;
  }
}

// ── Fullscreen product modal ─────────────────────────────────────────────────

function bindProductModalInteractions(container) {
  if (container.dataset.productModalBound === '1') return;
  container.dataset.productModalBound = '1';

  container.addEventListener('click', (e) => {
    if (e.target.closest('.btn-add-cart')) return;
    const card = e.target.closest('.product-card[data-product="1"]');
    if (!card) return;
    openProductModalFromCard(card);
  });

  container.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const card = e.target.closest?.('.product-card[data-product="1"]');
    if (!card) return;
    e.preventDefault();
    openProductModalFromCard(card);
  });

  const modal = document.getElementById('product-modal');
  if (!modal) return;
  if (modal.dataset.bound === '1') return;
  modal.dataset.bound = '1';

  modal.addEventListener('click', (e) => {
    if (!e.target.closest('[data-modal-close]')) return;
    closeProductModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeProductModal();
  });
}

function readProductFromCard(card) {
  const id = card.dataset.id || '';
  const name = decodeURIComponent(card.dataset.name || '');
  const category = decodeURIComponent(card.dataset.category || '');
  const description = decodeURIComponent(card.dataset.description || '');
  const price = Number(card.dataset.price || 0);
  const imageURL = card.dataset.img || '';
  return { id, name, category, description, price, imageURL };
}

function openProductModalFromCard(card) {
  const modal = document.getElementById('product-modal');
  const body = document.getElementById('product-modal-body');
  if (!modal || !body) return;

  const p = readProductFromCard(card);

  body.innerHTML = `
    <div class="product-modal-content">
      <div class="product-modal-media">
        <img
          src="${p.imageURL}"
          alt="${escapeHtml(p.name)}"
          onerror="this.src='https://placehold.co/1100x800/1a1a1a/ff6b00?text=${encodeURIComponent(p.name)}'"
        >
      </div>
      <div class="product-modal-details">
        <span class="product-category">${escapeHtml(p.category)}</span>
        <div class="product-modal-title">${escapeHtml(p.name)}</div>
        <div class="product-modal-desc">${escapeHtml(p.description || 'No description available.')}</div>
        <div class="product-modal-price">$${Number.isFinite(p.price) ? p.price.toFixed(2) : '0.00'}</div>
        <div class="product-modal-actions" id="product-modal-actions"></div>
      </div>
    </div>
  `;

  const actions = document.getElementById('product-modal-actions');
  if (actions) {
    const btn = document.createElement('button');
    btn.className = 'btn-add-cart';
    btn.textContent = 'Add to Cart';
    btn.dataset.id = p.id;
    btn.dataset.name = encodeURIComponent(p.name);
    btn.dataset.price = String(p.price);
    btn.dataset.img = p.imageURL;
    btn.addEventListener('click', handleAddToCart);
    actions.appendChild(btn);
  }

  openProductModal();
}

let lastScrollY = 0;

function openProductModal() {
  const modal = document.getElementById('product-modal');
  if (!modal || modal.classList.contains('is-open')) return;

  lastScrollY = window.scrollY || 0;
  document.body.style.position = 'fixed';
  document.body.style.top = `-${lastScrollY}px`;
  document.body.style.left = '0';
  document.body.style.right = '0';

  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');

  const backBtn = modal.querySelector('.product-modal-back');
  backBtn?.focus?.();
}

function closeProductModal() {
  const modal = document.getElementById('product-modal');
  if (!modal || !modal.classList.contains('is-open')) return;

  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');

  const y = lastScrollY;
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.left = '';
  document.body.style.right = '';
  window.scrollTo(0, y);
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
