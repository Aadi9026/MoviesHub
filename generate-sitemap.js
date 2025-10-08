import fs from "fs";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const baseUrl = "https://ytmovieshub.website";

// 🔥 Your Firebase config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function generateSitemap() {
  const today = new Date().toISOString().split("T")[0];
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  sitemap += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  // --- Static pages
  const staticPages = ["", "latest", "trending"];
  staticPages.forEach((page) => {
    sitemap += `
  <url>
    <loc>${baseUrl}/${page}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`;
  });

  // --- Fetch movie URLs from Firebase
  console.log("📡 Fetching movies from Firebase...");
  const moviesSnapshot = await getDocs(collection(db, "movies"));
  moviesSnapshot.forEach((doc) => {
    const data = doc.data();
    const slug =
      data.slug ||
      data.title
        ?.toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

    sitemap += `
  <url>
    <loc>${baseUrl}/movies/${slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
  });

  sitemap += `\n</urlset>`;

  fs.writeFileSync("./public/sitemap.xml", sitemap);
  console.log("✅ Sitemap generated successfully with Firebase movies!");
}

generateSitemap().catch((err) => console.error("❌ Error generating sitemap:", err));
