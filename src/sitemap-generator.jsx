import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";

// Firebase config (from your VITE_ env vars)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function generateSitemap() {
  const moviesCol = collection(db, "movies");
  const snapshot = await getDocs(moviesCol);
  
  const urls = snapshot.docs.map((doc) => {
    const data = doc.data();
    return `https://yourdomain.com/movie/${data.slug || doc.id}`;
  });

  const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls.map(url => `<url><loc>${url}</loc></url>`).join("\n")}
  </urlset>`;

  fs.writeFileSync("public/sitemap.xml", sitemapContent);
  console.log("✅ Sitemap generated successfully!");
}

generateSitemap();
