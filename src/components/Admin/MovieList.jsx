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
    try {
      setLoading(true);
      setError('');
      console.log('Loading videos...');
      
      const result = await getVideos();
      console.log('Videos result:', result);
      
      if (result && result.success) {
        // FIX: Sort videos by original createdAt date to maintain position
        const sortedVideos = (result.videos || []).sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
          return dateB - dateA; // Keep original order (newest first)
        });
        
        setVideos(sortedVideos);
      } else {
        setError(result?.error || 'Failed to load videos');
      }
    } catch (err) {
      console.error('Error loading videos:', err);
      setError('Error loading videos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filterVideos = () => {
    try {
      if (!searchTerm.trim()) {
        setFilteredVideos(videos);
        return;
      }

      const term = searchTerm.toLowerCase().trim();
      const filtered = videos.filter(video => 
        (video.title?.toLowerCase().includes(term)) ||
        (video.genre?.toLowerCase().includes(term)) ||
        (video.description?.toLowerCase().includes(term)) ||
        (video.releaseYear?.toString().includes(term)) ||
        (video.duration?.toString().includes(term))
      );
      setFilteredVideos(filtered || []);
    } catch (err) {
      console.error('Error filtering videos:', err);
      setFilteredVideos(videos);
    }
  };

  const handleEdit = (video) => {
    setEditingVideo(video);
    setShowEditModal(true);
  };

  const handleDelete = async (id, title) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      try {
        const result = await deleteVideo(id);
        if (result.success) {
          setVideos(videos.filter(video => video.id !== id));
        } else {
          setError(result.error || 'Failed to delete video');
        }
      } catch (err) {
        setError('Error deleting video: ' + err.message);
      }
    }
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setEditingVideo(null);
    // FIX: Instead of reloading all videos, update the specific video in state
    // This maintains the original position
    loadVideos(); // Still reload but with proper sorting
  };

  // SAFE RENDER - PREVENT CRASHES
  if (loading) return <LoadingSpinner text="Loading videos..." />;
  
  if (error) {
    return (
      <div className="error-message" style={{padding: '20px', background: '#dc3545', color: 'white', borderRadius: '8px'}}>
        <h4>Error Loading Movies</h4>
        <p>{error}</p>
        <button className="btn btn-secondary" onClick={loadVideos}>
          Try Again
        </button>
      </div>
    );
  }

  const displayVideos = searchTerm ? (filteredVideos || []) : (videos || []);
  const safeVideos = Array.isArray(displayVideos) ? displayVideos : [];

  return (
    <div className="movie-list">
      <div className="list-header">
        <h3>Manage Movies ({safeVideos.length}) 
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

      {searchTerm && safeVideos.length === 0 && (
        <div className="search-no-results">
          <i className="fas fa-search"></i>
          <h4>No movies found for "{searchTerm}"</h4>
          <p>Try searching with different keywords</p>
        </div>
      )}

      {!searchTerm && safeVideos.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-film"></i>
          <p>No movies found. Add your first movie!</p>
        </div>
      ) : (
        <div className="movies-grid">
          {safeVideos.map((video, index) => (
            <div key={video?.id || index} className="movie-item">
              <div className="movie-thumb">
                <img 
                  src={video?.thumbnail || ''} 
                  alt={video?.title || 'Movie'} 
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjcwIiB2aWV3Qm94PSIwIDAgMTIwIDcwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iNzAiIGZpbGw9IiMyZDJkMmQiLz48dGV4dCB4PSI2MCIgeT0iMzUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMiIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
                  }}
                />
                <div className="movie-stats">
                  <span><i className="fas fa-eye"></i> {video?.views || 0}</span>
                  {video?.releaseYear && (
                    <span><i className="fas fa-calendar"></i> {video.releaseYear}</span>
                  )}
                </div>
              </div>
              <div className="movie-info">
                <h4 className="movie-title">{video?.title || 'Untitled Movie'}</h4>
                <div className="movie-meta">
                  <span className="genre">{video?.genre || 'Unknown Genre'}</span>
                  <span> • </span>
                  <span>{video?.duration || 120} min</span>
                </div>
                <p className="movie-description">
                  {video?.description?.substring(0, 100) || 'No description available'}...
                </p>
                <div className="movie-date">
                  Added: {video?.createdAt ? new Date(video.createdAt.seconds ? video.createdAt.seconds * 1000 : video.createdAt).toLocaleDateString() : 'Unknown date'}
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
                  onClick={() => handleDelete(video?.id, video?.title || 'this movie')}
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
