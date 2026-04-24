import { auth, db } from './firebase-config.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  collection,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export function initNav() {
  const userDisplay = document.getElementById('user-display');
  const logoutBtn   = document.getElementById('logout-btn');
  const loginBtn    = document.getElementById('login-nav-btn');
  const cartCountEl = document.getElementById('cart-count');

  let unsubCart = null;

  function setCartCount(count) {
    if (!cartCountEl) return;
    if (!count || count <= 0) {
      cartCountEl.textContent = '0';
      cartCountEl.style.display = 'none';
      return;
    }
    cartCountEl.textContent = String(count);
    cartCountEl.style.display = 'inline-flex';
  }

  onAuthStateChanged(auth, (user) => {
    if (typeof unsubCart === 'function') {
      unsubCart();
      unsubCart = null;
    }

    if (user) {
      if (userDisplay) userDisplay.textContent = user.email;
      if (logoutBtn)   logoutBtn.style.display  = 'inline-flex';
      if (loginBtn)    loginBtn.style.display    = 'none';

      // Live cart badge: sum item quantities in /users/{uid}/cartItems
      if (cartCountEl) {
        const cartRef = collection(db, 'users', user.uid, 'cartItems');
        unsubCart = onSnapshot(cartRef, (snap) => {
          let totalQty = 0;
          snap.docs.forEach(d => {
            const data = d.data();
            const q = Number(data?.quantity ?? 0);
            if (Number.isFinite(q) && q > 0) totalQty += q;
          });
          setCartCount(totalQty);
        }, () => {
          // If snapshot fails (offline rules, etc.), hide badge rather than stale data.
          setCartCount(0);
        });
      }
    } else {
      if (userDisplay) userDisplay.textContent = '';
      if (logoutBtn)   logoutBtn.style.display  = 'none';
      if (loginBtn)    loginBtn.style.display    = 'inline-flex';
      setCartCount(0);
    }
  });

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await signOut(auth);
      window.location.href = 'index.html';
    });
  }
}

export async function login(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signup(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export function requireAuth(redirectTo = 'login.html') {
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();
      if (!user) {
        window.location.href = redirectTo;
      } else {
        resolve(user);
      }
    });
  });
}
