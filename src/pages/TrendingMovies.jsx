import React, { useEffect, useState } from 'react';
import { useVideos } from '../hooks/useVideos';
import VideoList from '../components/User/VideoList';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import AdSlot from '../components/Common/AdSlot';

const TrendingMovies = () => {
  const { videos, loading, error, loadTrendingVideos } = useVideos();

  useEffect(() => {
    // Load trending videos when component mounts
    loadTrendingVideos();
  }, [loadTrendingVideos]);

  if (loading) {
    return <LoadingSpinner text="Loading trending movies..." />;
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">
          <i className="fas fa-exclamation-triangle"></i>
          <p>Error: {error}</p>
          <button onClick={loadTrendingVideos} className="btn btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="trending-page">
      <div className="container">
        <AdSlot position="header" />
        
        <div className="section-header">
          <div>
            <h1 className="section-title">
              <i className="fas fa-fire"></i>
              Trending Today
            </h1>
            <p className="section-subtitle">Most popular movies right now</p>
          </div>
        </div>

        <VideoList videos={videos} className="trending-grid" />
        
        <AdSlot position="footer" />
      </div>
    </div>
  );
};

export default TrendingMovies;
