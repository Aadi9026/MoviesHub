import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { searchVideos } from '../../services/database';
import { debounce } from '../../utils/helpers';

const SearchBar = ({ onSearchClose }) => {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const navigate = useNavigate();
  const location = useLocation();
  const searchContainerRef = useRef(null);
  const searchResultsRef = useRef(null);
  const inputRef = useRef(null);

  // Calculate Levenshtein distance for fuzzy matching
  const levenshteinDistance = (a, b) => {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[b.length][a.length];
  };

  // Fuzzy search with multiple strategies
  const fuzzyMatch = (text, searchTerm) => {
    if (!text || !searchTerm) return 0;
    
    const textLower = text.toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    
    // Exact match
    if (textLower === searchLower) return 100;
    
    // Starts with
    if (textLower.startsWith(searchLower)) return 90;
    
    // Contains
    if (textLower.includes(searchLower)) return 80;
    
    // Word boundary match
    const words = textLower.split(/\s+/);
    const searchWords = searchLower.split(/\s+/);
    
    let wordMatchScore = 0;
    searchWords.forEach(searchWord => {
      words.forEach(word => {
        if (word.startsWith(searchWord)) wordMatchScore += 20;
        else if (word.includes(searchWord)) wordMatchScore += 15;
      });
    });
    
    if (wordMatchScore > 0) return Math.min(75, wordMatchScore);
    
    // Fuzzy string matching with Levenshtein distance
    const distance = levenshteinDistance(textLower, searchLower);
    const maxLength = Math.max(textLower.length, searchLower.length);
    const similarity = ((maxLength - distance) / maxLength) * 100;
    
    // Only consider matches with reasonable similarity
    return similarity >= 60 ? Math.max(40, similarity - 20) : 0;
  };

  // Enhanced search function with fuzzy matching
  const performSearch = debounce(async (searchTerm) => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      setSearchResults([]);
      setHasSearched(false);
      setActiveIndex(-1);
      return;
    }

    setLoading(true);
    setHasSearched(true);
    
    try {
      const result = await searchVideos(searchTerm);
      if (result.success && result.videos) {
        // Apply fuzzy matching and sort by relevance score
        const scoredResults = result.videos.map(video => {
          const titleScore = fuzzyMatch(video.title, searchTerm);
          const genreScore = fuzzyMatch(video.genre, searchTerm) * 0.7;
          const descriptionScore = fuzzyMatch(video.description, searchTerm) * 0.3;
          
          const totalScore = titleScore + genreScore + descriptionScore;
          
          return {
            ...video,
            relevanceScore: totalScore,
            matchType: getMatchType(totalScore)
          };
        });
        
        // Filter out very poor matches and sort by relevance
        const filteredResults = scoredResults
          .filter(item => item.relevanceScore >= 30)
          .sort((a, b) => b.relevanceScore - a.relevanceScore);
        
        setSearchResults(filteredResults);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, 400);

  const getMatchType = (score) => {
    if (score >= 80) return 'exact';
    if (score >= 60) return 'good';
    if (score >= 40) return 'partial';
    return 'fuzzy';
  };

  // Highlight matching text in results
  const highlightMatch = (text, searchTerm) => {
    if (!text || !searchTerm) return text;
    
    const searchLower = searchTerm.toLowerCase();
    const textLower = text.toLowerCase();
    
    // Find the position of the match
    const matchIndex = textLower.indexOf(searchLower);
    
    if (matchIndex === -1) {
      // Try fuzzy highlighting with word boundaries
      const words = searchLower.split(/\s+/);
      let highlighted = text;
      words.forEach(word => {
        if (word.length > 2) {
          const regex = new RegExp(`(${word})`, 'gi');
          highlighted = highlighted.replace(regex, '<mark>$1</mark>');
        }
      });
      return highlighted;
    }
    
    const before = text.substring(0, matchIndex);
    const match = text.substring(matchIndex, matchIndex + searchTerm.length);
    const after = text.substring(matchIndex + searchTerm.length);
    
    return `${before}<mark>${match}</mark>${after}`;
  };

  // Trigger search when query changes
  useEffect(() => {
    performSearch(query);
  }, [query]);

  const handleSearch = (searchTerm) => {
    if (searchTerm && searchTerm.trim()) {
      navigate(`/?search=${encodeURIComponent(searchTerm.trim())}`);
      setSearchResults([]);
      setActiveIndex(-1);
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
    setActiveIndex(-1);
    if (onSearchClose) {
      onSearchClose();
    }
  };

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    setActiveIndex(-1);
  };

  const handleClearSearch = () => {
    setQuery('');
    setSearchResults([]);
    setHasSearched(false);
    setActiveIndex(-1);
    navigate('/');
    inputRef.current?.focus();
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!searchResults.length) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : 0
        );
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => 
          prev > 0 ? prev - 1 : searchResults.length - 1
        );
        break;
      
      case 'Enter':
        if (activeIndex >= 0 && searchResults[activeIndex]) {
          e.preventDefault();
          handleResultClick(searchResults[activeIndex].id);
        }
        break;
      
      case 'Escape':
        setSearchResults([]);
        setActiveIndex(-1);
        break;
      
      default:
        break;
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && searchResultsRef.current) {
      const activeElement = searchResultsRef.current.querySelector(`[data-index="${activeIndex}"]`);
      if (activeElement) {
        activeElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [activeIndex]);

  const showResults = searchResults.length > 0 && hasSearched;

  return (
    <div className="search-container" ref={searchContainerRef}>
      <form className="search-bar" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search for movies by title, genre... (supports fuzzy search)"
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
            <span className="results-count">
              Found {searchResults.length} movies
              {query.length < 3 && <span className="search-tip"> (type more for better results)</span>}
            </span>
            {loading && <span className="searching-indicator">Searching...</span>}
          </div>
          
          <div className="search-results-list">
            {searchResults.slice(0, 8).map((video, index) => (
              <div
                key={video.id}
                data-index={index}
                className={`result-item ${index === activeIndex ? 'active' : ''}`}
                onClick={() => handleResultClick(video.id)}
                onMouseEnter={() => setActiveIndex(index)}
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
                  <div 
                    className="result-title"
                    dangerouslySetInnerHTML={{
                      __html: highlightMatch(video.title, query)
                    }}
                  />
                  <div className="result-meta">
                    <span className="genre">{video.genre}</span>
                    <span className="duration">• {video.duration || '120'}min</span>
                    {video.year && <span className="year">• {video.year}</span>}
                    <span className={`match-badge ${video.matchType}`}>
                      {video.matchType}
                    </span>
                  </div>
                  {video.relevanceScore && (
                    <div className="relevance-score">
                      Match: {Math.round(video.relevanceScore)}%
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="search-footer">
            <small>Use ↑↓ arrows to navigate • Enter to select • ESC to close</small>
          </div>
        </div>
      )}

      {hasSearched && searchResults.length === 0 && !loading && (
        <div className="search-results-dropdown no-results">
          <div className="no-results-content">
            <i className="fas fa-search"></i>
            <span>No movies found for "{query}"</span>
            <small>Try different keywords, check spelling, or use partial words</small>
            <div className="search-tips">
              <strong>Tips:</strong>
              <ul>
                <li>Try shorter or partial words</li>
                <li>Check for spelling mistakes</li>
                <li>Search by genre or partial title</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
