import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { searchVideos } from '../../services/database';
import { debounce } from '../../utils/helpers';

const SearchBar = ({ onSearchClose }) => {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const searchContainerRef = useRef(null);
  const searchResultsRef = useRef(null);

  // Enhanced debounced search function with better matching
  const performSearch = debounce(async (searchTerm) => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);
    
    try {
      const result = await searchVideos(searchTerm);
      if (result.success) {
        // Sort results by relevance (exact matches first)
        const sortedResults = sortByRelevance(result.videos, searchTerm);
        setSearchResults(sortedResults);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, 300); // Reduced debounce time for faster response

  // Sort results by relevance
  const sortByRelevance = (videos, searchTerm) => {
    const searchLower = searchTerm.toLowerCase();
    
    return videos.sort((a, b) => {
      const aTitle = a.title.toLowerCase();
      const bTitle = b.title.toLowerCase();
      
      // Exact match at start gets highest priority
      if (aTitle.startsWith(searchLower) && !bTitle.startsWith(searchLower)) return -1;
      if (!aTitle.startsWith(searchLower) && bTitle.startsWith(searchLower)) return 1;
      
      // Exact word match
      const aWords = aTitle.split(/\s+/);
      const bWords = bTitle.split(/\s+/);
      
      const aExactMatch = aWords.some(word => word === searchLower);
      const bExactMatch = bWords.some(word => word === searchLower);
      
      if (aExactMatch && !bExactMatch) return -1;
      if (!aExactMatch && bExactMatch) return 1;
      
      // Contains search term
      const aContains = aTitle.includes(searchLower);
      const bContains = bTitle.includes(searchLower);
      
      if (aContains && !bContains) return -1;
      if (!aContains && bContains) return 1;
      
      // Genre match
      const aGenre = a.genre?.toLowerCase() || '';
      const bGenre = b.genre?.toLowerCase() || '';
      
      const aGenreMatch = aGenre.includes(searchLower);
      const bGenreMatch = bGenre.includes(searchLower);
      
      if (aGenreMatch && !bGenreMatch) return -1;
      if (!aGenreMatch && bGenreMatch) return 1;
      
      // Finally, sort by title length (shorter titles first)
      return aTitle.length - bTitle.length;
    });
  };

  // Trigger search when query changes
  useEffect(() => {
    performSearch(query);
  }, [query]);

  const handleSearch = (searchTerm) => {
    if (searchTerm && searchTerm.trim()) {
      navigate(`/?search=${encodeURIComponent(searchTerm.trim())}`);
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
    setSearchResults([]);
    setHasSearched(false);
    navigate('/');
  };

  const handleKeyDown = (e) => {
    // Arrow key navigation in search results
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const results = searchResultsRef.current?.querySelectorAll('.result-item');
      if (!results || results.length === 0) return;

      const currentActive = searchResultsRef.current?.querySelector('.result-item.active');
      let nextIndex = 0;

      if (currentActive) {
        const currentIndex = Array.from(results).indexOf(currentActive);
        nextIndex = e.key === 'ArrowDown' 
          ? Math.min(currentIndex + 1, results.length - 1)
          : Math.max(currentIndex - 1, 0);
      }

      results.forEach((item, index) => {
        item.classList.toggle('active', index === nextIndex);
      });

      if (results[nextIndex]) {
        results[nextIndex].scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }

    // Enter key to select highlighted result
    if (e.key === 'Enter' && !e.shiftKey) {
      const activeResult = searchResultsRef.current?.querySelector('.result-item.active');
      if (activeResult) {
        e.preventDefault();
        const videoId = activeResult.dataset.videoId;
        if (videoId) {
          handleResultClick(videoId);
        }
      }
    }
  };

  const showResults = searchResults.length > 0 && hasSearched;

  return (
    <div className="search-container" ref={searchContainerRef}>
      <form className="search-bar" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Search for movies by title, genre, actor..."
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
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

      {showResults && (
        <div className="search-results-dropdown" ref={searchResultsRef}>
          <div className="search-results-header">
            <span className="results-count">Found {searchResults.length} movies</span>
            {loading && <span className="searching-indicator">Searching...</span>}
          </div>
          
          <div className="search-results-list">
            {searchResults.slice(0, 10).map((video, index) => (
              <div
                key={video.id}
                className="result-item"
                data-video-id={video.id}
                onClick={() => handleResultClick(video.id)}
                onMouseEnter={(e) => {
                  // Remove active class from all items
                  e.currentTarget.parentNode.querySelectorAll('.result-item').forEach(item => {
                    item.classList.remove('active');
                  });
                  // Add active class to hovered item
                  e.currentTarget.classList.add('active');
                }}
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
                    <span className="genre">{video.genre}</span>
                    <span className="duration">• {video.duration || '120'}min</span>
                    {video.year && <span className="year">• {video.year}</span>}
                  </div>
                  {video.rating && (
                    <div className="result-rating">
                      <i className="fas fa-star"></i>
                      <span>{video.rating}/10</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {hasSearched && searchResults.length === 0 && !loading && (
        <div className="search-results-dropdown no-results">
          <div className="no-results-content">
            <i className="fas fa-search"></i>
            <span>No movies found for "{query}"</span>
            <small>Try different keywords or check spelling</small>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
