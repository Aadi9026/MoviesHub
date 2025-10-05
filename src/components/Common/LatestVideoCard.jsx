import React from 'react';
import { Link } from 'react-router-dom';

const LatestVideoCard = ({ video }) => {
  const { id, title, thumbnail, quality, language, year, createdAt, genre } = video;

  // Format date like "05 OCT 2025" - ALL CAPS like screenshot
  const formatMovieDate = (timestamp) => {
    if (!timestamp) return 'UNKNOWN DATE';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('en', { month: 'short' }).toUpperCase();
    const year = date.getFullYear();
    
    return `${day} ${month} ${year}`;
  };

  // Extract year from title or use video year property
  const getMovieYear = () => {
    if (year) return year;
    const yearMatch = title.match(/\b(20\d{2})\b/);
    return yearMatch ? yearMatch[1] : new Date().getFullYear();
  };

  // Format title without year if year is already extracted
  const getMovieTitle = () => {
    if (year) return title;
    return title.replace(/\s*(20\d{2})\s*$/, '').trim();
  };

  // Get quality options
  const getQualityOptions = () => {
    if (quality && typeof quality === 'string') {
      return quality.split(' - ').map(q => q.trim().toUpperCase());
    }
    return ['480P', '720P', '1080P'];
  };

  const movieDate = formatMovieDate(createdAt);
  const movieYear = getMovieYear();
  const movieTitle = getMovieTitle();
  const qualityOptions = getQualityOptions();

  return (
    <div className="premium-video-card">
      {/* Premium Glow Effect Container */}
      <div className="premium-glow"></div>
      
      {/* Date Badge with Premium Style */}
      <div className="premium-date-badge">
        <i className="fas fa-calendar-alt"></i>
        {movieDate}
      </div>
      
      {/* Premium Thumbnail with Overlay */}
      <Link to={`/video/${id}`}>
        <div className="premium-thumbnail-container">
          <img src={thumbnail} alt={title} className="premium-thumbnail" />
          {/* Gradient Overlay */}
          <div className="thumbnail-overlay"></div>
          {/* Play Button Icon */}
          <div className="play-icon">
            <i className="fas fa-play"></i>
          </div>
        </div>
      </Link>
      
      {/* Premium Card Content */}
      <div className="premium-card-content">
        {/* Movie Title with Premium Typography */}
        <Link to={`/video/${id}`}>
          <h3 className="premium-movie-title" title={movieTitle}>
            {movieTitle}
          </h3>
        </Link>
        
        {/* Year Badge */}
        <div className="premium-year-badge">
          <i className="fas fa-star"></i>
          {movieYear}
        </div>
        
        {/* Quality Info Section */}
        <div className="premium-quality-section">
          {/* Primary Quality Highlight */}
          {qualityOptions[0] && (
            <div className="premium-primary-quality">
              <i className="fas fa-hd"></i>
              {qualityOptions[0]}
            </div>
          )}
          
          {/* All Quality Options */}
          <div className="premium-quality-options">
            {qualityOptions.map((quality, index) => (
              <span key={index} className="premium-quality-option">
                <span className="quality-dot"></span>
                {quality}
              </span>
            ))}
          </div>
        </div>
        
        {/* Language & Genre Info */}
        <div className="premium-meta-info">
          {language && (
            <span className="premium-language">
              <i className="fas fa-globe"></i>
              {language}
            </span>
          )}
          {genre && (
            <span className="premium-genre">
              <i className="fas fa-tag"></i>
              {genre}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default LatestVideoCard;
