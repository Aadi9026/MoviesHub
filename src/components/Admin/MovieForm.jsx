import React, { useState, useEffect } from 'react';
import { addVideo, updateVideo, checkDuplicateVideo } from '../../services/database';
import { GENRES, QUALITIES } from '../../utils/constants';
import { validateEmbedCode } from '../../utils/helpers';

const MovieForm = ({ editVideo, onSuccess, onCancel, onDuplicateCheck = true }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    genre: '',
    thumbnail: '',
    thumbnailFile: null,
    embedCode: '',
    duration: 120,
    altSources: ['', '', '', ''],
    altSourcesEnabled: [false, false, false, false],
    downloadLinks: { '480p': '', '720p': '', '1080p': '', '4K': '' },
    adCode: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [duplicateCheck, setDuplicateCheck] = useState({
    isDuplicate: false,
    duplicateVideos: [],
    showDuplicateModal: false
  });

  // Sample embed codes for testing
  const sampleEmbedCodes = [
    '<iframe src="https://www.example.com/embed/video-id" frameborder="0" allowfullscreen></iframe>',
    '<iframe src="https://multiembed.com/e/a598j0w1n0ms" width="100%" height="100%" frameborder="0"></iframe>',
    '<IFRAME SRC="https://multimoviesshg.com/e/a598j0w1n0ms" frameborder="0"></IFRAME>'
  ];

  useEffect(() => {
    if (editVideo) {
      setFormData({
        title: editVideo.title || '',
        description: editVideo.description || '',
        genre: editVideo.genre || '',
        thumbnail: editVideo.thumbnail || '',
        thumbnailFile: null,
        embedCode: editVideo.embedCode || '',
        duration: editVideo.duration || 120,
        altSources: editVideo.altSources || ['', '', '', ''],
        altSourcesEnabled: editVideo.altSourcesEnabled || [false, false, false, false],
        downloadLinks: editVideo.downloadLinks || { '480p': '', '720p': '', '1080p': '', '4K': '' },
        adCode: editVideo.adCode || ''
      });
      if (editVideo.thumbnail) {
        setImagePreview(editVideo.thumbnail);
      }
    }
  }, [editVideo]);

  // Check for duplicates when title changes
  useEffect(() => {
    if (onDuplicateCheck && !editVideo && formData.title.trim() && formData.genre) {
      const timer = setTimeout(() => {
        checkForDuplicates();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [formData.title, formData.genre, editVideo]);

  const checkForDuplicates = async () => {
    if (!formData.title.trim() || !formData.genre) return;

    const result = await checkDuplicateVideo(formData.title, formData.genre);
    if (result.success && result.duplicates.length > 0) {
      setDuplicateCheck({
        isDuplicate: true,
        duplicateVideos: result.duplicates,
        showDuplicateModal: false
      });
    } else {
      setDuplicateCheck({
        isDuplicate: false,
        duplicateVideos: [],
        showDuplicateModal: false
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear duplicate warning when user starts editing
    if (name === 'title' || name === 'genre') {
      setDuplicateCheck(prev => ({
        ...prev,
        isDuplicate: false
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }

      setFormData(prev => ({
        ...prev,
        thumbnailFile: file,
        thumbnail: ''
      }));

      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSampleEmbed = (sampleCode) => {
    setFormData(prev => ({
      ...prev,
      embedCode: sampleCode
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

  const handleForceAdd = async () => {
    setDuplicateCheck(prev => ({
      ...prev,
      isDuplicate: false,
      showDuplicateModal: false
    }));
    await submitForm();
  };

  const handleShowDuplicateModal = () => {
    setDuplicateCheck(prev => ({
      ...prev,
      showDuplicateModal: true
    }));
  };

  const submitForm = async () => {
    setLoading(true);
    setError('');

    if (!formData.title.trim()) {
      setError('Please enter a movie title');
      setLoading(false);
      return false;
    }

    if (!formData.thumbnail.trim() && !formData.thumbnailFile) {
      setError('Please provide a thumbnail URL or upload an image');
      setLoading(false);
      return false;
    }

    if (!formData.embedCode.trim()) {
      setError('Please provide an embed code');
      setLoading(false);
      return false;
    }

    try {
      let thumbnailUrl = formData.thumbnail;

      if (formData.thumbnailFile) {
        // Simulate upload - in production, upload to Firebase Storage
        thumbnailUrl = URL.createObjectURL(formData.thumbnailFile);
      }

      const videoData = {
        title: formData.title,
        description: formData.description,
        genre: formData.genre,
        thumbnail: thumbnailUrl,
        embedCode: formData.embedCode,
        duration: parseInt(formData.duration),
        altSources: formData.altSources,
        altSourcesEnabled: formData.altSourcesEnabled,
        downloadLinks: formData.downloadLinks,
        adCode: formData.adCode
      };

      const result = editVideo 
        ? await updateVideo(editVideo.id, videoData)
        : await addVideo(videoData);
      
      if (result.success) {
        setSuccess(editVideo ? 'Movie updated successfully!' : 'Movie added successfully!');
        if (!editVideo) {
          setFormData({
            title: '',
            description: '',
            genre: '',
            thumbnail: '',
            thumbnailFile: null,
            embedCode: '',
            duration: 120,
            altSources: ['', '', '', ''],
            altSourcesEnabled: [false, false, false, false],
            downloadLinks: { '480p': '', '720p': '', '1080p': '', '4K': '' },
            adCode: ''
          });
          setImagePreview('');
        }
        if (onSuccess) {
          setTimeout(onSuccess, 1500);
        }
        return true;
      } else {
        setError(result.error);
        return false;
      }
    } catch (err) {
      setError('Error: ' + err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Skip duplicate check for editing or if disabled
    if (editVideo || !onDuplicateCheck) {
      await submitForm();
      return;
    }

    // Check for duplicates before submitting
    const duplicateResult = await checkDuplicateVideo(formData.title, formData.genre);
    if (duplicateResult.success && duplicateResult.duplicates.length > 0) {
      setDuplicateCheck({
        isDuplicate: true,
        duplicateVideos: duplicateResult.duplicates,
        showDuplicateModal: true
      });
    } else {
      await submitForm();
    }
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
              placeholder="Enter movie title"
            />
            {duplicateCheck.isDuplicate && !duplicateCheck.showDuplicateModal && (
              <div className="duplicate-warning">
                <i className="fas fa-exclamation-triangle"></i>
                <span>Similar movie already exists!</span>
                <button 
                  type="button" 
                  className="btn-link"
                  onClick={handleShowDuplicateModal}
                >
                  View Details
                </button>
              </div>
            )}
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

        {/* Rest of your form remains the same */}
        <div className="form-group">
          <label className="form-label">Duration (minutes) *</label>
          <input
            type="number"
            name="duration"
            className="form-input"
            value={formData.duration}
            onChange={handleInputChange}
            min="1"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Thumbnail *</label>
          <div className="thumbnail-upload">
            <div className="upload-options">
              <div className="upload-option">
                <label className="form-label">Upload from system:</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="file-input"
                />
                <small>Max 5MB - JPG, PNG, WebP</small>
              </div>
              
              <div className="upload-option">
                <label className="form-label">Or enter URL:</label>
                <input
                  type="url"
                  name="thumbnail"
                  className="form-input"
                  value={formData.thumbnail}
                  onChange={handleInputChange}
                  placeholder="https://example.com/thumbnail.jpg"
                />
              </div>
            </div>

            {imagePreview && (
              <div className="image-preview">
                <label className="form-label">Preview:</label>
                <img src={imagePreview} alt="Thumbnail preview" className="preview-image" />
              </div>
            )}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            name="description"
            className="form-textarea"
            value={formData.description}
            onChange={handleInputChange}
            rows="3"
            placeholder="Enter movie description..."
          />
        </div>

        <div className="form-group">
          <label className="form-label">Embed Code (Primary) *</label>
          
          <div className="embed-help">
            <small>
              <strong>Supported formats:</strong> iframe tags, direct URLs, MultiMovies codes
            </small>
          </div>
          
          <textarea
            name="embedCode"
            className="form-textarea"
            value={formData.embedCode}
            onChange={handleInputChange}
            placeholder='Example: <iframe src="https://example.com/embed/video-id" frameborder="0" allowfullscreen></iframe>'
            rows="3"
            required
          />
          
          <div className="sample-codes">
            <label className="form-label">Quick Samples:</label>
            <div className="sample-buttons">
              {sampleEmbedCodes.map((code, index) => (
                <button
                  key={index}
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleSampleEmbed(code)}
                >
                  Sample {index + 1}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Alternative Sources (Optional)</label>
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
                  rows="2"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Download Links (Optional)</label>
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
            rows="2"
          />
        </div>

        <div className="form-actions">
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Saving...
              </>
            ) : (
              editVideo ? 'Update Movie' : 'Add Movie'
            )}
          </button>
          
          {onCancel && (
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Duplicate Confirmation Modal */}
      {duplicateCheck.showDuplicateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Duplicate Movie Detected</h3>
            </div>
            <div className="modal-body">
              <div className="duplicate-alert">
                <i className="fas fa-exclamation-triangle"></i>
                <p>A movie with similar title and genre already exists:</p>
              </div>
              
              <div className="duplicate-list">
                {duplicateCheck.duplicateVideos.map(video => (
                  <div key={video.id} className="duplicate-item">
                    <img src={video.thumbnail} alt={video.title} />
                    <div className="duplicate-info">
                      <h4>{video.title}</h4>
                      <p>{video.genre} • {video.duration} min</p>
                      <small>Added: {video.createdAt?.toDate().toLocaleDateString()}</small>
                    </div>
                  </div>
                ))}
              </div>

              <div className="duplicate-options">
                <p>What would you like to do?</p>
                <div className="option-buttons">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setDuplicateCheck(prev => ({ ...prev, showDuplicateModal: false }))}
                  >
                    Cancel & Edit
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-warning"
                    onClick={handleForceAdd}
                    disabled={loading}
                  >
                    Add Anyway (Duplicate)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MovieForm;
