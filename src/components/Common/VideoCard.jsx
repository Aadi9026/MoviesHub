import React from 'react';
import { Link } from 'react-router-dom';

const VideoCard = ({ video }) => {
  const { id, title, thumbnail, quality, language, year, createdAt, genre } = video;

  // Format date like "02 Oct 2025" from your screenshot
  const formatMovieDate = (timestamp) => {
    if (!timestamp) return 'Unknown Date';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('en', { month: 'short' });
    const year = date.getFullYear();
    
    return `${day} ${month} ${year}`;
  };

  // Extract year from title or use video year property
  const getMovieYear = () => {
    if (year) return year;
    // Try to extract year from title (e.g., "Movie Name 2025")
    const yearMatch = title.match(/\b(20\d{2})\b/);
    return yearMatch ? yearMatch[1] : new Date().getFullYear();
  };

  // Format title without year if year is already extracted
  const getMovieTitle = () => {
    if (year) return title;
    // Remove year from title if present
    return title.replace(/\s*(20\d{2})\s*$/, '').trim();
  };

  // Get quality options - you might need to adjust this based on your data structure
  const getQualityOptions = () => {
    if (quality && typeof quality === 'string') {
      return quality.split(' - ').map(q => q.trim());
    }
    // Default quality options if not provided
    return ['480p', '720p', '1080p'];
  };

  const movieDate = formatMovieDate(createdAt);
  const movieYear = getMovieYear();
  const movieTitle = getMovieTitle();
  const qualityOptions = getQualityOptions();

  return (
    <div className="video-card movie-card-screenshot">
      <Link to={`/video/${id}`}>
        <div className="thumbnail-container">
          <img src={thumbnail} alt={title} className="thumbnail" />
        </div>
      </Link>
      
      <div className="movie-card-content">
        {/* Date - Top left */}
        <div className="movie-date">{movieDate}</div>
        
        {/* Title with Year */}
        <Link to={`/video/${id}`}>
          <h3 className="movie-title">{movieTitle} {movieYear}</h3>
        </Link>
        
        {/* Language and Quality Info */}
        <div className="movie-language-quality">
          {language && <span className="language">{language}</span>}
          {qualityOptions[0] && (
            <span className="primary-quality">{qualityOptions[0]}</span>
          )}
        </div>
        
        {/* Quality Options */}
        <div className="quality-options">
          {qualityOptions.map((quality, index) => (
            <span key={index} className="quality-option">
              {quality}
              {index < qualityOptions.length - 1 && ' - '}
            </span>
          ))}
        </div>
        
        {/* Genre tag if available */}
        {genre && (
          <div className="movie-genre">
            <span className="genre-tag">{genre}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoCard;
