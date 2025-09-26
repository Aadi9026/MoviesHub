import React, { useState } from 'react';

const VideoPlayer = ({ embedCode, title }) => {
  const [currentSource, setCurrentSource] = useState(0);

  const extractIframeSrc = (code) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(code, 'text/html');
    const iframe = doc.querySelector('iframe');
    return iframe ? iframe.src : '';
  };

  const iframeSrc = extractIframeSrc(embedCode);

  return (
    <div className="video-player-container">
      <div className="video-player">
        {iframeSrc ? (
          <iframe
            src={iframeSrc}
            title={title}
            frameBorder="0"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          ></iframe>
        ) : (
          <div className="video-error">
            <i className="fas fa-exclamation-triangle"></i>
            <p>Unable to load video</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;
