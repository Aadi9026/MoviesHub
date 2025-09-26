import React from 'react';

const AdSlot = ({ position, videoId }) => {
  const getAdContent = () => {
    // In a real app, this would load actual ad code
    switch (position) {
      case 'header':
        return <div className="ad-banner">Header Advertisement</div>;
      case 'sidebar':
        return <div className="ad-sidebar">Sidebar Advertisement</div>;
      case 'footer':
        return <div className="ad-banner">Footer Advertisement</div>;
      case 'in_video':
        return <div className="ad-in-video">Video Advertisement</div>;
      default:
        return <div className="ad-default">Advertisement</div>;
    }
  };

  return (
    <div className={`ad-slot ad-${position}`}>
      <div className="ad-label">Advertisement</div>
      {getAdContent()}
    </div>
  );
};

export default AdSlot;
