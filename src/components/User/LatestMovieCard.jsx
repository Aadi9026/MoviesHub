import React from 'react';

const LatestMovieCard = ({ video }) => {
  const {
    id,
    title,
    description,
    genre,
    duration,
    // Use horizontal thumbnail if available, fallback to vertical
    thumbnail = video.horizontalThumbnail || video.thumbnail,
    year,
    rating,
    views = 0,
    downloadLinks = {},
    createdAt
  } = video;

  const handleCardClick = () => {
    window.location.href = `/movie/${id}`;
  };

  const formatDuration = (mins) => {
    if (!mins) return '';
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const hasDownloadLinks = downloadLinks && Object.values(downloadLinks).some(link => link);

  return (
    <div className="latest-movie-card" onClick={handleCardClick}>
      <div className="latest-card-thumbnail">
        <img 
          src={thumbnail} 
          alt={title}
          className="latest-thumbnail-img"
          onError={(e) => {
            e.target.src = '/images/placeholder-horizontal.jpg';
          }}
        />
        
        {hasDownloadLinks && (
          <div className="quality-badge">
            {downloadLinks['4K'] ? '4K' : downloadLinks['1080p'] ? 'HD' : 'SD'}
          </div>
        )}
        
        {duration && (
          <div className="duration-badge">
            {formatDuration(duration)}
          </div>
        )}
        
        <div className="card-overlay">
          <div className="play-button">
            <i className="fas fa-play"></i>
          </div>
        </div>
      </div>

      <div className="latest-card-content">
        <div className="card-header">
          <h3 className="card-title" title={title}>
            {title}
          </h3>
          {year && <span className="card-year">({year})</span>}
        </div>

        <div className="card-meta">
          <div className="meta-item">
            <i className="fas fa-film"></i>
            <span>{genre}</span>
          </div>
          
          {rating && rating !== 'N/A' && (
            <div className="meta-item">
              <i className="fas fa-star"></i>
              <span>{rating}/10</span>
            </div>
          )}
          
          <div className="meta-item">
            <i className="fas fa-eye"></i>
            <span>{views} views</span>
          </div>
        </div>

        {description && (
          <p className="card-description">
            {description.length > 100 
              ? `${description.substring(0, 100)}...` 
              : description
            }
          </p>
        )}

        <div className="card-footer">
          <div className="download-options">
            {downloadLinks?.['480p'] && <span className="quality-tag">480p</span>}
            {downloadLinks?.['720p'] && <span className="quality-tag">720p</span>}
            {downloadLinks?.['1080p'] && <span className="quality-tag">1080p</span>}
            {downloadLinks?.['4K'] && <span className="quality-tag">4K</span>}
          </div>

          {createdAt && (
            <div className="upload-date">
              <i className="fas fa-calendar-alt"></i>
              {formatDate(createdAt)}
            </div>
          )}
        </div>

        <div className="card-actions">
          <button 
            className="btn-watch"
            onClick={(e) => {
              e.stopPropagation();
              window.location.href = `/watch/${id}`;
            }}
          >
            <i className="fas fa-play"></i>
            Watch Now
          </button>
          
          {hasDownloadLinks && (
            <button 
              className="btn-download"
              onClick={(e) => {
                e.stopPropagation();
                // Show download options
                const qualities = Object.entries(downloadLinks)
                  .filter(([quality, link]) => link)
                  .map(([quality, link]) => ({ quality, link }));
                
                if (qualities.length === 1) {
                  window.open(qualities[0].link, '_blank');
                } else if (qualities.length > 1) {
                  const quality = prompt(
                    `Choose quality:\n${qualities.map(q => q.quality).join(', ')}`,
                    qualities[0].quality
                  );
                  const selected = qualities.find(q => q.quality === quality);
                  if (selected) window.open(selected.link, '_blank');
                }
              }}
            >
              <i className="fas fa-download"></i>
              Download
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LatestMovieCard;
