export const extractVideoId = (embedCode) => {
  const match = embedCode.match(/src="([^"]+)"/);
  return match ? match[1] : null;
};

export const formatDuration = (minutes) => {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
};

export const formatViews = (views) => {
  if (views >= 1000000) {
    return (views / 1000000).toFixed(1) + 'M';
  } else if (views >= 1000) {
    return (views / 1000).toFixed(1) + 'K';
  }
  return views.toString();
};

export const validateEmbedCode = (code) => {
  return code.includes('<iframe') && code.includes('</iframe>');
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};
// Add this function to your existing helpers.js
export const formatDate = (date) => {
  if (!date) return 'Recent';
  
  const now = new Date();
  const videoDate = date.toDate ? date.toDate() : new Date(date);
  const diffTime = Math.abs(now - videoDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return 'Today';
  if (diffDays === 2) return 'Yesterday';
  if (diffDays <= 7) return `${diffDays - 1} days ago`;
  if (diffDays <= 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  
  return videoDate.toLocaleDateString();
};
