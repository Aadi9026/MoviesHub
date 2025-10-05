// Movie Data Fetcher Service - WORKING FIXED VERSION
const TMDB_API_KEY = 'your_tmdb_api_key_here'; // Replace with actual key
const OMDB_API_KEY = '53cca1db'; // Your working OMDB API key

export const fetchMovieData = async (identifier) => {
  try {
    console.log('Fetching movie data for:', identifier);
    
    if (!identifier || identifier.trim() === '') {
      return {
        success: false,
        error: 'Please enter a movie title, IMDb ID, or TMDB ID',
        data: null
      };
    }
    
    // Clean the identifier
    identifier = identifier.trim();
    
    // Check if it's an IMDb ID (starts with tt)
    if (identifier.startsWith('tt')) {
      return await fetchMovieByIMDb(identifier);
    }
    
    // Check if it's a TMDB ID (numeric)
    if (/^\d+$/.test(identifier)) {
      return await fetchMovieByTMDB(identifier);
    }
    
    // Otherwise treat it as a movie title
    return await fetchMovieByTitle(identifier);
    
  } catch (error) {
    console.error('Error fetching movie data:', error);
    return { 
      success: false, 
      error: 'Network error: ' + error.message,
      data: null
    };
  }
};

// Fetch movie by IMDb ID - FIXED
const fetchMovieByIMDb = async (imdbId) => {
  try {
    // Use OMDB API with your key
    const omdbResponse = await fetch(
      `https://www.omdbapi.com/?i=${imdbId}&apikey=${OMDB_API_KEY}&plot=full`
    );
    
    if (!omdbResponse.ok) {
      throw new Error(`OMDB API error: ${omdbResponse.status}`);
    }
    
    const omdbData = await omdbResponse.json();
    
    if (omdbData.Response === 'True') {
      console.log('Found movie via OMDB:', omdbData.Title);
      
      // Get 16:9 image from TMDB if available
      let backdropImage = '';
      try {
        backdropImage = await fetchTMDBBackdrop(omdbData.Title, omdbData.Year);
      } catch (e) {
        console.log('Could not fetch TMDB backdrop:', e.message);
      }
      
      const formattedData = formatOMDBData(omdbData, backdropImage);
      return {
        success: true,
        data: formattedData,
        source: 'omdb'
      };
    } else {
      throw new Error(omdbData.Error || 'Movie not found on OMDB');
    }
    
  } catch (error) {
    console.error('Error in fetchMovieByIMDb:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

// Fetch movie by TMDB ID - FIXED
const fetchMovieByTMDB = async (tmdbId) => {
  try {
    // If TMDB API key is not set, fallback to title search
    if (!TMDB_API_KEY || TMDB_API_KEY === 'your_tmdb_api_key_here') {
      return {
        success: false,
        error: 'TMDB API key not configured',
        data: null
      };
    }
    
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=en-US`
    );
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Movie not found on TMDB');
      }
      throw new Error(`TMDB API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.id) {
      const formattedData = formatTMDBData(data);
      return {
        success: true,
        data: formattedData,
        source: 'tmdb'
      };
    }
    
    throw new Error('Movie not found on TMDB');
  } catch (error) {
    console.error('Error in fetchMovieByTMDB:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

// Search movie by title - FIXED
const fetchMovieByTitle = async (title) => {
  try {
    // Use OMDB with your API key
    const omdbResponse = await fetch(
      `https://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=${OMDB_API_KEY}&plot=full`
    );
    
    if (!omdbResponse.ok) {
      throw new Error(`OMDB API error: ${omdbResponse.status}`);
    }
    
    const omdbData = await omdbResponse.json();
    
    if (omdbData.Response === 'True') {
      console.log('Found movie via OMDB title search:', omdbData.Title);
      
      // Get 16:9 image from TMDB if available
      let backdropImage = '';
      try {
        backdropImage = await fetchTMDBBackdrop(omdbData.Title, omdbData.Year);
      } catch (e) {
        console.log('Could not fetch TMDB backdrop:', e.message);
      }
      
      const formattedData = formatOMDBData(omdbData, backdropImage);
      return {
        success: true,
        data: formattedData,
        source: 'omdb'
      };
    } else {
      throw new Error(omdbData.Error || `Movie "${title}" not found on OMDB`);
    }
    
  } catch (error) {
    console.error('Error in fetchMovieByTitle:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

// Fetch 16:9 backdrop image from TMDB - FIXED
const fetchTMDBBackdrop = async (title, year) => {
  try {
    if (!TMDB_API_KEY || TMDB_API_KEY === 'your_tmdb_api_key_here') {
      return '';
    }
    
    const searchResponse = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&language=en-US&page=1`
    );
    
    if (!searchResponse.ok) {
      return '';
    }
    
    const searchData = await searchResponse.json();
    
    if (searchData.results && searchData.results.length > 0) {
      const movie = searchData.results[0];
      if (movie.backdrop_path) {
        // Return 16:9 backdrop image
        return `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`;
      }
    }
    
    return '';
  } catch (error) {
    console.error('Error fetching TMDB backdrop:', error);
    return '';
  }
};

// Format OMDB data to our schema - FIXED with year in title
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
  
  // Ensure title with year
  const titleWithYear = year ? `${data.Title} (${year})` : data.Title;
  const displayTitle = year ? `${data.Title} ${year}` : data.Title;

  return {
    // Title with year included
    title: data.Title || '',
    titleWithYear: titleWithYear,
    displayTitle: displayTitle,
    originalTitle: data.Title || '',
    
    // Basic info
    description: data.Plot || '',
    genre: data.Genre?.split(', ')[0] || 'Unknown',
    allGenres: data.Genre?.split(', ') || ['Unknown'],
    duration: duration,
    year: year,
    rating: rating,
    
    // Images
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
};

// Format TMDB data to our schema - FIXED
const formatTMDBData = (data) => {
  const year = data.release_date ? new Date(data.release_date).getFullYear().toString() : '';
  
  const titleWithYear = year ? `${data.title} (${year})` : data.title;
  const displayTitle = year ? `${data.title} ${year}` : data.title;

  return {
    // Title with year
    title: data.title || '',
    titleWithYear: titleWithYear,
    displayTitle: displayTitle,
    originalTitle: data.original_title || '',
    
    // Basic info
    description: data.overview || '',
    genre: data.genres?.[0]?.name || 'Unknown',
    allGenres: data.genres?.map(g => g.name) || ['Unknown'],
    duration: data.runtime || 120,
    year: year,
    rating: data.vote_average ? data.vote_average.toFixed(1) : 'N/A',
    
    // Images
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
    
    // Metadata
    source: 'tmdb',
    fetchedAt: new Date().toISOString()
  };
};

// Simple display function for admin panel - FIXED
export const displayMovieData = (movieData) => {
  if (!movieData || !movieData.success) {
    return `
    <div style="padding: 20px; background: #fee; border: 1px solid #fcc; border-radius: 5px; color: #c00;">
      <strong>Error:</strong> ${movieData?.error || 'Failed to fetch movie data'}
    </div>
    `;
  }
  
  const data = movieData.data;
  const imageUrl = data.backdrop || data.thumbnail;
  
  return `
  <div style="border: 2px solid #4CAF50; border-radius: 10px; padding: 20px; background: white; margin: 20px 0;">
    <div style="background: #4CAF50; color: white; padding: 10px; border-radius: 5px; margin: -20px -20px 20px -20px;">
      <h3 style="margin: 0;">✅ Movie Data Fetched Successfully</h3>
    </div>
    
    <div style="display: flex; gap: 20px; margin-bottom: 20px;">
      ${imageUrl ? `
      <div style="flex: 0 0 300px;">
        <img src="${imageUrl}" alt="${data.title}" 
             style="width: 100%; height: 169px; object-fit: cover; border-radius: 5px; border: 2px solid #ddd;">
        <div style="text-align: center; margin-top: 5px; font-size: 12px; color: #666;">
          ${data.backdrop ? '16:9 Backdrop Image' : 'Poster Image'}
        </div>
      </div>
      ` : ''}
      
      <div style="flex: 1;">
        <h2 style="color: #333; margin-top: 0;">${data.titleWithYear}</h2>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin: 15px 0;">
          <div style="background: #f5f5f5; padding: 8px; border-radius: 4px;">
            <strong>Rating:</strong> ${data.rating}/10
          </div>
          <div style="background: #f5f5f5; padding: 8px; border-radius: 4px;">
            <strong>Duration:</strong> ${data.duration} min
          </div>
          <div style="background: #f5f5f5; padding: 8px; border-radius: 4px;">
            <strong>Genre:</strong> ${data.genre}
          </div>
          <div style="background: #f5f5f5; padding: 8px; border-radius: 4px;">
            <strong>Year:</strong> ${data.year}
          </div>
        </div>
        
        <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; border-left: 4px solid #4CAF50;">
          <strong>Description:</strong><br>
          ${data.description || 'No description available.'}
        </div>
      </div>
    </div>
    
    <div style="background: #e7f3ff; padding: 15px; border-radius: 5px;">
      <h4 style="margin-top: 0;">Add Download & Embed Information</h4>
      
      <div style="display: grid; gap: 10px;">
        <div>
          <label style="display: block; margin-bottom: 5px; font-weight: bold;">Download Link:</label>
          <input type="url" placeholder="https://example.com/download-movie" 
                 style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
        </div>
        
        <div>
          <label style="display: block; margin-bottom: 5px; font-weight: bold;">Embed Code:</label>
          <textarea placeholder="Paste embed code here..." 
                    style="width: 100%; height: 80px; padding: 8px; border: 1px solid #ccc; border-radius: 4px;"></textarea>
        </div>
      </div>
    </div>
  </div>
  `;
};

// Test function - FIXED
export const testMovieFetcher = async () => {
  console.log('Testing movie fetcher...');
  
  const testCases = [
    'tt3896198', // Guardians of the Galaxy Vol. 2
    'Avengers: Endgame',
    'The Dark Knight'
  ];
  
  for (const testCase of testCases) {
    console.log(`Testing: "${testCase}"`);
    const result = await fetchMovieData(testCase);
    
    if (result.success) {
      console.log('✅ SUCCESS:', result.data.titleWithYear);
      console.log('   Year:', result.data.year);
      console.log('   16:9 Image:', result.data.backdrop ? 'Yes' : 'No');
    } else {
      console.log('❌ FAILED:', result.error);
    }
  }
};

// Simple usage example
export const setupMovieFetcher = (inputId, displayId) => {
  const inputElement = document.getElementById(inputId);
  const displayElement = document.getElementById(displayId);
  
  if (!inputElement || !displayElement) {
    console.error('Input or display element not found');
    return;
  }
  
  inputElement.addEventListener('change', async (e) => {
    const identifier = e.target.value.trim();
    if (!identifier) return;
    
    displayElement.innerHTML = '<div style="padding: 20px; text-align: center;">Fetching movie data...</div>';
    
    const result = await fetchMovieData(identifier);
    displayElement.innerHTML = displayMovieData(result);
  });
};

// Initialize when DOM is ready
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', function() {
    console.log('Movie Fetcher initialized');
    // Auto-setup if elements exist
    if (document.getElementById('movie-input') && document.getElementById('movie-display')) {
      setupMovieFetcher('movie-input', 'movie-display');
    }
  });
}
