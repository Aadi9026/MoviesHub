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
    return ['480P', '720P', '1080P']; // ALL CAPS like screenshot
  };

  const movieDate = formatMovieDate(createdAt);
  const movieYear = getMovieYear();
  const movieTitle = getMovieTitle();
  const qualityOptions = getQualityOptions();

  return (
    <div className="latest-video-card">
      {/* Date Badge - ALL CAPS like screenshot */}
      <div className="latest-date-badge">{movieDate}</div>
      
      <Link to={`/video/${id}`}>
        <div className="latest-thumbnail-container">
          <img src={thumbnail} alt={title} className="latest-thumbnail" />
        </div>
      </Link>
      
      <div className="latest-card-content">
        {/* Title - Limited to 2 lines */}
        <Link to={`/video/${id}`}>
          <h3 className="latest-movie-title" title={movieTitle}>
            {movieTitle}
          </h3>
        </Link>
        
        {/* Year - Separate line like screenshot */}
        <div className="latest-movie-year">{movieYear}</div>
        
        {/* Primary Quality - Separate line like screenshot */}
        {qualityOptions[0] && (
          <div className="latest-primary-quality">{qualityOptions[0]}</div>
        )}
        
        {/* Quality Options - All in one line */}
        <div className="latest-quality-options">
          {qualityOptions.map((quality, index) => (
            <span key={index} className="latest-quality-option">
              {quality}
              {index < qualityOptions.length - 1 && <span className="quality-separator"> - </span>}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LatestVideoCard;
