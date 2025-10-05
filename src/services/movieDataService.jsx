// Movie Data Fetcher Service - Working Version
const TMDB_API_KEY = 'your_tmdb_api_key_here'; // Still need to get from https://www.themoviedb.org/settings/api
const OMDB_API_KEY = '53cca1db'; // Your OMDB API key

export const fetchMovieData = async (identifier) => {
  try {
    console.log('Fetching movie data for:', identifier);
    
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

// Fetch movie by IMDb ID - USING YOUR OMDB API KEY
const fetchMovieByIMDb = async (imdbId) => {
  try {
    // First try OMDB API with your key (most reliable for IMDb IDs)
    const omdbResponse = await fetch(
      `https://www.omdbapi.com/?i=${imdbId}&apikey=${OMDB_API_KEY}&plot=full`
    );
    
    if (!omdbResponse.ok) {
      throw new Error(`OMDB API error: ${omdbResponse.status}`);
    }
    
    const omdbData = await omdbResponse.json();
    
    if (omdbData.Response === 'True') {
      console.log('Found movie via OMDB:', omdbData.Title);
      return {
        success: true,
        data: formatOMDBData(omdbData),
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

// Fetch movie by TMDB ID
const fetchMovieByTMDB = async (tmdbId) => {
  try {
    // If TMDB API key is not set, fallback to OMDB search
    if (!TMDB_API_KEY || TMDB_API_KEY === 'your_tmdb_api_key_here') {
      return await searchMovieByTitle(tmdbId); // This will search by title or try OMDB
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
    // Fallback to title search
    return await searchMovieByTitle(tmdbId);
  }
};

// Search movie by title
const fetchMovieByTitle = async (title) => {
  return await searchMovieByTitle(title);
};

// Search movie by title across multiple APIs
const searchMovieByTitle = async (title) => {
  try {
    // First try OMDB with your API key (most reliable)
    const omdbResponse = await fetch(
      `https://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=${OMDB_API_KEY}&plot=full`
    );
    
    if (!omdbResponse.ok) {
      throw new Error(`OMDB API error: ${omdbResponse.status}`);
    }
    
    const omdbData = await omdbResponse.json();
    
    if (omdbData.Response === 'True') {
      console.log('Found movie via OMDB title search:', omdbData.Title);
      return {
        success: true,
        data: formatOMDBData(omdbData),
        source: 'omdb'
      };
    }
    
    // Fallback to TMDB if OMDB fails and TMDB key is available
    if (TMDB_API_KEY && TMDB_API_KEY !== 'your_tmdb_api_key_here') {
      console.log('Trying TMDB fallback for title:', title);
      const tmdbResponse = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&language=en-US&page=1&include_adult=false`
      );
      
      if (!tmdbResponse.ok) {
        throw new Error(`TMDB search error: ${tmdbResponse.status}`);
      }
      
      const tmdbData = await tmdbResponse.json();
      
      if (tmdbData.results && tmdbData.results.length > 0) {
        const movie = tmdbData.results[0];
        console.log('Found movie via TMDB:', movie.title);
        // Get full movie details
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

// Format OMDB data to our schema - ENHANCED
const formatOMDBData = (data) => {
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
    title: data.Title || '',
    originalTitle: data.Title || '',
    description: data.Plot || '',
    genre: data.Genre?.split(', ')[0] || 'Unknown',
    allGenres: data.Genre?.split(', ') || ['Unknown'],
    duration: duration,
    thumbnail: data.Poster !== 'N/A' ? data.Poster : '',
    year: year,
    rating: rating,
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
    
    // Additional fields for your post (to be filled by admin)
    downloadLink: '',
    embedCode: '',
    
    // Metadata
    source: 'omdb',
    fetchedAt: new Date().toISOString()
  };
};

// Format TMDB data to our schema
const formatTMDBData = (data) => {
  return {
    title: data.title || '',
    originalTitle: data.original_title || '',
    description: data.overview || '',
    genre: data.genres?.[0]?.name || 'Unknown',
    allGenres: data.genres?.map(g => g.name) || ['Unknown'],
    duration: data.runtime || 120,
    thumbnail: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : '',
    backdrop: data.backdrop_path ? `https://image.tmdb.org/t/p/w1280${data.backdrop_path}` : '',
    year: data.release_date ? new Date(data.release_date).getFullYear().toString() : '',
    rating: data.vote_average ? data.vote_average.toFixed(1) : 'N/A',
    releaseDate: data.release_date || '',
    country: data.production_countries?.map(c => c.name) || [],
    language: data.original_language || '',
    production: data.production_companies?.[0]?.name || '',
    budget: data.budget || 0,
    revenue: data.revenue || 0,
    tagline: data.tagline || '',
    status: data.status || '',
    imdbID: data.imdb_id || '',
    
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
            type: movie.Type
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
            movies: tmdbData.results.map(movie => ({
              id: movie.id,
              title: movie.title,
              year: movie.release_date ? new Date(movie.release_date).getFullYear() : 'Unknown',
              poster: movie.poster_path ? `https://image.tmdb.org/t/p/w300${movie.poster_path}` : '',
              overview: movie.overview,
              rating: movie.vote_average
            })),
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

// Generate embed code for movie
export const generateEmbedCode = (movieData, videoUrl = '') => {
  const embedUrl = videoUrl || `https://www.youtube.com/embed/dQw4w9WgXcQ`; // Default trailer
  
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
    <h3>${movieData.title} (${movieData.year})</h3>
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

// Test function to verify everything works
export const testMovieFetch = async () => {
  console.log('Testing movie fetch with your OMDB API key...');
  
  // Test with your example IMDb ID
  const testResult = await fetchMovieData('tt3896198');
  console.log('Test result:', testResult);
  
  return testResult;
};
