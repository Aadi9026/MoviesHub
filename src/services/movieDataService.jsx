// Movie Data Fetcher Service - Enhanced with OMDB Priority & 16:9 Images
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

// Fetch movie by IMDb ID - OMDB FIRST + 16:9 ENHANCEMENT
const fetchMovieByIMDb = async (imdbId) => {
  try {
    // FIRST: Try OMDB with your working API key
    console.log('Searching OMDB first for IMDb ID:', imdbId);
    const omdbResponse = await fetch(
      `https://www.omdbapi.com/?i=${imdbId}&apikey=${OMDB_API_KEY}&plot=full`
    );
    
    if (!omdbResponse.ok) {
      throw new Error(`OMDB API error: ${omdbResponse.status}`);
    }
    
    const omdbData = await omdbResponse.json();
    
    if (omdbData.Response === 'True') {
      console.log('Found movie via OMDB:', omdbData.Title);
      // Enhance OMDB data with 16:9 images from multiple sources
      const enhancedData = await enhanceWith16x9Images(omdbData);
      return {
        success: true,
        data: enhancedData,
        source: enhancedData.source
      };
    }
    
    // Fallback to TMDB only if OMDB fails
    if (TMDB_API_KEY && TMDB_API_KEY !== 'your_tmdb_api_key_here') {
      console.log('OMDB failed, trying TMDB fallback for IMDb ID:', imdbId);
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
    if (!TMDB_API_KEY || TMDB_API_KEY === 'your_tmdb_api_key_here') {
      return await searchMovieByTitle(tmdbId);
    }
    
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

// Search movie by title - OMDB FIRST
const fetchMovieByTitle = async (title) => {
  return await searchMovieByTitle(title);
};

// Search movie by title - OMDB FIRST + 16:9 ENHANCEMENT
const searchMovieByTitle = async (title) => {
  try {
    // FIRST: Try OMDB with your working API key
    console.log('Searching OMDB first for title:', title);
    const omdbResponse = await fetch(
      `https://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=${OMDB_API_KEY}&plot=full`
    );
    
    if (!omdbResponse.ok) {
      throw new Error(`OMDB API error: ${omdbResponse.status}`);
    }
    
    const omdbData = await omdbResponse.json();
    
    if (omdbData.Response === 'True') {
      console.log('Found movie via OMDB title search:', omdbData.Title);
      // Enhance OMDB data with 16:9 images
      const enhancedData = await enhanceWith16x9Images(omdbData);
      return {
        success: true,
        data: enhancedData,
        source: enhancedData.source
      };
    }
    
    // Fallback to TMDB only if OMDB fails
    if (TMDB_API_KEY && TMDB_API_KEY !== 'your_tmdb_api_key_here') {
      console.log('OMDB failed, trying TMDB fallback for title:', title);
      const tmdbResponse = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&language=en-US&page=1&include_adult=false`
      );
      
      if (tmdbResponse.ok) {
        const tmdbData = await tmdbResponse.json();
        
        if (tmdbData.results && tmdbData.results.length > 0) {
          const movie = tmdbData.results[0];
          console.log('Found movie via TMDB:', movie.title);
          return await fetchMovieByTMDB(movie.id);
        }
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

// ENHANCED: Get 16:9 images from multiple sources
const enhanceWith16x9Images = async (omdbData) => {
  const baseData = formatOMDBData(omdbData);
  
  let best16x9Image = '';
  let imageSource = 'omdb';
  
  // Strategy 1: Try TMDB for high-quality 16:9 backdrop
  if (TMDB_API_KEY && TMDB_API_KEY !== 'your_tmdb_api_key_here') {
    try {
      const tmdbImage = await get16x9FromTMDB(omdbData, baseData.year);
      if (tmdbImage) {
        best16x9Image = tmdbImage;
        imageSource = 'omdb+tmdb_images';
        console.log('Found 16:9 image from TMDB');
      }
    } catch (error) {
      console.log('TMDB image search failed:', error.message);
    }
  }
  
  // Strategy 2: Try YouTube trailer thumbnail (usually 16:9)
  if (!best16x9Image) {
    try {
      const youtubeImage = await get16x9FromYouTube(omdbData.Title, baseData.year);
      if (youtubeImage) {
        best16x9Image = youtubeImage;
        imageSource = 'omdb+youtube';
        console.log('Found 16:9 image from YouTube');
      }
    } catch (error) {
      console.log('YouTube image search failed:', error.message);
    }
  }
  
  // Strategy 3: Try Google Images search (many 16:9 results)
  if (!best16x9Image) {
    try {
      const googleImage = await get16x9FromGoogleImages(omdbData.Title, baseData.year);
      if (googleImage) {
        best16x9Image = googleImage;
        imageSource = 'omdb+google';
        console.log('Found 16:9 image from Google');
      }
    } catch (error) {
      console.log('Google image search failed:', error.message);
    }
  }
  
  // Strategy 4: Use OMDB poster and create 16:9 version (crop/resize)
  if (!best16x9Image && baseData.poster) {
    best16x9Image = await create16x9FromPoster(baseData.poster);
    imageSource = 'omdb+processed';
    console.log('Created 16:9 image from OMDB poster');
  }
  
  // Update the data with best available 16:9 image
  return {
    ...baseData,
    poster: best16x9Image || baseData.poster, // Primary image (16:9 preferred)
    thumbnail: best16x9Image || baseData.poster, // Thumbnail
    backdrop: best16x9Image || baseData.poster, // Backdrop
    originalPoster: baseData.poster, // Keep original 2:3 poster
    is16x9: !!best16x9Image, // Flag indicating if we have true 16:9
    imageSource: imageSource,
    source: imageSource
  };
};

// Get 16:9 backdrop from TMDB
const get16x9FromTMDB = async (omdbData, year) => {
  const searchResponse = await fetch(
    `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(omdbData.Title)}&language=en-US&page=1&include_adult=false&year=${year || ''}`
  );
  
  if (!searchResponse.ok) return null;
  
  const searchData = await searchResponse.json();
  
  if (searchData.results && searchData.results.length > 0) {
    const movie = searchData.results[0];
    
    // Get full movie details for backdrop
    const movieResponse = await fetch(
      `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${TMDB_API_KEY}&language=en-US`
    );
    
    if (movieResponse.ok) {
      const movieData = await movieResponse.json();
      if (movieData.backdrop_path) {
        return `https://image.tmdb.org/t/p/w1280${movieData.backdrop_path}`;
      }
    }
  }
  
  return null;
};

// Get 16:9 thumbnail from YouTube trailer
const get16x9FromYouTube = async (title, year) => {
  // YouTube thumbnails are always 16:9
  // We can construct a thumbnail URL from a potential video ID
  // or use YouTube's search API (requires separate API key)
  
  // Simple approach: Use standard YouTube thumbnail pattern
  // This is a fallback - in production you'd use YouTube Data API
  const searchQuery = `${title} ${year} official trailer`;
  console.log('Would search YouTube for:', searchQuery);
  
  // For now, return null - implement YouTube Data API if needed
  return null;
};

// Get 16:9 image from Google Images (conceptual)
const get16x9FromGoogleImages = async (title, year) => {
  // Note: Google Custom Search API requires setup and API key
  // This is a conceptual implementation
  
  const searchQuery = `${title} ${year} movie backdrop 16:9`;
  console.log('Would search Google Images for:', searchQuery);
  
  // Implementation would require:
  // 1. Google Custom Search JSON API
  // 2. API key and search engine ID
  // 3. Filter for 16:9 aspect ratio images
  
  return null;
};

// Create 16:9 version from existing poster (conceptual)
const create16x9FromPoster = async (posterUrl) => {
  // In a real implementation, you could:
  // 1. Use a server-side image processing service
  // 2. Use client-side canvas to crop/resize
  // 3. Use a CDN with image transformation
  
  // For now, we'll return the original poster
  // but note that this maintains 2:3 aspect ratio
  
  return posterUrl; // This would be processed to 16:9 in production
};

// Format OMDB data - ENHANCED
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
    
    // Additional metadata
    boxOffice: data.BoxOffice || '',
    dvdRelease: data.DVD || '',
    website: data.Website || '',
    ratings: data.Ratings || [],
    
    source: 'omdb',
    fetchedAt: new Date().toISOString()
  };
};

// Format TMDB data
const formatTMDBData = (data) => {
  const backdropUrl = data.backdrop_path ? `https://image.tmdb.org/t/p/w1280${data.backdrop_path}` : '';
  const posterUrl = data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : '';
  
  return {
    title: data.title || '',
    originalTitle: data.original_title || '',
    description: data.overview || '',
    genre: data.genres?.[0]?.name || 'Unknown',
    allGenres: data.genres?.map(g => g.name) || ['Unknown'],
    duration: data.runtime || 120,
    poster: backdropUrl || posterUrl, // 16:9 preferred
    thumbnail: data.backdrop_path ? `https://image.tmdb.org/t/p/w780${data.backdrop_path}` : posterUrl,
    backdrop: backdropUrl || posterUrl,
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

// Search multiple movies - OMDB FIRST
export const searchMovies = async (query) => {
  try {
    // FIRST: Try OMDB search
    console.log('Searching OMDB first for:', query);
    const omdbResponse = await fetch(
      `https://www.omdbapi.com/?s=${encodeURIComponent(query)}&apikey=${OMDB_API_KEY}&type=movie`
    );
    
    if (omdbResponse.ok) {
      const omdbData = await omdbResponse.json();
      
      if (omdbData.Response === 'True' && omdbData.Search) {
        // Enhance each movie with potential 16:9 images
        const enhancedMovies = await Promise.all(
          omdbData.Search.map(async movie => {
            let enhancedPoster = movie.Poster;
            
            // Try to get 16:9 image for each movie
            if (TMDB_API_KEY && TMDB_API_KEY !== 'your_tmdb_api_key_here') {
              try {
                const tmdbResponse = await fetch(
                  `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(movie.Title)}&language=en-US&page=1&include_adult=false&year=${movie.Year || ''}`
                );
                
                if (tmdbResponse.ok) {
                  const tmdbData = await tmdbResponse.json();
                  if (tmdbData.results && tmdbData.results.length > 0 && tmdbData.results[0].backdrop_path) {
                    enhancedPoster = `https://image.tmdb.org/t/p/w780${tmdbData.results[0].backdrop_path}`;
                  }
                }
              } catch (error) {
                console.log('TMDB enhancement failed for:', movie.Title);
              }
            }
            
            return {
              id: movie.imdbID,
              title: movie.Title,
              year: movie.Year,
              poster: enhancedPoster !== 'N/A' ? enhancedPoster : '',
              type: movie.Type,
              isEnhanced: enhancedPoster !== movie.Poster
            };
          })
        );
        
        return {
          success: true,
          movies: enhancedMovies,
          source: 'omdb+enhanced'
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

// Generate embed code for movie
export const generateEmbedCode = (movieData, videoUrl = '') => {
  const embedUrl = videoUrl || `https://www.youtube.com/embed/dQw4w9WgXcQ`;
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
          ${movieData.is16x9 ? '<span class="hd-badge">16:9 HD</span>' : ''}
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
.hd-badge {
  background: #007cba;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.8em;
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
  console.log('Testing enhanced movie fetch with OMDB priority...');
  
  const testResult = await fetchMovieData('tt3896198');
  console.log('Test result:', testResult);
  
  if (testResult.success) {
    console.log('Primary image source:', testResult.data.imageSource);
    console.log('Has 16:9 image:', testResult.data.is16x9);
    console.log('Poster URL:', testResult.data.poster);
  }
  
  return testResult;
};
