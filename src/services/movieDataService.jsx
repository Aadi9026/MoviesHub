// Movie Data Fetcher with your OMDB API Key
const OMDB_API_KEY = '53cca1db';
const TMDB_API_KEY = 'your_tmdb_key_here'; // Optional fallback

class MovieFetcher {
  constructor() {
    this.omdbKey = '53cca1db';
  }

  // Main function to fetch movie data
  async fetchMovieData(identifier) {
    try {
      console.log('Fetching data for:', identifier);
      
      // Clean the input
      identifier = identifier.trim();
      
      // If it's an IMDb ID (starts with tt)
      if (identifier.startsWith('tt')) {
        return await this.fetchByIMDb(identifier);
      }
      
      // If it's numeric (TMDB ID)
      if (/^\d+$/.test(identifier)) {
        return await this.fetchByTMDB(identifier);
      }
      
      // Otherwise search by title
      return await this.searchByTitle(identifier);
      
    } catch (error) {
      console.error('Error:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  // Fetch by IMDb ID using YOUR OMDB API key
  async fetchByIMDb(imdbId) {
    try {
      console.log('Fetching from OMDB with IMDb ID:', imdbId);
      
      const response = await fetch(
        `https://www.omdbapi.com/?i=${imdbId}&apikey=${this.omdbKey}&plot=full`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('OMDB Response:', data);
      
      if (data.Response === 'True') {
        return {
          success: true,
          source: 'OMDB',
          data: this.formatOMDBData(data)
        };
      } else {
        throw new Error(data.Error || 'Movie not found in OMDB');
      }
      
    } catch (error) {
      console.error('OMDB fetch failed:', error);
      // Fallback to TMDB if available
      if (TMDB_API_KEY && TMDB_API_KEY !== 'your_tmdb_key_here') {
        return await this.fetchByTMDBWithIMDb(imdbId);
      }
      return {
        success: false,
        error: `Failed to fetch movie: ${error.message}`,
        data: null
      };
    }
  }

  // Fallback: Fetch using TMDB with IMDb ID
  async fetchByTMDBWithIMDb(imdbId) {
    try {
      console.log('Trying TMDB fallback for IMDb ID:', imdbId);
      
      const findResponse = await fetch(
        `https://api.themoviedb.org/3/find/${imdbId}?api_key=${TMDB_API_KEY}&language=en-US&external_source=imdb_id`
      );
      
      if (!findResponse.ok) {
        throw new Error(`TMDB find error: ${findResponse.status}`);
      }
      
      const findData = await findResponse.json();
      
      if (findData.movie_results && findData.movie_results.length > 0) {
        const tmdbId = findData.movie_results[0].id;
        return await this.fetchByTMDB(tmdbId);
      }
      
      throw new Error('Movie not found in TMDB');
      
    } catch (error) {
      throw new Error(`TMDB fallback also failed: ${error.message}`);
    }
  }

  // Fetch by TMDB ID
  async fetchByTMDB(tmdbId) {
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=en-US`
      );
      
      if (!response.ok) {
        throw new Error(`TMDB error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.id) {
        return {
          success: true,
          source: 'TMDB',
          data: this.formatTMDBData(data)
        };
      }
      
      throw new Error('Movie not found in TMDB');
      
    } catch (error) {
      throw new Error(`TMDB fetch failed: ${error.message}`);
    }
  }

  // Search by title
  async searchByTitle(title) {
    try {
      // Try OMDB first
      const response = await fetch(
        `https://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=${this.omdbKey}&plot=full`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.Response === 'True') {
        return {
          success: true,
          source: 'OMDB',
          data: this.formatOMDBData(data)
        };
      }
      
      throw new Error(data.Error || 'Movie not found');
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  // Format OMDB data
  formatOMDBData(data) {
    return {
      title: data.Title || '',
      description: data.Plot || '',
      genre: data.Genre?.split(', ')[0] || 'Unknown',
      genres: data.Genre?.split(', ') || ['Unknown'],
      duration: data.Runtime ? parseInt(data.Runtime) : 120,
      thumbnail: data.Poster !== 'N/A' ? data.Poster : '',
      year: data.Year || '',
      rating: data.imdbRating || 'N/A',
      actors: data.Actors || '',
      director: data.Director || '',
      releaseDate: data.Released || '',
      country: data.Country || '',
      language: data.Language || '',
      production: data.Production || '',
      imdbID: data.imdbID || '',
      type: data.Type || 'movie',
      boxOffice: data.BoxOffice || '',
      awards: data.Awards || '',
      
      // Fields for admin to fill
      downloadLink: '',
      embedCode: '',
      
      // Additional metadata
      metascore: data.Metascore || 'N/A',
      rated: data.Rated || '',
      website: data.Website || 'N/A'
    };
  }

  // Format TMDB data
  formatTMDBData(data) {
    return {
      title: data.title || '',
      description: data.overview || '',
      genre: data.genres?.[0]?.name || 'Unknown',
      genres: data.genres?.map(g => g.name) || ['Unknown'],
      duration: data.runtime || 120,
      thumbnail: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : '',
      backdrop: data.backdrop_path ? `https://image.tmdb.org/t/p/w1280${data.backdrop_path}` : '',
      year: data.release_date ? new Date(data.release_date).getFullYear().toString() : '',
      rating: data.vote_average ? data.vote_average.toFixed(1) : 'N/A',
      releaseDate: data.release_date || '',
      country: data.production_countries?.[0]?.name || '',
      language: data.original_language || '',
      production: data.production_companies?.[0]?.name || '',
      imdbID: data.imdb_id || '',
      
      // Fields for admin to fill
      downloadLink: '',
      embedCode: '',
      
      // Additional TMDB fields
      budget: data.budget || 0,
      revenue: data.revenue || 0,
      tagline: data.tagline || '',
      status: data.status || ''
    };
  }

  // Test function to verify your API key
  async testAPI() {
    console.log('Testing OMDB API key...');
    
    try {
      const response = await fetch(
        `https://www.omdbapi.com/?i=tt3896198&apikey=${this.omdbKey}`
      );
      
      const data = await response.json();
      console.log('API Test Response:', data);
      
      if (data.Response === 'True') {
        console.log('✅ API Key is working!');
        return true;
      } else {
        console.log('❌ API Key error:', data.Error);
        return false;
      }
    } catch (error) {
      console.log('❌ API Test failed:', error);
      return false;
    }
  }
}

// Create instance and test
const movieFetcher = new MovieFetcher();

// Test your API key first
movieFetcher.testAPI().then(success => {
  if (success) {
    console.log('Ready to fetch movie data!');
  }
});

// Export for use in your admin panel
export default movieFetcher;
