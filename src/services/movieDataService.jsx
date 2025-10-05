// Movie Data Fetcher Service - OMDB Only Version
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

// Fetch movie by IMDb ID - USING ONLY OMDB API
const fetchMovieByIMDb = async (imdbId) => {
  try {
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

// Search movie by title - USING ONLY OMDB API
const fetchMovieByTitle = async (title) => {
  return await searchMovieByTitle(title);
};

// Search movie by title - OMDB ONLY
const searchMovieByTitle = async (title) => {
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
      return {
        success: true,
        data: formatOMDBData(omdbData),
        source: 'omdb'
      };
    }
    
    return {
      success: false,
      error: `Movie "${title}" not found on OMDB database`,
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

// Search multiple movies - OMDB ONLY
export const searchMovies = async (query) => {
  try {
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
      error: 'No movies found on OMDB',
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
