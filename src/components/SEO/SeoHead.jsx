import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

const SeoHead = ({ 
  title = "MoviesHub - Stream HD Movies Online Free", 
  description = "Watch latest movies online free in HD quality. Stream Hollywood, Bollywood, Action, Romance, Comedy movies with English subtitles.",
  keywords = "watch movies online, free movies, HD movies, Hollywood movies, Bollywood movies, stream movies",
  image = "https://movieshub.vercel.app/og-image.jpg",
  video = null 
}) => {
  const location = useLocation();
  const currentUrl = `https://movieshub.vercel.app${location.pathname}`;
  
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": title,
    "description": description,
    "url": currentUrl,
    "mainEntity": video ? {
      "@type": "VideoObject",
      "name": video.title,
      "description": video.description,
      "thumbnailUrl": video.thumbnail,
      "uploadDate": video.uploadDate,
      "duration": video.duration,
      "contentUrl": video.contentUrl
    } : undefined
  };

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={currentUrl} />

      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:image" content={image} />
      <meta property="og:type" content={video ? "video.movie" : "website"} />
      <meta property="og:site_name" content="MoviesHub" />

      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content={video ? "player" : "summary_large_image"} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Video Specific Meta Tags */}
      {video && (
        <>
          <meta property="og:video" content={video.contentUrl} />
          <meta property="og:video:type" content="text/html" />
          <meta property="og:video:width" content="1280" />
          <meta property="og:video:height" content="720" />
          <meta property="og:video:duration" content={video.duration} />
        </>
      )}

      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(schemaData)}
      </script>

      {/* Additional SEO Meta Tags */}
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      <meta name="bingbot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
    </Helmet>
  );
};

export default SeoHead;
