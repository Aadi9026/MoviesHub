// Enhanced Movie Data Fetcher with Year in Title & 16:9 Images - FIXED VERSION
const TMDB_API_KEY = 'your_tmdb_api_key_here'; // Get from https://www.themoviedb.org/settings/api
const OMDB_API_KEY = '53cca1db'; // Your OMDB API key

export const fetchMovieData = async (identifier) => {
  try {
    console.log('Fetching movie data for:', identifier);
    
    // Clean the identifier
    identifier = identifier.trim();
    
    // Extract year from identifier if present
    const { cleanIdentifier, year } = extractYearFromTitle(identifier);
    
    let result;
    
    // Check if it's an IMDb ID (starts with tt)
    if (cleanIdentifier.startsWith('tt')) {
      result = await fetchMovieByIMDb(cleanIdentifier);
    }
    // Check if it's a TMDB ID (numeric)
    else if (/^\d+$/.test(cleanIdentifier)) {
      result = await fetchMovieByTMDB(cleanIdentifier);
    }
    // Otherwise treat it as a movie title
    else {
      result = await fetchMovieByTitle(cleanIdentifier, year);
    }
    
    // Ensure year is included in title for all results
    if (result.success && result.data) {
      result.data = ensureYearInTitle(result.data);
    }
    
    return result;
    
  } catch (error) {
    console.error('Error fetching movie data:', error);
    return { 
      success: false, 
      error: error.message,
      data: null
    };
  }
};

// Ensure year is always included in title formats
const ensureYearInTitle = (data) => {
  const year = data.year || '';
  
  if (!data.titleWithYear) {
    data.titleWithYear = year ? `${data.title} (${year})` : data.title;
  }
  
  if (!data.displayTitle) {
    data.displayTitle = year ? `${data.title} ${year}` : data.title;
  }
  
  return data;
};

// Extract year from movie title - IMPROVED
const extractYearFromTitle = (title) => {
  // Patterns: "Movie Name 2025", "Movie Name (2025)", "2025 Movie Name"
  const yearInParentheses = title.match(/\((\d{4})\)/);
  const yearAtEnd = title.match(/(\d{4})$/);
  const yearAtStart = title.match(/^(\d{4})/);
  
  let year = null;
  let cleanTitle = title;
  
  if (yearInParentheses) {
    year = yearInParentheses[1];
    cleanTitle = title.replace(/\(\d{4}\)/, '').trim();
  } else if (yearAtEnd) {
    year = yearAtEnd[1];
    cleanTitle = title.replace(/\d{4}$/, '').trim();
  } else if (yearAtStart) {
    year = yearAtStart[1];
    cleanTitle = title.replace(/^\d{4}/, '').trim();
  }
  
  // Clean up any extra spaces or parentheses
  cleanTitle = cleanTitle.replace(/\s+/g, ' ').replace(/\s*\(\s*\)\s*/, '').trim();
  
  return { cleanIdentifier: cleanTitle, year };
};

// Fetch movie by IMDb ID - IMPROVED with 16:9 images
const fetchMovieByIMDb = async (imdbId) => {
  try {
    // First try OMDB API with your key
    const omdbResponse = await fetch(
      `https://www.omdbapi.com/?i=${imdbId}&apikey=${OMDB_API_KEY}&plot=full`
    );
    
    if (!omdbResponse.ok) {
      throw new Error(`OMDB API error: ${omdbResponse.status}`);
    }
    
    const omdbData = await omdbResponse.json();
    
    if (omdbData.Response === 'True') {
      console.log('Found movie via OMDB:', omdbData.Title);
      
      // ALWAYS try to get 16:9 backdrop from TMDB
      const backdropImage = await fetchTMDBBackdrop(omdbData.Title, omdbData.Year);
      
      return {
        success: true,
        data: formatOMDBData(omdbData, backdropImage),
        source: 'omdb'
      };
    }
    
    throw new Error(`Movie not found with IMDb ID: ${imdbId}`);
    
  } catch (error) {
    console.error('Error in fetchMovieByIMDb:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

// Fetch movie by TMDB ID - IMPROVED
const fetchMovieByTMDB = async (tmdbId) => {
  try {
    // If TMDB API key is not set, fallback to OMDB search
    if (!TMDB_API_KEY || TMDB_API_KEY === 'your_tmdb_api_key_here') {
      return await searchMovieByTitle(tmdbId);
    }
    
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=en-US&append_to_response=videos,credits`
    );
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Movie not found on TMDB');
      }
      throw new Error(`TMDB API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.id) {
      return {
        success: true,
        data: formatTMDBData(data),
        source: 'tmdb'
      };
    }
    
    throw new Error('Movie not found on TMDB');
  } catch (error) {
    console.error('Error in fetchMovieByTMDB:', error);
    return await searchMovieByTitle(tmdbId);
  }
};

// Search movie by title - IMPROVED
const fetchMovieByTitle = async (title, year = null) => {
  return await searchMovieByTitle(title, year);
};

// Search movie by title across multiple APIs - IMPROVED
const searchMovieByTitle = async (title, year = null) => {
  try {
    // First try OMDB with your API key
    let omdbUrl = `https://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=${OMDB_API_KEY}&plot=full`;
    if (year) {
      omdbUrl += `&y=${year}`;
    }
    
    const omdbResponse = await fetch(omdbUrl);
    
    if (!omdbResponse.ok) {
      throw new Error(`OMDB API error: ${omdbResponse.status}`);
    }
    
    const omdbData = await omdbResponse.json();
    
    if (omdbData.Response === 'True') {
      console.log('Found movie via OMDB title search:', omdbData.Title);
      
      // ALWAYS try to get 16:9 backdrop from TMDB
      const backdropImage = await fetchTMDBBackdrop(omdbData.Title, omdbData.Year);
      
      return {
        success: true,
        data: formatOMDBData(omdbData, backdropImage),
        source: 'omdb'
      };
    }
    
    // If OMDB fails, try TMDB search
    const tmdbResults = await searchTMDBMovies(title, year);
    if (tmdbResults.success && tmdbResults.movies.length > 0) {
      const movie = tmdbResults.movies[0];
      return await fetchMovieByTMDB(movie.id);
    }
    
    return {
      success: false,
      error: `Movie "${title}" not found on any database`,
      data: null
    };
    
  } catch (error) {
    console.error('Error in searchMovieByTitle:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

// Search TMDB movies - NEW FUNCTION
const searchTMDBMovies = async (title, year = null) => {
  try {
    if (!TMDB_API_KEY || TMDB_API_KEY === 'your_tmdb_api_key_here') {
      return { success: false, movies: [] };
    }
    
    let tmdbUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&language=en-US&page=1&include_adult=false`;
    if (year) {
      tmdbUrl += `&year=${year}`;
    }
    
    const tmdbResponse = await fetch(tmdbUrl);
    
    if (!tmdbResponse.ok) {
      return { success: false, movies: [] };
    }
    
    const tmdbData = await tmdbResponse.json();
    
    if (tmdbData.results && tmdbData.results.length > 0) {
      return {
        success: true,
        movies: tmdbData.results.map(movie => ({
          id: movie.id,
          title: movie.title,
          year: movie.release_date ? new Date(movie.release_date).getFullYear() : 'Unknown',
          backdrop: movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : '',
          poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : ''
        }))
      };
    }
    
    return { success: false, movies: [] };
  } catch (error) {
    return { success: false, movies: [] };
  }
};

// Fetch 16:9 backdrop image from TMDB - IMPROVED
const fetchTMDBBackdrop = async (title, year) => {
  try {
    if (!TMDB_API_KEY || TMDB_API_KEY === 'your_tmdb_api_key_here') return '';
    
    const searchResults = await searchTMDBMovies(title, year);
    
    if (searchResults.success && searchResults.movies.length > 0) {
      const movie = searchResults.movies[0];
      if (movie.backdrop) {
        return movie.backdrop;
      }
    }
    
    return '';
  } catch (error) {
    console.error('Error fetching TMDB backdrop:', error);
    return '';
  }
};

// Format OMDB data to our schema - IMPROVED with guaranteed year in title
const formatOMDBData = (data, backdropImage = '') => {
  // Extract year from "2020–2021" or "2020" format
  let year = data.Year || '';
  if (year.includes('–')) {
    year = year.split('–')[0];
  }
  year = year.replace(/[^0-9]/g, ''); // Remove non-numeric characters
  
  // Extract duration from "136 min" format
  let duration = 120;
  if (data.Runtime && data.Runtime !== 'N/A') {
    const runtimeMatch = data.Runtime.match(/(\d+)/);
    duration = runtimeMatch ? parseInt(runtimeMatch[1]) : 120;
  }
  
  // Extract rating
  let rating = 'N/A';
  if (data.imdbRating && data.imdbRating !== 'N/A') {
    rating = parseFloat(data.imdbRating).toFixed(1);
  }

  const formattedData = {
    // GUARANTEED: Multiple title formats with year
    title: data.Title || '',
    titleWithYear: `${data.Title} (${year})`, // Format: "Movie Name (2025)"
    displayTitle: `${data.Title} ${year}`, // Format: "Movie Name 2025"
    originalTitle: data.Title || '',
    
    // Basic info
    description: data.Plot || '',
    genre: data.Genre?.split(', ')[0] || 'Unknown',
    allGenres: data.Genre?.split(', ') || ['Unknown'],
    duration: duration,
    year: year,
    rating: rating,
    
    // 16:9 image support - GUARANTEED to try TMDB
    thumbnail: data.Poster !== 'N/A' ? data.Poster : '',
    backdrop: backdropImage, // 16:9 image from TMDB
    poster: data.Poster !== 'N/A' ? data.Poster : '',
    
    // Additional details
    actors: data.Actors?.split(', ') || [],
    director: data.Director?.split(', ') || [],
    releaseDate: data.Released || '',
    country: data.Country?.split(', ') || [],
    language: data.Language?.split(', ') || [],
    production: data.Production || '',
    imdbID: data.imdbID || '',
    type: data.Type || 'movie',
    rated: data.Rated || '',
    awards: data.Awards || '',
    
    // Quality options
    qualities: ['480p', '720p', '1080p'],
    
    // Additional fields for your post
    downloadLink: '',
    embedCode: '',
    
    // Metadata
    source: 'omdb',
    fetchedAt: new Date().toISOString()
  };

  // Ensure year formats are correct
  return ensureYearInTitle(formattedData);
};

// Format TMDB data to our schema - IMPROVED
const formatTMDBData = (data) => {
  const year = data.release_date ? new Date(data.release_date).getFullYear().toString() : '';

  const formattedData = {
    // GUARANTEED: Multiple title formats with year
    title: data.title || '',
    titleWithYear: `${data.title} (${year})`,
    displayTitle: `${data.title} ${year}`,
    originalTitle: data.original_title || '',
    
    // Basic info
    description: data.overview || '',
    genre: data.genres?.[0]?.name || 'Unknown',
    allGenres: data.genres?.map(g => g.name) || ['Unknown'],
    duration: data.runtime || 120,
    year: year,
    rating: data.vote_average ? data.vote_average.toFixed(1) : 'N/A',
    
    // 16:9 image support - GUARANTEED from TMDB
    thumbnail: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : '',
    backdrop: data.backdrop_path ? `https://image.tmdb.org/t/p/w1280${data.backdrop_path}` : '', // 16:9
    poster: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : '',
    
    // Additional details
    releaseDate: data.release_date || '',
    country: data.production_countries?.map(c => c.name) || [],
    language: data.original_language || '',
    production: data.production_companies?.[0]?.name || '',
    budget: data.budget || 0,
    revenue: data.revenue || 0,
    tagline: data.tagline || '',
    status: data.status || '',
    imdbID: data.imdb_id || '',
    
    // Quality options
    qualities: ['480p', '720p', '1080p'],
    
    // Additional fields for your post
    downloadLink: '',
    embedCode: '',
    
    // Cast information
    cast: data.credits?.cast?.slice(0, 5).map(actor => actor.name) || [],
    director: data.credits?.crew?.find(person => person.job === 'Director')?.name || '',
    
    // Metadata
    source: 'tmdb',
    fetchedAt: new Date().toISOString()
  };

  // Ensure year formats are correct
  return ensureYearInTitle(formattedData);
};

// Generate HTML for admin panel like your screenshot - FIXED
export const generateAdminMovieDisplay = (movieData) => {
  if (!movieData || !movieData.success) {
    return `
    <div class="movie-fetch-error">
      <p>❌ Movie data not available. Please check the identifier and try again.</p>
    </div>
    `;
  }
  
  const data = movieData.data;
  
  return `
<div class="movie-fetch-result">
  <div class="success-message">✅ Movie data fetched successfully!</div>
  
  <div class="movie-preview">
    <h3>Preview:</h3>
    <div class="preview-content">
      ${data.backdrop ? `
      <div class="preview-image">
        <img src="${data.backdrop}" alt="${data.title}" 
             style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px; border: 2px solid #007cba;">
        <div class="image-info">16:9 Backdrop Image</div>
      </div>
      ` : data.thumbnail ? `
      <div class="preview-image">
        <img src="${data.thumbnail}" alt="${data.title}" 
             style="width: 100%; max-height: 300px; object-fit: contain; border-radius: 8px; border: 2px solid #ccc;">
        <div class="image-info">Poster Image</div>
      </div>
      ` : '<p>No image available</p>'}
    </div>
  </div>

  <div class="movie-details-form">
    <div class="form-group">
      <label><strong>Title with Year:</strong></label>
      <input type="text" value="${data.titleWithYear}" readonly 
             style="width: 100%; padding: 8px; border: 1px solid #007cba; border-radius: 4px; background: #f0f8ff;">
      <small>Automatically formatted with year</small>
    </div>

    <div class="form-group">
      <label><strong>Description:</strong></label>
      <textarea readonly style="width: 100%; height: 100px; padding: 8px; border: 1px solid #ddd; border-radius: 4px; background: #f9f9f9;">${data.description || 'No description available'}</textarea>
    </div>

    <div class="movie-meta-grid">
      <div class="meta-item">
        <strong>Year:</strong> ${data.year || 'N/A'}
      </div>
      <div class="meta-item">
        <strong>Rating:</strong> ${data.rating}/10
      </div>
      <div class="meta-item">
        <strong>Duration:</strong> ${data.duration} min
      </div>
      <div class="meta-item">
        <strong>Genre:</strong> ${data.genre}
      </div>
      <div class="meta-item">
        <strong>Language:</strong> ${data.language || 'N/A'}
      </div>
      <div class="meta-item">
        <strong>Country:</strong> ${data.country?.[0] || 'N/A'}
      </div>
    </div>

    <div class="form-group">
      <label><strong>Download Link:</strong></label>
      <input type="url" placeholder="https://example.com/download-movie" 
             style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
    </div>

    <div class="form-group">
      <label><strong>Embed Code (Primary) *</strong></label>
      <textarea placeholder="Paste embed code here..." 
                style="width: 100%; height: 80px; padding: 8px; border: 1px solid #ddd; border-radius: 4px;"></textarea>
    </div>
  </div>
</div>

<style>
.movie-fetch-result {
  border: 2px solid #28a745;
  border-radius: 8px;
  padding: 20px;
  background: white;
  margin: 15px 0;
}

.success-message {
  background: #d4edda;
  color: #155724;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
  font-weight: bold;
}

.movie-preview {
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 6px;
}

.movie-preview h3 {
  margin-top: 0;
  color: #333;
}

.preview-image {
  position: relative;
  margin: 10px 0;
}

.image-info {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background: rgba(0,0,0,0.7);
  color: white;
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 0.8em;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  color: #333;
}

.form-group small {
  color: #666;
  font-style: italic;
}

.movie-meta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
  margin: 15px 0;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 6px;
}

.meta-item {
  padding: 8px;
  background: white;
  border-radius: 4px;
  border-left: 3px solid #007cba;
}

.movie-fetch-error {
  border: 2px solid #dc3545;
  border-radius: 8px;
  padding: 15px;
  background: #f8d7da;
  color: #721c24;
  margin: 15px 0;
}
</style>
  `.trim();
};

// Test with guaranteed features
export const testGuaranteedFeatures = async () => {
  console.log('Testing guaranteed year in title and 16:9 images...');
  
  const testCases = [
    'tt3896198', // Guardians of the Galaxy Vol. 2
    'Avengers: Endgame',
    'Kantara 2022',
    'The Dark Knight (2008)'
  ];
  
  for (const testCase of testCases) {
    console.log(`\nTesting: "${testCase}"`);
    const result = await fetchMovieData(testCase);
    
    if (result.success) {
      console.log('✅ SUCCESS');
      console.log('Title with Year:', result.data.titleWithYear);
      console.log('16:9 Image:', result.data.backdrop ? '✅ Available' : '❌ Not available');
      console.log('Year:', result.data.year);
    } else {
      console.log('❌ FAILED:', result.error);
    }
  }
};

// Get TMDB API key reminder
export const getTMDBKeyReminder = () => {
  if (!TMDB_API_KEY || TMDB_API_KEY === 'your_tmdb_api_key_here') {
    return `
    <div class="tmdb-warning">
      <h4>⚠️ TMDB API Key Required for 16:9 Images</h4>
      <p>To get 16:9 backdrop images, you need to:</p>
      <ol>
        <li>Visit <a href="https://www.themoviedb.org/settings/api" target="_blank">TMDB API Settings</a></li>
        <li>Register for a free account</li>
        <li>Get your API key</li>
        <li>Replace 'your_tmdb_api_key_here' in the code</li>
      </ol>
      <p><strong>Current Status:</strong> Using OMDB only - limited to poster images</p>
    </div>
    <style>
    .tmdb-warning {
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      border-radius: 6px;
      padding: 15px;
      margin: 15px 0;
      color: #856404;
    }
    .tmdb-warning a {
      color: #007cba;
      font-weight: bold;
    }
    </style>
    `;
  }
  return '';
};
