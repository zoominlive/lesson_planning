import { getUserInfo } from './auth';

/**
 * Check if the current user has permission for a specific action.
 * For now, this does a simple role-based check, but can be extended
 * to check against permission overrides from the backend.
 */
export function hasPermission(permissionName: string): boolean {
  const userInfo = getUserInfo();
  const role = userInfo?.role?.toLowerCase();
  
  console.log('[hasPermission] Checking permission:', permissionName, 'for role:', role, 'Original role:', userInfo?.role);
  
  // Superadmin always has all permissions
  if (role === 'superadmin') {
    console.log('[hasPermission] Superadmin detected, returning true');
    return true;
  }
  
  // Define default permissions by role
  const defaultPermissions: { [key: string]: string[] } = {
    'settings.access': ['admin', 'director', 'assistant_director'],
    'lesson_plan.approve': ['director', 'assistant_director', 'admin'],
    'lesson_plan.reject': ['director', 'assistant_director', 'admin'],
    'lesson_plan.submit': ['teacher', 'director', 'assistant_director', 'admin'],
    'activity.create': ['teacher', 'director', 'assistant_director', 'admin'],
    'activity.update': ['teacher', 'director', 'assistant_director', 'admin'],
    'activity.delete': ['director', 'assistant_director', 'admin'],
    'material.create': ['teacher', 'director', 'assistant_director', 'admin'],
    'material.update': ['teacher', 'director', 'assistant_director', 'admin'],
    'material.delete': ['director', 'assistant_director', 'admin'],
  };
  
  const allowedRoles = defaultPermissions[permissionName] || [];
  const hasAccess = role ? allowedRoles.includes(role) : false;
  console.log('[hasPermission] Allowed roles:', allowedRoles, 'Has access:', hasAccess);
  return hasAccess;
}

/**
 * Hook to check permissions with React Query
 * This will eventually fetch permission overrides from the backend
 */
export function usePermission(permissionName: string): boolean {
  // For now, use the simple check
  // In the future, this can be enhanced to fetch permission overrides
  return hasPermission(permissionName);
}