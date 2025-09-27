import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import SearchBar from './SearchBar';
import AdSlot from './AdSlot';

const Header = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleAdminClick = () => {
    if (isAdmin) {
      navigate('/admin');
    } else {
      navigate('/admin/login');
    }
  };

  const toggleMobileSearch = () => {
    setShowMobileSearch(!showMobileSearch);
  };

  // Show search bar on all pages EXCEPT admin pages
  const showSearchBar = !location.pathname.startsWith('/admin');

  // Close mobile search when route changes
  useEffect(() => {
    setShowMobileSearch(false);
  }, [location.pathname]);

  return (
    <header className="header">
      <div className="container">
        {/* Main Header Content */}
        <div className="header-content">
          {/* Logo - Always visible */}
          <div className="header-left">
            <Link to="/" className="logo">
              <i className="fas fa-film"></i>
              <span className="logo-text">MoviesHub</span>
            </Link>
          </div>

          {/* Desktop Search Bar - Hidden on mobile */}
          {showSearchBar && !isMobile && (
            <div className="header-center">
              <SearchBar />
            </div>
          )}

          {/* Header Right Section */}
          <div className="header-right">
            {/* Mobile Search Icon - Only show on mobile */}
            {showSearchBar && isMobile && (
              <button 
                className="header-icon mobile-search-toggle"
                onClick={toggleMobileSearch}
                aria-label="Search"
              >
                <i className={`fas ${showMobileSearch ? 'fa-times' : 'fa-search'}`}></i>
              </button>
            )}

            {/* Admin Button */}
            <button 
              className="header-icon admin-btn"
              onClick={handleAdminClick}
              aria-label={isAdmin ? "Admin Panel" : "Admin Login"}
            >
              <i className={`fas ${isAdmin ? 'fa-user-shield' : 'fa-sign-in-alt'}`}></i>
              {!isMobile && (
                <span className="btn-text">
                  {isAdmin ? 'Admin Panel' : 'Admin Login'}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar - Expands below header */}
        {showSearchBar && isMobile && showMobileSearch && (
          <div className="mobile-search-expanded">
            <SearchBar onSearchClose={() => setShowMobileSearch(false)} />
          </div>
        )}
        
        <AdSlot position="header" />
      </div>
    </header>
  );
};

export default Header;
