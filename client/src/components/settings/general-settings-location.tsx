import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { Clock, Grid3x3, AlertCircle, ChevronRight, ChevronLeft, ChevronsRight, ChevronsLeft, Search } from "lucide-react";

interface GeneralSettingsProps {
  tenantId: string;
}

interface LocationScheduleSettings {
  scheduleType: 'time-based' | 'position-based';
  startTime?: string;
  endTime?: string;
  slotsPerDay?: number;
}

interface OrganizationSettings {
  locationSettings: { [locationId: string]: LocationScheduleSettings };
  defaultScheduleType: 'time-based' | 'position-based';
  defaultStartTime: string;
  defaultEndTime: string;
  defaultSlotsPerDay: number;
  locations?: Array<{ id: string; name: string; }>;
}

// Generate time options from 12:00 AM to 11:00 PM
const generateTimeOptions = () => {
  const options = [];
  for (let hour = 0; hour < 24; hour++) {
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const period = hour < 12 ? 'AM' : 'PM';
    const timeString = `${displayHour}:00 ${period}`;
    const value = `${hour.toString().padStart(2, '0')}:00`;
    options.push({ label: timeString, value });
  }
  return options;
};

const timeOptions = generateTimeOptions();

export function GeneralSettings({ tenantId }: GeneralSettingsProps) {
  const [settings, setSettings] = useState<OrganizationSettings>({
    locationSettings: {},
    defaultScheduleType: 'time-based',
    defaultStartTime: '06:00',
    defaultEndTime: '18:00',
    defaultSlotsPerDay: 8,
    locations: []
  });
  const [selectedLocationIds, setSelectedLocationIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [timeBasedSettings, setTimeBasedSettings] = useState({
    startTime: '06:00',
    endTime: '18:00'
  });
  const [positionBasedSettings, setPositionBasedSettings] = useState({
    slotsPerDay: 8
  });

  // Load settings from database
  const { data: dbSettings, isLoading } = useQuery({
    queryKey: ['/api/organization-settings'],
  });

  // Update local state when database settings load
  useEffect(() => {
    if (dbSettings) {
      setSettings({
        locationSettings: dbSettings.locationSettings || {},
        defaultScheduleType: dbSettings.defaultScheduleType || 'time-based',
        defaultStartTime: dbSettings.defaultStartTime || '06:00',
        defaultEndTime: dbSettings.defaultEndTime || '18:00',
        defaultSlotsPerDay: dbSettings.defaultSlotsPerDay || 8,
        locations: dbSettings.locations || []
      });
      
      // Update localStorage for each location's settings
      if (dbSettings.locations) {
        dbSettings.locations.forEach((location: any) => {
          const locationSettings = dbSettings.locationSettings?.[location.id] || {
            scheduleType: dbSettings.defaultScheduleType || 'time-based',
            startTime: dbSettings.defaultStartTime || '06:00',
            endTime: dbSettings.defaultEndTime || '18:00',
            slotsPerDay: dbSettings.defaultSlotsPerDay || 8
          };
          
          localStorage.setItem(`scheduleSettings_${location.id}`, JSON.stringify({
            type: locationSettings.scheduleType,
            startTime: locationSettings.startTime,
            endTime: locationSettings.endTime,
            slotsPerDay: locationSettings.slotsPerDay
          }));
        });
      }
    }
  }, [dbSettings]);

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (updatedSettings: OrganizationSettings) => {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/organization-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          tenantId,
          locationSettings: updatedSettings.locationSettings,
          defaultScheduleType: updatedSettings.defaultScheduleType,
          defaultStartTime: updatedSettings.defaultStartTime,
          defaultEndTime: updatedSettings.defaultEndTime,
          defaultSlotsPerDay: updatedSettings.defaultSlotsPerDay
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save settings');
      }
      
      // Update localStorage for each location
      Object.entries(updatedSettings.locationSettings).forEach(([locationId, locationSettings]) => {
        localStorage.setItem(`scheduleSettings_${locationId}`, JSON.stringify({
          type: locationSettings.scheduleType,
          startTime: locationSettings.startTime,
          endTime: locationSettings.endTime,
          slotsPerDay: locationSettings.slotsPerDay
        }));
        
        // Dispatch custom event for calendar components
        window.dispatchEvent(new CustomEvent('scheduleSettingsChanged', { 
          detail: { 
            locationId,
            ...locationSettings 
          } 
        }));
      });
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/organization-settings'] });
      toast({
        title: "Settings saved",
        description: "Your schedule settings have been saved to the database.",
      });
    },
    onError: (error: any) => {
      console.error('Error saving settings:', error);
      toast({
        title: "Error saving settings",
        description: error.message || "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleScheduleTypeChange = (locationId: string, newType: 'time-based' | 'position-based') => {
    const currentSettings = settings.locationSettings[locationId];
    if (currentSettings && currentSettings.scheduleType !== newType) {
      // Show alert about separate lesson plans
      setPendingLocationChange({ locationId, newType });
      setShowScheduleChangeAlert(true);
    } else {
      // This is a new location or same type, just update
      updateLocationSettings(locationId, { scheduleType: newType });
    }
  };

  const confirmScheduleTypeChange = () => {
    if (pendingLocationChange) {
      updateLocationSettings(pendingLocationChange.locationId, { 
        scheduleType: pendingLocationChange.newType 
      });
      setShowScheduleChangeAlert(false);
      setPendingLocationChange(null);
    }
  };

  const updateLocationSettings = (locationId: string, updates: Partial<LocationScheduleSettings>) => {
    const currentLocationSettings = settings.locationSettings[locationId] || {
      scheduleType: settings.defaultScheduleType,
      startTime: settings.defaultStartTime,
      endTime: settings.defaultEndTime,
      slotsPerDay: settings.defaultSlotsPerDay
    };

    setSettings(prev => ({
      ...prev,
      locationSettings: {
        ...prev.locationSettings,
        [locationId]: {
          ...currentLocationSettings,
          ...updates
        }
      }
    }));
  };

  const getLocationSettings = (locationId: string): LocationScheduleSettings => {
    return settings.locationSettings[locationId] || {
      scheduleType: settings.defaultScheduleType,
      startTime: settings.defaultStartTime,
      endTime: settings.defaultEndTime,
      slotsPerDay: settings.defaultSlotsPerDay
    };
  };

  const handleSave = () => {
    // Validate all location settings
    for (const [locationId, locationSettings] of Object.entries(settings.locationSettings)) {
      if (locationSettings.scheduleType === 'time-based') {
        if (!locationSettings.startTime || !locationSettings.endTime) {
          toast({
            title: "Validation error",
            description: `Please select both start and end times for ${settings.locations?.find(l => l.id === locationId)?.name || 'location'}`,
            variant: "destructive",
          });
          return;
        }
        const startHour = parseInt(locationSettings.startTime.split(':')[0]);
        const endHour = parseInt(locationSettings.endTime.split(':')[0]);
        if (startHour >= endHour) {
          toast({
            title: "Validation error",
            description: `End time must be after start time for ${settings.locations?.find(l => l.id === locationId)?.name || 'location'}`,
            variant: "destructive",
          });
          return;
        }
      } else {
        if (!locationSettings.slotsPerDay || locationSettings.slotsPerDay < 1 || locationSettings.slotsPerDay > 12) {
          toast({
            title: "Validation error",
            description: `Number of slots must be between 1 and 12 for ${settings.locations?.find(l => l.id === locationId)?.name || 'location'}`,
            variant: "destructive",
          });
          return;
        }
      }
    }

    saveSettingsMutation.mutate(settings);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>Loading settings...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      {showScheduleChangeAlert && (
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Schedule Type Change</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>
              Changing from time-based to position-based (or vice versa) will create separate lesson plans. 
              Your existing lesson plans for this schedule type will be preserved and you can switch back 
              at any time to view them.
            </p>
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={confirmScheduleTypeChange}>
                Continue with Change
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => {
                  setShowScheduleChangeAlert(false);
                  setPendingLocationChange(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>
            Configure schedule display settings for each location. Each location can use either 
            time-based or position-based scheduling.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Default Settings */}
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Default Settings for New Locations
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Default Schedule Type</Label>
                <Select
                  value={settings.defaultScheduleType}
                  onValueChange={(value: 'time-based' | 'position-based') => 
                    setSettings(prev => ({ ...prev, defaultScheduleType: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="time-based">Time-Based</SelectItem>
                    <SelectItem value="position-based">Position-Based</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {settings.defaultScheduleType === 'time-based' ? (
                <>
                  <div className="space-y-2">
                    <Label>Default Start Time</Label>
                    <Select
                      value={settings.defaultStartTime}
                      onValueChange={(value) => 
                        setSettings(prev => ({ ...prev, defaultStartTime: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Default End Time</Label>
                    <Select
                      value={settings.defaultEndTime}
                      onValueChange={(value) => 
                        setSettings(prev => ({ ...prev, defaultEndTime: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <Label>Default Slots per Day</Label>
                  <Input
                    type="number"
                    min="1"
                    max="12"
                    value={settings.defaultSlotsPerDay}
                    onChange={(e) => 
                      setSettings(prev => ({ ...prev, defaultSlotsPerDay: parseInt(e.target.value) || 8 }))
                    }
                    className="w-32"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Location-Specific Settings */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Location-Specific Schedule Settings
            </h4>
            
            {settings.locations && settings.locations.length > 0 ? (
              settings.locations.map((location) => {
                const locationSettings = getLocationSettings(location.id);
                
                return (
                  <div key={location.id} className="border rounded-lg p-4 space-y-4">
                    <h5 className="font-medium text-sm">{location.name}</h5>
                    
                    <RadioGroup
                      value={locationSettings.scheduleType}
                      onValueChange={(value: 'time-based' | 'position-based') => 
                        handleScheduleTypeChange(location.id, value)
                      }
                    >
                      <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                        <RadioGroupItem value="time-based" id={`time-based-${location.id}`} className="mt-1" />
                        <Label htmlFor={`time-based-${location.id}`} className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2 font-medium">
                            <Clock className="h-4 w-4" />
                            Time-Based Schedule
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Display activities at specific times (e.g., 9:00 AM, 10:00 AM)
                          </p>
                        </Label>
                      </div>
                      
                      <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                        <RadioGroupItem value="position-based" id={`position-based-${location.id}`} className="mt-1" />
                        <Label htmlFor={`position-based-${location.id}`} className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2 font-medium">
                            <Grid3x3 className="h-4 w-4" />
                            Position-Based Schedule
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Display activities in numbered slots (e.g., Slot 1, Slot 2)
                          </p>
                        </Label>
                      </div>
                    </RadioGroup>

                    {locationSettings.scheduleType === 'time-based' ? (
                      <div className="grid grid-cols-2 gap-4 pl-6">
                        <div className="space-y-2">
                          <Label>Start Time</Label>
                          <Select
                            value={locationSettings.startTime}
                            onValueChange={(value) => 
                              updateLocationSettings(location.id, { startTime: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {timeOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>End Time</Label>
                          <Select
                            value={locationSettings.endTime}
                            onValueChange={(value) => 
                              updateLocationSettings(location.id, { endTime: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {timeOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ) : (
                      <div className="pl-6 space-y-2">
                        <Label>Number of Activity Slots per Day</Label>
                        <Input
                          type="number"
                          min="1"
                          max="12"
                          value={locationSettings.slotsPerDay}
                          onChange={(e) => 
                            updateLocationSettings(location.id, { 
                              slotsPerDay: parseInt(e.target.value) || 8 
                            })
                          }
                          className="w-32"
                        />
                        <p className="text-sm text-gray-600">
                          Choose between 1 and 12 slots per day
                        </p>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-gray-600">
                No locations configured. Please add locations in the Locations settings.
              </p>
            )}
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button 
              onClick={handleSave} 
              disabled={saveSettingsMutation.isPending}
            >
              {saveSettingsMutation.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}