import React from 'react';
import { Link } from 'react-router-dom';
import { formatDuration, formatViews } from '../../utils/helpers';

const VideoCard = ({ video }) => {
  const { 
    id, 
    title, 
    thumbnail, // Always use vertical thumbnail for VideoCard
    duration, 
    views, 
    genre, 
    createdAt,
    year,
    rating,
    downloadLinks = {}
  } = video;

  // Ensure we always use vertical thumbnail (ignore horizontalThumbnail)
  const displayThumbnail = thumbnail;

  // Simple date formatting function inside component
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffTime = now - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  // Check if download links are available
  const hasDownloadLinks = downloadLinks && Object.values(downloadLinks).some(link => link);

  return (
    <div className="video-card">
      <Link to={`/movie/${id}`}>
        <div className="thumbnail-container">
          <img 
            src={displayThumbnail} 
            alt={title} 
            className="thumbnail"
            onError={(e) => {
              e.target.src = '/images/placeholder-vertical.jpg';
            }}
          />
          <div className="video-duration">{formatDuration(duration)}</div>
          
          {/* Quality Indicator */}
          {hasDownloadLinks && (
            <div className="quality-indicator">
              {downloadLinks['4K'] ? '4K' : downloadLinks['1080p'] ? 'HD' : 'SD'}
            </div>
          )}
        </div>
      </Link>
      
      <div className="video-info-container">
        <div className="video-details">
          <Link to={`/movie/${id}`}>
            <h3 className="video-title" title={title}>
              {title}
              {year && <span className="year-badge"> ({year})</span>}
            </h3>
          </Link>
          
          <div className="video-meta">
            <span>{formatViews(views)} views</span>
            <span className="separator"> • </span>
            <span>{formatDate(createdAt)}</span>
            
            {rating && rating !== 'N/A' && (
              <>
                <span className="separator"> • </span>
                <span className="rating">
                  <i className="fas fa-star"></i> {rating}
                </span>
              </>
            )}
            
            {genre && (
              <>
                <span className="separator"> • </span>
                <span className="genre-tag">{genre}</span>
              </>
            )}
          </div>

          {/* Download Quality Tags */}
          {hasDownloadLinks && (
            <div className="quality-tags">
              {downloadLinks['480p'] && <span className="quality-tag">480p</span>}
              {downloadLinks['720p'] && <span className="quality-tag">720p</span>}
              {downloadLinks['1080p'] && <span className="quality-tag">1080p</span>}
              {downloadLinks['4K'] && <span className="quality-tag">4K</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
