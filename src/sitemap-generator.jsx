// src/sitemap-generator.js
import fs from "fs";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

// ✅ Firebase config from .env
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ✅ Escape special XML characters safely
const escapeXml = (unsafe = "") =>
  unsafe
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, ""); // remove invisible control chars

async function generateSitemap() {
  console.log("🛠 Generating sitemap...");

  try {
    const moviesCol = collection(db, "movies");
    const snapshot = await getDocs(moviesCol);

    // Base URLs
    const urls = [
      `<url><loc>https://ytmovieshub.website/</loc></url>`,
      `<url><loc>https://ytmovieshub.website/latest</loc></url>`,
      `<url><loc>https://ytmovieshub.website/trending</loc></url>`,
    ];

    // Add movies from Firestore
    snapshot.forEach((doc) => {
      const data = doc.data();
      const slug = escapeXml(data.slug || doc.id);
      urls.push(`<url><loc>https://ytmovieshub.website/movie/${slug}</loc></url>`);
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join(
      "\n"
    )}\n</urlset>`;

    // Write the file in UTF-8 (very important)
    fs.writeFileSync("public/sitemap.xml", xml, { encoding: "utf8" });

    console.log(`✅ Sitemap generated successfully (${urls.length} URLs)`);
  } catch (err) {
    console.error("❌ Error generating sitemap:", err);
  }
}

generateSitemap();
