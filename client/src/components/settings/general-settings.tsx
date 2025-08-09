import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Clock, Grid3x3 } from "lucide-react";

interface GeneralSettingsProps {
  tenantId: string;
}

interface ScheduleSettings {
  type: 'time-based' | 'position-based';
  startTime?: string;
  endTime?: string;
  slotsPerDay?: number;
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
  const [scheduleSettings, setScheduleSettings] = useState<ScheduleSettings>({
    type: 'time-based',
    startTime: '06:00',
    endTime: '18:00',
    slotsPerDay: 8
  });

  // Load settings from database
  const { data: dbSettings, isLoading } = useQuery({
    queryKey: ['/api/organization-settings'],
  });

  // Update local state when database settings load
  useEffect(() => {
    if (dbSettings) {
      const settings = {
        type: dbSettings.scheduleType as 'time-based' | 'position-based',
        startTime: dbSettings.startTime,
        endTime: dbSettings.endTime,
        slotsPerDay: dbSettings.slotsPerDay
      };
      setScheduleSettings(settings);
      
      // Also update localStorage for immediate calendar updates
      localStorage.setItem('scheduleSettings', JSON.stringify(settings));
      
      // Dispatch custom event for calendar components
      window.dispatchEvent(new CustomEvent('scheduleSettingsChanged', { detail: settings }));
    }
  }, [dbSettings]);

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (settings: ScheduleSettings) => {
      // Validate settings
      if (settings.type === 'time-based') {
        if (!settings.startTime || !settings.endTime) {
          throw new Error('Please select both start and end times');
        }
        const startHour = parseInt(settings.startTime.split(':')[0]);
        const endHour = parseInt(settings.endTime.split(':')[0]);
        if (startHour >= endHour) {
          throw new Error('End time must be after start time');
        }
      } else {
        if (!settings.slotsPerDay || settings.slotsPerDay < 1 || settings.slotsPerDay > 12) {
          throw new Error('Number of slots must be between 1 and 12');
        }
      }

      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/organization-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          tenantId,
          scheduleType: settings.type,
          startTime: settings.startTime,
          endTime: settings.endTime,
          slotsPerDay: settings.slotsPerDay
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save settings');
      }
      
      // Update localStorage immediately
      localStorage.setItem('scheduleSettings', JSON.stringify(settings));
      
      // Trigger custom event for calendar components
      window.dispatchEvent(new CustomEvent('scheduleSettingsChanged', { detail: settings }));
      
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

  const handleSave = () => {
    saveSettingsMutation.mutate(scheduleSettings);
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
        <CardTitle>General Settings</CardTitle>
        <CardDescription>
          Configure how your organization's schedule is displayed and managed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Schedule Type Selection */}
        <div className="space-y-4">
          <Label>Schedule Display Type</Label>
          <RadioGroup
            value={scheduleSettings.type}
            onValueChange={(value: 'time-based' | 'position-based') => 
              setScheduleSettings({ ...scheduleSettings, type: value })
            }
          >
            <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50">
              <RadioGroupItem value="time-based" id="time-based" className="mt-1" />
              <Label htmlFor="time-based" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2 font-medium">
                  <Clock className="h-4 w-4" />
                  Time-Based Schedule
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Display activities at specific times of day (e.g., 9:00 AM, 10:00 AM)
                </p>
              </Label>
            </div>
            
            <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50">
              <RadioGroupItem value="position-based" id="position-based" className="mt-1" />
              <Label htmlFor="position-based" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2 font-medium">
                  <Grid3x3 className="h-4 w-4" />
                  Position-Based Schedule
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Display activities in numbered slots (e.g., Slot 1, Slot 2, Slot 3)
                </p>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Conditional Settings based on type */}
        {scheduleSettings.type === 'time-based' ? (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium">Time-Based Settings</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-time">Start Time</Label>
                <Select
                  value={scheduleSettings.startTime}
                  onValueChange={(value) => 
                    setScheduleSettings({ ...scheduleSettings, startTime: value })
                  }
                >
                  <SelectTrigger id="start-time">
                    <SelectValue placeholder="Select start time" />
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
                <Label htmlFor="end-time">End Time</Label>
                <Select
                  value={scheduleSettings.endTime}
                  onValueChange={(value) => 
                    setScheduleSettings({ ...scheduleSettings, endTime: value })
                  }
                >
                  <SelectTrigger id="end-time">
                    <SelectValue placeholder="Select end time" />
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
        ) : (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium">Position-Based Settings</h4>
            
            <div className="space-y-2">
              <Label htmlFor="slots-per-day">Number of Activity Slots per Day</Label>
              <Input
                id="slots-per-day"
                type="number"
                min="1"
                max="12"
                value={scheduleSettings.slotsPerDay}
                onChange={(e) => 
                  setScheduleSettings({ ...scheduleSettings, slotsPerDay: parseInt(e.target.value) || 8 })
                }
                className="w-32"
              />
              <p className="text-sm text-gray-600">
                Choose between 1 and 12 slots per day
              </p>
            </div>
          </div>
        )}

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