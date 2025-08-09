import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { format, addDays } from "date-fns";
import { Clock, Undo2, Package, Scissors } from "lucide-react";
import type { Activity } from "@shared/schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TabletWeeklyCalendarProps {
  currentWeekDate: Date;
  selectedLocation: string;
  selectedRoom: string;
  selectedActivity: Activity | null;
  onSlotTap: (day: number, slot: number) => void;
}

// Generate time slots based on schedule settings
const generateTimeSlots = (scheduleSettings: any) => {
  if (scheduleSettings?.type === 'position-based') {
    const slots = [];
    const slotsCount = scheduleSettings.slotsPerDay || 8;
    for (let i = 0; i < slotsCount; i++) {
      slots.push({
        id: i,
        label: `${i + 1}`,
        name: `Position ${i + 1}`
      });
    }
    return slots;
  } else {
    // Time-based slots
    const startHour = parseInt(scheduleSettings?.startTime?.split(':')[0] || '6');
    const endHour = parseInt(scheduleSettings?.endTime?.split(':')[0] || '18');
    const slots = [];
    
    for (let hour = startHour, id = 0; hour <= endHour; hour++, id++) {
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      const timeLabel = `${displayHour}:00`;
      slots.push({
        id,
        label: timeLabel,
        name: `Time Slot ${id + 1}`
      });
    }
    return slots;
  }
};

const generateWeekDays = (weekStartDate: Date) => {
  const days = [];
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  
  for (let i = 0; i < 5; i++) {
    const date = addDays(weekStartDate, i);
    days.push({
      id: i,
      name: dayNames[i],
      date: format(date, 'd'),
      fullDate: date
    });
  }
  
  return days;
};

export function TabletWeeklyCalendar({ 
  currentWeekDate, 
  selectedLocation, 
  selectedRoom,
  selectedActivity,
  onSlotTap 
}: TabletWeeklyCalendarProps) {
  const weekDays = generateWeekDays(currentWeekDate);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<any>(null);
  const [recentlyDeleted, setRecentlyDeleted] = useState<any>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const undoTimer = useRef<NodeJS.Timeout | null>(null);
  const [scheduleSettings, setScheduleSettings] = useState<any>({
    type: 'time-based',
    startTime: '06:00',
    endTime: '18:00',
    slotsPerDay: 8
  });
  const [draggedActivity, setDraggedActivity] = useState<any>(null);
  const [dragOverSlot, setDragOverSlot] = useState<{day: number, slot: number} | null>(null);

  // Load schedule settings from localStorage for the specific location
  useEffect(() => {
    const loadSettings = () => {
      // Try to load location-specific settings first
      const locationSettings = localStorage.getItem(`scheduleSettings_${selectedLocation}`);
      if (locationSettings) {
        try {
          const parsed = JSON.parse(locationSettings);
          setScheduleSettings(parsed);
        } catch (error) {
          console.error('Error loading location schedule settings:', error);
        }
      } else {
        // Fall back to general settings if no location-specific settings exist
        const savedSettings = localStorage.getItem('scheduleSettings');
        if (savedSettings) {
          try {
            const parsed = JSON.parse(savedSettings);
            setScheduleSettings(parsed);
          } catch (error) {
            console.error('Error loading schedule settings:', error);
          }
        }
      }
    };

    loadSettings();

    // Listen for settings changes
    const handleSettingsChange = (event: CustomEvent) => {
      // Only update if the change is for the current location or a general update
      if (!event.detail.locationId || event.detail.locationId === selectedLocation) {
        const { locationId, ...settings } = event.detail;
        setScheduleSettings(settings);
      }
    };

    window.addEventListener('scheduleSettingsChanged' as any, handleSettingsChange as any);
    return () => {
      window.removeEventListener('scheduleSettingsChanged' as any, handleSettingsChange as any);
    };
  }, [selectedLocation]);

  // Generate time slots based on current settings
  const timeSlots = generateTimeSlots(scheduleSettings);

  // Fetch scheduled activities
  const { data: scheduledActivities = [] } = useQuery<any[]>({
    queryKey: ["/api/scheduled-activities", selectedRoom, currentWeekDate.toISOString(), selectedLocation],
    queryFn: async () => {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `/api/scheduled-activities/${selectedRoom}?weekStart=${encodeURIComponent(currentWeekDate.toISOString())}&locationId=${encodeURIComponent(selectedLocation)}`,
        {
          headers: {
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
        }
      );
      if (!response.ok) throw new Error('Failed to fetch scheduled activities');
      return response.json();
    },
    enabled: !!selectedRoom && !!selectedLocation,
  });

  // Delete scheduled activity mutation
  const deleteScheduledMutation = useMutation({
    mutationFn: async (scheduledActivityId: string) => {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/scheduled-activities/${scheduledActivityId}`, {
        method: 'DELETE',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete');
      }
      
      if (response.status === 204) {
        return { success: true };
      }
      
      return response.json();
    },
    onSuccess: (_, deletedId) => {
      // Store the deleted activity for undo
      const deletedActivity = scheduledActivities.find((a: any) => a.id === deletedId);
      if (deletedActivity) {
        setRecentlyDeleted(deletedActivity);
        // Clear undo after 30 seconds
        if (undoTimer.current) clearTimeout(undoTimer.current);
        undoTimer.current = setTimeout(() => {
          setRecentlyDeleted(null);
        }, 30000);
      }
      
      queryClient.invalidateQueries({ 
        queryKey: ['/api/scheduled-activities', selectedRoom, currentWeekDate.toISOString(), selectedLocation] 
      });
      toast({
        title: "Activity Removed",
        description: "Tap the undo button to restore.",
      });
      setDeleteDialogOpen(false);
      setActivityToDelete(null);
    },
  });

  const isSlotOccupied = (dayOfWeek: number, timeSlot: number) => {
    return scheduledActivities.find(
      (scheduled: any) => 
        scheduled.dayOfWeek === dayOfWeek && 
        scheduled.timeSlot === timeSlot &&
        scheduled.roomId === selectedRoom
    );
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Social Development":
        return "from-green-100 via-emerald-100 to-teal-100 border-green-300 shadow-green-200/50";
      case "Art & Creativity":
        return "from-pink-100 via-rose-100 to-fuchsia-100 border-pink-300 shadow-pink-200/50";
      case "Physical Development":
        return "from-cyan-100 via-sky-100 to-blue-100 border-blue-300 shadow-blue-200/50";
      case "Cognitive Development":
        return "from-indigo-100 via-purple-100 to-violet-100 border-indigo-300 shadow-indigo-200/50";
      default:
        return "from-gray-100 via-slate-100 to-gray-200 border-gray-300 shadow-gray-200/50";
    }
  };

  const handleTouchStart = (e: React.TouchEvent, scheduledActivity: any) => {
    // Store the initial touch position
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    
    // Start the long press timer
    longPressTimer.current = setTimeout(() => {
      // Trigger haptic feedback if available
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
      setActivityToDelete(scheduledActivity);
      setDeleteDialogOpen(true);
    }, 500); // 500ms for long press
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Cancel long press if user moves finger too much
    if (touchStartPos.current && longPressTimer.current) {
      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - touchStartPos.current.x);
      const deltaY = Math.abs(touch.clientY - touchStartPos.current.y);
      
      // If finger moved more than 10 pixels, cancel the long press
      if (deltaX > 10 || deltaY > 10) {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
      }
    }
  };

  const handleTouchEnd = () => {
    // Clear the timer if touch ends before long press triggers
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    touchStartPos.current = null;
  };

  const handleDeleteConfirm = () => {
    if (activityToDelete) {
      deleteScheduledMutation.mutate(activityToDelete.id);
    }
  };

  // Add scheduled activity mutation for undo
  const addScheduledMutation = useMutation({
    mutationFn: async (scheduledActivity: any) => {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/scheduled-activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          lessonPlanId: scheduledActivity.lessonPlanId,
          activityId: scheduledActivity.activityId,
          dayOfWeek: scheduledActivity.dayOfWeek,
          timeSlot: scheduledActivity.timeSlot,
          roomId: scheduledActivity.roomId,
          locationId: selectedLocation,
          weekStart: currentWeekDate.toISOString(),
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to restore activity');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/scheduled-activities', selectedRoom, currentWeekDate.toISOString(), selectedLocation] 
      });
      toast({
        title: "Activity Restored",
        description: "The activity has been added back to the schedule.",
      });
      setRecentlyDeleted(null);
      if (undoTimer.current) clearTimeout(undoTimer.current);
    },
  });

  // Move activity mutation for drag and drop
  const moveActivityMutation = useMutation({
    mutationFn: async ({ scheduledActivityId, newDay, newSlot }: { scheduledActivityId: string, newDay: number, newSlot: number }) => {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/scheduled-activities/${scheduledActivityId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          dayOfWeek: newDay,
          timeSlot: newSlot,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to move activity');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/scheduled-activities', selectedRoom, currentWeekDate.toISOString(), selectedLocation] 
      });
      toast({
        title: "Activity Moved",
        description: "The activity has been moved to the new time slot.",
      });
      setDraggedActivity(null);
      setDragOverSlot(null);
    },
  });

  const handleUndo = () => {
    if (recentlyDeleted) {
      addScheduledMutation.mutate(recentlyDeleted);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, scheduledActivity: any) => {
    setDraggedActivity(scheduledActivity);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', scheduledActivity.id);
  };

  const handleDragOver = (e: React.DragEvent, day: number, slot: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSlot({ day, slot });
  };

  const handleDragLeave = () => {
    setDragOverSlot(null);
  };

  const handleDrop = (e: React.DragEvent, targetDay: number, targetSlot: number) => {
    e.preventDefault();
    setDragOverSlot(null);
    
    if (!draggedActivity) return;
    
    // Check if target slot is already occupied
    const targetOccupied = isSlotOccupied(targetDay, targetSlot);
    if (targetOccupied) {
      toast({
        title: "Cannot Move",
        description: "The target time slot is already occupied.",
        variant: "destructive"
      });
      return;
    }
    
    // Don't move if dropping on the same slot
    if (draggedActivity.dayOfWeek === targetDay && draggedActivity.timeSlot === targetSlot) {
      return;
    }
    
    // Move the activity
    moveActivityMutation.mutate({
      scheduledActivityId: draggedActivity.id,
      newDay: targetDay,
      newSlot: targetSlot
    });
  };

  // Clear undo state when adding a new activity
  useEffect(() => {
    if (selectedActivity) {
      setRecentlyDeleted(null);
      if (undoTimer.current) clearTimeout(undoTimer.current);
    }
  }, [selectedActivity]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (undoTimer.current) clearTimeout(undoTimer.current);
    };
  }, []);

  return (
    <div className="h-full overflow-auto p-4 relative">
      {/* Undo Button */}
      {recentlyDeleted && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 animate-slide-up">
          <Button
            onClick={handleUndo}
            disabled={addScheduledMutation.isPending}
            className="bg-gradient-to-r from-charcoal to-gray-700 hover:from-charcoal/90 hover:to-gray-700/90 text-white rounded-full shadow-2xl px-6 py-3 flex items-center gap-2"
            data-testid="undo-delete-button"
          >
            <Undo2 className="h-5 w-5" />
            <span>Undo Remove</span>
          </Button>
        </div>
      )}
      <div className="min-h-full">
        {/* Calendar Grid - Optimized for touch */}
        <div className="grid gap-2 bg-gradient-to-br from-white via-white to-gray-50 rounded-2xl shadow-2xl p-3 border border-gray-100" style={{gridTemplateColumns: "80px repeat(5, 1fr)"}}>
          {/* Position Column */}
          <div className="space-y-2">
            <div className="h-12 flex items-center justify-center text-xs font-bold bg-gradient-to-r from-turquoise/20 to-sky-blue/20 rounded-lg">
              {scheduleSettings.type === 'position-based' ? 'Position' : 'Time'}
            </div>
            {timeSlots.map((slot) => (
              <div 
                key={slot.id} 
                className="h-16 flex items-center justify-center bg-gradient-to-br from-white to-gray-50 rounded-lg shadow-sm border border-gray-100 text-center p-1"
              >
                <span className="text-xs font-bold text-[#000000]">Position {slot.label}</span>
              </div>
            ))}
          </div>

          {/* Days */}
          {weekDays.map((day) => (
            <div key={day.id} className="space-y-2">
              {/* Day Header */}
              <div className="h-12 bg-gradient-to-br from-turquoise/30 via-sky-blue/20 to-mint-green/30 rounded-lg shadow-sm flex flex-col items-center justify-center border border-turquoise/20">
                <span className="text-xs font-bold text-charcoal">{day.name}</span>
                <span className="text-[10px] text-gray-600">{day.date}</span>
              </div>
              
              {/* Time Slots */}
              {timeSlots.map((slot) => {
                const scheduledActivity = isSlotOccupied(day.id, slot.id);
                const isSelected = selectedActivity !== null;
                
                return (
                  <div key={slot.id}>
                    {scheduledActivity ? (
                      <div
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, scheduledActivity)}
                        className={`h-20 w-full p-2 rounded-lg bg-gradient-to-br ${getCategoryColor(scheduledActivity.activity?.category || '')} border-2 transition-all cursor-move active:scale-95 shadow-lg hover:shadow-xl ${
                          draggedActivity?.id === scheduledActivity.id ? 'opacity-50 scale-95' : ''
                        }`}
                        onTouchStart={(e) => handleTouchStart(e, scheduledActivity)}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        onTouchCancel={handleTouchEnd}
                        data-testid={`scheduled-activity-${day.id}-${slot.id}`}
                      >
                        <div className="h-full flex flex-col justify-between relative">
                          {scheduledActivity.activity?.materialIds && scheduledActivity.activity.materialIds.length > 0 && (
                            <div className="absolute top-0 right-0" title="Materials required">
                              <Scissors className="h-3.5 w-3.5 text-gray-600" />
                            </div>
                          )}
                          <div className="flex-1 pr-5">
                            <p className="text-sm font-bold line-clamp-2 text-gray-700 leading-tight">
                              {scheduledActivity.activity?.title}
                            </p>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5 text-gray-600" />
                              <span className="text-xs text-gray-600 font-medium">
                                {scheduledActivity.activity?.duration}m
                              </span>
                            </div>
                            <span className="text-xs text-gray-600">
                              {scheduledActivity.activity?.category}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        onDragOver={(e) => handleDragOver(e, day.id, slot.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, day.id, slot.id)}
                        className={`h-20 w-full p-1 rounded-lg transition-all ${
                          dragOverSlot?.day === day.id && dragOverSlot?.slot === slot.id
                            ? 'bg-gradient-to-br from-turquoise/30 to-sky-blue/30 border-2 border-dashed border-turquoise scale-105'
                            : isSelected 
                            ? 'bg-gradient-to-br from-turquoise/20 to-sky-blue/20 border-2 border-dashed border-turquoise hover:from-turquoise/30 hover:to-sky-blue/30 shadow-inner' 
                            : 'bg-white border border-gray-200 hover:bg-gray-50 shadow-sm hover:shadow-md'
                        }`}
                        data-testid={`slot-${day.id}-${slot.id}`}
                      >
                        <button
                          onClick={() => onSlotTap(day.id, slot.id)}
                          className="h-full w-full flex items-center justify-center"
                        >
                          {dragOverSlot?.day === day.id && dragOverSlot?.slot === slot.id ? (
                            <span className="text-xs font-bold text-turquoise animate-pulse">Drop Here</span>
                          ) : isSelected ? (
                            <span className="text-xs font-bold text-turquoise animate-pulse">Tap</span>
                          ) : (
                            <span className="text-lg text-gray-300 hover:text-gray-400">+</span>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[90%] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Activity</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{activityToDelete?.activity?.title}" from the schedule? You can undo this action using the undo button that will appear.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setActivityToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}