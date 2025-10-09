import { getVideos } from '../src/services/database';

export default async function handler(req, res) {
  try {
    // Get all videos from your database
    const videosResult = await getVideos(1000); // Adjust limit as needed
    
    if (!videosResult.success) {
      throw new Error('Failed to fetch videos');
    }

    const videos = videosResult.videos || [];
    
    // Generate sitemap XML
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
  
  <!-- Static Pages -->
  <url>
    <loc>https://ytmovieshub.website/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  
  <url>
    <loc>https://ytmovieshub.website/latest</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  
  <url>
    <loc>https://ytmovieshub.website/trending</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`;

    // Add video pages
    videos.forEach(video => {
      const videoDate = video.createdAt?.toDate ? 
        video.createdAt.toDate().toISOString().split('T')[0] : 
        new Date().toISOString().split('T')[0];
      
      sitemap += `
  <url>
    <loc>https://ytmovieshub.website/video/${video.id}</loc>
    <lastmod>${videoDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    <video:video>
      <video:thumbnail_loc>${video.thumbnail || 'https://ytmovieshub.website/default-thumbnail.jpg'}</video:thumbnail_loc>
      <video:title><![CDATA[${video.title || 'Movie'}]]></video:title>
      <video:description><![CDATA[${video.description || 'Watch this movie online for free'}]]></video:description>
      <video:content_loc>https://ytmovieshub.website/video/${video.id}</video:content_loc>
      <video:duration>${video.duration || 120}</video:duration>
      <video:view_count>${video.views || 0}</video:view_count>
      <video:publication_date>${videoDate}T00:00:00+00:00</video:publication_date>
      <video:family_friendly>yes</video:family_friendly>
      <video:category>Entertainment</video:category>
      <video:tag>${video.genre || 'movie'}</video:tag>
    </video:video>
  </url>`;
    });

    sitemap += '\n</urlset>';

    // Set response headers
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate');
    res.status(200).send(sitemap);
    
  } catch (error) {
    console.error('Sitemap generation error:', error);
    res.status(500).send('Error generating sitemap');
  }
}
