
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';

export interface AuthenticatedRequest extends Request {
  tenantId?: string;
  userId?: string;
  userFirstName?: string;
  userLastName?: string;
  username?: string;
  role?: string;
  locations?: string[];
}

export async function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // In development mode, we still use JWT tokens but with a development-specific setup

  // Get JWT token from Authorization header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    // First, decode the token to get the tenant ID (without verification)
    const decoded = jwt.decode(token) as any;
    if (!decoded || !decoded.tenantId) {
      return res.status(401).json({ error: 'Invalid token format' });
    }

    let verified: any;

    // In development mode, use a simple secret for JWT verification
    if (process.env.NODE_ENV === 'development') {
      try {
        verified = jwt.verify(token, 'dev-secret-key') as any;
      } catch (devErr) {
        return res.status(403).json({ error: 'Invalid development token' });
      }
    } else {
      // Production mode: get the tenant and verify it's active
      const tenant = await storage.getTenant(decoded.tenantId);
      if (!tenant || !tenant.isActive) {
        return res.status(401).json({ error: 'Invalid tenant' });
      }

      // Get the tenant's JWT secret from token secrets table
      const tokenSecret = await storage.getTokenSecret(decoded.tenantId);
      if (!tokenSecret || !tokenSecret.isActive) {
        return res.status(401).json({ error: 'Invalid token secret' });
      }

      // Verify the token with the tenant's secret
      verified = jwt.verify(token, tokenSecret.jwtSecret) as any;
    }
    
    // Set tenant context and user information for all subsequent operations
    req.tenantId = verified.tenantId;
    req.userId = verified.userId;
    req.userFirstName = verified.userFirstName;
    req.userLastName = verified.userLastName;
    req.username = verified.username;
    req.role = verified.role;
    req.locations = verified.locations;
    
    // Track user login in database (don't block the request)
    storage.setTenantContext(verified.tenantId);
    storage.upsertUserFromToken({
      userId: verified.userId,
      username: verified.username,
      firstName: verified.userFirstName,
      lastName: verified.userLastName,
      role: verified.role,
      locations: verified.locations || [],
      fullPayload: verified,
    }).catch(err => {
      console.error('Failed to track user login:', err);
    });
    
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

// Utility function to generate JWT secrets
export function generateJwtSecret(): string {
  return require('crypto').randomBytes(64).toString('hex');
}

// Location validation helper
export async function validateLocationAccess(
  req: AuthenticatedRequest,
  requestedLocationId?: string
): Promise<{ allowed: boolean; message?: string }> {
  // If no location ID is requested, allow the request (for list operations)
  if (!requestedLocationId) {
    return { allowed: true };
  }

  // If user has no locations in JWT, deny access
  if (!req.locations || req.locations.length === 0) {
    return { 
      allowed: false, 
      message: "User has no authorized locations" 
    };
  }

  // Get the location details to verify it exists
  const location = await storage.getLocation(requestedLocationId);
  if (!location) {
    return { 
      allowed: false, 
      message: "Location not found" 
    };
  }

  // Check if the location ID is in the user's authorized locations
  // The locations array in JWT contains location IDs, not names
  const hasAccess = req.locations.includes(requestedLocationId);
  
  if (!hasAccess) {
    return { 
      allowed: false, 
      message: `Access denied to location: ${location.name}` 
    };
  }

  return { allowed: true };
}

// Helper to filter locations based on user's authorized locations
export async function getUserAuthorizedLocationIds(
  req: AuthenticatedRequest
): Promise<string[]> {
  if (!req.locations || req.locations.length === 0) {
    return [];
  }

  // Get all locations for this tenant
  const allLocations = await storage.getLocations();
  
  // Filter to only locations the user has access to
  // The locations array in JWT contains location IDs, not names
  const authorizedLocations = allLocations.filter(loc => 
    req.locations!.includes(loc.id)
  );

  return authorizedLocations.map(loc => loc.id);
}

// Generate development JWT token
export function generateDevelopmentToken(): string {
  const payload = {
    tenantId: "7cb6c28d-164c-49fa-b461-dfc47a8a3fed", // Your assigned tenant ID
    userId: "user123",                                  // Optional: User identifier
    userFirstName: "John",                              // Required: User's first name
    userLastName: "Doe",                                // Required: User's last name
    username: "john.doe@kindertales.com",               // Required: Username
    role: "Admin",                                      // Required: User role (teacher, admin, etc.)
    locations: ["Main Campus", "Third Location"],       // Required: Array of location name strings
    iat: Math.floor(Date.now() / 1000),                // Issued at
    // No expiration for development token
  };

  return jwt.sign(payload, 'dev-secret-key');
}
