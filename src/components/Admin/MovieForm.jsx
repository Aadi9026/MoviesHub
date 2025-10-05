import React, { useState, useEffect } from 'react';
import { addVideo, updateVideo } from '../../services/database';
import { fetchMovieData, searchMovies, fetchMovieTrailer } from '../../services/movieDataService';
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
  const [movieSearchQuery, setMovieSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);

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

  // Search for movies
  const handleMovieSearch = async () => {
    if (!movieSearchQuery.trim()) return;
    
    setSearching(true);
    setError('');
    
    try {
      // First try to fetch directly if it's an ID
      if (movieSearchQuery.startsWith('tt') || /^\d+$/.test(movieSearchQuery)) {
        const result = await fetchMovieData(movieSearchQuery);
        if (result.success) {
          fillFormWithMovieData(result.data);
          setSearchResults([]);
        } else {
          // If direct fetch fails, try search
          await performMovieSearch();
        }
      } else {
        // It's a title, perform search
        await performMovieSearch();
      }
    } catch (err) {
      setError('Failed to search for movie: ' + err.message);
    } finally {
      setSearching(false);
    }
  };

  const performMovieSearch = async () => {
    const result = await searchMovies(movieSearchQuery);
    if (result.success) {
      setSearchResults(result.movies);
    } else {
      setError(result.error);
      setSearchResults([]);
    }
  };

  // Fill form with movie data
  const fillFormWithMovieData = (movieData) => {
    setFormData(prev => ({
      ...prev,
      title: movieData.title || prev.title,
      description: movieData.description || prev.description,
      genre: movieData.genre || prev.genre,
      thumbnail: movieData.thumbnail || prev.thumbnail,
      duration: movieData.duration || prev.duration
    }));
    
    if (movieData.thumbnail) {
      setImagePreview(movieData.thumbnail);
    }
    
    setSuccess('Movie data fetched successfully!');
    setSelectedMovie(movieData);
  };

  // Select movie from search results
  const handleSelectMovie = async (movie) => {
    setSearching(true);
    try {
      const result = await fetchMovieData(movie.id.toString());
      if (result.success) {
        fillFormWithMovieData(result.data);
        setSearchResults([]);
        setMovieSearchQuery('');
      }
    } catch (err) {
      setError('Failed to fetch movie details');
    } finally {
      setSearching(false);
    }
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!formData.title.trim()) {
      setError('Please enter a movie title');
      setLoading(false);
      return;
    }

    if (!formData.thumbnail.trim() && !formData.thumbnailFile) {
      setError('Please provide a thumbnail URL or upload an image');
      setLoading(false);
      return;
    }

    if (!formData.embedCode.trim()) {
      setError('Please provide an embed code');
      setLoading(false);
      return;
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
        adCode: formData.adCode,
        // Add movie metadata if available
        ...(selectedMovie && {
          year: selectedMovie.year,
          rating: selectedMovie.rating,
          actors: selectedMovie.actors,
          director: selectedMovie.director
        })
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
          setSelectedMovie(null);
        }
        if (onSuccess) {
          setTimeout(onSuccess, 1500);
        }
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Error: ' + err.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="movie-form">
      <h3>{editVideo ? 'Edit Movie' : 'Add New Movie'}</h3>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {/* Movie Data Fetcher Section */}
      <div className="movie-fetcher-section">
        <h4>Fetch Movie Data</h4>
        <div className="movie-search">
          <div className="search-input-group">
            <input
              type="text"
              placeholder="Enter IMDb ID (tt4154796), TMDB ID, or movie title..."
              value={movieSearchQuery}
              onChange={(e) => setMovieSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleMovieSearch()}
            />
            <button 
              type="button"
              className="btn btn-primary"
              onClick={handleMovieSearch}
              disabled={searching || !movieSearchQuery.trim()}
            >
              {searching ? 'Searching...' : 'Fetch Data'}
            </button>
          </div>
          
          {searchResults.length > 0 && (
            <div className="search-results">
              <h5>Search Results:</h5>
              {searchResults.map(movie => (
                <div 
                  key={movie.id} 
                  className="search-result-item"
                  onClick={() => handleSelectMovie(movie)}
                >
                  <img src={movie.poster} alt={movie.title} />
                  <div className="movie-info">
                    <div className="movie-title">{movie.title} ({movie.year})</div>
                    <div className="movie-overview">{movie.overview}</div>
                    <div className="movie-rating">⭐ {movie.rating}/10</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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
    </div>
  );
};

export default MovieForm;
