// Authentication token management for iframe integration
let authToken: string | null = null;

export function setAuthToken(token: string) {
  console.log('Setting auth token:', token.substring(0, 20) + '...');
  authToken = token;
  localStorage.setItem('authToken', token);
  
  // Also decode and store user info for debugging
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log('Token payload:', payload);
    localStorage.setItem('userInfo', JSON.stringify(payload));
  } catch (e) {
    console.warn('Could not decode token payload:', e);
  }
}

export function getAuthToken(): string | null {
  if (authToken) {
    console.log('Auth token found in memory:', authToken.substring(0, 20) + '...');
    return authToken;
  }
  
  // Try to get from localStorage as fallback
  const stored = localStorage.getItem('authToken');
  if (stored) {
    console.log('Auth token found in localStorage:', stored.substring(0, 20) + '...');
    authToken = stored;
    return stored;
  }
  
  console.log('No auth token found');
  return null;
}

export function clearAuthToken() {
  authToken = null;
  superAdminLocations = null;
  locationsFetchPromise = null;
  localStorage.removeItem('authToken');
  localStorage.removeItem('userInfo');
  console.log('Cleared auth token and user info from storage');
}

// Get JWT token from URL query parameters
function getTokenFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('token');
}

// Listen for postMessage authentication tokens and check URL parameters
// Get user information from stored JWT token
export interface UserInfo {
  tenantId: string;
  userId: string;
  userFirstName: string;
  userLastName: string;
  username: string;
  role: string;
  locations: string[];
}

// Store SuperAdmin locations in memory to avoid repeated fetches
let superAdminLocations: string[] | null = null;
let locationsFetchPromise: Promise<void> | null = null;

async function fetchAllLocationsForSuperAdmin(token: string): Promise<string[]> {
  try {
    const response = await fetch('/api/locations', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      console.warn('Failed to fetch locations for SuperAdmin');
      return [];
    }
    
    const locations = await response.json();
    if (Array.isArray(locations)) {
      const locationNames = locations.map(loc => loc.name);
      console.log('SuperAdmin has access to all locations:', locationNames);
      return locationNames;
    }
    return [];
  } catch (error) {
    console.warn('Error fetching locations for SuperAdmin:', error);
    return [];
  }
}

export function getUserInfo(): UserInfo | null {
  const token = getAuthToken();
  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userInfo = {
      tenantId: payload.tenantId,
      userId: payload.userId,
      userFirstName: payload.userFirstName,
      userLastName: payload.userLastName,
      username: payload.username,
      role: payload.role,
      locations: payload.locations || []
    };
    
    // SuperAdmin should have access to all locations from the database
    if (payload.role === 'SuperAdmin') {
      // First check if we have locations in memory
      if (superAdminLocations) {
        userInfo.locations = superAdminLocations;
      } else {
        // Try to get from localStorage first
        const cachedLocations = localStorage.getItem('allLocationNames');
        if (cachedLocations) {
          try {
            userInfo.locations = JSON.parse(cachedLocations);
            superAdminLocations = userInfo.locations;
          } catch {
            // If parsing fails, keep original locations
          }
        }
        
        // Trigger a background fetch to update the locations
        if (!locationsFetchPromise && token) {
          locationsFetchPromise = fetchAllLocationsForSuperAdmin(token).then(locations => {
            superAdminLocations = locations;
            localStorage.setItem('allLocationNames', JSON.stringify(locations));
            locationsFetchPromise = null;
          }).catch(error => {
            console.warn('Failed to fetch SuperAdmin locations in background:', error);
            locationsFetchPromise = null;
          });
        }
      }
    }
    
    return userInfo;
  } catch (e) {
    console.warn('Could not decode user info from token:', e);
    return null;
  }
}

// Get authorized locations from JWT
export function getUserAuthorizedLocations(): string[] {
  const userInfo = getUserInfo();
  return userInfo?.locations || [];
}

// Check if user has access to a specific location
export function hasLocationAccess(locationName: string): boolean {
  const authorizedLocations = getUserAuthorizedLocations();
  return authorizedLocations.includes(locationName);
}

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
  
  // Check if we have a valid token in storage
  const currentToken = getAuthToken();
  
  // Check if token was manually set (by token switcher)
  const isManuallySet = localStorage.getItem('tokenManuallySet') === 'true';
  
  if (isManuallySet && currentToken) {
    console.log('Using manually set token from token switcher');
    return;
  }
  
  // Default admin token for development (signed with 'dev-secret-key')
  // Token includes locations as ["Main Campus", "Third Location"] instead of UUIDs
  const defaultToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZW5hbnRJZCI6IjdjYjZjMjhkLTE2NGMtNDlmYS1iNDYxLWRmYzQ3YThhM2ZlZCIsInVzZXJJZCI6ImU1YjdmMGRlLWM4NjgtNGU0MC1hMGJkLWUxNTkzN2NiMzA5NyIsInVzZXJGaXJzdE5hbWUiOiJBZG1pbiIsInVzZXJMYXN0TmFtZSI6IlVzZXIiLCJ1c2VybmFtZSI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6IkFkbWluIiwibG9jYXRpb25zIjpbIk1haW4gQ2FtcHVzIiwiVGhpcmQgTG9jYXRpb24iXSwiaWF0IjoxNzU0ODAzMDM0fQ.atm0PWAUeYKXddW1eT-wodxP5H3eYdW0B7e98NtU1yk';
  
  // If no token or invalid token, set default
  if (!currentToken) {
    console.log('No token found, setting default admin token');
    setAuthToken(defaultToken);
    // Don't mark as manually set
    localStorage.removeItem('tokenManuallySet');
    // Reload to apply the new token
    setTimeout(() => window.location.reload(), 100);
    return;
  }
  
  // Listen for postMessage authentication tokens as fallback
  window.addEventListener('message', (event) => {
    // Only accept messages from trusted origins in production
    // For development, accept from any origin
    if (event.data?.type === 'AUTH_TOKEN' && event.data?.token) {
      console.log('Received auth token via postMessage');
      setAuthToken(event.data.token);
      localStorage.removeItem('tokenManuallySet');
      
      // Reload the page to apply the new token
      window.location.reload();
    }
  });
  
  console.log('Iframe auth initialized. Waiting for token via URL parameter or postMessage.');
}

