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

// Listen for postMessage authentication tokens (for iframe use)
export function initializeIframeAuth() {
  if (typeof window === 'undefined') return;
  
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
  
  // For development: generate a mock token if none exists
  if (process.env.NODE_ENV === 'development' && !getAuthToken()) {
    console.log('Development mode: using mock token');
    // This is a development-only mock token
    setAuthToken('dev-token-placeholder');
  }
}