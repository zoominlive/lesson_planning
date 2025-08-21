# Permission Management System Guide

## Overview

The Lesson Planning Application implements a flexible Role-Based Access Control (RBAC) system that allows organizations to customize approval workflows and permission requirements based on their specific needs.

## System Architecture

### Database Schema

The permission system consists of four main tables:

1. **permissions** - Defines available permissions in the system
   - `id`: Unique identifier
   - `name`: Permission name (e.g., "lesson_plan.submit")
   - `description`: Human-readable description
   - `resource`: Resource type (e.g., "lesson_plan")
   - `action`: Action type (e.g., "submit")

2. **roles** - Defines system roles
   - `id`: Unique identifier
   - `name`: Role name (e.g., "teacher")
   - `description`: Role description
   - `isSystem`: Whether it's a system-defined role

3. **role_permissions** - Junction table linking roles to permissions
   - `roleId`: Reference to role
   - `permissionId`: Reference to permission
   - `canDelegate`: Whether the role can delegate this permission

4. **organization_permission_overrides** - Organization-specific permission customizations
   - `organizationId`: Tenant/organization ID
   - `permissionName`: Permission being customized
   - `rolesRequired`: Array of roles that require approval
   - `autoApproveRoles`: Array of roles that auto-approve

## Available Roles

### System Roles (Cannot be modified)

1. **Teacher**
   - Basic educator role
   - Can create and edit lesson plans
   - Typically requires approval for submissions
   - Limited to assigned locations

2. **Assistant Director**
   - Mid-level management role
   - Can review and approve teacher submissions
   - Manages activities and materials
   - Location-specific access

3. **Director**
   - Location management role
   - Full control over assigned locations
   - Approves lesson plans
   - Manages rooms and settings

4. **Admin**
   - Organization-wide management
   - Configures permission settings
   - Manages all locations
   - Full access to settings

5. **Superadmin**
   - System-level access
   - All permissions granted
   - Cannot be restricted
   - Maintenance and support role

## Permission Categories

### Lesson Plan Permissions
- `lesson_plan.create` - Create new lesson plans
- `lesson_plan.read` - View lesson plans
- `lesson_plan.update` - Edit existing lesson plans
- `lesson_plan.delete` - Delete lesson plans
- `lesson_plan.submit` - Submit plans for review
- `lesson_plan.approve` - Approve submitted plans
- `lesson_plan.reject` - Reject submitted plans
- `lesson_plan.manage` - Full lesson plan management

### Activity Permissions
- `activity.create` - Create new activities
- `activity.read` - View activities
- `activity.update` - Edit existing activities
- `activity.delete` - Delete/archive activities
- `activity.manage` - Full activity management

### Material Permissions
- `material.create` - Create new materials
- `material.read` - View materials
- `material.update` - Edit existing materials
- `material.delete` - Delete materials
- `material.manage` - Full material management

### Milestone Permissions
- `milestone.create` - Create new milestones
- `milestone.read` - View milestones
- `milestone.update` - Edit existing milestones
- `milestone.delete` - Delete milestones
- `milestone.manage` - Full milestone management

### Settings Permissions
- `settings.read` - View organization settings
- `settings.update` - Modify organization settings
- `settings.manage` - Full settings management
- `location.manage` - Manage locations
- `room.manage` - Manage rooms

## Configuring Permissions

### Via User Interface

1. Navigate to **Settings** → **Permissions** tab
2. For each permission category, configure:
   - **Requires Approval**: Roles that need their actions reviewed
   - **Auto-Approve**: Roles that bypass the approval process
3. Click **Save Changes** to apply

### Via API

#### Get Current Permission Overrides
```http
GET /api/permissions/overrides
Authorization: Bearer {JWT_TOKEN}
```

#### Create Permission Override
```http
POST /api/permissions/overrides
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "permissionName": "lesson_plan.submit",
  "rolesRequired": ["teacher"],
  "autoApproveRoles": ["director", "admin"]
}
```

#### Update Permission Override
```http
PATCH /api/permissions/overrides/{id}
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "rolesRequired": ["teacher", "assistant_director"],
  "autoApproveRoles": ["director", "admin"]
}
```

#### Check User Permission
```http
POST /api/permissions/check
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "resource": "lesson_plan",
  "action": "submit"
}
```

## Default Permission Configuration

### Teacher Role
- **Requires Approval**: lesson_plan.submit
- **Granted**: 
  - lesson_plan.create, read, update
  - activity.read, create
  - material.read
  - milestone.read

### Assistant Director Role
- **Auto-Approve**: Most actions
- **Granted**:
  - lesson_plan.* (all actions)
  - activity.* (all actions)
  - material.create, read, update
  - milestone.read, create

### Director Role
- **Auto-Approve**: All actions
- **Granted**:
  - Full management of lesson plans
  - Full management of activities
  - Full management of materials
  - User and room management
  - Location read access

### Admin Role
- **Auto-Approve**: All actions
- **Granted**:
  - All director permissions
  - Settings management
  - Location management
  - Permission configuration

### Superadmin Role
- **Auto-Approve**: All actions
- **Granted**: All system permissions

## Implementation Examples

### Checking Permissions in Code

#### Backend (Node.js/Express)
```javascript
import { checkPermission } from './middleware/permission-checker';

// Protect route with permission check
app.post('/api/lesson-plans/:id/submit', 
  authenticateToken,
  checkPermission('lesson_plan', 'submit'),
  async (req, res) => {
    // Permission check passed
    const permissionResult = req.permissionCheck;
    
    if (permissionResult.requiresApproval) {
      // Handle approval workflow
      await submitForReview(req.params.id);
    } else {
      // Auto-approve
      await autoApprove(req.params.id);
    }
  }
);
```

#### Frontend (React)
```typescript
// Check permission before showing UI element
const checkPermissionResult = await apiRequest(
  '/api/permissions/check',
  'POST',
  { resource: 'lesson_plan', action: 'approve' }
);

if (checkPermissionResult.hasPermission) {
  // Show approve button
}
```

### Custom Permission Logic

Organizations can implement custom permission logic by:

1. **Creating Permission Overrides**
   - Modify which roles require approval
   - Set auto-approval for specific roles
   - Customize per permission type

2. **Using Permission Middleware**
   - Apply permission checks to API routes
   - Implement conditional logic based on permissions
   - Track permission usage for auditing

## Best Practices

1. **Principle of Least Privilege**
   - Grant only necessary permissions
   - Start restrictive, expand as needed
   - Regular permission audits

2. **Approval Workflows**
   - Teachers submit → Directors approve
   - Assistant Directors can pre-review
   - Admins can override

3. **Permission Hierarchies**
   - Use `.manage` permissions for full access
   - Granular permissions for specific actions
   - Inherit permissions from parent resources

4. **Testing Permissions**
   - Use token switcher for role testing
   - Verify permission checks in API
   - Test approval workflows end-to-end

## Troubleshooting

### Common Issues

1. **Permission Denied Errors**
   - Check user's role in JWT token
   - Verify organization permission overrides
   - Ensure permission exists in database

2. **Auto-Approval Not Working**
   - Check autoApproveRoles array
   - Verify role name matches exactly
   - Clear any conflicting overrides

3. **UI Not Reflecting Permissions**
   - Refresh permission cache
   - Check browser console for errors
   - Verify API returns correct permissions

### Debug Commands

```javascript
// Check current user permissions
const permissions = await apiRequest('/api/permissions/check', 'POST', {
  resource: 'lesson_plan',
  action: 'submit'
});
console.log('Permission Result:', permissions);

// List all overrides
const overrides = await apiRequest('/api/permissions/overrides');
console.log('Current Overrides:', overrides);
```

## Migration from Role-Based to Permission-Based

The system has transitioned from hardcoded role checks to flexible permission-based authorization:

### Before (Role-based)
```javascript
if (user.role === 'teacher') {
  // Limited access
} else if (user.role === 'admin') {
  // Full access
}
```

### After (Permission-based)
```javascript
const permission = await checkUserPermission(
  userId, role, resource, action, organizationId
);

if (permission.hasPermission) {
  if (permission.requiresApproval) {
    // Handle approval workflow
  } else {
    // Direct access
  }
}
```

## Future Enhancements

- **Audit Logging**: Track all permission changes
- **Time-based Permissions**: Temporary permission grants
- **Delegation**: Allow users to delegate permissions
- **Custom Roles**: Organization-defined roles
- **Permission Templates**: Pre-configured permission sets
- **API Rate Limiting**: Permission-based rate limits

## Support

For permission-related issues or questions:
1. Check this guide for configuration steps
2. Review the Settings → Permissions UI
3. Use the API endpoints for programmatic access
4. Contact system administrator for role changes