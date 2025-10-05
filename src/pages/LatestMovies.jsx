import React, { useEffect, useState } from 'react';
import { getLatestVideosForSection } from '../services/database';
import VideoList from '../components/User/VideoList';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import AdSlot from '../components/Common/AdSlot';

const LatestMovies = () => {
  const [latestVideos, setLatestVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadLatestVideos = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await getLatestVideosForSection(12);
      
      if (result.success) {
        setLatestVideos(result.videos);
      } else {
        setError(result.error || 'Failed to load latest videos');
      }
    } catch (err) {
      setError('Error loading latest videos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLatestVideos();
  }, []);

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

        {/* Use VideoList with horizontal layout */}
        <VideoList 
          videos={latestVideos} 
          className="latest-grid"
          layout="horizontal"
        />
        
        <AdSlot position="footer" />
      </div>
    </div>
  );
};

export default LatestMovies;
