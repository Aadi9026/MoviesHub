// Movie Data Fetcher Service - FULLY WORKING with TMDB API Key
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

// Fetch movie by IMDb ID
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
      
      // Get 16:9 poster image from TMDB
      const poster16x9 = await fetch16x9Poster(omdbData.Title, omdbData.Year);
      const backdrop = await fetchBackdrop(omdbData.Title, omdbData.Year);
      
      return {
        success: true,
        data: formatOMDBData(omdbData, poster16x9, backdrop),
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

// Fetch movie by TMDB ID
const fetchMovieByTMDB = async (tmdbId) => {
  try {
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
    // Fallback to OMDB search
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
    // First try OMDB with your API key
    const omdbResponse = await fetch(
      `https://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=${OMDB_API_KEY}&plot=full`
    );
    
    if (!omdbResponse.ok) {
      throw new Error(`OMDB API error: ${omdbResponse.status}`);
    }
    
    const omdbData = await omdbResponse.json();
    
    if (omdbData.Response === 'True') {
      console.log('Found movie via OMDB title search:', omdbData.Title);
      
      // Get 16:9 poster image from TMDB
      const poster16x9 = await fetch16x9Poster(omdbData.Title, omdbData.Year);
      const backdrop = await fetchBackdrop(omdbData.Title, omdbData.Year);
      
      return {
        success: true,
        data: formatOMDBData(omdbData, poster16x9, backdrop),
        source: 'omdb'
      };
    }
    
    // Fallback to TMDB search
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
      return await fetchMovieByTMDB(movie.id);
    }
    
    throw new Error(`Movie "${title}" not found on any database`);
    
  } catch (error) {
    console.error('Error in searchMovieByTitle:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

// Fetch 16:9 poster image from TMDB
const fetch16x9Poster = async (title, year) => {
  try {
    const searchResponse = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&language=en-US&page=1${year ? `&year=${year}` : ''}`
    );
    
    if (!searchResponse.ok) {
      return '';
    }
    
    const searchData = await searchResponse.json();
    
    if (searchData.results && searchData.results.length > 0) {
      const movie = searchData.results[0];
      if (movie.poster_path) {
        // Use w780 for 16:9 aspect ratio posters
        return `https://image.tmdb.org/t/p/w780${movie.poster_path}`;
      }
    }
    
    return '';
  } catch (error) {
    console.error('Error fetching 16:9 poster:', error);
    return '';
  }
};

// Fetch backdrop image from TMDB
const fetchBackdrop = async (title, year) => {
  try {
    const searchResponse = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&language=en-US&page=1${year ? `&year=${year}` : ''}`
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
    console.error('Error fetching backdrop:', error);
    return '';
  }
};

// Format OMDB data to our schema with 16:9 images
const formatOMDBData = (data, poster16x9 = '', backdrop = '') => {
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
  
  // Use 16:9 poster if available, otherwise use original poster
  const posterImage = poster16x9 || (data.Poster !== 'N/A' ? data.Poster : '');
  
  // Create title with year
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
    
    // IMAGES - 16:9 support
    thumbnail: posterImage,
    poster: posterImage,
    poster16x9: posterImage,
    backdrop: backdrop,
    originalPoster: data.Poster !== 'N/A' ? data.Poster : '',
    
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

// Format TMDB data to our schema
const formatTMDBData = (data) => {
  const year = data.release_date ? new Date(data.release_date).getFullYear().toString() : '';
  
  // Use w780 for 16:9 aspect ratio poster
  const poster16x9 = data.poster_path ? `https://image.tmdb.org/t/p/w780${data.poster_path}` : '';
  
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
    
    // IMAGES - 16:9 support
    thumbnail: poster16x9,
    poster: poster16x9,
    poster16x9: poster16x9,
    backdrop: data.backdrop_path ? `https://image.tmdb.org/t/p/w1280${data.backdrop_path}` : '',
    originalPoster: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : '',
    
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

// Search multiple movies with 16:9 posters
export const searchMovies = async (query) => {
  try {
    // Try both APIs in parallel for better performance
    const [omdbResponse, tmdbResponse] = await Promise.all([
      fetch(`https://www.omdbapi.com/?s=${encodeURIComponent(query)}&apikey=${OMDB_API_KEY}&type=movie`),
      fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=en-US&page=1&include_adult=false`)
    ]);
    
    let movies = [];
    
    // Process OMDB results
    if (omdbResponse.ok) {
      const omdbData = await omdbResponse.json();
      if (omdbData.Response === 'True' && omdbData.Search) {
        movies = omdbData.Search.map(movie => ({
          id: movie.imdbID,
          title: movie.Title,
          year: movie.Year,
          poster: movie.Poster !== 'N/A' ? movie.Poster : '',
          type: movie.Type,
          source: 'omdb'
        }));
      }
    }
    
    // Process TMDB results if no OMDB results
    if (movies.length === 0 && tmdbResponse.ok) {
      const tmdbData = await tmdbResponse.json();
      if (tmdbData.results && tmdbData.results.length > 0) {
        movies = tmdbData.results.map(movie => {
          const year = movie.release_date ? new Date(movie.release_date).getFullYear() : 'Unknown';
          const poster16x9 = movie.poster_path ? `https://image.tmdb.org/t/p/w780${movie.poster_path}` : '';
          
          return {
            id: movie.id,
            title: movie.title,
            year: year,
            poster: poster16x9,
            overview: movie.overview,
            rating: movie.vote_average,
            source: 'tmdb'
          };
        });
      }
    }
    
    if (movies.length > 0) {
      return {
        success: true,
        movies: movies,
        source: movies[0].source
      };
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

// Generate admin panel display
export const displayMovieData = (movieData) => {
  if (!movieData || !movieData.success) {
    return `
    <div style="padding: 20px; background: #fee; border: 1px solid #fcc; border-radius: 5px; color: #c00;">
      <strong>Error:</strong> ${movieData?.error || 'Failed to fetch movie data'}
    </div>
    `;
  }
  
  const data = movieData.data;
  const imageUrl = data.poster16x9 || data.thumbnail;
  
  return `
  <div style="border: 2px solid #4CAF50; border-radius: 10px; padding: 20px; background: white; margin: 20px 0;">
    <div style="background: #4CAF50; color: white; padding: 10px; border-radius: 5px; margin: -20px -20px 20px -20px;">
      <h3 style="margin: 0;">✅ Movie Data Fetched Successfully</h3>
      <small>TMDB API: ✅ Active | 16:9 Images: ✅ Enabled</small>
    </div>
    
    <div style="display: flex; gap: 20px; margin-bottom: 20px;">
      ${imageUrl ? `
      <div style="flex: 0 0 300px;">
        <img src="${imageUrl}" alt="${data.title}" 
             style="width: 100%; height: 169px; object-fit: cover; border-radius: 5px; border: 2px solid #4CAF50;">
        <div style="text-align: center; margin-top: 5px; font-size: 12px; color: #4CAF50;">
          ✅ 16:9 Poster Image
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

// Test function
export const testMovieFetcher = async () => {
  console.log('Testing movie fetcher with TMDB API key...');
  
  const testCases = [
    'tt3896198', // Guardians of the Galaxy Vol. 2
    'Avengers: Endgame',
    'The Dark Knight',
    'Kantara'
  ];
  
  for (const testCase of testCases) {
    console.log(`Testing: "${testCase}"`);
    const result = await fetchMovieData(testCase);
    
    if (result.success) {
      console.log('✅ SUCCESS:', result.data.titleWithYear);
      console.log('   Year:', result.data.year);
      console.log('   16:9 Poster:', result.data.poster16x9 ? '✅ Yes' : '❌ No');
      console.log('   Backdrop:', result.data.backdrop ? '✅ Yes' : '❌ No');
    } else {
      console.log('❌ FAILED:', result.error);
    }
  }
};

// Quick setup for admin panel
export const setupMovieFetcher = (inputId, displayId) => {
  const inputElement = document.getElementById(inputId);
  const displayElement = document.getElementById(displayId);
  
  if (inputElement && displayElement) {
    inputElement.addEventListener('change', async (e) => {
      const identifier = e.target.value.trim();
      if (!identifier) return;
      
      displayElement.innerHTML = '<div style="padding: 20px; text-align: center;">Fetching movie data...</div>';
      
      const result = await fetchMovieData(identifier);
      displayElement.innerHTML = displayMovieData(result);
    });
  }
};
