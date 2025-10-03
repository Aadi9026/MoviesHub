import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import MovieList from './MovieList';
import MovieForm from './MovieForm';
import AdSettings from './AdSettings';
import TabPanel from '../UI/TabPanel';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('movies');
  const [refreshList, setRefreshList] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const tabs = [
    { id: 'movies', label: 'Manage Movies', icon: 'fas fa-film' },
    { id: 'add', label: 'Add New Movie', icon: 'fas fa-plus' },
    { id: 'ads', label: 'Ad Settings', icon: 'fas fa-ad' }
  ];

  const handleMovieAdded = () => {
    setRefreshList(prev => !prev);
    setActiveTab('movies');
  };

  const handleBackToSite = () => {
    navigate('/');
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  if (!isAdmin) {
    return (
      <div className="admin-panel">
        <div className="admin-header">
          <h2>Access Denied</h2>
          <p>You need admin privileges to access this panel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <div className="admin-title-section">
          <div className="admin-title">
            <i className="fas fa-user-shield"></i>
            <h2>Admin Panel</h2>
          </div>
          <p>Manage your MoviesHub content and settings</p>
        </div>
        
        <div className="admin-actions">
          <button className="btn btn-secondary" onClick={handleBackToSite}>
            <i className="fas fa-arrow-left"></i>
            Back to Site
          </button>
        </div>
      </div>

      {/* Add Search Bar in Movies Tab */}
      {activeTab === 'movies' && (
        <div className="admin-search-bar">
          <div className="search-container">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search movies by title, year, or genre..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button 
                className="clear-search"
                onClick={() => setSearchTerm('')}
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
        </div>
      )}

      <TabPanel 
        tabs={tabs} 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
      />

      <div className="admin-content">
        {activeTab === 'movies' && (
          <MovieList 
            key={refreshList} 
            searchTerm={searchTerm}
          />
        )}
        {activeTab === 'add' && (
          <MovieForm 
            onSuccess={handleMovieAdded} 
            onDuplicateCheck={true}
          />
        )}
        {activeTab === 'ads' && <AdSettings />}
      </div>
    </div>
  );
};

export default AdminPanel;
