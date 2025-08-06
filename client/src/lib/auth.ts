// Authentication token management for iframe integration
let authToken: string | null = null;

export function setAuthToken(token: string) {
  authToken = token;
  localStorage.setItem('authToken', token);
}

export function getAuthToken(): string | null {
  if (authToken) return authToken;
  
  // Try to get from localStorage as fallback
  const stored = localStorage.getItem('authToken');
  if (stored) {
    authToken = stored;
    return stored;
  }
  
  return null;
}

export function clearAuthToken() {
  authToken = null;
  localStorage.removeItem('authToken');
}

// Get JWT token from URL query parameters
function getTokenFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('token');
}

// Listen for postMessage authentication tokens and check URL parameters
export function initializeIframeAuth() {
  if (typeof window === 'undefined') return;
  
  // First, check for token in URL query parameters
  const urlToken = getTokenFromUrl();
  if (urlToken) {
    console.log('Found auth token in URL parameters');
    setAuthToken(urlToken);
    
    // Clean the token from URL for security
    const url = new URL(window.location.href);
    url.searchParams.delete('token');
    window.history.replaceState({}, document.title, url.toString());
    return;
  }
  
  // Listen for postMessage authentication tokens as fallback
  window.addEventListener('message', (event) => {
    // Only accept messages from trusted origins in production
    // For development, accept from any origin
    if (event.data?.type === 'AUTH_TOKEN' && event.data?.token) {
      console.log('Received auth token via postMessage');
      setAuthToken(event.data.token);
      
      // Reload the page to apply the new token
      window.location.reload();
    }
  });
  
  // For development: get a real JWT token from the server if none exists
  if (!getAuthToken() && (window.location.hostname.includes('localhost') || window.location.hostname.includes('replit.dev'))) {
    console.log('Development mode: fetching JWT token from server');
    fetchDevelopmentToken();
  }
}

// Fetch development JWT token from server
async function fetchDevelopmentToken() {
  try {
    const response = await fetch('/api/dev-token');
    if (response.ok) {
      const data = await response.json();
      if (data.token) {
        console.log('Development mode: received JWT token from server');
        setAuthToken(data.token);
        // Trigger a page reload to ensure all components re-fetch with the new token
        window.location.reload();
      }
    }
  } catch (error) {
    console.warn('Failed to fetch development token:', error);
  }
}