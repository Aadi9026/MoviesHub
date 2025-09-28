import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Footer = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleHomeClick = () => {
    navigate('/');
  };

  const handleLatestClick = () => {
    navigate('/latest');
  };

  const handleTrendingClick = () => {
    navigate('/trending');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <footer className="footer">
      <div className="footer-buttons">
        <button 
          className={`footer-btn ${isActive('/') ? 'active' : ''}`}
          onClick={handleHomeClick}
        >
          <i className="fas fa-home"></i>
          <span>Home</span>
        </button>
        
        <button 
          className={`footer-btn ${isActive('/latest') ? 'active' : ''}`}
          onClick={handleLatestClick}
        >
          <i className="fas fa-clock"></i>
          <span>Latest</span>
        </button>
        
        <button 
          className={`footer-btn ${isActive('/trending') ? 'active' : ''}`}
          onClick={handleTrendingClick}
        >
          <i className="fas fa-fire"></i>
          <span>Trending</span>
        </button>
      </div>
    </footer>
  );
};

export default Footer;
