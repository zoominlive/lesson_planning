import { getUserInfo } from './auth';

// Cache for permission overrides
let permissionOverridesCache: { [key: string]: string[] } | null = null;

/**
 * Fetch permission overrides from localStorage (synced from backend)
 */
function getPermissionOverrides(): { [key: string]: string[] } {
  if (permissionOverridesCache) {
    return permissionOverridesCache;
  }
  
  try {
    const stored = localStorage.getItem('permissionOverrides');
    if (stored) {
      permissionOverridesCache = JSON.parse(stored);
      return permissionOverridesCache;
    }
  } catch (e) {
    console.warn('Could not parse permission overrides:', e);
  }
  
  return {};
}

/**
 * Store permission overrides in localStorage
 */
export function setPermissionOverrides(overrides: Array<{ permissionName: string; autoApproveRoles: string[] }>) {
  const overrideMap: { [key: string]: string[] } = {};
  overrides.forEach(override => {
    overrideMap[override.permissionName] = override.autoApproveRoles || [];
  });
  localStorage.setItem('permissionOverrides', JSON.stringify(overrideMap));
  permissionOverridesCache = overrideMap;
}

/**
 * Check if the current user has permission for a specific action.
 * First checks permission overrides from backend, then falls back to defaults.
 */
export function hasPermission(permissionName: string): boolean {
  const userInfo = getUserInfo();
  // Normalize role: convert to lowercase and replace spaces with underscores
  const role = userInfo?.role?.toLowerCase().replace(/\s+/g, '_');
  
  // Superadmin always has all permissions
  if (role === 'superadmin') {
    return true;
  }
  
  // First check permission overrides from backend
  const overrides = getPermissionOverrides();
  if (overrides[permissionName]) {
    return role ? overrides[permissionName].includes(role) : false;
  }
  
  // Fall back to default permissions (matching backend configuration)
  const defaultPermissions: { [key: string]: string[] } = {
    'settings.access': ['admin'],  // Only admin and superadmin by default
    'settings.manage': ['admin'],  // Backend uses settings.manage
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
  return role ? allowedRoles.includes(role) : false;
}

/**
 * Check if the current user's lesson plan submissions require approval
 */
export function requiresLessonPlanApproval(): boolean {
  const userInfo = getUserInfo();
  // Normalize role: convert to lowercase and replace spaces with underscores
  const role = userInfo?.role?.toLowerCase().replace(/\s+/g, '_');
  
  // Check permission overrides first
  const overrides = getPermissionOverrides();
  
  // Check if there's a specific override for lesson plan approval
  if (overrides['lesson_plan.auto_approve']) {
    return role ? !overrides['lesson_plan.auto_approve'].includes(role) : true;
  }
  
  // Default auto-approve roles (assistant_director requires approval)
  const autoApproveRoles = ['director', 'admin', 'superadmin'];
  
  // If user's role is in auto-approve list, they don't require approval
  return role ? !autoApproveRoles.includes(role) : true;
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