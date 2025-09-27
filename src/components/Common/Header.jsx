import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import SearchBar from './SearchBar';
import AdSlot from './AdSlot';

const Header = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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
    setShowMobileMenu(false);
    setShowMobileSearch(false);
  };

  const handleLogoClick = () => {
    setShowMobileMenu(false);
    setShowMobileSearch(false);
  };

  const toggleMobileSearch = () => {
    setShowMobileSearch(!showMobileSearch);
    setShowMobileMenu(false);
  };

  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
    setShowMobileSearch(false);
  };

  // Show search bar on all pages EXCEPT admin pages
  const showSearchBar = !location.pathname.startsWith('/admin');

  // Close mobile elements when route changes
  useEffect(() => {
    setShowMobileMenu(false);
    setShowMobileSearch(false);
  }, [location.pathname]);

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <div className="header-left">
            <button 
              className="mobile-menu-btn"
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
            >
              <i className={`fas ${showMobileMenu ? 'fa-times' : 'fa-bars'}`}></i>
            </button>
            <Link to="/" className="logo" onClick={handleLogoClick}>
              <i className="fas fa-film"></i>
              <span>MoviesHub</span>
            </Link>
          </div>

          {/* Desktop Search Bar - Always visible on desktop */}
          {showSearchBar && !isMobile && (
            <div className="header-center">
              <SearchBar />
            </div>
          )}

          <div className="header-right">
            {/* Mobile Search Icon - Only on mobile */}
            {showSearchBar && isMobile && (
              <button 
                className="mobile-search-btn"
                onClick={toggleMobileSearch}
                aria-label="Search"
              >
                <i className={`fas ${showMobileSearch ? 'fa-times' : 'fa-search'}`}></i>
              </button>
            )}

            <button 
              className="btn btn-secondary admin-btn"
              onClick={handleAdminClick}
            >
              {isAdmin ? (
                <>
                  <i className="fas fa-user-shield"></i>
                  {!isMobile && <span>Admin Panel</span>}
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt"></i>
                  {!isMobile && <span>Admin Login</span>}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar - Expands when search icon is clicked */}
        {showSearchBar && isMobile && showMobileSearch && (
          <div className="mobile-search-expanded">
            <SearchBar onSearchClose={() => setShowMobileSearch(false)} />
          </div>
        )}
        
        <AdSlot position="header" />
      </div>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && isMobile && (
        <div className="mobile-menu-overlay" onClick={() => setShowMobileMenu(false)}>
          <div className="mobile-menu-content" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-menu-header">
              <h3>Menu</h3>
              <button 
                className="mobile-menu-close"
                onClick={() => setShowMobileMenu(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="mobile-menu-items">
              <Link 
                to="/" 
                className="mobile-menu-item"
                onClick={() => setShowMobileMenu(false)}
              >
                <i className="fas fa-home"></i>
                <span>Home</span>
              </Link>
              
              <button 
                className="mobile-menu-item"
                onClick={handleAdminClick}
              >
                <i className={`fas ${isAdmin ? 'fa-user-shield' : 'fa-sign-in-alt'}`}></i>
                <span>{isAdmin ? 'Admin Panel' : 'Admin Login'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
