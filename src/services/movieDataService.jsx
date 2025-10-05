// Movie Data Fetcher Service - True 16:9 Poster Images
const TMDB_API_KEY = '3aad529c86f3fd8fb8ac9fb059421be5';
const OMDB_API_KEY = '53cca1db';

export const fetchMovieData = async (identifier) => {
  try {
    console.log('Fetching movie data for:', identifier);
    
    identifier = identifier.trim();
    
    if (identifier.startsWith('tt')) {
      return await fetchMovieByIMDb(identifier);
    }
    
    if (/^\d+$/.test(identifier)) {
      return await fetchMovieByTMDB(identifier);
    }
    
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

// Fetch movie by IMDb ID - ENHANCED FOR 16:9 POSTERS
const fetchMovieByIMDb = async (imdbId) => {
  try {
    // ALWAYS try TMDB first for 16:9 images
    if (TMDB_API_KEY && TMDB_API_KEY !== 'your_tmdb_api_key_here') {
      console.log('Searching TMDB for IMDb ID to get 16:9 posters:', imdbId);
      const tmdbResponse = await fetch(
        `https://api.themoviedb.org/3/find/${imdbId}?api_key=${TMDB_API_KEY}&language=en-US&external_source=imdb_id`
      );
      
      if (tmdbResponse.ok) {
        const tmdbData = await tmdbResponse.json();
        
        if (tmdbData.movie_results && tmdbData.movie_results.length > 0) {
          const movieId = tmdbData.movie_results[0].id;
          console.log('Found movie on TMDB with ID:', movieId);
          const result = await fetchMovieByTMDB(movieId);
          if (result.success) {
            return result;
          }
        }
      }
    }
    
    // Fallback to OMDB only if TMDB fails
    console.log('TMDB failed, falling back to OMDB for:', imdbId);
    const omdbResponse = await fetch(
      `https://www.omdbapi.com/?i=${imdbId}&apikey=${OMDB_API_KEY}&plot=full`
    );
    
    if (!omdbResponse.ok) {
      throw new Error(`OMDB API error: ${omdbResponse.status}`);
    }
    
    const omdbData = await omdbResponse.json();
    
    if (omdbData.Response === 'True') {
      console.log('Found movie via OMDB:', omdbData.Title);
      // Try to enhance OMDB data with TMDB images
      const enhancedData = await enhanceOMDBWithTMDBImages(omdbData);
      return {
        success: true,
        data: enhancedData,
        source: 'omdb+tmdb'
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

// Fetch movie by TMDB ID - OPTIMIZED FOR 16:9 POSTERS
const fetchMovieByTMDB = async (tmdbId) => {
  try {
    if (!TMDB_API_KEY || TMDB_API_KEY === 'your_tmdb_api_key_here') {
      return await searchMovieByTitle(tmdbId);
    }
    
    // Get full movie details with images
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=en-US&append_to_response=images`
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
        data: formatTMDBDataWith16x9Posters(data),
        source: 'tmdb'
      };
    }
    
    throw new Error('Movie not found on TMDB');
  } catch (error) {
    console.error('Error in fetchMovieByTMDB:', error);
    return await searchMovieByTitle(tmdbId);
  }
};

// Search movie by title - PRIORITIZE 16:9 IMAGES
const fetchMovieByTitle = async (title) => {
  return await searchMovieByTitle(title);
};

// Search movie by title - TMDB FIRST FOR 16:9
const searchMovieByTitle = async (title) => {
  try {
    // ALWAYS try TMDB first for 16:9 images
    if (TMDB_API_KEY && TMDB_API_KEY !== 'your_tmdb_api_key_here') {
      console.log('Searching TMDB for title to get 16:9 posters:', title);
      const tmdbResponse = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&language=en-US&page=1&include_adult=false`
      );
      
      if (tmdbResponse.ok) {
        const tmdbData = await tmdbResponse.json();
        
        if (tmdbData.results && tmdbData.results.length > 0) {
          const movie = tmdbData.results[0];
          console.log('Found movie via TMDB:', movie.title);
          const result = await fetchMovieByTMDB(movie.id);
          if (result.success) {
            return result;
          }
        }
      }
    }
    
    // Only use OMDB as last resort
    console.log('TMDB failed, falling back to OMDB for:', title);
    const omdbResponse = await fetch(
      `https://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=${OMDB_API_KEY}&plot=full`
    );
    
    if (!omdbResponse.ok) {
      throw new Error(`OMDB API error: ${omdbResponse.status}`);
    }
    
    const omdbData = await omdbResponse.json();
    
    if (omdbData.Response === 'True') {
      console.log('Found movie via OMDB title search:', omdbData.Title);
      const enhancedData = await enhanceOMDBWithTMDBImages(omdbData);
      return {
        success: true,
        data: enhancedData,
        source: 'omdb+tmdb'
      };
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

// Enhance OMDB data with TMDB 16:9 images
const enhanceOMDBWithTMDBImages = async (omdbData) => {
  const baseData = formatOMDBData(omdbData);
  
  // Try to find this movie on TMDB to get 16:9 images
  if (TMDB_API_KEY && TMDB_API_KEY !== 'your_tmdb_api_key_here') {
    try {
      const searchResponse = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(omdbData.Title)}&language=en-US&page=1&include_adult=false&year=${baseData.year || ''}`
      );
      
      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        
        if (searchData.results && searchData.results.length > 0) {
          const movie = searchData.results[0];
          
          // Get full movie details for images
          const movieResponse = await fetch(
            `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${TMDB_API_KEY}&language=en-US&append_to_response=images`
          );
          
          if (movieResponse.ok) {
            const movieData = await movieResponse.json();
            return mergeOMDBWithTMDBImages(baseData, movieData);
          }
        }
      }
    } catch (error) {
      console.log('Could not enhance OMDB data with TMDB images:', error.message);
    }
  }
  
  return baseData;
};

// Merge OMDB data with TMDB 16:9 images
const mergeOMDBWithTMDBImages = (omdbData, tmdbData) => {
  const backdropUrl = tmdbData.backdrop_path ? `https://image.tmdb.org/t/p/w1280${tmdbData.backdrop_path}` : '';
  const posterUrl = tmdbData.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}` : '';
  
  // Use backdrop as 16:9 poster, keep original poster as thumbnail
  return {
    ...omdbData,
    // Primary image - using 16:9 backdrop as "poster"
    poster: backdropUrl || posterUrl || omdbData.poster,
    // Thumbnail - smaller version for previews
    thumbnail: backdropUrl ? `https://image.tmdb.org/t/p/w780${tmdbData.backdrop_path}` : omdbData.thumbnail,
    // Backdrop - full 16:9 image
    backdrop: backdropUrl || omdbData.poster,
    // Original poster if needed
    originalPoster: posterUrl || omdbData.poster,
    // Additional TMDB data if available
    tmdbId: tmdbData.id,
    tagline: tmdbData.tagline || omdbData.tagline,
    budget: tmdbData.budget || omdbData.budget,
    revenue: tmdbData.revenue || omdbData.revenue,
    source: 'omdb+tmdb'
  };
};

// Format OMDB data
const formatOMDBData = (data) => {
  let year = data.Year || '';
  if (year.includes('–')) {
    year = year.split('–')[0];
  }
  year = year.replace(/[^0-9]/g, '');
  
  let duration = 120;
  if (data.Runtime && data.Runtime !== 'N/A') {
    const runtimeMatch = data.Runtime.match(/(\d+)/);
    duration = runtimeMatch ? parseInt(runtimeMatch[1]) : 120;
  }
  
  let rating = 'N/A';
  if (data.imdbRating && data.imdbRating !== 'N/A') {
    rating = parseFloat(data.imdbRating).toFixed(1);
  }

  const poster = data.Poster !== 'N/A' ? data.Poster : '';
  
  return {
    title: data.Title || '',
    originalTitle: data.Title || '',
    description: data.Plot || '',
    genre: data.Genre?.split(', ')[0] || 'Unknown',
    allGenres: data.Genre?.split(', ') || ['Unknown'],
    duration: duration,
    // For OMDB-only data, we use poster for everything (not ideal but best we can do)
    poster: poster,
    thumbnail: poster,
    backdrop: poster,
    originalPoster: poster,
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
    
    downloadLink: '',
    embedCode: '',
    
    source: 'omdb',
    fetchedAt: new Date().toISOString()
  };
};

// Format TMDB data with TRUE 16:9 POSTERS
const formatTMDBDataWith16x9Posters = (data) => {
  const backdropUrl = data.backdrop_path ? `https://image.tmdb.org/t/p/w1280${data.backdrop_path}` : '';
  const posterUrl = data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : '';
  
  return {
    title: data.title || '',
    originalTitle: data.original_title || '',
    description: data.overview || '',
    genre: data.genres?.[0]?.name || 'Unknown',
    allGenres: data.genres?.map(g => g.name) || ['Unknown'],
    duration: data.runtime || 120,
    // PRIMARY IMAGE: Use 16:9 backdrop as poster
    poster: backdropUrl || posterUrl,
    // Thumbnail: smaller 16:9 version
    thumbnail: data.backdrop_path ? `https://image.tmdb.org/t/p/w780${data.backdrop_path}` : posterUrl,
    // Backdrop: full 16:9 image
    backdrop: backdropUrl || posterUrl,
    // Original 2:3 poster if needed
    originalPoster: posterUrl,
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
    
    downloadLink: '',
    embedCode: '',
    
    cast: data.credits?.cast?.slice(0, 5).map(actor => actor.name) || [],
    director: data.credits?.crew?.find(person => person.job === 'Director')?.name || '',
    
    source: 'tmdb',
    fetchedAt: new Date().toISOString()
  };
};

// Search multiple movies - WITH 16:9 POSTERS
export const searchMovies = async (query) => {
  try {
    // TMDB first for 16:9 images
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
              // Use 16:9 backdrop as poster for search results
              poster: movie.backdrop_path ? `https://image.tmdb.org/t/p/w780${movie.backdrop_path}` : 
                     movie.poster_path ? `https://image.tmdb.org/t/p/w300${movie.poster_path}` : '',
              backdrop: movie.backdrop_path ? `https://image.tmdb.org/t/p/w780${movie.backdrop_path}` : '',
              overview: movie.overview,
              rating: movie.vote_average
            })),
            source: 'tmdb'
          };
        }
      }
    }
    
    // OMDB fallback
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

// Generate embed code for movie - USING 16:9 POSTERS
export const generateEmbedCode = (movieData, videoUrl = '') => {
  const embedUrl = videoUrl || `https://www.youtube.com/embed/dQw4w9WgXcQ`;
  
  // Use the 16:9 poster image
  const imageUrl = movieData.poster || movieData.backdrop || movieData.thumbnail;
  
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
    <div class="movie-header">
      ${imageUrl ? `<img src="${imageUrl}" alt="${movieData.title}" class="movie-poster-16x9" />` : ''}
      <div class="movie-title-section">
        <h3>${movieData.title} (${movieData.year})</h3>
        <p class="movie-meta">
          <span class="rating">⭐ ${movieData.rating}/10</span>
          <span class="genre">${movieData.allGenres?.join(', ') || movieData.genre}</span>
          <span class="duration">⏱ ${movieData.duration} min</span>
        </p>
      </div>
    </div>
    <p class="movie-description">${movieData.description}</p>
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
  margin-bottom: 20px;
}
.embed-container iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
.movie-header {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
  align-items: flex-start;
}
.movie-poster-16x9 {
  width: 300px;
  height: 169px;
  object-fit: cover;
  border-radius: 8px;
  flex-shrink: 0;
}
.movie-title-section {
  flex: 1;
}
.movie-meta {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  margin-top: 8px;
  font-size: 0.9em;
  color: #666;
}
.movie-description {
  line-height: 1.5;
  margin-bottom: 15px;
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
@media (max-width: 768px) {
  .movie-header {
    flex-direction: column;
  }
  .movie-poster-16x9 {
    width: 100%;
    height: auto;
    max-height: 200px;
  }
}
</style>
  `.trim();
};

// Test function
export const testMovieFetch = async () => {
  console.log('Testing movie fetch with true 16:9 posters...');
  
  const testResult = await fetchMovieData('tt3896198'); // Guardians of the Galaxy
  console.log('Test result:', testResult);
  
  if (testResult.success) {
    console.log('16:9 Poster URL:', testResult.data.poster);
    console.log('Aspect ratio should be 16:9 (widescreen)');
  }
  
  return testResult;
};
