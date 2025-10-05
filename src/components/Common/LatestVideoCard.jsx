import React from 'react';
import { Link } from 'react-router-dom';

const LatestVideoCard = ({ video }) => {
  const { id, title, thumbnail, language, year, createdAt, genre } = video;

  // Simple date formatting - no heavy operations
  const formatMovieDate = (timestamp) => {
    if (!timestamp) return 'NEW';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const day = date.getDate().toString().padStart(2, '0');
      const month = date.toLocaleString('en', { month: 'short' }).toUpperCase();
      return `${day} ${month}`;
    } catch {
      return 'NEW';
    }
  };

  // Simple year extraction
  const getMovieYear = () => {
    return year || new Date().getFullYear();
  };

  // Simple title formatting
  const getMovieTitle = () => {
    return title.replace(/\s*(20\d{2})\s*$/, '').trim() || title;
  };

  const movieDate = formatMovieDate(createdAt);
  const movieYear = getMovieYear();
  const movieTitle = getMovieTitle();

  return (
    <div className="pro-video-card">
      {/* Simple Date Badge */}
      <div className="pro-date-badge">{movieDate}</div>
      
      {/* Optimized Thumbnail */}
      <Link to={`/video/${id}`}>
        <div className="pro-thumbnail-container">
          <img 
            src={thumbnail} 
            alt={title} 
            className="pro-thumbnail"
            loading="lazy"
          />
        </div>
      </Link>
      
      {/* Clean Content */}
      <div className="pro-card-content">
        <Link to={`/video/${id}`}>
          <h3 className="pro-movie-title">{movieTitle}</h3>
        </Link>
        
        <div className="pro-movie-info">
          <span className="pro-year">{movieYear}</span>
          {language && (
            <span className="pro-language">{language}</span>
          )}
        </div>

        {genre && (
          <div className="pro-genre">{genre}</div>
        )}
      </div>
    </div>
  );
};

export default LatestVideoCard;
