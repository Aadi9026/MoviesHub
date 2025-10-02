import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useVideo, useRelatedVideos } from '../../hooks/useVideos';
import VideoPlayer from '../Common/VideoPlayer';
import VideoCard from '../Common/VideoCard';
import AdSlot from '../Common/AdSlot';
import LoadingSpinner from '../Common/LoadingSpinner';
import { QUALITIES } from '../../utils/constants';
import { formatViews, formatDuration } from '../../utils/helpers';
const VideoDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { video, loading, error } = useVideo(id);
  const { videos: relatedVideos, loading: relatedLoading } = useRelatedVideos(
    video?.genre, 
    id
  );
  
  // Refs
  const actionBarRef = useRef(null);
  
  // State management
  const [currentSource, setCurrentSource] = useState(0);
  const [showDownloads, setShowDownloads] = useState(false);
  const [metadataExpanded, setMetadataExpanded] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [likeCount, setLikeCount] = useState(video?.likes || 0);
  const [dislikeCount, setDislikeCount] = useState(video?.dislikes || 0);
  const [showShareTooltip, setShowShareTooltip] = useState(false);
  // Reset states when video changes
  useEffect(() => {
    setCurrentSource(0);
    setShowDownloads(false);
    setMetadataExpanded(false);
    setDescriptionExpanded(false);
    setLiked(false);
    setDisliked(false);
    setLikeCount(video?.likes || 0);
    setDislikeCount(video?.dislikes || 0);
  }, [id, video]);
  const handleLike = () => {
    if (liked) {
      setLiked(false);
      setLikeCount(prev => Math.max(0, prev - 1));
    } else {
      setLiked(true);
      setLikeCount(prev => prev + 1);
      if (disliked) {
        setDisliked(false);
        setDislikeCount(prev => Math.max(0, prev - 1));
      }
    }
    // Add your like API call here
  };
  const handleDislike = () => {
    if (disliked) {
      setDisliked(false);
      setDislikeCount(prev => Math.max(0, prev - 1));
    } else {
      setDisliked(true);
      setDislikeCount(prev => prev + 1);
      if (liked) {
        setLiked(false);
        setLikeCount(prev => Math.max(0, prev - 1));
      }
    }
    // Add your dislike API call here
  };
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: video.title,
          text: video.description,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setShowShareTooltip(true);
        setTimeout(() => setShowShareTooltip(false), 2000);
      }
    } catch (err) {
      console.log('Share cancelled or failed');
    }
  };
 const handleScrollIndicator = () => {
  const scrollContainer = actionBarRef.current;
  if (scrollContainer) {
    const scrollLeft = scrollContainer.scrollLeft;
    const scrollWidth = scrollContainer.scrollWidth;
    const clientWidth = scrollContainer.clientWidth;
    
    // Remove all classes first
    scrollContainer.classList.remove('scroll-start', 'scroll-middle', 'scroll-end');
    
    // Add appropriate class based on scroll position
    if (scrollLeft === 0) {
      scrollContainer.classList.add('scroll-start');
    } else if (scrollLeft + clientWidth >= scrollWidth - 10) {
      scrollContainer.classList.add('scroll-end');
    } else {
      scrollContainer.classList.add('scroll-middle');
    }
  }
};
  // Initialize scroll indicators
  useEffect(() => {
    handleScrollIndicator();
    const scrollContainer = actionBarRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScrollIndicator);
      return () => scrollContainer.removeEventListener('scroll', handleScrollIndicator);
    }
  }, []);
  if (loading) return <LoadingSpinner text="Loading video..." />;
  if (error) return <div className="error-message">Error: {error}</div>;
  if (!video) return <div className="error-message">Video not found</div>;
  // Prepare video sources
  const sources = [];
  
  // Add primary source if available
  if (video.embedCode && video.embedCode.trim() !== '') {
    sources.push({ 
      code: video.embedCode, 
      label: 'Primary Source',
      valid: true
    });
  }
  
  // Add alternative sources if available and enabled
  if (video.altSources && video.altSourcesEnabled) {
    video.altSources.forEach((source, index) => {
      if (video.altSourcesEnabled[index] && source && source.trim() !== '') {
        sources.push({ 
          code: source, 
          label: `Source ${index + 1}`,
          valid: true
        });
      }
    });
  }
  // If no valid sources, show error
  if (sources.length === 0) {
    return (
      <div className="video-detail-page custom-scroll-hide">
        <div className="error-container">
          <div className="error-message">
            <i className="fas fa-exclamation-triangle"></i>
            <h3>Video Source Missing</h3>
            <p>This video doesn't have any valid embed codes. Please contact the administrator.</p>
            <button onClick={() => navigate('/')} className="btn btn-primary">
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }
  const availableDownloads = video.downloadLinks ? 
    Object.entries(video.downloadLinks).filter(([_, link]) => link && link.trim() !== '') : [];
  return (
    <div className="video-detail-page custom-scroll-hide">
      {/* Sticky Video Player at Top */}
<div className="video-player-sticky">
  <VideoPlayer 
    embedCode={sources[currentSource]?.code}
    title={video.title}
  />
</div>
      {/* Scrollable Content Below Video */}
      <div className="video-content-scroll">
        <div className="container">
          <div className="video-layout">
            <div className="video-main">
              <div className="video-info">
                <h1 className="video-detail-title">{video.title}</h1>
                
                {/* Enhanced Premium Horizontal Action Bar */}
                <div className="horizontal-action-bar">
                  <div 
                    className="action-bar-scroll" 
                    ref={actionBarRef}
                    id="actionBarScroll"
                  >
                    {/* Like Button */}
                    <button 
                      className={`action-bar-btn like-btn ${liked ? 'active' : ''}`}
                      onClick={handleLike}
                      aria-label={liked ? 'Unlike this video' : 'Like this video'}
                    >
                      <i className={`fas fa-thumbs-up ${liked ? 'fas' : 'far'}`}></i>
                      <span>Like</span>
                      {likeCount > 0 && <span className="btn-counter">{likeCount}</span>}
                    </button>
                    
                    {/* Dislike Button */}
                    <button 
                      className={`action-bar-btn dislike-btn ${disliked ? 'active' : ''}`}
                      onClick={handleDislike}
                      aria-label={disliked ? 'Remove dislike' : 'Dislike this video'}
                    >
                      <i className={`fas fa-thumbs-down ${disliked ? 'fas' : 'far'}`}></i>
                      <span>Dislike</span>
                      {dislikeCount > 0 && <span className="btn-counter">{dislikeCount}</span>}
                    </button>
                    
                    {/* Share Button with Tooltip */}
                    <div className="share-button-container">
                      <button 
                        className="action-bar-btn share-btn"
                        onClick={handleShare}
                        aria-label="Share this video"
                      >
                        <i className="fas fa-share-alt"></i>
                        <span>Share</span>
                      </button>
                      {showShareTooltip && (
                        <div className="share-tooltip">
                          <i className="fas fa-check"></i>
                          Link copied to clipboard!
                        </div>
                      )}
                    </div>
                    
                    {/* Download Button */}
                    {availableDownloads.length > 0 && (
                      <button 
                        className="action-bar-btn download-btn"
                        onClick={() => setShowDownloads(!showDownloads)}
                        aria-label={`Download options (${availableDownloads.length} available)`}
                      >
                        <i className="fas fa-download"></i>
                        <span>Download</span>
                        <span className="btn-counter">({availableDownloads.length})</span>
                      </button>
                    )}
                    
                    {/* Video Information Button */}
                    <button 
                      className="action-bar-btn info-btn"
                      onClick={() => setMetadataExpanded(!metadataExpanded)}
                      aria-expanded={metadataExpanded}
                      aria-label="Show video information"
                    >
                      <i className="fas fa-info-circle"></i>
                      <span>Info</span>
                      <i className={`fas fa-chevron-${metadataExpanded ? 'up' : 'down'} info-chevron`}></i>
                    </button>
                    
                    {/* Primary Source Dropdown */}
                    {sources.length > 0 && (
                      <div className="action-bar-dropdown">
                        <select 
                          className="action-bar-select"
                          value={currentSource} 
                          onChange={(e) => setCurrentSource(parseInt(e.target.value))}
                          aria-label="Select video source"
                        >
                          <option value="" disabled>Source</option>
                          {sources.map((source, index) => (
                            <option key={index} value={index}>
                              {source.label} {index === 0 && '★'}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
                {/* Download options (appears when download button clicked) */}
                {showDownloads && availableDownloads.length > 0 && (
                  <div className="download-section">
                    <div className="download-header">
                      <i className="fas fa-download"></i>
                      <h3>Download Options</h3>
                      <button 
                        className="download-close-btn"
                        onClick={() => setShowDownloads(false)}
                        aria-label="Close download options"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                    <div className="quality-buttons">
                      {availableDownloads.map(([quality, link]) => (
                        <a 
                          key={quality} 
                          href={link} 
                          className="quality-btn"
                          target="_blank" 
                          rel="noopener noreferrer"
                          download
                        >
                          <i className="fas fa-download"></i>
                          {quality}
                          <span className="quality-badge">HD</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                {/* Enhanced Collapsible Metadata Section */}
                <div className={`metadata-collapsible ${metadataExpanded ? 'expanded' : ''}`}>
                  <button 
                    className="metadata-header"
                    onClick={() => setMetadataExpanded(!metadataExpanded)}
                    aria-expanded={metadataExpanded}
                  >
                    <div className="metadata-title">
                      <i className="fas fa-info-circle"></i>
                      <span>Video Information</span>
                      <div className="metadata-badge">
                        <i className="fas fa-film"></i>
                        Details
                      </div>
                    </div>
                    <i className={`fas fa-chevron-${metadataExpanded ? 'up' : 'down'} metadata-toggle`}></i>
                  </button>
                  
                  <div className="metadata-content">
                    {/* Enhanced Metadata Grid */}
                    <div className="metadata-grid">
                      <div className="metadata-item highlight">
                        <div className="metadata-label">
                          <i className="fas fa-eye"></i>
                          Views
                        </div>
                        <div className="metadata-value">
                          {formatViews(video.views || 0)}
                        </div>
                      </div>
                      
                      <div className="metadata-item">
                        <div className="metadata-label">
                          <i className="fas fa-clock"></i>
                          Duration
                        </div>
                        <div className="metadata-value">
                          {formatDuration(video.duration || 120)}
                        </div>
                      </div>
                      
                      <div className="metadata-item highlight">
                        <div className="metadata-label">
                          <i className="fas fa-tags"></i>
                          Genre
                        </div>
                        <div className="metadata-value">
                          <span className="genre-badge">{video.genre}</span>
                        </div>
                      </div>
                      
                      {video.createdAt && (
                        <div className="metadata-item">
                          <div className="metadata-label">
                            <i className="fas fa-calendar"></i>
                            Date Added
                          </div>
                          <div className="metadata-value">
                            {video.createdAt.toDate ? 
                              new Date(video.createdAt.toDate()).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              }) : 
                              'Recently added'
                            }
                          </div>
                        </div>
                      )}
                      
                      {/* Engagement Stats */}
                      <div className="metadata-item engagement-stats">
                        <div className="metadata-label">
                          <i className="fas fa-chart-bar"></i>
                          Engagement
                        </div>
                        <div className="engagement-metrics">
                          <div className="engagement-item">
                            <i className="fas fa-thumbs-up"></i>
                            <span>{likeCount} likes</span>
                          </div>
                          <div className="engagement-item">
                            <i className="fas fa-thumbs-down"></i>
                            <span>{dislikeCount} dislikes</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Enhanced Description */}
                    {video.description && (
                      <div className="metadata-description">
                        <div className="description-header">
                          <i className="fas fa-align-left"></i>
                          <h4>Description</h4>
                          <div className="description-badge">
                            {video.description.length > 200 ? 'Detailed' : 'Brief'}
                          </div>
                        </div>
                        <div className={`description-text ${descriptionExpanded ? 'expanded' : 'collapsed'}`}>
                          {video.description}
                        </div>
                        {video.description.length > 150 && (
                          <button 
                            className="read-more-btn"
                            onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                          >
                            <i className={`fas fa-chevron-${descriptionExpanded ? 'up' : 'down'}`}></i>
                            {descriptionExpanded ? 'Show Less' : 'Read More'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <AdSlot position="in_video" videoId={video.id} />
              </div>
            </div>
            <div className="video-sidebar">
              <AdSlot position="sidebar" />
              
              <div className="suggested-videos">
                <div className="sidebar-header">
                  <i className="fas fa-film"></i>
                  <h3>Related Movies</h3>
                  <span className="sidebar-badge">{relatedVideos.length}</span>
                </div>
                
                {relatedLoading ? (
                  <LoadingSpinner size="small" text="Loading related videos..." />
                ) : relatedVideos.length > 0 ? (
                  relatedVideos.map(relatedVideo => (
                    <VideoCard key={relatedVideo.id} video={relatedVideo} />
                  ))
                ) : (
                  <div className="no-related">
                    <i className="fas fa-search"></i>
                    <p>No related videos found</p>
                    <button 
                      className="btn-secondary"
                      onClick={() => navigate('/')}
                    >
                      Browse All Movies
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default VideoDetail;
