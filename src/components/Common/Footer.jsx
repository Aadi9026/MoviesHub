import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getVideos, getTrendingVideos, getLatestVideos } from '../../services/database';
import VideoCard from './VideoCard';
import LoadingSpinner from './LoadingSpinner';

const Footer = () => {
  const [activeSection, setActiveSection] = useState('home');
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  // Don't show footer on admin pages
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  const loadSectionVideos = async (section) => {
    setLoading(true);
    setActiveSection(section);
    
    try {
      let result;
      switch (section) {
        case 'trending':
          result = await getTrendingVideos();
          break;
        case 'latest':
          result = await getLatestVideos();
          break;
        case 'home':
        default:
          result = await getVideos(12);
          break;
      }
      
      if (result.success) {
        setVideos(result.videos);
      } else {
        console.error('Error loading videos:', result.error);
        setVideos([]);
      }
    } catch (error) {
      console.error('Error loading section videos:', error);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  // Load home videos by default
  useEffect(() => {
    loadSectionVideos('home');
  }, []);

  return (
    <footer className="footer">
      <div className="container">
        {/* Footer Navigation */}
        <div className="footer-navigation">
          <button 
            className={`footer-nav-btn ${activeSection === 'home' ? 'active' : ''}`}
            onClick={() => loadSectionVideos('home')}
          >
            <i className="fas fa-home"></i>
            <span>Home</span>
          </button>
          
          <button 
            className={`footer-nav-btn ${activeSection === 'trending' ? 'active' : ''}`}
            onClick={() => loadSectionVideos('trending')}
          >
            <i className="fas fa-fire"></i>
            <span>Trending</span>
          </button>
          
          <button 
            className={`footer-nav-btn ${activeSection === 'latest' ? 'active' : ''}`}
            onClick={() => loadSectionVideos('latest')}
          >
            <i className="fas fa-clock"></i>
            <span>Latest</span>
          </button>
        </div>

        {/* Section Content */}
        <div className="footer-content">
          <div className="section-header">
            <h3>
              {activeSection === 'home' && 'Featured Movies'}
              {activeSection === 'trending' && 'Trending Now'}
              {activeSection === 'latest' && 'Latest Uploads'}
            </h3>
            <p>
              {activeSection === 'home' && 'Discover amazing movies from our collection'}
              {activeSection === 'trending' && 'Most popular movies right now'}
              {activeSection === 'latest' && 'Recently added movies'}
            </p>
          </div>

          {loading ? (
            <div className="section-loading">
              <LoadingSpinner text={`Loading ${activeSection} movies...`} />
            </div>
          ) : (
            <div className="footer-videos-grid">
              {videos.length > 0 ? (
                videos.map(video => (
                  <VideoCard key={video.id} video={video} compact={true} />
                ))
              ) : (
                <div className="no-videos">
                  <i className="fas fa-film"></i>
                  <p>No movies found in this section</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Links */}
        <div className="footer-links">
          <div className="footer-section">
            <h4>MoviesHub</h4>
            <p>Your ultimate destination for streaming movies and TV shows in high quality.</p>
          </div>
          
          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><a href="#trending" onClick={() => loadSectionVideos('trending')}>Trending</a></li>
              <li><a href="#latest" onClick={() => loadSectionVideos('latest')}>Latest</a></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>Genres</h4>
            <ul>
              <li><a href="#action">Action</a></li>
              <li><a href="#comedy">Comedy</a></li>
              <li><a href="#drama">Drama</a></li>
              <li><a href="#horror">Horror</a></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>Support</h4>
            <ul>
              <li><a href="#help">Help Center</a></li>
              <li><a href="#contact">Contact Us</a></li>
              <li><a href="#privacy">Privacy Policy</a></li>
              <li><a href="#terms">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2023 MoviesHub. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
