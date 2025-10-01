import React from 'react';
import { useParams } from 'react-router-dom';
import { useVideo, useRelatedVideos } from '../hooks/useVideos';
import VideoDetail from '../components/User/VideoDetail';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import SeoHead from '../components/SEO/SeoHead';
import StructuredData, { generateVideoSchema } from '../components/SEO/StructuredData';

const VideoPage = () => {
  const { id } = useParams();
  const { video, loading, error } = useVideo(id);
  const { videos: relatedVideos, loading: relatedLoading } = useRelatedVideos(
    video?.genre, 
    id
  );

  // Extract video source for SEO
  const extractVideoSource = (embedCode) => {
    if (!embedCode) return '';
    const match = embedCode.match(/src=(["'])(.*?)\1/);
    return match ? match[2] : '';
  };

  // Format duration for SEO
  const formatDuration = (minutes) => {
    if (!minutes) return 'PT2H';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `PT${hours > 0 ? hours + 'H' : ''}${mins}M`;
  };

  // Generate video data for SEO
  const getVideoSeoData = () => {
    if (!video) return null;

    const videoSource = extractVideoSource(video.embedCode);
    const uploadDate = video.createdAt?.toDate?.() || new Date();
    const duration = formatDuration(video.duration);
    
    return {
      title: `${video.title} - Watch Online Free HD | MoviesHub`,
      description: video.description || `Watch ${video.title} online free in HD quality. ${video.genre} movie with English subtitles. ${video.views || 0}+ views.`,
      keywords: `${video.title}, watch ${video.title} online, ${video.genre} movies, ${video.title} full movie, ${video.title} HD, free movie streaming`,
      image: video.thumbnail,
      video: {
        title: video.title,
        description: video.description || `Watch ${video.title} - ${video.genre} movie online free in HD quality.`,
        thumbnail: video.thumbnail,
        uploadDate: uploadDate.toISOString(),
        duration: duration,
        contentUrl: videoSource,
        embedUrl: videoSource,
        genre: video.genre,
        views: video.views || 0,
        actor: "Various Artists", // You can customize this based on your data
        director: "Various Directors" // You can customize this based on your data
      }
    };
  };

  // Generate breadcrumb structured data
  const getBreadcrumbSchema = () => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://movieshub.vercel.app/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": video?.genre || "Movies",
        "item": `https://movieshub.vercel.app/?genre=${video?.genre || 'movies'}`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": video?.title || "Movie",
        "item": `https://movieshub.vercel.app/video/${id}`
      }
    ]
  });

  if (loading) return <LoadingSpinner text="Loading video..." />;
  if (error) return <div className="error-message">Error: {error}</div>;
  if (!video) return <div className="error-message">Video not found</div>;

  const seoData = getVideoSeoData();

  return (
    <div className="video-page">
      {/* Video SEO Head */}
      <SeoHead {...seoData} />
      
      {/* Video Structured Data */}
      <StructuredData data={generateVideoSchema(video)} />
      
      {/* Breadcrumb Structured Data */}
      <StructuredData data={getBreadcrumbSchema()} />
      
      {/* Additional Video SEO Meta Tags */}
      <SeoHead 
        title={seoData.title}
        description={seoData.description}
        keywords={seoData.keywords}
        video={seoData.video}
      />

      <VideoDetail 
        video={video} 
        relatedVideos={relatedVideos} 
        relatedLoading={relatedLoading}
      />
    </div>
  );
};

export default VideoPage;
