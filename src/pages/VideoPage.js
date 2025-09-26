import React from 'react';
import { useParams } from 'react-router-dom';
import { useVideo, useRelatedVideos } from '../hooks/useVideos';
import VideoDetail from '../components/User/VideoDetail';
import LoadingSpinner from '../components/Common/LoadingSpinner';

const VideoPage = () => {
  const { id } = useParams();
  const { video, loading, error } = useVideo(id);
  const { videos: relatedVideos, loading: relatedLoading } = useRelatedVideos(
    video?.genre, 
    id
  );

  if (loading) return <LoadingSpinner text="Loading video..." />;
  if (error) return <div className="error-message">Error: {error}</div>;
  if (!video) return <div className="error-message">Video not found</div>;

  return (
    <VideoDetail 
      video={video} 
      relatedVideos={relatedVideos} 
      relatedLoading={relatedLoading}
    />
  );
};

export default VideoPage;
