import React, { useEffect, useState } from 'react';
import { useVideos } from '../hooks/useVideos';
import VideoList from '../components/User/VideoList';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import AdSlot from '../components/Common/AdSlot';

const LatestMovies = () => {
  const { videos, loading, error, loadLatestVideos } = useVideos();

  useEffect(() => {
    // Load latest videos when component mounts
    loadLatestVideos();
  }, [loadLatestVideos]);

  if (loading) {
    return <LoadingSpinner text="Loading latest movies..." />;
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">
          <i className="fas fa-exclamation-triangle"></i>
          <p>Error: {error}</p>
          <button onClick={loadLatestVideos} className="btn btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="latest-page">
      <div className="container">
        <AdSlot position="header" />
        
        <div className="section-header">
          <div>
            <h1 className="section-title">
              <i className="fas fa-clock"></i>
              Latest Releases
            </h1>
            <p className="section-subtitle">Recently added movies</p>
          </div>
        </div>

        <VideoList videos={videos} className="latest-grid" />
        
        <AdSlot position="footer" />
      </div>
    </div>
  );
};

export default LatestMovies;
