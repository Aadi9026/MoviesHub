import React, { useState, useEffect } from 'react';
import { getVideos } from '../../services/database';
import VideoList from '../User/VideoList';
import LoadingSpinner from './LoadingSpinner';

const FooterSwitcher = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadVideos(activeTab);
  }, [activeTab]);

  const loadVideos = async (tab) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getVideos(50); // Get more videos for filtering
      
      if (result.success) {
        let filteredVideos = [];
        
        switch(tab) {
          case 'trending':
            // Sort by views (highest first) - simulate trending
            filteredVideos = [...result.videos].sort((a, b) => (b.views || 0) - (a.views || 0));
            break;
          case 'latest':
            // Sort by creation date (newest first)
            filteredVideos = [...result.videos].sort((a, b) => {
              const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date();
              const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date();
              return dateB - dateA;
            });
            break;
          case 'home':
          default:
            // Random order for home
            filteredVideos = [...result.videos].sort(() => Math.random() - 0.5);
            break;
        }
        
        setVideos(filteredVideos);
      } else {
        setError(result.error || 'Failed to load videos');
      }
    } catch (err) {
      setError('Failed to load videos');
      console.error('Error loading videos:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="footer-switcher">
      {/* Tab Switcher */}
      <div className="switcher-tabs">
        <button 
          className={`tab-btn ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => setActiveTab('home')}
        >
          <i className="fas fa-home"></i>
          <span>Home</span>
        </button>
        
        <button 
          className={`tab-btn ${activeTab === 'trending' ? 'active' : ''}`}
          onClick={() => setActiveTab('trending')}
        >
          <i className="fas fa-fire"></i>
          <span>Trending</span>
        </button>
        
        <button 
          className={`tab-btn ${activeTab === 'latest' ? 'active' : ''}`}
          onClick={() => setActiveTab('latest')}
        >
          <i className="fas fa-clock"></i>
          <span>Latest</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="switcher-content">
        {loading ? (
          <LoadingSpinner text={`Loading ${activeTab} movies...`} />
        ) : error ? (
          <div className="error-message">
            <i className="fas fa-exclamation-triangle"></i>
            <p>{error}</p>
          </div>
        ) : (
          <VideoList videos={videos} />
        )}
      </div>
    </div>
  );
};

export default FooterSwitcher;
