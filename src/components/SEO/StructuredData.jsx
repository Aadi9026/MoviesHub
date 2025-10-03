import React from 'react';
import { Helmet } from 'react-helmet-async';

const StructuredData = ({ data }) => {
  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(data)}
      </script>
    </Helmet>
  );
};

export const generateWebsiteSchema = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "YTMoviesHub",
  "url": "https://ytmovieshub.website/",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://ytmovieshub.website/?search={search_term_string}",
    "query-input": "required name=search_term_string"
  },
  "description": "Watch latest movies online free in HD quality. Stream Hollywood, Bollywood movies with English subtitles.",
  "publisher": {
    "@type": "Organization",
    "name": "YTMoviesHub",
    "logo": "https://ytmovieshub.website/logo.png"
  }
});

export const generateVideoSchema = (video) => ({
  "@context": "https://schema.org",
  "@type": "VideoObject",
  "name": video.title,
  "description": video.description,
  "thumbnailUrl": video.thumbnail,
  "uploadDate": video.createdAt?.toDate?.().toISOString() || new Date().toISOString(),
  "duration": `PT${video.duration || 120}M`,
  "contentUrl": video.contentUrl || `https://ytmovieshub.website/video/${video.id}`,
  "embedUrl": video.embedCode ? extractIframeSrc(video.embedCode) : undefined,
  "genre": video.genre,
  "interactionCount": video.views || 0
});

const extractIframeSrc = (embedCode) => {
  const match = embedCode.match(/src="([^"]+)"/);
  return match ? match[1] : '';
};

export default StructuredData;
