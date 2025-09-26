import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import SearchBar from './SearchBar';
import AdSlot from './AdSlot';

const Header = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleAdminClick = () => {
    if (isAdmin) {
      navigate('/admin');
    } else {
      navigate('/admin/login');
    }
  };

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
              {isAdmin && <span className="admin-badge">Admin</span>}
            </Link>
          </div>

          <div className={`header-center ${showMobileMenu ? 'mobile-show' : ''}`}>
            <SearchBar />
          </div>

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
