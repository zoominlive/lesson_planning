
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';

export interface AuthenticatedRequest extends Request {
  tenantId?: string;
  userId?: string;
}

export async function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // For now, bypass authentication entirely to maintain existing functionality
  // TODO: Enable JWT authentication when tenant schema is properly migrated
  req.tenantId = 'dev-tenant';
  req.userId = 'dev-user';
  return next();
}

// Utility function to generate JWT secrets
export function generateJwtSecret(): string {
  return require('crypto').randomBytes(64).toString('hex');
}
