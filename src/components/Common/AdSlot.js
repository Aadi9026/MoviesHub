import React, { useState, useEffect } from 'react';
import { getAdSettings } from '../../services/database';

const AdSlot = ({ position, videoId }) => {
  const [adCode, setAdCode] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdSettings();
  }, [position]);

  const loadAdSettings = async () => {
    try {
      const result = await getAdSettings();
      if (result.success) {
        const adCode = result.settings[`${position}Ad`] || '';
        setAdCode(adCode);
      }
    } catch (error) {
      console.error('Error loading ad settings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`ad-slot ad-${position} loading`}>
        <div className="ad-label">Loading Advertisement...</div>
      </div>
    );
  }

  if (!adCode) {
    return (
      <div className={`ad-slot ad-${position} empty`}>
        <div className="ad-label">Advertisement</div>
        <div className="ad-placeholder">
          <i className="fas fa-ad"></i>
          <span>Ad slot available</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`ad-slot ad-${position}`}>
      <div className="ad-label">Advertisement</div>
      <div 
        className="ad-content"
        dangerouslySetInnerHTML={{ __html: adCode }}
      />
    </div>
  );
};

export default AdSlot;
