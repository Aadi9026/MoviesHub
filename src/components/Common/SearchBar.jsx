import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { searchVideos } from '../../services/database';
import { debounce } from '../../utils/helpers';

const SearchBar = ({ onSearchClose }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const searchContainerRef = useRef(null);
  const inputRef = useRef(null);

  // Detect mobile screen size and focus input
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Auto-focus on mobile when search opens
    if (isMobile && inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus();
      }, 300);
    }
    
    return () => window.removeEventListener('resize', checkMobile);
  }, [isMobile]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setSuggestions([]);
        setSearchResults([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const performSearch = debounce(async (searchTerm) => {
    if (searchTerm.trim().length < 2) {
      setSearchResults([]);
      setSuggestions([]);
      return;
    }

    setLoading(true);
    const result = await searchVideos(searchTerm);
    if (result.success) {
      setSearchResults(result.videos);
      const newSuggestions = result.videos.slice(0, 5).map(video => video.title);
      setSuggestions(newSuggestions);
    } else {
      setSearchResults([]);
      setSuggestions([]);
    }
    setLoading(false);
  }, 500);

  useEffect(() => {
    performSearch(query);
  }, [query]);

  const handleSearch = (searchTerm) => {
    if (searchTerm.trim()) {
      navigate(`/?search=${encodeURIComponent(searchTerm)}`);
      setSuggestions([]);
      setSearchResults([]);
      if (isMobile && onSearchClose) {
        setTimeout(onSearchClose, 100);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSearch(query);
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    handleSearch(suggestion);
  };

  const handleResultClick = (videoId) => {
    navigate(`/video/${videoId}`);
    setQuery('');
    setSuggestions([]);
    setSearchResults([]);
    if (isMobile && onSearchClose) {
      setTimeout(onSearchClose, 100);
    }
  };

  const handleInputChange = (e) => {
    setQuery(e.target.value);
  };

  const handleClearSearch = () => {
    setQuery('');
    setSuggestions([]);
    setSearchResults([]);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const showSuggestions = suggestions.length > 0 || searchResults.length > 0;

  return (
    <div className="search-container" ref={searchContainerRef}>
      <form className="search-bar" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          placeholder={isMobile ? "Search movies..." : "Search for movies by title, genre..."}
          value={query}
          onChange={handleInputChange}
          autoComplete="off"
          enterKeyHint="search"
        />
        
        {query && (
          <button 
            type="button" 
            className="search-clear-btn"
            onClick={handleClearSearch}
            aria-label="Clear search"
          >
            <i className="fas fa-times"></i>
          </button>
        )}
        
        <button 
          type="submit" 
          disabled={loading} 
          aria-label="Search"
          className="search-submit-btn"
        >
          {loading ? (
            <i className="fas fa-spinner fa-spin"></i>
          ) : (
            <i className="fas fa-search"></i>
          )}
        </button>
      </form>

      {showSuggestions && (
        <div className={`search-suggestions ${isMobile ? 'mobile' : ''}`}>
          {suggestions.length > 0 && suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="suggestion-item"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <i className="fas fa-search"></i>
              <span>{suggestion}</span>
            </div>
          ))}
          
          {searchResults.length > 0 && (
            <div className="search-results-preview">
              <div className="results-header">
                <span>Found {searchResults.length} movies</span>
              </div>
              {searchResults.slice(0, isMobile ? 3 : 5).map(video => (
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
        </div>
      )}
    </div>
  );
};

export default SearchBar;
