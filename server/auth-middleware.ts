
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';

export interface AuthenticatedRequest extends Request {
  tenantId?: string;
  userId?: string;
}

export async function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // In development mode, allow bypass of authentication for easier testing
  if (process.env.NODE_ENV === 'development') {
    // Set a default tenant for development
    req.tenantId = '7cb6c28d-164c-49fa-b461-dfc47a8a3fed';
    req.userId = 'dev-user';
    return next();
  }

  // Skip auth for iframe integration - expect JWT token
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

    // Get the tenant and verify it's active
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
    const verified = jwt.verify(token, tokenSecret.jwtSecret) as any;
    
    // Set tenant context for all subsequent operations
    req.tenantId = verified.tenantId;
    req.userId = verified.userId; // Optional: if you want to track specific users
    
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

// Utility function to generate JWT secrets
export function generateJwtSecret(): string {
  return require('crypto').randomBytes(64).toString('hex');
}
