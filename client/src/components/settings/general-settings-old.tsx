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
  const [isSaving, setIsSaving] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('scheduleSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setScheduleSettings(parsed);
      } catch (error) {
        console.error('Error loading schedule settings:', error);
      }
    }
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Validate settings
      if (scheduleSettings.type === 'time-based') {
        if (!scheduleSettings.startTime || !scheduleSettings.endTime) {
          throw new Error('Please select both start and end times');
        }
        const startHour = parseInt(scheduleSettings.startTime.split(':')[0]);
        const endHour = parseInt(scheduleSettings.endTime.split(':')[0]);
        if (startHour >= endHour) {
          throw new Error('End time must be after start time');
        }
      } else {
        if (!scheduleSettings.slotsPerDay || scheduleSettings.slotsPerDay < 1 || scheduleSettings.slotsPerDay > 12) {
          throw new Error('Number of slots must be between 1 and 12');
        }
      }

      // Save to localStorage
      localStorage.setItem('scheduleSettings', JSON.stringify(scheduleSettings));
      
      // Trigger a custom event to notify calendar components
      window.dispatchEvent(new CustomEvent('scheduleSettingsChanged', { detail: scheduleSettings }));
      
      toast({
        title: "Settings saved",
        description: "Schedule settings have been updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error saving settings",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>General Settings</CardTitle>
        <CardDescription>Configure how your schedule calendar is displayed</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Schedule Type Selection */}
        <div className="space-y-4">
          <Label className="text-base font-semibold">Schedule Type</Label>
          <RadioGroup
            value={scheduleSettings.type}
            onValueChange={(value: 'time-based' | 'position-based') => 
              setScheduleSettings({ ...scheduleSettings, type: value })
            }
          >
            <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50">
              <RadioGroupItem value="time-based" id="time-based" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="time-based" className="flex items-center gap-2 cursor-pointer">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">Time Based</span>
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  Schedule activities based on specific time slots throughout the day
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50">
              <RadioGroupItem value="position-based" id="position-based" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="position-based" className="flex items-center gap-2 cursor-pointer">
                  <Grid3x3 className="h-4 w-4" />
                  <span className="font-medium">Position Based</span>
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  Schedule activities in numbered slots without specific times
                </p>
              </div>
            </div>
          </RadioGroup>
        </div>

        {/* Time-Based Options */}
        {scheduleSettings.type === 'time-based' && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-sm">Time Range</h4>
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
        )}

        {/* Position-Based Options */}
        {scheduleSettings.type === 'position-based' && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-sm">Schedule Configuration</h4>
            <div className="space-y-2">
              <Label htmlFor="slots-per-day">Number of Slots Per Day</Label>
              <Input
                id="slots-per-day"
                type="number"
                min="1"
                max="12"
                value={scheduleSettings.slotsPerDay || ''}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (!isNaN(value) && value >= 1 && value <= 12) {
                    setScheduleSettings({ ...scheduleSettings, slotsPerDay: value });
                  }
                }}
                placeholder="Enter number of slots (1-12)"
                className="max-w-xs"
              />
              <p className="text-sm text-gray-600">
                Each day will have {scheduleSettings.slotsPerDay || 8} slots for activities
              </p>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="bg-gradient-to-r from-turquoise to-sky-blue hover:from-turquoise/90 hover:to-sky-blue/90"
          >
            {isSaving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}