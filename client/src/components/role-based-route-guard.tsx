import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { getUserInfo } from '@/lib/auth';

interface RoleBasedRouteGuardProps {
  children: React.ReactNode;
}

/**
 * Component that guards routes based on user role
 * Redirects parent users to /parent if they try to access main or tablet views
 */
export function RoleBasedRouteGuard({ children }: RoleBasedRouteGuardProps) {
  const [location, navigate] = useLocation();
  const userInfo = getUserInfo();

  useEffect(() => {
    // Only apply restrictions if user is authenticated
    if (!userInfo?.role) {
      return;
    }

    const userRole = userInfo.role.toLowerCase();
    const currentPath = location;

    // Special handling for parent role
    if (userRole === 'parent') {
      // Allow access to parent view and API calls
      if (currentPath === '/parent' || currentPath.startsWith('/api/')) {
        return;
      }

      // Redirect parent users trying to access restricted views
      if (currentPath === '/' || currentPath === '/tablet' || currentPath === '/settings') {
        console.log(`Parent role detected, redirecting from ${currentPath} to /parent`);
        navigate('/parent');
        return;
      }
    }

    // For all other roles, allow normal access (no restrictions)
    // Teachers, directors, admins, etc. can access all views
  }, [location, userInfo, navigate]);

  return <>{children}</>;
}

/**
 * Hook to check if current user has access to a specific view
 */
export function useViewAccess() {
  const userInfo = getUserInfo();

  const hasMainViewAccess = () => {
    if (!userInfo?.role) return false;
    const role = userInfo.role.toLowerCase();
    return role !== 'parent'; // All roles except parent can access main view
  };

  const hasTabletViewAccess = () => {
    if (!userInfo?.role) return false;
    const role = userInfo.role.toLowerCase();
    return role !== 'parent'; // All roles except parent can access tablet view
  };

  const hasParentViewAccess = () => {
    if (!userInfo?.role) return false;
    const role = userInfo.role.toLowerCase();
    return role === 'parent'; // Only parent role can access parent view
  };

  const getDefaultViewForRole = () => {
    if (!userInfo?.role) return '/';
    const role = userInfo.role.toLowerCase();
    
    switch (role) {
      case 'parent':
        return '/parent';
      default:
        return '/';
    }
  };

  return {
    hasMainViewAccess,
    hasTabletViewAccess,
    hasParentViewAccess,
    getDefaultViewForRole,
    userRole: userInfo?.role?.toLowerCase()
  };
}