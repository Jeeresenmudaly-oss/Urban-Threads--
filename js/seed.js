import { db } from './firebase-config.js';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export const PRODUCTS = [
  // ── Hoodies ──────────────────────────────────────────────────────────────
  {
    id: "ut-hoodie-1",
    name: "Oversized Hoodie",
    price: 49.99,
    category: "Hoodies",
    description: "Soft cotton hoodie in an oversized fit. Perfect for layering over anything.",
    imageURL: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&q=80"
  },
  {
    id: "ut-hoodie-2",
    name: "Zip-Up Fleece Hoodie",
    price: 59.99,
    category: "Hoodies",
    description: "Warm fleece zip-up with ribbed cuffs and dual front pockets.",
    imageURL: "https://images.unsplash.com/photo-1655141559697-f927ed68170c?w=500&q=80"
  },
  {
    id: "ut-hoodie-3",
    name: "Pullover Street Hoodie",
    price: 44.99,
    category: "Hoodies",
    description: "Classic kangaroo-pocket pullover with adjustable drawstring hood.",
    imageURL: "https://images.unsplash.com/photo-1578768079052-aa76e52ff62e?w=500&q=80"
  },
  // ── T-Shirts ─────────────────────────────────────────────────────────────
  {
    id: "ut-tee-1",
    name: "Urban Graphic Tee",
    price: 24.99,
    category: "T-Shirts",
    description: "Bold screen-print graphic tee made from 100% organic cotton.",
    imageURL: "https://images.unsplash.com/photo-1593726891090-b4c6bc09c819?w=500&q=80"
  },
  {
    id: "ut-tee-2",
    name: "Essential Crewneck Tee",
    price: 19.99,
    category: "T-Shirts",
    description: "Clean, minimal everyday tee in a relaxed unisex fit.",
    imageURL: "https://images.unsplash.com/photo-1621446511130-0ed6519bfeb6?w=500&q=80"
  },
  {
    id: "ut-tee-3",
    name: "Tie-Dye Street Tee",
    price: 29.99,
    category: "T-Shirts",
    description: "Hand tie-dyed tee — every piece is one of a kind.",
    imageURL: "https://images.unsplash.com/photo-1775819541895-09686ee511e8?w=500&q=80"
  },
  // ── Sneakers ─────────────────────────────────────────────────────────────
  {
    id: "ut-shoe-1",
    name: "Classic Low-Top Sneakers",
    price: 89.99,
    category: "Sneakers",
    description: "Versatile low-tops with a clean leather upper. Goes with everything.",
    imageURL: "https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=500&q=80"
  },
  {
    id: "ut-shoe-2",
    name: "High-Top Urban Kicks",
    price: 109.99,
    category: "Sneakers",
    description: "Bold high-tops with ankle support and premium suede panels.",
    imageURL: "https://images.unsplash.com/photo-1562105962-2fbaaf107fe3?w=500&q=80"
  },
  {
    id: "ut-shoe-3",
    name: "Retro Runner Sneakers",
    price: 99.99,
    category: "Sneakers",
    description: "Chunky sole running silhouette inspired by 90s street culture.",
    imageURL: "https://images.unsplash.com/photo-1771844914099-f9fa32e1a3e0?w=500&q=80"
  },
  // ── Accessories ──────────────────────────────────────────────────────────
  {
    id: "ut-acc-1",
    name: "Streetwear Snapback",
    price: 29.99,
    category: "Accessories",
    description: "Adjustable flat-brim snapback with embroidered Urban Threads logo.",
    imageURL: "https://images.unsplash.com/photo-1691256676359-20e5c6d4bc92?w=500&q=80"
  },
  {
    id: "ut-acc-2",
    name: "Canvas Tote Bag",
    price: 24.99,
    category: "Accessories",
    description: "Heavy-duty canvas tote with inner zip pocket and reinforced straps.",
    imageURL: "https://images.unsplash.com/photo-1574365569389-a10d488ca3fb?w=500&q=80"
  },
  {
    id: "ut-acc-3",
    name: "Gold Chain Necklace",
    price: 34.99,
    category: "Accessories",
    description: "18k gold-plated chunky link chain. Make a statement.",
    imageURL: "https://images.unsplash.com/photo-1662434923031-b9bf1b6c10e2?w=500&q=80"
  }
];

let seeded = false;

export async function seedProducts() {
  if (seeded) return;
  try {
    // Check if already seeded with the current real-photo URLs (not picsum)
    const firstDoc = await getDoc(doc(db, 'products', 'ut-hoodie-1'));
    if (firstDoc.exists() && !firstDoc.data().imageURL?.includes('picsum')) {
      seeded = true;
      return;
    }

    // Delete any stale docs (old auto-IDs or old picsum URLs)
    const snap = await getDocs(collection(db, 'products'));
    await Promise.all(snap.docs.map(d => deleteDoc(doc(db, 'products', d.id))));

    // Re-seed with stable IDs and real clothing photo URLs
    await Promise.all(
      PRODUCTS.map(({ id, ...product }) =>
        setDoc(doc(db, 'products', id), product)
      )
    );

    seeded = true;
    console.log('✅ Urban Threads: products seeded to Firestore.');
  } catch (err) {
    console.warn('Seeding skipped (check Firestore rules or auth):', err.message);
  }
}
