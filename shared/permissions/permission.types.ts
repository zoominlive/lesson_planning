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

export interface OrganizationPermissionOverride {
  id: string;
  organizationId: string; // tenantId
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
} as const;

export const PERMISSION_ACTIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  SUBMIT: 'submit',
  APPROVE: 'approve',
  REJECT: 'reject',
  MANAGE: 'manage', // Full control
} as const;

export type PermissionResource = typeof PERMISSION_RESOURCES[keyof typeof PERMISSION_RESOURCES];
export type PermissionAction = typeof PERMISSION_ACTIONS[keyof typeof PERMISSION_ACTIONS];