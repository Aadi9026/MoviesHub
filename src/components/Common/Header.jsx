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

  // Show search bar on all pages EXCEPT admin pages
  const showSearchBar = !location.pathname.startsWith('/admin');

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <div className="header-left">
            <Link to="/" className="logo">
              <i className="fas fa-film"></i>
              <span>MoviesHub</span>
            </Link>
          </div>

          {/* Search Bar - Always visible when not on admin pages */}
          {showSearchBar && (
            <div className="header-center">
              <SearchBar />
            </div>
          )}

          <div className="header-right">
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
        
        <AdSlot position="header" />
      </div>
    </header>
  );
};

export default Header;
