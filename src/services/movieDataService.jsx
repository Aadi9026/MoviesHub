// Movie Data Fetcher Service
const TMDB_API_KEY = 'your_tmdb_api_key_here'; // You'll need to get this from https://www.themoviedb.org/settings/api

export const fetchMovieData = async (identifier) => {
  try {
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
    return { success: false, error: error.message };
  }
};

// Fetch movie by IMDb ID
const fetchMovieByIMDb = async (imdbId) => {
  try {
    // Using OMDB API (free tier available)
    const omdbResponse = await fetch(`https://www.omdbapi.com/?i=${imdbId}&apikey=your_omdb_api_key`);
    const omdbData = await omdbResponse.json();
    
    if (omdbData.Response === 'True') {
      return {
        success: true,
        data: formatOMDBData(omdbData)
      };
    }
    
    // Fallback to TMDB search
    return await searchMovieByTitle(omdbData.Title || imdbId);
    
  } catch (error) {
    return await searchMovieByTitle(imdbId);
  }
};

// Fetch movie by TMDB ID
const fetchMovieByTMDB = async (tmdbId) => {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=en-US`
    );
    const data = await response.json();
    
    if (data.id) {
      return {
        success: true,
        data: formatTMDBData(data)
      };
    }
    
    throw new Error('Movie not found on TMDB');
  } catch (error) {
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
    // Try TMDB first
    const tmdbResponse = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&language=en-US&page=1`
    );
    const tmdbData = await tmdbResponse.json();
    
    if (tmdbData.results && tmdbData.results.length > 0) {
      const movie = tmdbData.results[0];
      // Get full movie details
      const fullDetails = await fetch(
        `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${TMDB_API_KEY}&language=en-US`
      );
      const fullData = await fullDetails.json();
      
      return {
        success: true,
        data: formatTMDBData(fullData)
      };
    }
    
    // Fallback to OMDB
    const omdbResponse = await fetch(`https://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=your_omdb_api_key`);
    const omdbData = await omdbResponse.json();
    
    if (omdbData.Response === 'True') {
      return {
        success: true,
        data: formatOMDBData(omdbData)
      };
    }
    
    return {
      success: false,
      error: 'Movie not found on any database'
    };
    
  } catch (error) {
    return {
      success: false,
      error: 'Failed to search for movie'
    };
  }
};

// Format OMDB data to our schema
const formatOMDBData = (data) => {
  return {
    title: data.Title,
    description: data.Plot,
    genre: data.Genre?.split(', ')[0] || 'Unknown',
    duration: parseInt(data.Runtime) || 120,
    thumbnail: data.Poster !== 'N/A' ? data.Poster : '',
    year: data.Year,
    rating: data.imdbRating,
    actors: data.Actors,
    director: data.Director,
    releaseDate: data.Released,
    country: data.Country,
    language: data.Language,
    production: data.Production
  };
};

// Format TMDB data to our schema
const formatTMDBData = (data) => {
  return {
    title: data.title,
    description: data.overview,
    genre: data.genres?.[0]?.name || 'Unknown',
    duration: data.runtime || 120,
    thumbnail: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : '',
    backdrop: data.backdrop_path ? `https://image.tmdb.org/t/p/w1280${data.backdrop_path}` : '',
    year: data.release_date ? new Date(data.release_date).getFullYear().toString() : '',
    rating: data.vote_average ? data.vote_average.toFixed(1) : 'N/A',
    releaseDate: data.release_date,
    country: data.production_countries?.[0]?.name || '',
    language: data.original_language,
    production: data.production_companies?.[0]?.name || '',
    budget: data.budget,
    revenue: data.revenue,
    tagline: data.tagline,
    status: data.status
  };
};

// Get movie trailer from TMDB
export const fetchMovieTrailer = async (tmdbId) => {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${tmdbId}/videos?api_key=${TMDB_API_KEY}&language=en-US`
    );
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const trailer = data.results.find(video => 
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
    const response = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=en-US&page=1&include_adult=false`
    );
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      return {
        success: true,
        movies: data.results.map(movie => ({
          id: movie.id,
          title: movie.title,
          year: movie.release_date ? new Date(movie.release_date).getFullYear() : 'Unknown',
          poster: movie.poster_path ? `https://image.tmdb.org/t/p/w300${movie.poster_path}` : '',
          overview: movie.overview,
          rating: movie.vote_average
        }))
      };
    }
    
    return {
      success: false,
      error: 'No movies found'
    };
  } catch (error) {
    return {
      success: false,
      error: 'Search failed'
    };
  }
};
