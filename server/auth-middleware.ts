
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
    
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

// Utility function to generate JWT secrets
export function generateJwtSecret(): string {
  return require('crypto').randomBytes(64).toString('hex');
}

// Generate development JWT token
export function generateDevelopmentToken(): string {
  const payload = {
    tenantId: "7cb6c28d-164c-49fa-b461-dfc47a8a3fed", // Your assigned tenant ID
    userId: "user123",                                  // Optional: User identifier
    userFirstName: "John",                              // Required: User's first name
    userLastName: "Doe",                                // Required: User's last name
    username: "john.doe@kindertales.com",               // Required: Username
    role: "admin",                                      // Required: User role (teacher, admin, etc.)
    iat: Math.floor(Date.now() / 1000),                // Issued at
    // No expiration for development token
  };

  return jwt.sign(payload, 'dev-secret-key');
}
