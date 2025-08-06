
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';

export interface AuthenticatedRequest extends Request {
  tenantId?: string;
  userId?: string;
}

export async function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
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

    // Get the tenant's JWT secret from database
    const tenant = await storage.getTenant(decoded.tenantId);
    if (!tenant || !tenant.isActive) {
      return res.status(401).json({ error: 'Invalid tenant' });
    }

    // Verify the token with the tenant's secret
    const verified = jwt.verify(token, tenant.jwtSecret) as any;
    
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
