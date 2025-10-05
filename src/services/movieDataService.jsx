// Enhanced Movie Data Fetcher with Year in Title & 16:9 Images
const TMDB_API_KEY = 'your_tmdb_api_key_here'; // Get from https://www.themoviedb.org/settings/api
const OMDB_API_KEY = '53cca1db'; // Your OMDB API key

export const fetchMovieData = async (identifier) => {
  try {
    console.log('Fetching movie data for:', identifier);
    
    // Clean the identifier
    identifier = identifier.trim();
    
    // Extract year from identifier if present (e.g., "Kantara 2025" or "Kantara (2025)")
    const { cleanIdentifier, year } = extractYearFromTitle(identifier);
    
    // Check if it's an IMDb ID (starts with tt)
    if (cleanIdentifier.startsWith('tt')) {
      return await fetchMovieByIMDb(cleanIdentifier);
    }
    
    // Check if it's a TMDB ID (numeric)
    if (/^\d+$/.test(cleanIdentifier)) {
      return await fetchMovieByTMDB(cleanIdentifier);
    }
    
    // Otherwise treat it as a movie title with year
    return await fetchMovieByTitle(cleanIdentifier, year);
    
  } catch (error) {
    console.error('Error fetching movie data:', error);
    return { 
      success: false, 
      error: error.message,
      data: null
    };
  }
};

// Extract year from movie title
const extractYearFromTitle = (title) => {
  // Patterns: "Movie Name 2025", "Movie Name (2025)", "2025 Movie Name"
  const yearMatch = title.match(/(\d{4})/);
  const hasYearInParentheses = title.match(/\((\d{4})\)/);
  
  let year = null;
  let cleanTitle = title;
  
  if (hasYearInParentheses) {
    year = hasYearInParentheses[1];
    cleanTitle = title.replace(/\(\d{4}\)/, '').trim();
  } else if (yearMatch) {
    year = yearMatch[1];
    // Check if year is at the end (most common)
    if (title.endsWith(year)) {
      cleanTitle = title.replace(year, '').trim();
    } else if (title.startsWith(year)) {
      cleanTitle = title.replace(year, '').trim();
    }
  }
  
  return { cleanIdentifier: cleanTitle, year };
};

// Fetch movie by IMDb ID - ENHANCED
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
      
      // Try to get 16:9 backdrop from TMDB
      const backdropImage = await fetchTMDBBackdrop(omdbData.Title, omdbData.Year);
      
      return {
        success: true,
        data: formatOMDBData(omdbData, backdropImage),
        source: 'omdb'
      };
    }
    
    // Fallback to TMDB if OMDB fails
    if (TMDB_API_KEY && TMDB_API_KEY !== 'your_tmdb_api_key_here') {
      console.log('Trying TMDB fallback for IMDb ID:', imdbId);
      const tmdbResponse = await fetch(
        `https://api.themoviedb.org/3/find/${imdbId}?api_key=${TMDB_API_KEY}&language=en-US&external_source=imdb_id`
      );
      
      if (tmdbResponse.ok) {
        const tmdbData = await tmdbResponse.json();
        
        if (tmdbData.movie_results && tmdbData.movie_results.length > 0) {
          const movieId = tmdbData.movie_results[0].id;
          return await fetchMovieByTMDB(movieId);
        }
      }
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

// Fetch movie by TMDB ID - ENHANCED
const fetchMovieByTMDB = async (tmdbId) => {
  try {
    // If TMDB API key is not set, fallback to OMDB search
    if (!TMDB_API_KEY || TMDB_API_KEY === 'your_tmdb_api_key_here') {
      return await searchMovieByTitle(tmdbId);
    }
    
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=en-US&append_to_response=videos,credits,images`
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

// Search movie by title - ENHANCED with year parameter
const fetchMovieByTitle = async (title, year = null) => {
  return await searchMovieByTitle(title, year);
};

// Search movie by title across multiple APIs - ENHANCED
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
      
      // Try to get 16:9 backdrop from TMDB
      const backdropImage = await fetchTMDBBackdrop(omdbData.Title, omdbData.Year);
      
      return {
        success: true,
        data: formatOMDBData(omdbData, backdropImage),
        source: 'omdb'
      };
    }
    
    // Fallback to TMDB if OMDB fails
    if (TMDB_API_KEY && TMDB_API_KEY !== 'your_tmdb_api_key_here') {
      console.log('Trying TMDB fallback for title:', title);
      let tmdbUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&language=en-US&page=1&include_adult=false`;
      if (year) {
        tmdbUrl += `&year=${year}`;
      }
      
      const tmdbResponse = await fetch(tmdbUrl);
      
      if (!tmdbResponse.ok) {
        throw new Error(`TMDB search error: ${tmdbResponse.status}`);
      }
      
      const tmdbData = await tmdbResponse.json();
      
      if (tmdbData.results && tmdbData.results.length > 0) {
        const movie = tmdbData.results[0];
        console.log('Found movie via TMDB:', movie.title);
        return await fetchMovieByTMDB(movie.id);
      }
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

// Fetch 16:9 backdrop image from TMDB
const fetchTMDBBackdrop = async (title, year) => {
  try {
    if (!TMDB_API_KEY || TMDB_API_KEY === 'your_tmdb_api_key_here') return '';
    
    let searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&language=en-US&page=1`;
    if (year) {
      searchUrl += `&year=${year}`;
    }
    
    const searchResponse = await fetch(searchUrl);
    
    if (!searchResponse.ok) return '';
    
    const searchData = await searchResponse.json();
    
    if (searchData.results && searchData.results.length > 0) {
      const movie = searchData.results[0];
      if (movie.backdrop_path) {
        // Return 16:9 backdrop image (w1280 is typically 16:9 aspect ratio)
        return `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`;
      }
    }
    
    return '';
  } catch (error) {
    console.error('Error fetching TMDB backdrop:', error);
    return '';
  }
};

// Format OMDB data to our schema - ENHANCED with year in title
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

  return {
    // ENHANCED: Multiple title formats with year
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
    
    // ENHANCED: 16:9 image support
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
    
    // Quality options (like your screenshot)
    qualities: ['480p', '720p', '1080p'],
    
    // Additional fields for your post
    downloadLink: '',
    embedCode: '',
    
    // Metadata
    source: 'omdb',
    fetchedAt: new Date().toISOString()
  };
};

// Format TMDB data to our schema - ENHANCED with year in title
const formatTMDBData = (data) => {
  const year = data.release_date ? new Date(data.release_date).getFullYear().toString() : '';

  return {
    // ENHANCED: Multiple title formats with year
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
    
    // ENHANCED: 16:9 image support
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

// Get movie trailer from TMDB
export const fetchMovieTrailer = async (tmdbId) => {
  try {
    if (!TMDB_API_KEY || TMDB_API_KEY === 'your_tmdb_api_key_here') {
      return null;
    }
    
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${tmdbId}/videos?api_key=${TMDB_API_KEY}&language=en-US`
    );
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const trailer = data.results.find(video => 
        video.type === 'Trailer' && video.site === 'YouTube' && video.official
      ) || data.results.find(video => 
        video.type === 'Trailer' && video.site === 'YouTube'
      );
      
      if (trailer) {
        return `https://www.youtube.com/embed/${trailer.key}`;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching trailer:', error);
    return null;
  }
};

// Search multiple movies
export const searchMovies = async (query) => {
  try {
    // Try OMDB first since we have a working API key
    const omdbResponse = await fetch(
      `https://www.omdbapi.com/?s=${encodeURIComponent(query)}&apikey=${OMDB_API_KEY}&type=movie`
    );
    
    if (omdbResponse.ok) {
      const omdbData = await omdbResponse.json();
      
      if (omdbData.Response === 'True' && omdbData.Search) {
        return {
          success: true,
          movies: omdbData.Search.map(movie => ({
            id: movie.imdbID,
            title: movie.Title,
            year: movie.Year,
            poster: movie.Poster !== 'N/A' ? movie.Poster : '',
            type: movie.Type,
            // ENHANCED: Include title with year
            titleWithYear: `${movie.Title} (${movie.Year})`
          })),
          source: 'omdb'
        };
      }
    }
    
    // Fallback to TMDB
    if (TMDB_API_KEY && TMDB_API_KEY !== 'your_tmdb_api_key_here') {
      const tmdbResponse = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=en-US&page=1&include_adult=false`
      );
      
      if (tmdbResponse.ok) {
        const tmdbData = await tmdbResponse.json();
        
        if (tmdbData.results && tmdbData.results.length > 0) {
          return {
            success: true,
            movies: tmdbData.results.map(movie => {
              const year = movie.release_date ? new Date(movie.release_date).getFullYear() : 'Unknown';
              return {
                id: movie.id,
                title: movie.title,
                year: year,
                poster: movie.poster_path ? `https://image.tmdb.org/t/p/w300${movie.poster_path}` : '',
                overview: movie.overview,
                rating: movie.vote_average,
                // ENHANCED: Include title with year and backdrop
                titleWithYear: `${movie.title} (${year})`,
                backdrop: movie.backdrop_path ? `https://image.tmdb.org/t/p/w780${movie.backdrop_path}` : ''
              };
            }),
            source: 'tmdb'
          };
        }
      }
    }
    
    return {
      success: false,
      error: 'No movies found',
      movies: []
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      movies: []
    };
  }
};

// ENHANCED: Generate display HTML with year in title and 16:9 images
export const generateMovieDisplayHTML = (movieData) => {
  if (!movieData || !movieData.success) {
    return '<div class="movie-error">Movie data not available</div>';
  }
  
  const data = movieData.data;
  const imageUrl = data.backdrop || data.thumbnail; // Prefer 16:9 backdrop
  
  return `
<div class="movie-card">
  <div class="movie-header">
    <h2 class="movie-title">${data.titleWithYear}</h2>
    <span class="movie-quality">HD</span>
  </div>
  
  <div class="movie-content">
    ${imageUrl ? `
    <div class="movie-image">
      <img src="${imageUrl}" alt="${data.title}" loading="lazy" 
           style="width: 100%; height: 225px; object-fit: cover; border-radius: 8px;" />
      <div class="image-aspect">16:9</div>
    </div>
    ` : ''}
    
    <div class="movie-details">
      <div class="movie-meta">
        <span class="rating">⭐ ${data.rating}/10</span>
        <span class="duration">⏱ ${data.duration} min</span>
        <span class="genre">🎬 ${data.genre}</span>
      </div>
      
      <p class="movie-description">${data.description || 'No description available.'}</p>
      
      <div class="download-options">
        <h4>Download Quality:</h4>
        <div class="quality-buttons">
          ${data.qualities.map(quality => `
            <button class="quality-btn" data-quality="${quality}">${quality}</button>
          `).join('')}
        </div>
      </div>
      
      ${data.downloadLink ? `
      <div class="direct-download">
        <a href="${data.downloadLink}" class="download-link">📥 Direct Download</a>
      </div>
      ` : ''}
    </div>
  </div>
  
  <div class="movie-footer">
    <div class="movie-info">
      <strong>Release Date:</strong> ${data.releaseDate || 'N/A'} | 
      <strong>Language:</strong> ${data.language || 'N/A'} | 
      <strong>Country:</strong> ${data.country?.[0] || 'N/A'}
    </div>
  </div>
</div>

<style>
.movie-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  margin: 20px 0;
  background: white;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.movie-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
  background: #f8f9fa;
}

.movie-title {
  margin: 0;
  font-size: 1.4em;
  color: #333;
  flex: 1;
}

.movie-quality {
  background: #007cba;
  color: white;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 0.9em;
  font-weight: bold;
}

.movie-content {
  display: flex;
  padding: 20px;
  gap: 20px;
}

.movie-image {
  flex: 0 0 400px;
  position: relative;
}

.movie-image img {
  width: 100%;
  height: 225px; /* 16:9 aspect ratio (400x225) */
  object-fit: cover;
  border-radius: 6px;
}

.image-aspect {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0,0,0,0.7);
  color: white;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.8em;
}

.movie-details {
  flex: 1;
}

.movie-meta {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.movie-meta span {
  background: #f1f3f4;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 0.9em;
}

.movie-description {
  line-height: 1.6;
  color: #555;
  margin-bottom: 20px;
}

.download-options h4 {
  margin-bottom: 10px;
  color: #333;
}

.quality-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.quality-btn {
  background: #28a745;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.quality-btn:hover {
  background: #218838;
}

.download-link {
  display: inline-block;
  background: #dc3545;
  color: white;
  padding: 10px 20px;
  text-decoration: none;
  border-radius: 5px;
  font-weight: bold;
  margin-top: 10px;
}

.download-link:hover {
  background: #c82333;
}

.movie-footer {
  padding: 15px 20px;
  border-top: 1px solid #eee;
  background: #f8f9fa;
  font-size: 0.9em;
  color: #666;
}

@media (max-width: 768px) {
  .movie-content {
    flex-direction: column;
  }
  
  .movie-image {
    flex: none;
  }
}
</style>
  `.trim();
};

// Test function to verify enhancements
export const testEnhancedFetch = async () => {
  console.log('Testing enhanced movie fetch...');
  
  // Test cases with years in titles
  const testCases = [
    'tt3896198', // IMDb ID
    'Kantara 2025', // Title with year
    'Avengers Endgame (2019)', // Title with year in parentheses
    '2025 Kantara' // Year at beginning
  ];
  
  for (const testCase of testCases) {
    console.log(`Testing: ${testCase}`);
    const result = await fetchMovieData(testCase);
    if (result.success) {
      console.log('✓ Success:', result.data.titleWithYear);
      console.log('  16:9 Image:', result.data.backdrop ? 'Available' : 'Not available');
    } else {
      console.log('✗ Failed:', result.error);
    }
  }
};

// Generate embed code for movie - ENHANCED
export const generateEmbedCode = (movieData, videoUrl = '') => {
  const embedUrl = videoUrl || `https://www.youtube.com/embed/dQw4w9WgXcQ`;
  
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
    <h3>${movieData.titleWithYear}</h3>
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
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
  height: 0;
  overflow: hidden;
  max-width: 100%;
  border-radius: 8px;
}
.embed-container iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
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
