import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Info, Save, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { setPermissionOverrides } from '@/lib/permission-utils';

interface PermissionOverride {
  id?: string;
  tenantId: string;
  permissionName: string;
  rolesRequired: string[];
  autoApproveRoles: string[];
}

const ROLES = [
  { id: 'teacher', name: 'Teacher', description: 'Basic educator role' },
  { id: 'assistant_director', name: 'Assistant Director', description: 'Mid-level management' },
  { id: 'director', name: 'Director', description: 'Location management' },
  { id: 'admin', name: 'Admin', description: 'Organization administration' },
  { id: 'superadmin', name: 'Super Admin', description: 'Full system access' },
];

const PERMISSION_GROUPS = {
  'Lesson Plans': [
    { name: 'lesson_plan.submit', description: 'Submit lesson plans for review' },
    { name: 'lesson_plan.approve', description: 'Review lesson plans (approve/reject)', isReviewPermission: true },
    { name: 'lesson_plan.copy', description: 'Copy lesson plans to other rooms' },
  ],
  'Activities': [
    { name: 'activity.create', description: 'Create new activities' },
    { name: 'activity.update', description: 'Edit existing activities' },
    { name: 'activity.delete', description: 'Delete activities' },
  ],
  'Materials': [
    { name: 'material.create', description: 'Create new materials' },
    { name: 'material.update', description: 'Edit existing materials' },
    { name: 'material.delete', description: 'Delete materials' },
  ],
  'Settings': [
    { name: 'settings.access', description: 'Access Settings Page', isSettingsPermission: true },
  ],
};

export default function PermissionSettings() {
  const { toast } = useToast();
  const [overrides, setOverrides] = useState<{ [key: string]: PermissionOverride }>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Get organization ID from auth context
  const tenantId = localStorage.getItem('tenantId') || '7cb6c28d-164c-49fa-b461-dfc47a8a3fed';

  // Fetch existing permission overrides
  const { data: existingOverrides, isLoading } = useQuery({
    queryKey: ['/api/permissions/overrides'],
    enabled: !!tenantId,
  });

  useEffect(() => {
    if (existingOverrides && Array.isArray(existingOverrides)) {
      const overrideMap: { [key: string]: PermissionOverride } = {};
      existingOverrides.forEach((override: PermissionOverride) => {
        overrideMap[override.permissionName] = override;
      });
      
      // Sync lesson_plan.approve with lesson_plan.reject (use approve as the source of truth for the UI)
      // If only reject exists, copy it to approve for the UI
      if (overrideMap['lesson_plan.reject'] && !overrideMap['lesson_plan.approve']) {
        overrideMap['lesson_plan.approve'] = {
          ...overrideMap['lesson_plan.reject'],
          permissionName: 'lesson_plan.approve'
        };
      }
      
      setOverrides(overrideMap);
    }
  }, [existingOverrides]);

  // Save permission overrides
  const saveMutation = useMutation({
    mutationFn: async (updates: PermissionOverride[]) => {
      console.log('Saving permission overrides:', updates);
      const promises = updates.map(override => {
        // Remove timestamp fields for updates
        const { createdAt, updatedAt, ...cleanData } = override;
        return apiRequest(
          override.id ? 'PATCH' : 'POST',
          override.id ? `/api/permissions/overrides/${override.id}` : '/api/permissions/overrides',
          cleanData
        );
      });
      return Promise.all(promises);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/permissions/overrides'] });
      // Update the cached permission overrides in localStorage
      setPermissionOverrides(variables.map(override => ({
        permissionName: override.permissionName,
        autoApproveRoles: override.autoApproveRoles
      })));
      toast({
        title: 'Success',
        description: 'Permission settings saved successfully',
      });
      setHasChanges(false);
    },
    onError: (error) => {
      console.error('Failed to save permission settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save permission settings',
        variant: 'destructive',
      });
    },
  });

  const handleRoleToggle = (permissionName: string, role: string, type: 'require' | 'autoApprove') => {
    setOverrides(prev => {
      const current = prev[permissionName] || {
        tenantId: tenantId,
        permissionName,
        rolesRequired: [],
        autoApproveRoles: [],
      };

      const updated = { ...current };
      
      if (type === 'require') {
        if (updated.rolesRequired.includes(role)) {
          updated.rolesRequired = updated.rolesRequired.filter(r => r !== role);
        } else {
          updated.rolesRequired = [...updated.rolesRequired, role];
          // Remove from auto-approve if adding to required
          updated.autoApproveRoles = updated.autoApproveRoles.filter(r => r !== role);
        }
      } else {
        if (updated.autoApproveRoles.includes(role)) {
          updated.autoApproveRoles = updated.autoApproveRoles.filter(r => r !== role);
        } else {
          updated.autoApproveRoles = [...updated.autoApproveRoles, role];
          // Remove from required if adding to auto-approve
          updated.rolesRequired = updated.rolesRequired.filter(r => r !== role);
        }
      }

      setHasChanges(true);
      return { ...prev, [permissionName]: updated };
    });
  };

  const handleSave = () => {
    const updates = Object.values(overrides);
    
    // If lesson_plan.approve is being saved, also sync lesson_plan.reject with the same settings
    const approveOverride = overrides['lesson_plan.approve'];
    if (approveOverride) {
      // Create or update reject permission to match approve permission
      const rejectOverride = {
        ...approveOverride,
        permissionName: 'lesson_plan.reject',
        id: overrides['lesson_plan.reject']?.id // Preserve existing ID if it exists
      };
      updates.push(rejectOverride);
    }
    
    // Remove duplicates by permission name (keeping the last one)
    const uniqueUpdates = updates.reduce((acc, curr) => {
      acc[curr.permissionName] = curr;
      return acc;
    }, {} as { [key: string]: PermissionOverride });
    
    saveMutation.mutate(Object.values(uniqueUpdates));
  };

  const handleReset = () => {
    if (existingOverrides && Array.isArray(existingOverrides)) {
      const overrideMap: { [key: string]: PermissionOverride } = {};
      existingOverrides.forEach((override: PermissionOverride) => {
        overrideMap[override.permissionName] = override;
      });
      setOverrides(overrideMap);
      setHasChanges(false);
    }
  };

  if (isLoading) {
    return <div>Loading permission settings...</div>;
  }

  return (
    <Card className="w-full" data-testid="permission-settings">
      <CardHeader>
        <CardTitle>Permission Management</CardTitle>
      </CardHeader>
      <CardContent>
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Configure which roles require approval for specific actions. Roles marked as "Requires Approval" 
            will need their actions to be reviewed. Roles marked as "Auto-Approve" bypass the approval process.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="lesson-plans" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="lesson-plans">Lesson Plans</TabsTrigger>
            <TabsTrigger value="activities">Activities</TabsTrigger>
            <TabsTrigger value="materials">Materials</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {Object.entries(PERMISSION_GROUPS).map(([groupName, permissions]) => (
            <TabsContent key={groupName} value={groupName.toLowerCase().replace(' ', '-')}>
              <div className="space-y-6">
                {permissions.map(permission => {
                  const override = overrides[permission.name];
                  
                  // For review permissions, only show which roles can access the review tab
                  if ((permission as any).isReviewPermission) {
                    return (
                      <Card key={permission.name} className="p-4">
                        <div className="mb-4">
                          <h4 className="font-semibold">{permission.description}</h4>
                          <p className="text-sm text-muted-foreground">
                            Select which roles can access the Review tab and approve or reject submitted lesson plans
                          </p>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium mb-2 block">Roles with Review Access</Label>
                            <div className="grid grid-cols-2 gap-3">
                              {ROLES.filter(r => r.id !== 'superadmin').map(role => (
                                <div key={role.id} className="flex items-center space-x-2">
                                  <Switch
                                    id={`${permission.name}-${role.id}-access`}
                                    checked={override?.autoApproveRoles?.includes(role.id) || false}
                                    onCheckedChange={() => handleRoleToggle(permission.name, role.id, 'autoApprove')}
                                    data-testid={`switch-review-access-${role.id}`}
                                  />
                                  <Label htmlFor={`${permission.name}-${role.id}-access`} className="text-sm">
                                    {role.name}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  }
                  
                  // For Settings permissions, only show which roles can access Settings
                  if ((permission as any).isSettingsPermission) {
                    return (
                      <Card key={permission.name} className="p-4">
                        <div className="mb-4">
                          <h4 className="font-semibold">{permission.description}</h4>
                          <p className="text-sm text-muted-foreground">
                            Select which roles can access the Settings page and configure organization settings
                          </p>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium mb-2 block">Roles with Settings Access</Label>
                            <div className="grid grid-cols-2 gap-3">
                              {ROLES.filter(r => r.id !== 'superadmin').map(role => (
                                <div key={role.id} className="flex items-center space-x-2">
                                  <Switch
                                    id={`${permission.name}-${role.id}-access`}
                                    checked={override?.autoApproveRoles?.includes(role.id) || false}
                                    onCheckedChange={() => handleRoleToggle(permission.name, role.id, 'autoApprove')}
                                    data-testid={`switch-settings-access-${role.id}`}
                                  />
                                  <Label htmlFor={`${permission.name}-${role.id}-access`} className="text-sm">
                                    {role.name}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  }
                  
                  // For copy permission, only show which roles can copy
                  if (permission.name === 'lesson_plan.copy') {
                    return (
                      <Card key={permission.name} className="p-4">
                        <div className="mb-4">
                          <h4 className="font-semibold">{permission.description}</h4>
                          <p className="text-sm text-muted-foreground">
                            Select which roles can copy approved lesson plans to other rooms
                          </p>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium mb-2 block">Roles with Copy Permission</Label>
                            <div className="grid grid-cols-2 gap-3">
                              {ROLES.filter(r => r.id !== 'superadmin').map(role => (
                                <div key={role.id} className="flex items-center space-x-2">
                                  <Switch
                                    id={`${permission.name}-${role.id}-access`}
                                    checked={override?.autoApproveRoles?.includes(role.id) || false}
                                    onCheckedChange={() => handleRoleToggle(permission.name, role.id, 'autoApprove')}
                                    data-testid={`switch-copy-access-${role.id}`}
                                  />
                                  <Label htmlFor={`${permission.name}-${role.id}-access`} className="text-sm">
                                    {role.name}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  }
                  
                  // Regular permissions show both requires approval and auto-approve
                  return (
                    <Card key={permission.name} className="p-4">
                      <div className="mb-4">
                        <h4 className="font-semibold">{permission.description}</h4>
                        <p className="text-sm text-muted-foreground">Permission: {permission.name}</p>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium mb-2 block">Requires Approval</Label>
                          <div className="grid grid-cols-2 gap-3">
                            {ROLES.filter(r => r.id !== 'superadmin').map(role => (
                              <div key={role.id} className="flex items-center space-x-2">
                                <Switch
                                  id={`${permission.name}-${role.id}-require`}
                                  checked={override?.rolesRequired?.includes(role.id) || false}
                                  onCheckedChange={() => handleRoleToggle(permission.name, role.id, 'require')}
                                  disabled={override?.autoApproveRoles?.includes(role.id)}
                                  data-testid={`switch-require-${permission.name}-${role.id}`}
                                />
                                <Label htmlFor={`${permission.name}-${role.id}-require`} className="text-sm">
                                  {role.name}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium mb-2 block">Auto-Approve (No Review Needed)</Label>
                          <div className="grid grid-cols-2 gap-3">
                            {ROLES.filter(r => r.id !== 'superadmin').map(role => (
                              <div key={role.id} className="flex items-center space-x-2">
                                <Switch
                                  id={`${permission.name}-${role.id}-auto`}
                                  checked={override?.autoApproveRoles?.includes(role.id) || false}
                                  onCheckedChange={() => handleRoleToggle(permission.name, role.id, 'autoApprove')}
                                  disabled={override?.rolesRequired?.includes(role.id)}
                                  data-testid={`switch-auto-${permission.name}-${role.id}`}
                                />
                                <Label htmlFor={`${permission.name}-${role.id}-auto`} className="text-sm">
                                  {role.name}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <div className="flex justify-end space-x-3 mt-6">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={!hasChanges}
            data-testid="button-reset-permissions"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset Changes
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saveMutation.isPending}
            data-testid="button-save-permissions"
          >
            <Save className="mr-2 h-4 w-4" />
            {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}