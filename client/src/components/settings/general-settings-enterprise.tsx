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
import { Badge } from "@/components/ui/badge";
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
  
  const [selectedTimeBasedIds, setSelectedTimeBasedIds] = useState<Set<string>>(new Set());
  const [selectedPositionBasedIds, setSelectedPositionBasedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [timeBasedSettings, setTimeBasedSettings] = useState({
    startTime: '06:00',
    endTime: '18:00'
  });
  const [positionBasedSettings, setPositionBasedSettings] = useState({
    slotsPerDay: 8
  });

  // Get user's permitted locations from localStorage
  const getUserPermittedLocations = () => {
    const userInfoStr = localStorage.getItem('userInfo');
    if (!userInfoStr) return [];
    try {
      const userInfo = JSON.parse(userInfoStr);
      return userInfo.locations || [];
    } catch (e) {
      console.error('Failed to parse userInfo:', e);
      return [];
    }
  };

  // Load settings from database
  const { data: dbSettings, isLoading } = useQuery({
    queryKey: ['/api/organization-settings'],
  });

  // Update local state when database settings load
  useEffect(() => {
    if (dbSettings) {
      // Get user's permitted locations (these are names, not IDs)
      const permittedLocationNames = getUserPermittedLocations();
      
      // Filter locations to only include those the user has access to (match by name)
      const filteredLocations = (dbSettings.locations || []).filter((location: any) => 
        permittedLocationNames.includes(location.name)
      );
      
      setSettings({
        locationSettings: dbSettings.locationSettings || {},
        defaultScheduleType: dbSettings.defaultScheduleType || 'time-based',
        defaultStartTime: dbSettings.defaultStartTime || '06:00',
        defaultEndTime: dbSettings.defaultEndTime || '18:00',
        defaultSlotsPerDay: dbSettings.defaultSlotsPerDay || 8,
        locations: filteredLocations
      });
      
      // Set default values for the settings panels
      setTimeBasedSettings({
        startTime: dbSettings.defaultStartTime || '06:00',
        endTime: dbSettings.defaultEndTime || '18:00'
      });
      
      setPositionBasedSettings({
        slotsPerDay: dbSettings.defaultSlotsPerDay || 8
      });
      
      // Update localStorage for each permitted location's settings
      if (filteredLocations.length > 0) {
        filteredLocations.forEach((location: any) => {
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

  // Get locations grouped by schedule type
  const getLocationsByType = () => {
    const timeBased: Array<{ id: string; name: string; }> = [];
    const positionBased: Array<{ id: string; name: string; }> = [];
    
    settings.locations?.forEach(location => {
      const locationSettings = settings.locationSettings[location.id] || {
        scheduleType: settings.defaultScheduleType
      };
      
      if (locationSettings.scheduleType === 'position-based') {
        positionBased.push(location);
      } else {
        timeBased.push(location);
      }
    });
    
    return { timeBased, positionBased };
  };

  // Filter locations based on search term
  const filterLocations = (locations: Array<{ id: string; name: string; }>) => {
    if (!searchTerm) return locations;
    return locations.filter(loc => 
      loc.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const { timeBased, positionBased } = getLocationsByType();
  const filteredTimeBased = filterLocations(timeBased);
  const filteredPositionBased = filterLocations(positionBased);

  // Move selected locations to time-based
  const moveToTimeBased = () => {
    const newSettings = { ...settings };
    selectedPositionBasedIds.forEach(locationId => {
      newSettings.locationSettings[locationId] = {
        scheduleType: 'time-based',
        startTime: timeBasedSettings.startTime,
        endTime: timeBasedSettings.endTime,
        slotsPerDay: undefined
      };
    });
    setSettings(newSettings);
    setSelectedPositionBasedIds(new Set());
  };

  // Move selected locations to position-based
  const moveToPositionBased = () => {
    const newSettings = { ...settings };
    selectedTimeBasedIds.forEach(locationId => {
      newSettings.locationSettings[locationId] = {
        scheduleType: 'position-based',
        startTime: undefined,
        endTime: undefined,
        slotsPerDay: positionBasedSettings.slotsPerDay
      };
    });
    setSettings(newSettings);
    setSelectedTimeBasedIds(new Set());
  };

  // Move all locations to time-based
  const moveAllToTimeBased = () => {
    const newSettings = { ...settings };
    positionBased.forEach(location => {
      newSettings.locationSettings[location.id] = {
        scheduleType: 'time-based',
        startTime: timeBasedSettings.startTime,
        endTime: timeBasedSettings.endTime,
        slotsPerDay: undefined
      };
    });
    setSettings(newSettings);
    setSelectedPositionBasedIds(new Set());
  };

  // Move all locations to position-based
  const moveAllToPositionBased = () => {
    const newSettings = { ...settings };
    timeBased.forEach(location => {
      newSettings.locationSettings[location.id] = {
        scheduleType: 'position-based',
        startTime: undefined,
        endTime: undefined,
        slotsPerDay: positionBasedSettings.slotsPerDay
      };
    });
    setSettings(newSettings);
    setSelectedTimeBasedIds(new Set());
  };

  const handleSave = () => {
    // Update all location settings with current panel settings
    const updatedSettings = { ...settings };
    
    // Update time-based locations
    timeBased.forEach(location => {
      updatedSettings.locationSettings[location.id] = {
        scheduleType: 'time-based',
        startTime: timeBasedSettings.startTime,
        endTime: timeBasedSettings.endTime,
        slotsPerDay: undefined
      };
    });
    
    // Update position-based locations
    positionBased.forEach(location => {
      updatedSettings.locationSettings[location.id] = {
        scheduleType: 'position-based',
        startTime: undefined,
        endTime: undefined,
        slotsPerDay: positionBasedSettings.slotsPerDay
      };
    });
    
    // Validate time settings
    const startHour = parseInt(timeBasedSettings.startTime.split(':')[0]);
    const endHour = parseInt(timeBasedSettings.endTime.split(':')[0]);
    if (startHour >= endHour) {
      toast({
        title: "Validation error",
        description: "End time must be after start time",
        variant: "destructive",
      });
      return;
    }
    
    // Validate position settings
    if (positionBasedSettings.slotsPerDay < 1 || positionBasedSettings.slotsPerDay > 12) {
      toast({
        title: "Validation error",
        description: "Number of slots must be between 1 and 12",
        variant: "destructive",
      });
      return;
    }

    saveSettingsMutation.mutate(updatedSettings);
  };

  const toggleLocationSelection = (locationId: string, isTimeBased: boolean) => {
    if (isTimeBased) {
      const newSelection = new Set(selectedTimeBasedIds);
      if (newSelection.has(locationId)) {
        newSelection.delete(locationId);
      } else {
        newSelection.add(locationId);
      }
      setSelectedTimeBasedIds(newSelection);
    } else {
      const newSelection = new Set(selectedPositionBasedIds);
      if (newSelection.has(locationId)) {
        newSelection.delete(locationId);
      } else {
        newSelection.add(locationId);
      }
      setSelectedPositionBasedIds(newSelection);
    }
  };

  const selectAllTimeBased = () => {
    setSelectedTimeBasedIds(new Set(filteredTimeBased.map(l => l.id)));
  };

  const selectAllPositionBased = () => {
    setSelectedPositionBasedIds(new Set(filteredPositionBased.map(l => l.id)));
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
    <Card>
      <CardHeader>
        <CardTitle>Schedule Settings by Location</CardTitle>
        <CardDescription>
          Assign locations to either time-based or position-based scheduling. Select locations and move them between schedule types.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-[1fr,auto,1fr] gap-4">
          {/* Time-Based Column */}
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">Time-Based Schedule</h3>
                </div>
                <Badge variant="secondary" className="bg-blue-100">
                  {timeBased.length} locations
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label className="text-xs">Start Time</Label>
                    <Select
                      value={timeBasedSettings.startTime}
                      onValueChange={(value) => 
                        setTimeBasedSettings(prev => ({ ...prev, startTime: value }))
                      }
                    >
                      <SelectTrigger className="h-8">
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
                  
                  <div className="flex-1">
                    <Label className="text-xs">End Time</Label>
                    <Select
                      value={timeBasedSettings.endTime}
                      onValueChange={(value) => 
                        setTimeBasedSettings(prev => ({ ...prev, endTime: value }))
                      }
                    >
                      <SelectTrigger className="h-8">
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
              </div>
              
              <div className="flex justify-between items-center pt-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selectAllTimeBased}
                  disabled={filteredTimeBased.length === 0}
                >
                  Select All
                </Button>
                <span className="text-xs text-gray-600">
                  {selectedTimeBasedIds.size} selected
                </span>
              </div>
            </div>

            <ScrollArea className="h-[400px] border rounded-lg p-2">
              {filteredTimeBased.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No locations with time-based scheduling
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredTimeBased.map(location => (
                    <div
                      key={location.id}
                      className={`flex items-center space-x-2 p-2 rounded hover:bg-gray-50 cursor-pointer ${
                        selectedTimeBasedIds.has(location.id) ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => toggleLocationSelection(location.id, true)}
                    >
                      <Checkbox
                        checked={selectedTimeBasedIds.has(location.id)}
                        onCheckedChange={() => toggleLocationSelection(location.id, true)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="flex-1 text-sm">{location.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Move Buttons */}
          <div className="flex flex-col justify-center items-center gap-2 px-2">
            <Button
              variant="outline"
              size="icon"
              onClick={moveAllToPositionBased}
              disabled={timeBased.length === 0}
              title="Move all to position-based"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={moveToPositionBased}
              disabled={selectedTimeBasedIds.size === 0}
              title="Move selected to position-based"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={moveToTimeBased}
              disabled={selectedPositionBasedIds.size === 0}
              title="Move selected to time-based"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={moveAllToTimeBased}
              disabled={positionBased.length === 0}
              title="Move all to time-based"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
          </div>

          {/* Position-Based Column */}
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Grid3x3 className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-green-900">Position-Based Schedule</h3>
                </div>
                <Badge variant="secondary" className="bg-green-100">
                  {positionBased.length} locations
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div>
                  <Label className="text-xs">Number of Activity Slots</Label>
                  <Input
                    type="number"
                    min="1"
                    max="12"
                    value={positionBasedSettings.slotsPerDay}
                    onChange={(e) => 
                      setPositionBasedSettings({ slotsPerDay: parseInt(e.target.value) || 8 })
                    }
                    className="h-8"
                  />
                  <p className="text-xs text-gray-600 mt-1">Between 1-12 slots per day</p>
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selectAllPositionBased}
                  disabled={filteredPositionBased.length === 0}
                >
                  Select All
                </Button>
                <span className="text-xs text-gray-600">
                  {selectedPositionBasedIds.size} selected
                </span>
              </div>
            </div>

            <ScrollArea className="h-[400px] border rounded-lg p-2">
              {filteredPositionBased.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No locations with position-based scheduling
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredPositionBased.map(location => (
                    <div
                      key={location.id}
                      className={`flex items-center space-x-2 p-2 rounded hover:bg-gray-50 cursor-pointer ${
                        selectedPositionBasedIds.has(location.id) ? 'bg-green-50' : ''
                      }`}
                      onClick={() => toggleLocationSelection(location.id, false)}
                    >
                      <Checkbox
                        checked={selectedPositionBasedIds.has(location.id)}
                        onCheckedChange={() => toggleLocationSelection(location.id, false)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="flex-1 text-sm">{location.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        {/* Alert about schedule type changes */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Important Note</AlertTitle>
          <AlertDescription>
            Time-based and position-based schedules maintain separate lesson plans. 
            When you switch a location's schedule type, its existing lesson plans for that type 
            are preserved and you can switch back at any time.
          </AlertDescription>
        </Alert>

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
  );
}