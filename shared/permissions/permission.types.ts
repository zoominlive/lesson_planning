// Permission system type definitions

export interface Permission {
  id: string;
  name: string; // e.g., "lesson_plan.submit", "lesson_plan.approve"
  resource: string; // e.g., "lesson_plan", "activity", "material"
  action: string; // e.g., "create", "read", "update", "delete", "submit", "approve"
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id: string;
  name: string; // "teacher", "assistant_director", "director", "admin", "superadmin"
  description: string;
  isSystem: boolean; // System roles can't be deleted
  createdAt: Date;
  updatedAt: Date;
}

export interface RolePermission {
  id: string;
  roleId: string;
  permissionId: string;
  createdAt: Date;
}

export interface TenantPermissionOverride {
  id: string;
  tenantId: string;
  permissionName: string; // e.g., "lesson_plan.submit"
  rolesRequired: string[]; // Array of role names that require this permission
  autoApproveRoles: string[]; // Roles that bypass approval
  createdAt: Date;
  updatedAt: Date;
}

export interface PermissionCheck {
  hasPermission: boolean;
  requiresApproval: boolean;
  reason?: string;
}

// Permission resources and actions
export const PERMISSION_RESOURCES = {
  LESSON_PLAN: 'lesson_plan',
  ACTIVITY: 'activity',
  MATERIAL: 'material',
  MILESTONE: 'milestone',
  USER: 'user',
  SETTINGS: 'settings',
  LOCATION: 'location',
  ROOM: 'room',
  VIEW: 'view', // For controlling access to different application views
} as const;

export const PERMISSION_ACTIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  SUBMIT: 'submit',
  APPROVE: 'approve',
  REJECT: 'reject',
  COPY: 'copy', // Copy lesson plans to other rooms
  MANAGE: 'manage', // Full control
  ACCESS_MAIN: 'access_main', // Access to main lesson planner view
  ACCESS_TABLET: 'access_tablet', // Access to tablet view
  ACCESS_PARENT: 'access_parent', // Access to parent view
} as const;

export type PermissionResource = typeof PERMISSION_RESOURCES[keyof typeof PERMISSION_RESOURCES];
export type PermissionAction = typeof PERMISSION_ACTIONS[keyof typeof PERMISSION_ACTIONS];