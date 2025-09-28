import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const BottomNavigation = () => {
  const location = useLocation();
  
  const getNavItemClass = (path) => {
    return location.pathname === path ? 'footer-nav-btn active' : 'footer-nav-btn';
  };

  return (
    <nav className="footer-nav">
      <div className="footer-nav-container">
        <div className="footer-nav-buttons">
          <Link to="/" className={getNavItemClass('/')}>
            <i className="fas fa-home"></i>
            <span>Home</span>
          </Link>
          <Link to="/latest" className={getNavItemClass('/latest')}>
            <i className="fas fa-clock"></i>
            <span>Latest</span>
          </Link>
          <Link to="/trending" className={getNavItemClass('/trending')}>
            <i className="fas fa-fire"></i>
            <span>Trending</span>
            <div className="notification-badge"></div>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default BottomNavigation;
