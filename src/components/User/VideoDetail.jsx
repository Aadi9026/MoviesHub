import React, { useState, useEffect } from 'react';
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
  
  // State management
  const [currentSource, setCurrentSource] = useState(0);
  const [showDownloads, setShowDownloads] = useState(false);
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);

  // Reset states when video changes
  useEffect(() => {
    setCurrentSource(0);
    setShowDownloads(false);
    setDescriptionOpen(false);
    setLiked(false);
    setDisliked(false);
    
    // Set initial like/dislike counts (you can get these from your video data)
    if (video) {
      setLikes(video.likes || Math.floor(Math.random() * 1000) + 100);
      setDislikes(video.dislikes || Math.floor(Math.random() * 50) + 10);
    }
  }, [id, video]);

  // Like/Dislike handlers
  const handleLike = () => {
    if (liked) {
      setLiked(false);
      setLikes(prev => prev - 1);
    } else {
      setLiked(true);
      setLikes(prev => prev + 1);
      if (disliked) {
        setDisliked(false);
        setDislikes(prev => prev - 1);
      }
    }
    // Here you can add API call to save like status
  };

  const handleDislike = () => {
    if (disliked) {
      setDisliked(false);
      setDislikes(prev => prev - 1);
    } else {
      setDisliked(true);
      setDislikes(prev => prev + 1);
      if (liked) {
        setLiked(false);
        setLikes(prev => prev - 1);
      }
    }
    // Here you can add API call to save dislike status
  };

  // Share handler
  const handleShare = async () => {
    const shareData = {
      title: video.title,
      text: `Check out this movie: ${video.title}`,
      url: window.location.href
    };

    try {
      // Try native Web Share API first (mobile)
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    } catch (err) {
      // Final fallback: show share options
      const shareUrl = encodeURIComponent(window.location.href);
      const shareText = encodeURIComponent(shareData.text);
      
      const shareOptions = [
        { name: 'WhatsApp', url: `https://wa.me/?text=${shareText}%20${shareUrl}` },
        { name: 'Telegram', url: `https://t.me/share/url?url=${shareUrl}&text=${shareText}` },
        { name: 'Twitter', url: `https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareText}` },
        { name: 'Facebook', url: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}` }
      ];

      // Create a simple modal or alert with share options
      const choice = prompt(`Share via:\n${shareOptions.map((opt, i) => `${i+1}. ${opt.name}`).join('\n')}\nEnter number (1-4) or press Cancel to copy link:`);
      
      if (choice && choice >= 1 && choice <= 4) {
        window.open(shareOptions[choice - 1].url, '_blank');
      } else {
        try {
          await navigator.clipboard.writeText(window.location.href);
          alert('Link copied to clipboard!');
        } catch {
          alert(`Share this link: ${window.location.href}`);
        }
      }
    }
  };

  // Download handler
  const handleDownload = () => {
    setShowDownloads(!showDownloads);
  };

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
      <div className="video-detail-page">
        <div className="container">
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
      </div>
    );
  }

  const availableDownloads = video.downloadLinks ? 
    Object.entries(video.downloadLinks).filter(([_, link]) => link && link.trim() !== '') : [];

  return (
    <div className="video-detail-page">
      <div className="container">
        <div className="video-layout">
          <div className="video-main">
            <VideoPlayer 
              embedCode={sources[currentSource]?.code}
              title={video.title}
            />

            <div className="video-info">
              <h1 className="video-detail-title">{video.title}</h1>
              
              <div className="video-detail-meta">
                <div className="meta-item">
                  <i className="fas fa-eye"></i>
                  <span>{formatViews(video.views || 0)} views</span>
                </div>
                <div className="meta-item">
                  <i className="fas fa-clock"></i>
                  <span>{formatDuration(video.duration || 120)}</span>
                </div>
                <div className="meta-item genre">
                  <i className="fas fa-tags"></i>
                  <span>{video.genre}</span>
                </div>
                {video.createdAt && (
                  <div className="meta-item">
                    <i className="fas fa-calendar"></i>
                    <span>
                      {video.createdAt.toDate ? 
                        new Date(video.createdAt.toDate()).toLocaleDateString() : 
                        'Recent'
                      }
                    </span>
                  </div>
                )}
              </div>

              {/* NEW: All 5 actions in one row */}
              <div className="video-actions-row">
                <button 
                  className={`action-btn like-btn ${liked ? 'active' : ''}`}
                  onClick={handleLike}
                >
                  <i className="fas fa-thumbs-up"></i>
                  <span>Like</span>
                  <span className="count">{formatViews(likes)}</span>
                </button>

                <button 
                  className={`action-btn dislike-btn ${disliked ? 'active' : ''}`}
                  onClick={handleDislike}
                >
                  <i className="fas fa-thumbs-down"></i>
                  <span>Dislike</span>
                  <span className="count">{formatViews(dislikes)}</span>
                </button>

                <button 
                  className="action-btn share-btn"
                  onClick={handleShare}
                >
                  <i className="fas fa-share"></i>
                  <span>Share</span>
                </button>

                {sources.length > 0 && (
                  <select 
                    className="action-select source-select"
                    value={currentSource} 
                    onChange={(e) => setCurrentSource(parseInt(e.target.value))}
                  >
                    {sources.map((source, index) => (
                      <option key={index} value={index}>{source.label}</option>
                    ))}
                  </select>
                )}

                {availableDownloads.length > 0 && (
                  <button 
                    className="action-btn download-btn"
                    onClick={handleDownload}
                  >
                    <i className="fas fa-download"></i>
                    <span>Download ({availableDownloads.length})</span>
                  </button>
                )}
              </div>

              {/* Download options (appears when download button clicked) */}
              {showDownloads && availableDownloads.length > 0 && (
                <div className="download-section">
                  <div className="download-header">
                    <i className="fas fa-download"></i>
                    <h3>Download Options</h3>
                  </div>
                  <div className="quality-buttons">
                    {availableDownloads.map(([quality, link]) => (
                      <a 
                        key={quality} 
                        href={link} 
                        className="quality-btn"
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <i className="fas fa-download"></i>
                        {quality}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* NEW: Collapsible Description */}
              {video.description && (
                <div className="description-section">
                  <button 
                    className="description-toggle"
                    onClick={() => setDescriptionOpen(!descriptionOpen)}
                  >
                    <div className="description-header">
                      <i className="fas fa-align-left"></i>
                      <h3>Description</h3>
                    </div>
                    <i className={`fas fa-chevron-${descriptionOpen ? 'up' : 'down'}`}></i>
                  </button>
                  
                  {descriptionOpen && (
                    <div className="description-content">
                      <p>{video.description}</p>
                    </div>
                  )}
                </div>
              )}

              <AdSlot position="in_video" videoId={video.id} />
            </div>
          </div>

          <div className="video-sidebar">
            <AdSlot position="sidebar" />
            
            <div className="suggested-videos">
              <div className="sidebar-header">
                <i className="fas fa-list"></i>
                <h3>Related Movies</h3>
              </div>
              
              {relatedLoading ? (
                <LoadingSpinner size="small" text="Loading related videos..." />
              ) : relatedVideos.length > 0 ? (
                relatedVideos.map(relatedVideo => (
                  <VideoCard key={relatedVideo.id} video={relatedVideo} />
                ))
              ) : (
                <div className="no-related">
                  <i className="fas fa-film"></i>
                  <p>No related videos found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoDetail;
