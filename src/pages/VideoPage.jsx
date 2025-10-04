import React, { useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useVideo, useRelatedVideos } from '../hooks/useVideos';
import VideoDetail from '../components/User/VideoDetail';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import SeoHead from '../components/SEO/SeoHead';
import StructuredData, { generateVideoSchema } from '../components/SEO/StructuredData';

const VideoPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { video, loading, error } = useVideo(id);
  const { videos: relatedVideos, loading: relatedLoading } = useRelatedVideos(
    video?.genre, 
    id
  );

  // Handle URL parameters for direct video access
  useEffect(() => {
    // Check if there's a video ID in URL search params (for backward compatibility)
    const urlParams = new URLSearchParams(location.search);
    const videoIdFromUrl = urlParams.get('v');
    
    if (videoIdFromUrl && videoIdFromUrl !== id) {
      // Redirect to proper video page format
      navigate(`/video/${videoIdFromUrl}`, { replace: true });
      return;
    }

    // Auto-scroll to video player when page loads
    if (video && !loading) {
      setTimeout(() => {
        const videoElement = document.querySelector('.video-player-sticky');
        if (videoElement) {
          videoElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 500);
    }
  }, [id, video, loading, location.search, navigate]);

  if (loading) return <LoadingSpinner text="Loading video..." />;
  if (error) return <div className="error-message">Error: {error}</div>;
  if (!video) return <div className="error-message">Video not found</div>;

  // SEO data for video page
  const seoData = {
    title: `${video.title} - Watch Online Free | YTMoviesHub`,
    description: video.description || `Watch ${video.title} online free in HD quality. ${video.genre} movie with English subtitles on YTMoviesHub.`,
    keywords: `${video.title}, watch ${video.title} online, ${video.genre} movies, ${video.title} HD`,
    video: {
      title: video.title,
      description: video.description,
      thumbnail: video.thumbnail,
      uploadDate: video.createdAt?.toDate?.().toISOString() || new Date().toISOString(),
      duration: video.duration || 120,
      contentUrl: `https://ytmovieshub.website/video/${video.id}`
    }
  };

  return (
    <div className="video-page">
      {/* ADD SEO HEAD */}
      <SeoHead {...seoData} />
      
      {/* ADD STRUCTURED DATA */}
      <StructuredData data={generateVideoSchema(video)} />
      
      <VideoDetail 
        video={video} 
        relatedVideos={relatedVideos} 
        relatedLoading={relatedLoading}
      />
    </div>
  );
};

export default VideoPage;
