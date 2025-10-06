// Movie Data Fetcher Service - FIXED VERSION
const TMDB_API_KEY = '3aad529c86f3fd8fb8ac9fb059421be5'; // Your TMDB API key
const OMDB_API_KEY = '53cca1db'; // Your OMDB API key

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
      error: error.message,
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
      
      // Get 16:9 backdrop from TMDB
      const backdropImage = await fetchTMDBBackdrop(omdbData.Title, omdbData.Year);
      
      return {
        success: true,
        data: formatOMDBData(omdbData, backdropImage),
        source: 'omdb'
      };
    }
    
    throw new Error(omdbData.Error || `Movie not found with IMDb ID: ${imdbId}`);
    
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
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=en-US&append_to_response=videos,credits`
    );
    
    if (!response.ok) {
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
    const omdbResponse = await fetch(
      `https://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=${OMDB_API_KEY}&plot=full`
    );
    
    if (!omdbResponse.ok) {
      throw new Error(`OMDB API error: ${omdbResponse.status}`);
    }
    
    const omdbData = await omdbResponse.json();
    
    if (omdbData.Response === 'True') {
      console.log('Found movie via OMDB title search:', omdbData.Title);
      
      // Get 16:9 backdrop from TMDB
      const backdropImage = await fetchTMDBBackdrop(omdbData.Title, omdbData.Year);
      
      return {
        success: true,
        data: formatOMDBData(omdbData, backdropImage),
        source: 'omdb'
      };
    }
    
    // Fallback to TMDB search
    const tmdbResponse = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&language=en-US&page=1&include_adult=false`
    );
    
    if (tmdbResponse.ok) {
      const tmdbData = await tmdbResponse.json();
      
      if (tmdbData.results && tmdbData.results.length > 0) {
        const movie = tmdbData.results[0];
        return await fetchMovieByTMDB(movie.id);
      }
    }
    
    throw new Error(omdbData.Error || `Movie "${title}" not found`);
    
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
  
  // FIX: Add year to title formats
  const titleWithYear = year ? `${data.Title} (${year})` : data.Title;
  const displayTitle = year ? `${data.Title} ${year}` : data.Title;

  return {
    // FIXED: Year included in title
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
    
    // FIXED: 16:9 image included
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

// Format TMDB data to our schema - FIXED with year in title
const formatTMDBData = (data) => {
  const year = data.release_date ? new Date(data.release_date).getFullYear().toString() : '';
  
  // FIX: Add year to title formats
  const titleWithYear = year ? `${data.title} (${year})` : data.title;
  const displayTitle = year ? `${data.title} ${year}` : data.title;

  return {
    // FIXED: Year included in title
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
    
    // FIXED: 16:9 image included
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
};

// FIXED: Generate embed code with year in title
export const generateEmbedCode = (movieData, videoUrl = '') => {
  const embedUrl = videoUrl || `https://www.youtube.com/embed/dQw4w9WgXcQ`;
  
  // FIX: Use titleWithYear instead of separate title and year
  return `
<div class="movie-embed">
  <div class="embed-container">
    <iframe 
      width="100%" 
      height="400" 
      src="${embedUrl}" 
      frameborder="0" 
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
      allowfullscreen>
    </iframe>
  </div>
  <div class="movie-info">
    <h3>${movieData.titleWithYear || `${movieData.title} (${movieData.year})`}</h3>
    <p><strong>Rating:</strong> ${movieData.rating}/10</p>
    <p><strong>Genre:</strong> ${movieData.allGenres?.join(', ') || movieData.genre}</p>
    <p><strong>Duration:</strong> ${movieData.duration} minutes</p>
    <p>${movieData.description}</p>
    ${movieData.downloadLink ? `<p><a href="${movieData.downloadLink}" class="download-link">Download Movie</a></p>` : ''}
  </div>
</div>
<style>
.embed-container {
  position: relative;
  padding-bottom: 56.25%;
  height: 0;
  overflow: hidden;
  max-width: 100%;
}
.embed-container iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
.download-link {
  display: inline-block;
  background: #007cba;
  color: white;
  padding: 10px 20px;
  text-decoration: none;
  border-radius: 5px;
  margin-top: 10px;
}
</style>
  `.trim();
};

// NEW: Display function for admin panel
export const displayMovieResult = (movieData) => {
  if (!movieData || !movieData.success) {
    return `
    <div style="padding: 15px; background: #fee; border: 1px solid #fcc; border-radius: 5px; color: #c00;">
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
  </div>
  `;
};

// Test function - FIXED
export const testMovieFetch = async () => {
  console.log('Testing movie fetch...');
  
  const testResult = await fetchMovieData('tt3896198');
  console.log('Test result:', testResult);
  
  if (testResult.success) {
    console.log('✅ Year in title:', testResult.data.titleWithYear);
    console.log('✅ 16:9 Image:', testResult.data.backdrop ? 'Available' : 'Not available');
  }
  
  return testResult;
};

// Simple usage
export const setupMovieFetcher = (inputId, displayId) => {
  const inputElement = document.getElementById(inputId);
  const displayElement = document.getElementById(displayId);
  
  if (inputElement && displayElement) {
    inputElement.addEventListener('change', async (e) => {
      const identifier = e.target.value.trim();
      if (!identifier) return;
      
      displayElement.innerHTML = '<div style="padding: 20px; text-align: center;">Fetching movie data...</div>';
      
      const result = await fetchMovieData(identifier);
      displayElement.innerHTML = displayMovieResult(result);
    });
  }
};
