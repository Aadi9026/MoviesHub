import React, { useState, useEffect } from 'react';
import { getVideos, deleteVideo } from '../../services/database';
import LoadingSpinner from '../Common/LoadingSpinner';
import MovieForm from './MovieForm';
import Modal from '../UI/Modal';

const MovieList = ({ searchTerm = '' }) => {
  const [videos, setVideos] = useState([]);
  const [filteredVideos, setFilteredVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingVideo, setEditingVideo] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    loadVideos();
  }, []);

  useEffect(() => {
    filterVideos();
  }, [searchTerm, videos]);

  const loadVideos = async () => {
    setLoading(true);
    const result = await getVideos();
    if (result.success) {
      setVideos(result.videos);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const filterVideos = () => {
    if (!searchTerm.trim()) {
      setFilteredVideos(videos);
      return;
    }

    const term = searchTerm.toLowerCase().trim();
    const filtered = videos.filter(video => 
      video.title?.toLowerCase().includes(term) ||
      video.genre?.toLowerCase().includes(term) ||
      video.description?.toLowerCase().includes(term) ||
      video.releaseYear?.toString().includes(term) ||
      video.duration?.toString().includes(term)
    );
    setFilteredVideos(filtered);
  };

  const handleEdit = (video) => {
    setEditingVideo(video);
    setShowEditModal(true);
  };

  const handleDelete = async (id, title) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      const result = await deleteVideo(id);
      if (result.success) {
        setVideos(videos.filter(video => video.id !== id));
      } else {
        setError(result.error);
      }
    }
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setEditingVideo(null);
    loadVideos();
  };

  if (loading) return <LoadingSpinner text="Loading videos..." />;
  if (error) return <div className="error-message">Error: {error}</div>;

  const displayVideos = searchTerm ? filteredVideos : videos;

  return (
    <div className="movie-list">
      <div className="list-header">
        <h3>Manage Movies ({displayVideos.length}) 
          {searchTerm && (
            <span className="search-results">
              {" "}for "{searchTerm}"
            </span>
          )}
        </h3>
        <button className="btn btn-secondary" onClick={loadVideos}>
          <i className="fas fa-sync-alt"></i> Refresh
        </button>
      </div>

      {searchTerm && filteredVideos.length === 0 && (
        <div className="search-no-results">
          <i className="fas fa-search"></i>
          <h4>No movies found for "{searchTerm}"</h4>
          <p>Try searching with different keywords</p>
        </div>
      )}

      {!searchTerm && videos.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-film"></i>
          <p>No movies found. Add your first movie!</p>
        </div>
      ) : (
        <div className="movies-grid">
          {displayVideos.map(video => (
            <div key={video.id} className="movie-item">
              <div className="movie-thumb">
                <img src={video.thumbnail} alt={video.title} />
                <div className="movie-stats">
                  <span><i className="fas fa-eye"></i> {video.views || 0}</span>
                  {video.releaseYear && (
                    <span><i className="fas fa-calendar"></i> {video.releaseYear}</span>
                  )}
                </div>
              </div>
              <div className="movie-info">
                <h4 className="movie-title">{video.title}</h4>
                <div className="movie-meta">
                  <span className="genre">{video.genre}</span>
                  <span> • </span>
                  <span>{video.duration || 120} min</span>
                </div>
                <p className="movie-description">
                  {video.description?.substring(0, 100)}...
                </p>
                <div className="movie-date">
                  Added: {video.createdAt?.toDate().toLocaleDateString()}
                </div>
              </div>
              <div className="movie-actions">
                <button 
                  className="btn btn-edit"
                  onClick={() => handleEdit(video)}
                >
                  <i className="fas fa-edit"></i> Edit
                </button>
                <button 
                  className="btn btn-delete"
                  onClick={() => handleDelete(video.id, video.title)}
                >
                  <i className="fas fa-trash"></i> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal 
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Movie"
      >
        <MovieForm 
          editVideo={editingVideo}
          onSuccess={handleEditSuccess}
          onCancel={() => setShowEditModal(false)}
        />
      </Modal>
    </div>
  );
};

export default MovieList;
