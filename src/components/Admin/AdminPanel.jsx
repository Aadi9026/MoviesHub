import React, { useState } from 'react';
import MovieList from './MovieList';
import MovieForm from './MovieForm';
import AdSettings from './AdSettings';
import TabPanel from '../UI/TabPanel';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('movies');
  const [refreshList, setRefreshList] = useState(false);

  const tabs = [
    { id: 'movies', label: 'Manage Movies', icon: 'fas fa-film' },
    { id: 'add', label: 'Add New Movie', icon: 'fas fa-plus' },
    { id: 'ads', label: 'Ad Settings', icon: 'fas fa-ad' }
  ];

  const handleMovieAdded = () => {
    setRefreshList(prev => !prev);
    setActiveTab('movies');
  };

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <div className="admin-title">
          <i className="fas fa-user-shield"></i>
          <h2>Admin Panel</h2>
        </div>
        <p>Manage your MoviesHub content and settings</p>
      </div>

      <TabPanel 
        tabs={tabs} 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
      />

      <div className="admin-content">
        {activeTab === 'movies' && <MovieList key={refreshList} />}
        {activeTab === 'add' && <MovieForm onSuccess={handleMovieAdded} />}
        {activeTab === 'ads' && <AdSettings />}
      </div>
    </div>
  );
};

export default AdminPanel;
