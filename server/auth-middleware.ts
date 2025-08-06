
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';

export interface AuthenticatedRequest extends Request {
  tenantId?: string;
  userId?: string;
}

export async function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // For development, use the development tenant UUID
  req.tenantId = '7cb6c28d-164c-49fa-b461-dfc47a8a3fed';
  req.userId = 'dev-user';
  return next();
}

// Utility function to generate JWT secrets
export function generateJwtSecret(): string {
  return require('crypto').randomBytes(64).toString('hex');
}
