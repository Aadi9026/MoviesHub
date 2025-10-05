import React from 'react';
import { Link } from 'react-router-dom';

const LatestVideoCard = ({ video }) => {
  const { id, title, thumbnail, quality, language, year, createdAt, genre } = video;

  // Format date like "02 Oct 2025"
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
      return quality.split(' - ').map(q => q.trim());
    }
    return ['480p', '720p', '1080p'];
  };

  const movieDate = formatMovieDate(createdAt);
  const movieYear = getMovieYear();
  const movieTitle = getMovieTitle();
  const qualityOptions = getQualityOptions();

  return (
    <div className="latest-video-card">
      {/* Date Badge */}
      <div className="latest-date-badge">{movieDate}</div>
      
      <Link to={`/video/${id}`}>
        <div className="latest-thumbnail-container">
          <img src={thumbnail} alt={title} className="latest-thumbnail" />
        </div>
      </Link>
      
      <div className="latest-card-content">
        {/* Title with Year */}
        <Link to={`/video/${id}`}>
          <h3 className="latest-movie-title">{movieTitle}</h3>
          <div className="latest-movie-year">{movieYear}</div>
        </Link>
        
        {/* Language and Quality Info */}
        <div className="latest-language-quality">
          {language && <span className="latest-language">{language}</span>}
          {qualityOptions[0] && (
            <span className="latest-primary-quality">{qualityOptions[0]}</span>
          )}
        </div>
        
        {/* Quality Options */}
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
