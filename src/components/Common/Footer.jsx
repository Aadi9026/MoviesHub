import React from 'react';
import { useVideos } from '../../hooks/useVideos';

const Footer = ({ activeSection, onSectionChange }) => {
  const { videos } = useVideos();

  const getTrendingVideos = () => {
    // Sort by views (highest first) and take top 10
    return [...videos]
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 10);
  };

  const getLatestVideos = () => {
    // Sort by creation date (newest first)
    return [...videos]
      .sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date();
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date();
        return dateB - dateA;
      })
      .slice(0, 10);
  };

  const getRandomVideos = () => {
    // Shuffle array and take first 10
    return [...videos]
      .sort(() => Math.random() - 0.5)
      .slice(0, 10);
  };

  const getDisplayVideos = () => {
    switch (activeSection) {
      case 'trending':
        return getTrendingVideos();
      case 'latest':
        return getLatestVideos();
      case 'home':
      default:
        return getRandomVideos();
    }
  };

  const displayVideos = getDisplayVideos();

  return (
    <footer className="footer">
      <div className="container">
        {/* Section Switcher */}
        <div className="footer-sections">
          <button 
            className={`section-btn ${activeSection === 'home' ? 'active' : ''}`}
            onClick={() => onSectionChange('home')}
          >
            <i className="fas fa-home"></i>
            <span>Home</span>
          </button>
          
          <button 
            className={`section-btn ${activeSection === 'trending' ? 'active' : ''}`}
            onClick={() => onSectionChange('trending')}
          >
            <i className="fas fa-fire"></i>
            <span>Trending</span>
          </button>
          
          <button 
            className={`section-btn ${activeSection === 'latest' ? 'active' : ''}`}
            onClick={() => onSectionChange('latest')}
          >
            <i className="fas fa-clock"></i>
            <span>Latest</span>
          </button>
        </div>

        {/* Videos Grid */}
        <div className="footer-videos">
          <div className="videos-grid">
            {displayVideos.map(video => (
              <div key={video.id} className="video-card">
                <div className="thumbnail">
                  <img src={video.thumbnail} alt={video.title} />
                  <div className="video-duration">120m</div>
                </div>
                <div className="video-info">
                  <h3 className="video-title">{video.title}</h3>
                  <div className="video-meta">
                    <span>{video.views || 0} views</span>
                    <span className="genre">{video.genre}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Copyright */}
        <div className="footer-bottom">
          <p>&copy; 2023 MoviesHub. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
