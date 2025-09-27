import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { searchVideos } from '../../services/database';
import { debounce } from '../../utils/helpers';

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const searchContainerRef = useRef(null);

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
      
      // Generate suggestions from search results
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
  };

  const handleInputChange = (e) => {
    setQuery(e.target.value);
  };

  const handleClearSearch = () => {
    setQuery('');
    setSuggestions([]);
    setSearchResults([]);
  };

  const showSuggestions = suggestions.length > 0 || searchResults.length > 0;

  return (
    <div className="search-container" ref={searchContainerRef}>
      <form className="search-bar" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Search for movies by title, genre..."
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
            <i className="fas fa-times"></i>
          </button>
        )}
        
        <button type="submit" disabled={loading} aria-label="Search">
          {loading ? (
            <i className="fas fa-spinner fa-spin"></i>
          ) : (
            <i className="fas fa-search"></i>
          )}
        </button>
      </form>

      {showSuggestions && (
        <div className="search-suggestions">
          {/* Search suggestions */}
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
          
          {/* Search results preview */}
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
        </div>
      )}
    </div>
  );
};

export default SearchBar;
