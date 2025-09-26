import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { debounce } from '../../utils/helpers';

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const navigate = useNavigate();

  const handleSearch = (searchTerm) => {
    if (searchTerm.trim()) {
      navigate(`/?search=${encodeURIComponent(searchTerm)}`);
    }
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    
    // In a real app, you would fetch suggestions from API
    if (value.length > 2) {
      const mockSuggestions = [
        `${value} movie`,
        `${value} full movie`,
        `${value} trailer`,
        `${value} 2023`
      ];
      setSuggestions(mockSuggestions);
    } else {
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
    setSuggestions([]);
  };

  return (
    <div className="search-container">
      <form className="search-bar" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Search for movies..."
          value={query}
          onChange={handleChange}
        />
        <button type="submit">
          <i className="fas fa-search"></i>
        </button>
      </form>

      {suggestions.length > 0 && (
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
        </div>
      )}
    </div>
  );
};

export default SearchBar;
