import React, { useState, useEffect } from 'react';
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

  // Load search results when query changes
  useEffect(() => {
    if (query.trim().length > 2) {
      performSearch(query);
    } else {
      setSearchResults([]);
      setSuggestions([]);
    }
  }, [query]);

  const performSearch = debounce(async (searchTerm) => {
    setLoading(true);
    const result = await searchVideos(searchTerm);
    if (result.success) {
      setSearchResults(result.videos);
      
      // Generate suggestions from search results
      const newSuggestions = result.videos.slice(0, 5).map(video => video.title);
      setSuggestions(newSuggestions);
    }
    setLoading(false);
  }, 300);

  const handleSearch = (searchTerm) => {
    if (searchTerm.trim()) {
      // If we're not on home page, navigate to home with search query
      if (location.pathname !== '/') {
        navigate(`/?search=${encodeURIComponent(searchTerm)}`);
      } else {
        // Trigger search on current page
        performSearch(searchTerm);
      }
      setSuggestions([]);
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

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
  };

  return (
    <div className="search-container">
      <form className="search-bar" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Search for movies..."
          value={query}
          onChange={handleInputChange}
        />
        <button type="submit" disabled={loading}>
          {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-search"></i>}
        </button>
      </form>

      {(suggestions.length > 0 || searchResults.length > 0) && (
        <div className="search-suggestions">
          {suggestions.map((suggestion, index) => (
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
                <span>Search Results ({searchResults.length})</span>
              </div>
              {searchResults.slice(0, 3).map(video => (
                <div
                  key={video.id}
                  className="result-item"
                  onClick={() => navigate(`/video/${video.id}`)}
                >
                  <img src={video.thumbnail} alt={video.title} className="result-thumb" />
                  <div className="result-info">
                    <div className="result-title">{video.title}</div>
                    <div className="result-meta">{video.genre} • {video.duration}min</div>
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
