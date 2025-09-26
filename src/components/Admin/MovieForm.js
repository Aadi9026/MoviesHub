import React, { useState } from 'react';
import { addVideo } from '../../services/database';
import { GENRES, QUALITIES } from '../../utils/constants';
import { validateEmbedCode } from '../../utils/helpers';

const MovieForm = ({ editVideo, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: editVideo?.title || '',
    description: editVideo?.description || '',
    genre: editVideo?.genre || '',
    thumbnail: editVideo?.thumbnail || '',
    embedCode: editVideo?.embedCode || '',
    altSources: editVideo?.altSources || ['', '', '', ''],
    altSourcesEnabled: editVideo?.altSourcesEnabled || [false, false, false, false],
    downloadLinks: editVideo?.downloadLinks || { '480p': '', '720p': '', '1080p': '', '4K': '' },
    adCode: editVideo?.adCode || ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAltSourceChange = (index, value) => {
    const newAltSources = [...formData.altSources];
    newAltSources[index] = value;
    setFormData(prev => ({
      ...prev,
      altSources: newAltSources
    }));
  };

  const handleAltSourceToggle = (index) => {
    const newEnabled = [...formData.altSourcesEnabled];
    newEnabled[index] = !newEnabled[index];
    setFormData(prev => ({
      ...prev,
      altSourcesEnabled: newEnabled
    }));
  };

  const handleDownloadLinkChange = (quality, value) => {
    setFormData(prev => ({
      ...prev,
      downloadLinks: {
        ...prev.downloadLinks,
        [quality]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!validateEmbedCode(formData.embedCode)) {
      setError('Please provide a valid embed code');
      setLoading(false);
      return;
    }

    const result = await addVideo(formData);
    
    if (result.success) {
      setSuccess('Movie added successfully!');
      setFormData({
        title: '',
        description: '',
        genre: '',
        thumbnail: '',
        embedCode: '',
        altSources: ['', '', '', ''],
        altSourcesEnabled: [false, false, false, false],
        downloadLinks: { '480p': '', '720p': '', '1080p': '', '4K': '' },
        adCode: ''
      });
      if (onSuccess) onSuccess();
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="movie-form">
      <h3>{editVideo ? 'Edit Movie' : 'Add New Movie'}</h3>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Movie Title *</label>
            <input
              type="text"
              name="title"
              className="form-input"
              value={formData.title}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Genre *</label>
            <select
              name="genre"
              className="form-select"
              value={formData.genre}
              onChange={handleInputChange}
              required
            >
              <option value="">Select Genre</option>
              {GENRES.map(genre => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            name="description"
            className="form-textarea"
            value={formData.description}
            onChange={handleInputChange}
            rows="4"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Thumbnail URL *</label>
          <input
            type="url"
            name="thumbnail"
            className="form-input"
            value={formData.thumbnail}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Embed Code (Primary) *</label>
          <textarea
            name="embedCode"
            className="form-textarea"
            value={formData.embedCode}
            onChange={handleInputChange}
            placeholder='<iframe src="https://example.com/embed/video-id"></iframe>'
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Alternative Sources</label>
          <div className="iframe-options">
            {[0, 1, 2, 3].map(index => (
              <div key={index} className="iframe-option">
                <div className="switch-option">
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={formData.altSourcesEnabled[index]}
                      onChange={() => handleAltSourceToggle(index)}
                    />
                    <span className="slider"></span>
                  </label>
                  <span>Source {index + 1}</span>
                </div>
                <textarea
                  className="form-textarea"
                  value={formData.altSources[index]}
                  onChange={(e) => handleAltSourceChange(index, e.target.value)}
                  placeholder="Alternative embed code"
                  disabled={!formData.altSourcesEnabled[index]}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Download Links</label>
          <div className="download-options">
            {QUALITIES.map(quality => (
              <div key={quality} className="download-option">
                <label className="form-label">{quality}</label>
                <input
                  type="url"
                  className="form-input"
                  value={formData.downloadLinks[quality]}
                  onChange={(e) => handleDownloadLinkChange(quality, e.target.value)}
                  placeholder={`${quality} download link`}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Ad Slot Code (Optional)</label>
          <textarea
            name="adCode"
            className="form-textarea"
            value={formData.adCode}
            onChange={handleInputChange}
            placeholder="Paste your ad code here"
            rows="3"
          />
        </div>

        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Saving...' : (editVideo ? 'Update Movie' : 'Add Movie')}
        </button>
      </form>
    </div>
  );
};

export default MovieForm;
