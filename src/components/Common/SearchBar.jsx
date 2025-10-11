import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { searchVideos } from '../../services/database';
import { debounce } from '../../utils/helpers';

const SearchBar = ({ onSearchClose }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const searchContainerRef = useRef(null);

  // Debounced search function
  const performSearch = debounce(async (searchTerm) => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      setSearchResults([]);
      setSuggestions([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);
    
    try {
      const result = await searchVideos(searchTerm);
      if (result.success) {
        setSearchResults(result.videos);
        setSuggestions([]);
      } else {
        setSearchResults([]);
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, 500);

  // Trigger search when query changes
  useEffect(() => {
    performSearch(query);
  }, [query]);

  const handleSearch = (searchTerm) => {
    if (searchTerm && searchTerm.trim()) {
      navigate(`/?search=${encodeURIComponent(searchTerm.trim())}`);
      setSuggestions([]);
      setSearchResults([]);
      if (onSearchClose) {
        onSearchClose();
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSearch(query);
  };

  const handleResultClick = (videoId) => {
    navigate(`/video/${videoId}`);
    setQuery('');
    setSuggestions([]);
    setSearchResults([]);
    if (onSearchClose) {
      onSearchClose();
    }
  };

  const handleInputChange = (e) => {
    setQuery(e.target.value);
  };

  const handleClearSearch = () => {
    setQuery('');
    setSuggestions([]);
    setSearchResults([]);
    setHasSearched(false);
  };

  const showSuggestions = searchResults.length > 0 && hasSearched;

  return (
    <div className="search-container" ref={searchContainerRef}>
      <form className="search-bar" onSubmit={handleSubmit}>
        {/* ✅ REMOVED: Search icon from inside input */}
        <input
          type="text"
          placeholder="Search movies by title, year, or genre..."
          value={query}
          onChange={handleInputChange}
          autoComplete="off"
        />
        
        {query && (
          <button 
            type="button" 
            className="search-clear-btn"
            onClick={handleClearSearch}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
        
        {/* ✅ HIDDEN: Submit button - search happens automatically as you type */}
        <button 
          type="submit" 
          style={{ display: 'none' }}
          disabled={loading} 
          aria-label="Search"
        >
          {loading ? (
            <i className="fas fa-spinner fa-spin"></i>
          ) : (
            <i className="fas fa-search"></i>
          )}
        </button>
      </form>

      {showSuggestions && (
        <div className="search-suggestions">
          {searchResults.length > 0 && (
            <div className="search-results-preview">
              <div className="results-header">
                <span>Found {searchResults.length} movies</span>
              </div>
              {searchResults.slice(0, 5).map(video => (
                <div
                  key={video.id}
                  className="result-item"
                  onClick={() => handleResultClick(video.id)}
                >
                  <img 
                    src={video.thumbnail} 
                    alt={video.title} 
                    className="result-thumb"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/60x40/333333/FFFFFF?text=No+Image';
                    }}
                  />
                  <div className="result-info">
                    <div className="result-title">{video.title}</div>
                    <div className="result-meta">
                      {video.genre} • {video.duration || '120'}min
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {searchResults.length === 0 && hasSearched && !loading && (
            <div className="no-results">
              <span>No movies found. Try different keywords.</span>
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="search-loading">
          <i className="fas fa-spinner fa-spin"></i> Searching...
        </div>
      )}
    </div>
  );
};

export default SearchBar;
