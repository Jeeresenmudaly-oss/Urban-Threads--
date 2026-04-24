import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// ─── FIREBASE CONFIG ───────────────────────────────

const firebaseConfig = {
  apiKey: "AIzaSyDS3gcDbYmYfeBrU1ydhnqBZq1V4rTsnl8",
  authDomain: "urban-threads-e069a.firebaseapp.com",
  projectId: "urban-threads-e069a",
  storageBucket: "urban-threads-e069a.firebasestorage.app",
  messagingSenderId: "51971464557",
  appId: "1:51971464557:web:5bc1140d408a9032010e64",
  measurementId: "G-77H1MY2G35"
};
// ─────────────────────────────────────────────────────────────────────────────

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
