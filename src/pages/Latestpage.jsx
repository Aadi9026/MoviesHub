import React, { useEffect, useState } from 'react';
import { useVideos } from '../hooks/useVideos';
import VideoList from '../components/User/VideoList';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import AdSlot from '../components/Common/AdSlot';

const LatestPage = () => {
  const { videos, loading, error } = useVideos();
  const [latestVideos, setLatestVideos] = useState([]);

  // Sort videos by creation date (newest first)
  useEffect(() => {
    if (videos && videos.length > 0) {
      const sortedVideos = [...videos].sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date();
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date();
        return dateB - dateA;
      });
      setLatestVideos(sortedVideos);
    }
  }, [videos]);

  if (loading) return <LoadingSpinner text="Loading latest movies..." />;
  if (error) return <div className="error-message">Error: {error}</div>;

  return (
    <div className="latest-page">
      <div className="container">
        <AdSlot position="header" />
        
        <div className="page-header">
          <h1>Latest Movies</h1>
          <p className="results-count">
            {latestVideos.length} newest movies
          </p>
        </div>

        <VideoList videos={latestVideos} />

        <AdSlot position="footer" />
      </div>
    </div>
  );
};

export default LatestPage;
