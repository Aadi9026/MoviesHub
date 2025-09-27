import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import SearchBar from './SearchBar';
import AdSlot from './AdSlot';

const Header = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleAdminClick = () => {
    if (isAdmin) {
      navigate('/admin');
    } else {
      navigate('/admin/login');
    }
  };

  // Show search bar on all pages EXCEPT admin pages
  const showSearchBar = !location.pathname.startsWith('/admin');

  console.log('Current path:', location.pathname);
  console.log('Show search bar:', showSearchBar);

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <div className="header-left">
            <button 
              className="mobile-menu-btn"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              <i className="fas fa-bars"></i>
            </button>
            <Link to="/" className="logo">
              <i className="fas fa-film"></i>
              <span>MoviesHub</span>
            </Link>
          </div>

          {showSearchBar && (
            <div className={`header-center ${showMobileMenu ? 'mobile-show' : ''}`}>
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
                  <span>Admin Panel</span>
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt"></i>
                  <span>Admin Login</span>
                </>
              )}
            </button>
          </div>
        </div>
        
        <AdSlot position="header" />
      </div>

      {showMobileMenu && (
        <div className="mobile-menu-overlay" onClick={() => setShowMobileMenu(false)}></div>
      )}
    </header>
  );
};

export default Header;
