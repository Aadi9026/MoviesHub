import React, { useState, useEffect } from 'react';
import { addVideo, updateVideo } from '../../services/database';
import { GENRES, QUALITIES } from '../../utils/constants';
import { validateEmbedCode } from '../../utils/helpers';

const MovieForm = ({ editVideo, onSuccess, onCancel }) => {
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }

      setFormData(prev => ({
        ...prev,
        thumbnailFile: file,
        thumbnail: '' // Clear URL if file is selected
      }));

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
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

  const uploadImageToFirebase = async (file) => {
    // For now, we'll use a placeholder service since Firebase Storage requires additional setup
    // In production, implement Firebase Storage upload here
    return new Promise((resolve) => {
      // Create a temporary URL for the file
      const temporaryUrl = URL.createObjectURL(file);
      resolve(temporaryUrl);
      
      // Note: For production, you should:
      // 1. Import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'
      // 2. Upload the file to Firebase Storage
      // 3. Get the download URL
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validation
    if (!formData.title.trim()) {
      setError('Please enter a movie title');
      setLoading(false);
      return;
    }

    if (!formData.genre) {
      setError('Please select a genre');
      setLoading(false);
      return;
    }

    if (!formData.thumbnail.trim() && !formData.thumbnailFile) {
      setError('Please provide a thumbnail URL or upload an image');
      setLoading(false);
      return;
    }

    if (!validateEmbedCode(formData.embedCode)) {
      setError('Please provide a valid embed code with iframe tags');
      setLoading(false);
      return;
    }

    try {
      let thumbnailUrl = formData.thumbnail;

      // Upload file if selected
      if (formData.thumbnailFile) {
        thumbnailUrl = await uploadImageToFirebase(formData.thumbnailFile);
      }

      // Prepare data for Firebase (remove undefined fields and file object)
      const videoData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        genre: formData.genre,
        thumbnail: thumbnailUrl,
        embedCode: formData.embedCode,
        duration: parseInt(formData.duration) || 120,
        altSources: formData.altSources,
        altSourcesEnabled: formData.altSourcesEnabled,
        downloadLinks: formData.downloadLinks,
        adCode: formData.adCode.trim(),
        // Remove file object and any undefined values
        thumbnailFile: undefined
      };

      // Clean up undefined values
      Object.keys(videoData).forEach(key => {
        if (videoData[key] === undefined) {
          delete videoData[key];
        }
      });

      const result = editVideo 
        ? await updateVideo(editVideo.id, videoData)
        : await addVideo(videoData);
      
      if (result.success) {
        setSuccess(editVideo ? 'Movie updated successfully!' : 'Movie added successfully!');
        if (!editVideo) {
          // Reset form if it's a new movie
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
          setTimeout(onSuccess, 1000);
        }
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Error: ' + (err.message || 'Something went wrong'));
      console.error('Submission error:', err);
    }
    
    setLoading(false);
  };

  const clearImage = () => {
    setFormData(prev => ({
      ...prev,
      thumbnail: '',
      thumbnailFile: null
    }));
    setImagePreview('');
  };

  return (
    <div className="movie-form">
      <h3>{editVideo ? 'Edit Movie' : 'Add New Movie'}</h3>
      
      {error && (
        <div className="error-message">
          <i className="fas fa-exclamation-triangle"></i>
          {error}
        </div>
      )}
      {success && (
        <div className="success-message">
          <i className="fas fa-check-circle"></i>
          {success}
        </div>
      )}

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
              placeholder="Enter movie title"
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

        <div className="form-row">
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
                <small>Supported formats: JPG, PNG, WebP (Max 5MB)</small>
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
                <div className="preview-header">
                  <label className="form-label">Preview:</label>
                  <button type="button" className="btn btn-small" onClick={clearImage}>
                    <i className="fas fa-times"></i> Remove
                  </button>
                </div>
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
            rows="4"
            placeholder="Enter movie description..."
          />
        </div>

        <div className="form-group">
          <label className="form-label">Embed Code (Primary) *</label>
          <textarea
            name="embedCode"
            className="form-textarea"
            value={formData.embedCode}
            onChange={handleInputChange}
            placeholder='<iframe src="https://example.com/embed/video-id" frameborder="0" allowfullscreen></iframe>'
            rows="3"
            required
          />
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
            placeholder="Paste your ad code here for this specific video"
            rows="3"
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
    </div>
  );
};

export default MovieForm;
