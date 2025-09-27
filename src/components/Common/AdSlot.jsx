import React, { useState, useEffect } from 'react';
import { getAdSettings } from '../../services/database';

const AdSlot = ({ position, videoId }) => {
  const [adCode, setAdCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [hasAdCode, setHasAdCode] = useState(false);

  useEffect(() => {
    loadAdSettings();
  }, [position]);

  const loadAdSettings = async () => {
    try {
      const result = await getAdSettings();
      if (result.success && result.settings) {
        const code = result.settings[`${position}Ad`] || '';
        setAdCode(code);
        setHasAdCode(code.trim() !== '');
      } else {
        setHasAdCode(false);
      }
    } catch (error) {
      console.error('Error loading ad settings:', error);
      setHasAdCode(false);
    } finally {
      setLoading(false);
    }
  };

  // Don't show ad slot at all if no ad code is configured
  if (!hasAdCode && !loading) {
    return null;
  }

  if (loading) {
    return (
      <div className={`ad-slot ad-${position} loading`}>
        <div className="ad-label">Loading Advertisement...</div>
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
