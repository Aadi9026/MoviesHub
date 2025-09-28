import React, { useState, useEffect } from 'react';

const VideoPlayer = ({ embedCode, title }) => {
  const [error, setError] = useState(false);
  const [iframeHtml, setIframeHtml] = useState('');

  useEffect(() => {
    if (embedCode) {
      const processedHtml = processEmbedCode(embedCode);
      setIframeHtml(processedHtml);
      setError(!processedHtml);
    } else {
      setError(true);
      setIframeHtml('');
    }
  }, [embedCode]);

  const processEmbedCode = (code) => {
    if (!code || typeof code !== 'string') {
      return null;
    }

    try {
      // Clean the code
      let cleanCode = code.trim();
      
      // Ensure it's a proper iframe
      if (!cleanCode.includes('<iframe')) {
        // If it's just a URL, wrap it in iframe
        if (cleanCode.startsWith('http')) {
          cleanCode = `<iframe src="${cleanCode}" frameborder="0" allowfullscreen></iframe>`;
        } else if (cleanCode.includes('multimoviesshg.com')) {
          // Handle MultiMovies format
          const srcMatch = cleanCode.match(/src=(["'])(.*?)\1/) || cleanCode.match(/(https:\/\/multimoviesshg\.com\/[^\s"']+)/);
          if (srcMatch) {
            const src = srcMatch[2] || srcMatch[1];
            cleanCode = `<iframe src="${src}" frameborder="0" allowfullscreen></iframe>`;
          }
        }
      }

      // Ensure iframe has proper attributes
      if (cleanCode.includes('<iframe')) {
        // Add required attributes if missing
        if (!cleanCode.includes(' width=')) {
          cleanCode = cleanCode.replace('<iframe', '<iframe width="100%"');
        }
        if (!cleanCode.includes(' height=')) {
          cleanCode = cleanCode.replace('<iframe', '<iframe height="100%"');
        }
        if (!cleanCode.includes(' frameborder=')) {
          cleanCode = cleanCode.replace('<iframe', '<iframe frameborder="0"');
        }
        if (!cleanCode.includes(' allowfullscreen')) {
          cleanCode = cleanCode.replace('<iframe', '<iframe allowfullscreen');
        }
        
        // Add security attributes
        cleanCode = cleanCode.replace('<iframe', 
          '<iframe allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"'
        );
      }

      return cleanCode;
    } catch (err) {
      console.error('Error processing embed code:', err);
      return null;
    }
  };

  const createFallbackPlayer = () => {
    return `
      <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #000; color: white; flex-direction: column; padding: 20px; text-align: center;">
        <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 20px; color: #f59e0b;"></i>
        <h3>Unable to Load Video</h3>
        <p>The video cannot be played due to an issue with the embed code.</p>
        <p style="font-size: 12px; opacity: 0.7; margin-top: 10px;">Please try another source or contact support.</p>
      </div>
    `;
  };

  if (error || !iframeHtml) {
    return (
      <div className="video-player-container">
        <div className="video-player error">
          <div 
            className="video-error"
            dangerouslySetInnerHTML={{ __html: createFallbackPlayer() }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="video-player-container">
      <div className="video-player">
        <div 
          dangerouslySetInnerHTML={{ __html: iframeHtml }}
          onError={() => setError(true)}
        />
      </div>
    </div>
  );
};

export default VideoPlayer;
