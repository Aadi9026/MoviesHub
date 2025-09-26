import React, { useState } from 'react';

const VideoPlayer = ({ embedCode, title }) => {
  const [error, setError] = useState(false);

  const extractIframeSrc = (code) => {
    if (!code) return '';
    
    try {
      // Simple regex to extract src from iframe
      const match = code.match(/src="([^"]+)"/);
      return match ? match[1] : '';
    } catch (err) {
      console.error('Error parsing embed code:', err);
      return '';
    }
  };

  const iframeSrc = extractIframeSrc(embedCode);

  if (error || !iframeSrc) {
    return (
      <div className="video-player-container">
        <div className="video-player error">
          <div className="video-error">
            <i className="fas fa-exclamation-triangle"></i>
            <h3>Unable to load video</h3>
            <p>Please check the embed code or try an alternative source.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="video-player-container">
      <div className="video-player">
        <iframe
          src={iframeSrc}
          title={title}
          frameBorder="0"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          onError={() => setError(true)}
          onLoad={() => setError(false)}
        ></iframe>
      </div>
    </div>
  );
};

export default VideoPlayer;
