import React, { useEffect, useState } from 'react';
import { useVideos } from '../hooks/useVideos';
import VideoList from '../components/User/VideoList';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import AdSlot from '../components/Common/AdSlot';

const TrendingPage = () => {
  const { videos, loading, error } = useVideos();
  const [trendingVideos, setTrendingVideos] = useState([]);

  // Get trending videos based on views and daily rotation
  useEffect(() => {
    if (videos && videos.length > 0) {
      // Get today's date as a seed for consistent daily trending
      const today = new Date();
      const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
      
      // Sort by views first, then apply daily rotation
      const sortedByViews = [...videos].sort((a, b) => {
        return (b.views || 0) - (a.views || 0);
      });

      // Apply daily rotation to trending videos
      const rotatedVideos = rotateTrendingVideos(sortedByViews, seed);
      setTrendingVideos(rotatedVideos.slice(0, 50)); // Show top 50 trending
    }
  }, [videos]);

  // Rotate trending videos based on daily seed
  const rotateTrendingVideos = (videosArray, seed) => {
    if (!videosArray || videosArray.length === 0) return [];
    
    const rotated = [...videosArray];
    const rotationIndex = seed % rotated.length;
    
    // Rotate array to show different trending videos each day
    return [
      ...rotated.slice(rotationIndex),
      ...rotated.slice(0, rotationIndex)
    ];
  };

  if (loading) return <LoadingSpinner text="Loading trending movies..." />;
  if (error) return <div className="error-message">Error: {error}</div>;

  return (
    <div className="trending-page">
      <div className="container">
        <AdSlot position="header" />
        
        <div className="page-header">
          <h1>Trending Movies</h1>
          <p className="results-count">
            {trendingVideos.length} trending movies today
          </p>
        </div>

        <VideoList videos={trendingVideos} />

        <AdSlot position="footer" />
      </div>
    </div>
  );
};

export default TrendingPage;
