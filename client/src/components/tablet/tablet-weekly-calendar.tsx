import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { format, addDays } from "date-fns";
import { Clock } from "lucide-react";
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

const timeSlots = [
  { id: 0, label: "6:00", name: "Early" },
  { id: 1, label: "7:00", name: "Breakfast" },
  { id: 2, label: "8:00", name: "Play" },
  { id: 3, label: "9:00", name: "Circle" },
  { id: 4, label: "10:00", name: "Activity" },
  { id: 5, label: "11:00", name: "Learning" },
  { id: 6, label: "12:00", name: "Lunch" },
  { id: 7, label: "1:00", name: "Rest" },
  { id: 8, label: "2:00", name: "Activities" },
  { id: 9, label: "3:00", name: "Snack" },
  { id: 10, label: "4:00", name: "Outdoor" },
  { id: 11, label: "5:00", name: "Free" },
  { id: 12, label: "6:00", name: "Pickup" },
];

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
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);

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
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/scheduled-activities', selectedRoom, currentWeekDate.toISOString(), selectedLocation] 
      });
      toast({
        title: "Activity Removed",
        description: "The activity has been removed from the schedule.",
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
        return "from-green-100 to-emerald-200 border-green-300";
      case "Art & Creativity":
        return "from-pink-100 to-rose-200 border-pink-300";
      case "Physical Development":
        return "from-cyan-100 to-blue-200 border-blue-300";
      case "Cognitive Development":
        return "from-blue-100 to-indigo-200 border-indigo-300";
      default:
        return "from-gray-100 to-gray-200 border-gray-300";
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

  return (
    <div className="h-full overflow-auto p-4">
      <div className="min-h-full">
        {/* Calendar Grid - Optimized for touch */}
        <div className="grid grid-cols-6 gap-1 bg-white rounded-lg shadow-lg p-2">
          {/* Time Column */}
          <div className="space-y-1">
            <div className="h-12 flex items-center justify-center text-xs font-bold text-turquoise">
              Time
            </div>
            {timeSlots.map((slot) => (
              <div 
                key={slot.id} 
                className="h-16 flex flex-col items-center justify-center bg-gradient-to-b from-mint-green/10 to-sky-blue/10 rounded text-center p-1"
              >
                <span className="text-xs font-semibold text-charcoal">{slot.label}</span>
                <span className="text-xs text-gray-500">{slot.name}</span>
              </div>
            ))}
          </div>

          {/* Days */}
          {weekDays.map((day) => (
            <div key={day.id} className="space-y-1">
              {/* Day Header */}
              <div className="h-12 bg-gradient-to-b from-turquoise/20 to-mint-green/20 rounded flex flex-col items-center justify-center">
                <span className="text-xs font-bold text-charcoal">{day.name}</span>
                <span className="text-xs text-gray-600">{day.date}</span>
              </div>
              
              {/* Time Slots */}
              {timeSlots.map((slot) => {
                const scheduledActivity = isSlotOccupied(day.id, slot.id);
                const isSelected = selectedActivity !== null;
                
                return (
                  <div key={slot.id}>
                    {scheduledActivity ? (
                      <div
                        className={`h-16 w-full p-1 rounded bg-gradient-to-br ${getCategoryColor(scheduledActivity.activity?.category || '')} border-2 transition-all cursor-pointer active:scale-95`}
                        onTouchStart={(e) => handleTouchStart(e, scheduledActivity)}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        onTouchCancel={handleTouchEnd}
                        data-testid={`scheduled-activity-${day.id}-${slot.id}`}
                      >
                        <div className="h-full flex flex-col justify-between">
                          <p className="text-xs font-semibold line-clamp-2 text-charcoal">
                            {scheduledActivity.activity?.title}
                          </p>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-gray-500" />
                            <span className="text-xs text-gray-600">
                              {scheduledActivity.activity?.duration}m
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => onSlotTap(day.id, slot.id)}
                        className={`h-16 w-full p-1 rounded transition-all ${
                          isSelected 
                            ? 'bg-turquoise/10 border-2 border-dashed border-turquoise hover:bg-turquoise/20' 
                            : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                        }`}
                        data-testid={`slot-${day.id}-${slot.id}`}
                      >
                        <div className="h-full flex items-center justify-center">
                          {isSelected ? (
                            <span className="text-xs text-turquoise font-medium">Tap</span>
                          ) : (
                            <span className="text-xs text-gray-400">+</span>
                          )}
                        </div>
                      </button>
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
              Are you sure you want to remove "{activityToDelete?.activity?.title}" from the schedule? This action cannot be undone.
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