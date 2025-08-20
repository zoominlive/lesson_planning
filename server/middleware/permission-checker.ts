import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

// Middleware to check permissions for specific actions
export function checkPermission(resource: string, action: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get user info from authenticated request
      const userId = (req as any).userId;
      const role = (req as any).role;
      const tenantId = (req as any).tenantId;
      
      if (!userId || !role) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      // Check if user has permission
      const hasPermission = await storage.checkUserPermission(
        userId,
        role,
        resource,
        action,
        tenantId
      );

      if (!hasPermission.hasPermission) {
        return res.status(403).json({ 
          error: 'Forbidden',
          message: hasPermission.reason || `You don't have permission to ${action} ${resource}`
        });
      }

      // Store permission result for use in route handler
      (req as any).permissionCheck = hasPermission;
      
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ error: 'Permission check failed' });
    }
  };
}

// Helper to check if a user's role requires approval for specific actions
export async function userRequiresApproval(
  permissionName: string,
  userId: string,
  role: string,
  tenantId: string
): Promise<boolean> {
  // Get organization-specific overrides
  const override = await storage.getTenantPermissionOverride(tenantId, permissionName);
  
  if (override) {
    // Check if role requires approval based on organization settings
    return override.rolesRequired.includes(role.toLowerCase());
  }
  
  // Default approval requirements
  const defaultApprovalSettings: { [key: string]: { requiresApproval: string[], autoApprove: string[] } } = {
    'lesson_plan.submit': {
      requiresApproval: ['teacher'],
      autoApprove: ['assistant_director', 'director', 'admin', 'superadmin']
    }
  };
  
  const setting = defaultApprovalSettings[permissionName];
  if (setting) {
    return setting.requiresApproval.includes(role.toLowerCase());
  }
  
  // By default, no approval required
  return false;
}