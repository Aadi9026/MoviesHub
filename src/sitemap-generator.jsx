// src/sitemap-generator.js
import fs from "fs";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

// ✅ Your Firebase config (same as in your .env)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Escape XML special chars
function escapeXml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function generateSitemap() {
  console.log("🛠️ Generating sitemap from Firebase...");

  try {
    const moviesCol = collection(db, "movies");
    const snapshot = await getDocs(moviesCol);

    const urls = [
      `  <url><loc>https://ytmovieshub.website/</loc></url>`,
      `  <url><loc>https://ytmovieshub.website/latest</loc></url>`,
      `  <url><loc>https://ytmovieshub.website/trending</loc></url>`,
    ];

    snapshot.forEach((doc) => {
      const data = doc.data();
      const slug = data.slug || doc.id;
      const safeUrl = escapeXml(`https://ytmovieshub.website/movie/${slug}`);
      urls.push(`  <url><loc>${safeUrl}</loc></url>`);
    });

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

    fs.writeFileSync("public/sitemap.xml", sitemap);
    console.log(`✅ Sitemap generated successfully with ${urls.length} URLs`);
  } catch (error) {
    console.error("❌ Error generating sitemap:", error);
  }
}

generateSitemap();
