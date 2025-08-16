import { Request, Response, NextFunction } from 'express';
import { PERMISSION_RESOURCES, PERMISSION_ACTIONS } from '@shared/permissions/permission.types';
import { DEFAULT_ROLE_PERMISSIONS } from '@shared/permissions/permissions.config';

export interface AuthenticatedRequest extends Request {
  role?: string;
  userId?: string;
  tenantId?: string;
}

/**
 * Middleware to check if user has permission to access specific application views
 */
export function checkViewAccess(viewType: 'main' | 'tablet' | 'parent') {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userRole = req.role;
      
      if (!userRole) {
        return res.status(401).json({ 
          error: 'Authentication required',
          message: 'User role not found in request'
        });
      }

      // Determine required permission based on view type
      let requiredPermission: string;
      switch (viewType) {
        case 'main':
          requiredPermission = `${PERMISSION_RESOURCES.VIEW}.${PERMISSION_ACTIONS.ACCESS_MAIN}`;
          break;
        case 'tablet':
          requiredPermission = `${PERMISSION_RESOURCES.VIEW}.${PERMISSION_ACTIONS.ACCESS_TABLET}`;
          break;
        case 'parent':
          requiredPermission = `${PERMISSION_RESOURCES.VIEW}.${PERMISSION_ACTIONS.ACCESS_PARENT}`;
          break;
        default:
          return res.status(400).json({ 
            error: 'Invalid view type',
            message: `Unknown view type: ${viewType}`
          });
      }

      // Check if user's role has the required permission
      const userPermissions = DEFAULT_ROLE_PERMISSIONS[userRole as keyof typeof DEFAULT_ROLE_PERMISSIONS];
      
      if (!userPermissions) {
        return res.status(403).json({ 
          error: 'Access denied',
          message: `Role '${userRole}' not recognized`
        });
      }

      // Check for wildcard permission (superadmin)
      const hasWildcard = userPermissions.includes('*.*');
      const hasSpecificPermission = userPermissions.includes(requiredPermission);

      if (!hasWildcard && !hasSpecificPermission) {
        return res.status(403).json({ 
          error: 'Access denied',
          message: `Role '${userRole}' does not have permission to access ${viewType} view`
        });
      }

      // Permission granted, continue to next middleware/route
      next();
    } catch (error) {
      console.error('View access control error:', error);
      res.status(500).json({ 
        error: 'Access control check failed',
        message: 'Internal server error during permission check'
      });
    }
  };
}

/**
 * Redirect users to appropriate view based on their role
 */
export function redirectToAuthorizedView(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userRole = req.role;
    
    if (!userRole) {
      return next(); // Let other middleware handle authentication
    }

    // Special handling for parent role - redirect to parent view only
    if (userRole.toLowerCase() === 'parent') {
      const requestedPath = req.path;
      
      // Allow access to parent view and API endpoints
      if (requestedPath === '/parent' || requestedPath.startsWith('/api/')) {
        return next();
      }
      
      // Redirect parent users trying to access main or tablet views
      if (requestedPath === '/' || requestedPath === '/tablet') {
        return res.redirect('/parent');
      }
    }

    // For all other roles, allow normal access
    next();
  } catch (error) {
    console.error('View redirect error:', error);
    next(); // Continue on error to avoid breaking the app
  }
}