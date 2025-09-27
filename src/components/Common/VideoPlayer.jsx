import React, { useState, useEffect } from 'react';

const VideoPlayer = ({ embedCode, title }) => {
  const [error, setError] = useState(false);
  const [iframeSrc, setIframeSrc] = useState('');

  useEffect(() => {
    if (embedCode) {
      const src = extractIframeSrc(embedCode);
      setIframeSrc(src);
      setError(!src);
    }
  }, [embedCode]);

  const extractIframeSrc = (code) => {
    if (!code) return '';
    
    try {
      // Handle different embed code formats
      let src = '';
      
      // Method 1: Direct iframe src extraction
      const iframeMatch = code.match(/src=(["'])(.*?)\1/);
      if (iframeMatch) {
        src = iframeMatch[2];
      }
      
      // Method 2: Handle encoded URLs
      if (!src) {
        const urlMatch = code.match(/https?:\/\/[^"'\s]+/);
        if (urlMatch) {
          src = urlMatch[0];
        }
      }
      
      // Method 3: Handle MultiMovies format
      if (!src && code.includes('multimoviesshg.com')) {
        const multiMatch = code.match(/https:\/\/multimoviesshg\.com\/[^"'\s]+/);
        if (multiMatch) {
          src = multiMatch[0];
        }
      }
      
      // Ensure the URL is properly formatted
      if (src && !src.startsWith('http')) {
        src = 'https:' + src;
      }
      
      return src;
    } catch (err) {
      console.error('Error parsing embed code:', err);
      return '';
    }
  };

  const createIframeHtml = (src) => {
    return `
      <iframe 
        src="${src}" 
        width="100%" 
        height="100%" 
        frameborder="0" 
        allowfullscreen 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      ></iframe>
    `;
  };

  if (error || !iframeSrc) {
    return (
      <div className="video-player-container">
        <div className="video-player error">
          <div className="video-error">
            <i className="fas fa-exclamation-triangle"></i>
            <h3>Unable to load video</h3>
            <p>Please check the embed code or try an alternative source.</p>
            <div className="debug-info">
              <p><strong>Debug Info:</strong></p>
              <p>Embed Code: {embedCode ? 'Provided' : 'Missing'}</p>
              <p>Extracted Source: {iframeSrc || 'None'}</p>
            </div>
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
          width="100%"
          height="100%"
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
