import React, { useState, useEffect } from 'react';
import { getAdSettings, updateAdSettings } from '../../services/database';
import LoadingSpinner from '../Common/LoadingSpinner';

const AdSettings = () => {
  const [adSettings, setAdSettings] = useState({
    headerAd: '',
    sidebarAd: '',
    footerAd: '',
    inVideoAd: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadAdSettings();
  }, []);

  const loadAdSettings = async () => {
    setLoading(true);
    const result = await getAdSettings();
    if (result.success) {
      setAdSettings(result.settings);
    } else {
      setMessage({ type: 'error', text: `Error: ${result.error}` });
    }
    setLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAdSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    // Clean empty values
    const cleanedSettings = Object.fromEntries(
      Object.entries(adSettings).map(([key, value]) => [key, value.trim()])
    );

    const result = await updateAdSettings(cleanedSettings);
    
    if (result.success) {
      setMessage({ type: 'success', text: 'Ad settings saved successfully!' });
    } else {
      setMessage({ type: 'error', text: `Error: ${result.error}` });
    }
    
    setSaving(false);
  };

  if (loading) return <LoadingSpinner text="Loading ad settings..." />;

  return (
    <div className="ad-settings">
      <h3>Ad Settings</h3>
      <p>Configure your ad codes for different positions on the website. Leave empty to hide ad slots.</p>

      {message.text && (
        <div className={`message ${message.type}`}>
          <i className={`fas fa-${message.type === 'success' ? 'check' : 'exclamation'}-circle`}></i>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Header Ad Code</label>
          <textarea
            name="headerAd"
            className="form-textarea"
            value={adSettings.headerAd}
            onChange={handleInputChange}
            placeholder="Paste your header ad code here"
            rows="4"
          />
          <small>This ad will appear in the website header. Leave empty to hide.</small>
        </div>

        <div className="form-group">
          <label className="form-label">Sidebar Ad Code</label>
          <textarea
            name="sidebarAd"
            className="form-textarea"
            value={adSettings.sidebarAd}
            onChange={handleInputChange}
            placeholder="Paste your sidebar ad code here"
            rows="4"
          />
          <small>This ad will appear in the video sidebar. Leave empty to hide.</small>
        </div>

        <div className="form-group">
          <label className="form-label">Footer Ad Code</label>
          <textarea
            name="footerAd"
            className="form-textarea"
            value={adSettings.footerAd}
            onChange={handleInputChange}
            placeholder="Paste your footer ad code here"
            rows="4"
          />
          <small>This ad will appear in the website footer. Leave empty to hide.</small>
        </div>

        <div className="form-group">
          <label className="form-label">In-Video Ad Code</label>
          <textarea
            name="inVideoAd"
            className="form-textarea"
            value={adSettings.inVideoAd}
            onChange={handleInputChange}
            placeholder="Paste your in-video ad code here"
            rows="4"
          />
          <small>This ad will appear below video player. Leave empty to hide.</small>
        </div>

        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={saving}
        >
          {saving ? (
            <>
              <i className="fas fa-spinner fa-spin"></i>
              Saving...
            </>
          ) : (
            'Save Ad Settings'
          )}
        </button>

        <button 
          type="button" 
          className="btn btn-secondary"
          onClick={loadAdSettings}
          style={{ marginLeft: '10px' }}
          disabled={saving}
        >
          <i className="fas fa-sync-alt"></i>
          Reload Settings
        </button>
      </form>

      <div className="ad-preview">
        <h4>Ad Preview</h4>
        <p><small>Ad slots will only appear when code is provided.</small></p>
        <div className="preview-grid">
          <div className="preview-item">
            <h5>Header Ad {adSettings.headerAd.trim() ? '(Active)' : '(Hidden)'}</h5>
            <div className="preview-content">
              {adSettings.headerAd.trim() ? (
                <div dangerouslySetInnerHTML={{ __html: adSettings.headerAd }} />
              ) : (
                <span className="preview-placeholder">No ad code - Slot hidden</span>
              )}
            </div>
          </div>

          <div className="preview-item">
            <h5>Sidebar Ad {adSettings.sidebarAd.trim() ? '(Active)' : '(Hidden)'}</h5>
            <div className="preview-content">
              {adSettings.sidebarAd.trim() ? (
                <div dangerouslySetInnerHTML={{ __html: adSettings.sidebarAd }} />
              ) : (
                <span className="preview-placeholder">No ad code - Slot hidden</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdSettings;
