import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Search, Plus, Play, Package, Filter, X, Trash2, Clock, Scissors, Lock, CheckCircle, AlertCircle, MessageSquare, Star, Trophy, Sparkles, CheckCircle2 } from "lucide-react";
import DraggableActivity from "./draggable-activity";
import { toast } from "@/hooks/use-toast";
import type { Activity, Category, AgeGroup } from "@shared/schema";
import { format, addDays, startOfWeek } from "date-fns";

interface WeeklyCalendarProps {
  selectedLocation: string;
  selectedRoom: string;
  currentWeekDate?: Date;
  currentLessonPlan?: any;
  isReviewMode?: boolean;
}

// Convert numbers to written words
const numberToWord = (num: number): string => {
  const words = [
    'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 
    'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen',
    'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen', 'Twenty'
  ];
  return words[num - 1] || `${num}`;
};

// Generate time slots based on schedule settings
const generateTimeSlots = (scheduleSettings: any) => {
  if (scheduleSettings?.type === 'position-based') {
    const slots = [];
    const slotsCount = scheduleSettings.slotsPerDay || 8;
    for (let i = 0; i < slotsCount; i++) {
      slots.push({
        id: i,
        label: numberToWord(i + 1),
        name: `Activity ${i + 1}`
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
      const period = hour < 12 ? 'AM' : 'PM';
      slots.push({
        id,
        label: `${displayHour}:00 ${period}`,
        name: `Time Slot ${id + 1}`
      });
    }
    return slots;
  }
};

const generateWeekDays = (weekStartDate: Date) => {
  const days = [];
  const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  
  // weekStartDate should already be a Monday, so use it directly
  for (let i = 0; i < 5; i++) {
    const date = addDays(weekStartDate, i);
    days.push({
      id: i,
      name: dayNames[i],
      date: format(date, 'MMM d'),
      fullDate: date
    });
  }
  
  return days;
};

export default function WeeklyCalendar({ selectedLocation, selectedRoom, currentWeekDate, currentLessonPlan, isReviewMode = false }: WeeklyCalendarProps) {
  // Ensure we're working with the correct date in local timezone
  const weekStartDate = currentWeekDate ? new Date(currentWeekDate.getFullYear(), currentWeekDate.getMonth(), currentWeekDate.getDate()) : startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = generateWeekDays(weekStartDate);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [draggedActivity, setDraggedActivity] = useState<Activity | null>(null);
  const [draggedScheduledActivity, setDraggedScheduledActivity] = useState<any>(null);
  const [dragOverSlot, setDragOverSlot] = useState<{day: number, slot: number} | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all-categories");
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>("all-age-groups");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showReviewNotes, setShowReviewNotes] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: 'schedule' | 'move' | 'delete';
    data: any;
  } | null>(null);
  const [showApprovedWarning, setShowApprovedWarning] = useState(false);
  
  // Check if lesson plan is locked (in review)
  const isLessonPlanLocked = currentLessonPlan?.status === 'submitted';
  const isLessonPlanApproved = currentLessonPlan?.status === 'approved';
  // Fetch location settings from API
  const { data: locationSettings } = useQuery<{ 
    scheduleType: 'time-based' | 'position-based',
    startTime?: string,
    endTime?: string,
    slotsPerDay?: number 
  }>({
    queryKey: [`/api/locations/${selectedLocation}/settings`],
    enabled: !!selectedLocation,
  });

  // Use API settings or defaults
  const scheduleSettings = {
    type: locationSettings?.scheduleType || 'time-based',
    startTime: locationSettings?.startTime || '06:00',
    endTime: locationSettings?.endTime || '18:00',
    slotsPerDay: locationSettings?.slotsPerDay || 8
  };

  // Listen for global schedule type changes
  useEffect(() => {
    const handleScheduleTypeChange = () => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['/api/scheduled-activities'] });
      queryClient.invalidateQueries({ queryKey: [`/api/locations/${selectedLocation}/settings`] });
    };
    
    window.addEventListener('scheduleTypeChanged', handleScheduleTypeChange);
    
    return () => {
      window.removeEventListener('scheduleTypeChanged', handleScheduleTypeChange);
    };
  }, [selectedLocation]);

  // Generate time slots based on current settings
  const timeSlots = generateTimeSlots(scheduleSettings);

  const { data: activities = [], isLoading } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: ageGroups = [] } = useQuery<AgeGroup[]>({
    queryKey: ["/api/age-groups"],
  });

  // Fetch scheduled activities for the current room and week
  const { data: scheduledActivities = [] } = useQuery<any[]>({
    queryKey: ["/api/scheduled-activities", selectedRoom, weekStartDate.toISOString(), selectedLocation],
    queryFn: async () => {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `/api/scheduled-activities/${selectedRoom}?weekStart=${encodeURIComponent(weekStartDate.toISOString())}&locationId=${encodeURIComponent(selectedLocation)}`,
        {
          headers: {
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
        }
      );
      if (!response.ok) throw new Error('Failed to fetch scheduled activities');
      return response.json();
    },
    enabled: !!selectedRoom && selectedRoom !== "all" && !!selectedLocation,
  });

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all-categories" || activity.category === selectedCategory;
    const matchesAgeGroup = selectedAgeGroup === "all-age-groups" || (activity.ageGroupIds && activity.ageGroupIds.includes(selectedAgeGroup));
    return matchesSearch && matchesCategory && matchesAgeGroup;
  });

  const getCategoryStyle = (category: string) => {
    switch (category) {
      case "Social Development":
        return "activity-social";
      case "Art & Creativity":
        return "activity-art";
      case "Physical Development":
        return "activity-physical";
      case "Cognitive Development":
        return "activity-cognitive";
      default:
        return "activity-social";
    }
  };

  const getCategoryGradient = (category: string) => {
    switch (category) {
      case "Social Development":
        return "from-green-100 to-emerald-200";
      case "Art & Creativity":
        return "from-pink-100 to-rose-200";
      case "Physical Development":
        return "from-cyan-100 to-blue-200";
      case "Cognitive Development":
        return "from-blue-100 to-indigo-200";
      case "Music & Movement":
        return "from-yellow-100 to-amber-200";
      default:
        return "from-gray-100 to-gray-200";
    }
  };

  const handleDragStart = (activity: Activity) => {
    if (isLessonPlanLocked) {
      toast({
        title: "Lesson Plan Locked",
        description: "Withdraw the lesson plan from review to make changes.",
        variant: "destructive",
      });
      return;
    }
    console.log('[handleDragStart] Setting dragged activity:', activity.title);
    setDraggedActivity(activity);
  };

  const handleScheduledActivityDragStart = (e: React.DragEvent, scheduledActivity: any) => {
    if (isLessonPlanLocked) {
      e.preventDefault();
      toast({
        title: "Lesson Plan Locked",
        description: "Withdraw the lesson plan from review to make changes.",
        variant: "destructive",
      });
      return;
    }
    console.log('[handleScheduledActivityDragStart] Setting dragged scheduled activity:', scheduledActivity.activity?.title);
    setDraggedScheduledActivity(scheduledActivity);
    setDraggedActivity(null); // Clear any dragged new activity
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    console.log('[handleDragEnd] Clearing drag state');
    setDraggedActivity(null);
    setDraggedScheduledActivity(null);
    setDragOverSlot(null);
  };

  const handleDragOver = (e: React.DragEvent, dayOfWeek?: number, timeSlot?: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (dayOfWeek !== undefined && timeSlot !== undefined) {
      setDragOverSlot({ day: dayOfWeek, slot: timeSlot });
    }
    
    const dropZone = e.currentTarget as HTMLElement;
    dropZone.classList.add("drag-over");
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const dropZone = e.currentTarget as HTMLElement;
    dropZone.classList.remove("drag-over");
    setDragOverSlot(null);
  };


  // Mutation to reset lesson plan to draft status
  const resetLessonPlanToDraft = useMutation({
    mutationFn: async (lessonPlanId: string) => {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/lesson-plans/${lessonPlanId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({ status: 'draft' }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reset lesson plan status');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lesson-plans'] });
    },
    onError: () => {
      toast({
        title: "Failed to reset status",
        description: "Unable to reset lesson plan status. Please try again.",
        variant: "destructive",
      });
    },
  });

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
        throw new Error(error.error || 'Failed to delete scheduled activity');
      }
      
      // Handle 204 No Content response (successful delete with no body)
      if (response.status === 204) {
        return { success: true };
      }
      
      return response.json();
    },
    onSuccess: async () => {
      // If lesson plan was approved and is now modified, reset it to draft
      if (isLessonPlanApproved && currentLessonPlan?.id && pendingAction) {
        await resetLessonPlanToDraft.mutateAsync(currentLessonPlan.id);
      }
      queryClient.invalidateQueries({ queryKey: ['/api/scheduled-activities', selectedRoom, weekStartDate.toISOString(), selectedLocation] });
      toast({
        title: "Activity Removed",
        description: isLessonPlanApproved ? "The activity has been removed and the lesson plan has been reset to draft for re-review." : "The activity has been removed from the schedule.",
      });
      setPendingAction(null);
    },
    onError: () => {
      toast({
        title: "Delete Failed",
        description: "Unable to remove the activity. Please try again.",
        variant: "destructive",
      });
      setPendingAction(null);
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
    onSuccess: async () => {
      // If lesson plan was approved and is now modified, reset it to draft
      if (isLessonPlanApproved && currentLessonPlan?.id && pendingAction) {
        await resetLessonPlanToDraft.mutateAsync(currentLessonPlan.id);
      }
      queryClient.invalidateQueries({ queryKey: ['/api/scheduled-activities', selectedRoom, weekStartDate.toISOString(), selectedLocation] });
      toast({
        title: "Activity Moved",
        description: isLessonPlanApproved ? "The activity has been moved and the lesson plan has been reset to draft for re-review." : "The activity has been moved to the new time slot.",
      });
      setDraggedScheduledActivity(null);
      setDragOverSlot(null);
      setPendingAction(null);
    },
    onError: () => {
      toast({
        title: "Move Failed",
        description: "Unable to move the activity. Please try again.",
        variant: "destructive",
      });
      setPendingAction(null);
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: async ({ activityId, dayOfWeek, timeSlot, weekStart }: { activityId: string; dayOfWeek: number; timeSlot: number; weekStart: string }) => {
      console.log('Scheduling activity:', { 
        activityId, 
        dayOfWeek, 
        timeSlot, 
        weekStart,
        selectedLocation, 
        selectedRoom
      });
      
      if (!selectedLocation || !selectedRoom) {
        console.error('Missing context:', { selectedLocation, selectedRoom });
        throw new Error(`Missing required context: location ${selectedLocation ? 'exists' : 'missing'}, room ${selectedRoom ? 'exists' : 'missing'}`);
      }
      
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/scheduled-activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          activityId,
          dayOfWeek,
          timeSlot,
          roomId: selectedRoom,
          locationId: selectedLocation,
          weekStart,
          // lessonPlanId is optional - backend will create one if needed
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        console.error('Server error:', error);
        throw new Error(error.error || 'Failed to schedule activity');
      }
      
      return response.json();
    },
    onSuccess: async () => {
      // If lesson plan was approved and is now modified, reset it to draft
      if (isLessonPlanApproved && currentLessonPlan?.id && pendingAction) {
        await resetLessonPlanToDraft.mutateAsync(currentLessonPlan.id);
      }
      queryClient.invalidateQueries({ queryKey: ['/api/scheduled-activities', selectedRoom, weekStartDate.toISOString(), selectedLocation] });
      toast({
        title: "Activity Scheduled",
        description: isLessonPlanApproved ? "The activity has been added and the lesson plan has been reset to draft for re-review." : "The activity has been added to the calendar.",
      });
      setPendingAction(null);
    },
    onError: () => {
      toast({
        title: "Scheduling Failed",
        description: "Unable to schedule the activity. Please try again.",
        variant: "destructive",
      });
      setPendingAction(null);
    },
  });

  const handleDrop = (e: React.DragEvent, dayOfWeek: number, timeSlot: number) => {
    console.log('[handleDrop] Drop event triggered');
    e.preventDefault();
    e.stopPropagation();
    
    if (isLessonPlanLocked) {
      toast({
        title: "Lesson Plan Locked",
        description: "Withdraw the lesson plan from review to make changes.",
        variant: "destructive",
      });
      return;
    }
    
    const dropZone = e.currentTarget as HTMLElement;
    dropZone.classList.remove("drag-over");
    setDragOverSlot(null);
    
    // Check if the target slot is already occupied (for move operations)
    const existingActivity = isSlotOccupied(dayOfWeek, timeSlot);
    
    if (draggedScheduledActivity) {
      // Moving an existing scheduled activity
      console.log('[handleDrop] Moving scheduled activity:', draggedScheduledActivity.activity?.title);
      
      // Check if we're dropping on the same slot (no change needed)
      if (draggedScheduledActivity.dayOfWeek === dayOfWeek && draggedScheduledActivity.timeSlot === timeSlot) {
        console.log('[handleDrop] Same slot, no action needed');
        setDraggedScheduledActivity(null);
        return;
      }
      
      // Check if target slot is occupied by a different activity
      if (existingActivity && existingActivity.id !== draggedScheduledActivity.id) {
        toast({
          title: "Cannot move activity",
          description: "Target slot is already occupied by another activity",
          variant: "destructive"
        });
        setDraggedScheduledActivity(null);
        return;
      }
      
      // Check if lesson plan is approved and show warning
      if (isLessonPlanApproved) {
        setPendingAction({
          type: 'move',
          data: {
            scheduledActivityId: draggedScheduledActivity.id,
            newDay: dayOfWeek,
            newSlot: timeSlot,
          }
        });
        setShowApprovedWarning(true);
      } else {
        moveActivityMutation.mutate({
          scheduledActivityId: draggedScheduledActivity.id,
          newDay: dayOfWeek,
          newSlot: timeSlot,
        });
      }
    } else if (draggedActivity) {
      // Adding a new activity
      console.log(`[handleDrop] Scheduling: ${draggedActivity.title} on ${weekDays[dayOfWeek].name} at ${timeSlots[timeSlot].label}`);
      
      if (!selectedLocation || !selectedRoom) {
        console.error('[handleDrop] Missing location or room');
        toast({
          title: "Cannot schedule activity",
          description: "Please select a location and room first",
          variant: "destructive"
        });
        return;
      }
      
      // Check if target slot is occupied
      if (existingActivity) {
        toast({
          title: "Cannot schedule activity",
          description: "This time slot is already occupied",
          variant: "destructive"
        });
        setDraggedActivity(null);
        return;
      }
      
      // Check if lesson plan is approved and show warning
      if (isLessonPlanApproved) {
        setPendingAction({
          type: 'schedule',
          data: {
            activityId: draggedActivity.id,
            dayOfWeek,
            timeSlot,
            weekStart: weekStartDate.toISOString(),
          }
        });
        setShowApprovedWarning(true);
      } else {
        console.log('[handleDrop] Calling scheduleMutation.mutate');
        scheduleMutation.mutate({
          activityId: draggedActivity.id,
          dayOfWeek,
          timeSlot,
          weekStart: weekStartDate.toISOString(),
        });
      }
      setDraggedActivity(null);
    } else {
      console.log('[handleDrop] No dragged activity to schedule');
    }
  };

  const isSlotOccupied = (dayOfWeek: number, timeSlot: number) => {
    return scheduledActivities.find(
      (scheduled: any) => 
        scheduled.dayOfWeek === dayOfWeek && 
        scheduled.timeSlot === timeSlot &&
        scheduled.roomId === selectedRoom
    );
  };

  return (
    <div className="space-y-4" data-testid="weekly-calendar">
      {/* Calendar Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-charcoal">Weekly Schedule</h2>
          
          {/* Review Status Indicator */}
          {currentLessonPlan && (currentLessonPlan.status === 'approved' || currentLessonPlan.status === 'rejected') && (
            <>
              <button
                onClick={() => setShowReviewNotes(true)}
                className={`flex items-center gap-2 px-3 py-1 rounded-lg border transition-colors ${
                  currentLessonPlan.status === 'approved' 
                    ? 'bg-green-50 text-green-800 border-green-200 hover:bg-green-100' 
                    : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                }`}
                data-testid="review-status-button"
              >
                {currentLessonPlan.status === 'approved' ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">
                  {currentLessonPlan.status === 'approved' ? 'Approved' : 'Returned for Revision'}
                </span>
                {currentLessonPlan.reviewNotes && (
                  <MessageSquare className="h-3 w-3 ml-1" />
                )}
              </button>

              {/* Review Notes Dialog */}
              <Dialog open={showReviewNotes} onOpenChange={setShowReviewNotes}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className={`flex items-center gap-2 ${
                      currentLessonPlan.status === 'approved' ? 'text-green-800' : 'text-amber-800'
                    }`}>
                      {currentLessonPlan.status === 'approved' ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <AlertCircle className="h-5 w-5" />
                      )}
                      {currentLessonPlan.status === 'approved' ? 'Lesson Plan Approved' : 'Lesson Plan Returned'}
                    </DialogTitle>
                    <DialogDescription className="text-left mt-4">
                      {currentLessonPlan.reviewNotes ? (
                        <>
                          <p className="font-medium mb-2">
                            {currentLessonPlan.status === 'approved' ? 'Approval Notes:' : 'Feedback from Reviewer:'}
                          </p>
                          <p className="text-sm text-gray-700">{currentLessonPlan.reviewNotes}</p>
                        </>
                      ) : (
                        <p className="text-sm text-gray-500">No review notes provided.</p>
                      )}
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
            </>
          )}
          
          {isLessonPlanLocked && (
            <div className="flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-800 rounded-lg border border-amber-200">
              <Lock className="h-4 w-4" />
              <span className="text-sm font-medium">Plan Locked (In Review)</span>
            </div>
          )}
        </div>
        
        {!isReviewMode && (
          <Button
            onClick={() => setDrawerOpen(!drawerOpen)}
            className="bg-gradient-to-r from-coral-red to-turquoise text-white shadow-lg hover:shadow-xl"
            size="default"
          >
            <Package className="mr-2 h-5 w-5" />
            Activities
          </Button>
        )}
      </div>
      {/* Main Content Area with Calendar and Drawer */}
      <div className="flex">
        {/* Calendar Grid */}
        <div className={`transition-all duration-300 ${drawerOpen && !isReviewMode ? 'w-[calc(100%-416px)] mr-4' : 'w-full'}`}>
          <Card className="material-shadow overflow-hidden bg-gradient-to-br from-white to-sky-blue/5 border-2 border-sky-blue/10">
            <div className="grid gap-0" style={{gridTemplateColumns: "100px repeat(5, 1fr)"}}>
          {/* Position Column */}
          <div className="bg-gradient-to-b from-mint-green/10 to-sky-blue/10 border-r-2 border-sky-blue/20">
            <div className="h-16 border-b-2 border-sky-blue/20 flex items-center justify-center font-bold bg-white/50 text-[#000000]">
              {scheduleSettings.type === 'position-based' ? 'Position' : 'Time'}
            </div>
            {timeSlots.map((slot) => (
              <div key={slot.id} className="h-24 border-b border-sky-blue/10 flex items-center justify-center bg-white/30 hover:bg-white/50 transition-colors">
                <span data-testid={`time-slot-${slot.id}`} className="text-sm font-semibold text-charcoal">{slot.label}</span>
              </div>
            ))}
          </div>

          {/* Days of Week */}
          {weekDays.map((day) => (
            <div key={day.id} className="border-r-2 border-sky-blue/10 last:border-r-0">
              {/* Day Header */}
              <div className="h-16 bg-gradient-to-b from-turquoise/10 to-mint-green/10 text-black border-b-2 border-sky-blue/20 flex flex-col items-center justify-center">
                <span className="font-bold text-xl tracking-wide text-turquoise" data-testid={`day-name-${day.id}`}>{day.name}</span>
                <span className="text-xs text-gray-600 mt-1 font-semibold" data-testid={`day-date-${day.id}`}>{day.date}</span>
              </div>
              
              {/* Time Slots */}
              {timeSlots.map((slot) => {
                const scheduledActivity = isSlotOccupied(day.id, slot.id);
                const isCompleted = scheduledActivity?.activityRecords?.some((record: any) => record.completed) || false;
                
                return (
                  <div 
                    key={slot.id} 
                    className={`h-24 p-1.5 border border-sky-blue/10 hover:border-turquoise/40 transition-all bg-white/40 hover:bg-turquoise/5 ${
                      dragOverSlot?.day === day.id && dragOverSlot?.slot === slot.id ? 'border-turquoise border-2 bg-turquoise/10' : ''
                    }`}
                    onDragOver={(e) => handleDragOver(e, day.id, slot.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, day.id, slot.id)}
                    data-testid={`calendar-slot-${day.id}-${slot.id}`}
                  >
                    {scheduledActivity ? (
                      <div 
                        draggable={!isReviewMode}
                        onDragStart={(e) => !isReviewMode && handleScheduledActivityDragStart(e, scheduledActivity)}
                        onDragEnd={handleDragEnd}
                        className={`bg-gradient-to-br ${isCompleted ? 'from-green-100 to-emerald-100 border-green-400' : getCategoryGradient(scheduledActivity.activity?.category || 'Other') + ' border-gray-200'} border rounded-lg p-2 h-full flex flex-col justify-between ${isReviewMode ? 'cursor-default' : 'cursor-move'} shadow-sm hover:shadow-md transition-all relative group ${
                          draggedScheduledActivity?.id === scheduledActivity.id ? 'opacity-50 scale-95' : ''
                        }`}
                      >
                        {/* Completion Badge - Fun visual indicator */}
                        {isCompleted && (
                          <div className="absolute -top-2 -right-2 z-10 animate-bounce">
                            <div className="relative">
                              <div className="absolute inset-0 bg-yellow-400 rounded-full blur-md opacity-50 animate-pulse"></div>
                              <div className="relative bg-gradient-to-br from-yellow-300 to-amber-400 rounded-full p-1.5 shadow-lg border-2 border-white">
                                <Trophy className="h-4 w-4 text-white" />
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {!isReviewMode && !isCompleted && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              if (isLessonPlanLocked) {
                                toast({
                                  title: "Lesson Plan Locked",
                                  description: "Withdraw the lesson plan from review to make changes.",
                                  variant: "destructive",
                                });
                                return;
                              }
                              // Check if lesson plan is approved and show warning
                              if (isLessonPlanApproved) {
                                setPendingAction({
                                  type: 'delete',
                                  data: scheduledActivity.id
                                });
                                setShowApprovedWarning(true);
                              } else {
                                deleteScheduledMutation.mutate(scheduledActivity.id);
                              }
                            }}
                            className="absolute top-1 right-1 p-1 rounded bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100"
                            title="Remove from schedule"
                          >
                            <Trash2 className="h-3 w-3 text-red-500" />
                          </button>
                        )}
                        
                        <div>
                          <div className="flex items-start gap-1">
                            <h4 className={`font-semibold text-xs text-charcoal line-clamp-2 ${isCompleted ? 'pr-2' : 'pr-6'} ${isCompleted ? 'text-green-700' : ''}`} data-testid={`activity-title-${scheduledActivity.activity?.id}`}>
                              {scheduledActivity.activity?.title || 'Untitled Activity'}
                            </h4>
                            {isCompleted && (
                              <div className="flex items-center gap-0.5 shrink-0">
                                <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                                <Sparkles className="h-3 w-3 text-yellow-500 animate-pulse" />
                              </div>
                            )}
                          </div>
                          <p className={`text-xs mt-1 ${isCompleted ? 'text-green-600 font-medium' : 'text-gray-600'}`}>
                            {isCompleted ? '✨ Completed!' : (scheduledActivity.activity?.category || 'Uncategorized')}
                          </p>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1">
                            {isCompleted ? (
                              <>
                                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                <span className="text-xs text-green-600 font-bold">Done!</span>
                              </>
                            ) : (
                              <>
                                <Clock className="h-2.5 w-2.5 text-gray-600" />
                                <span className="text-xs text-gray-500 font-medium">{scheduledActivity.activity?.duration || 30}m</span>
                              </>
                            )}
                          </div>
                          {!isCompleted && scheduledActivity.activity?.materialIds && scheduledActivity.activity.materialIds.length > 0 && (
                            <div className="flex items-center" title="Materials required">
                              <Scissors className="h-2.5 w-2.5 text-gray-600" />
                            </div>
                          )}
                          {isCompleted && (
                            <div className="flex gap-0.5">
                              {[1,2,3].map((i) => (
                                <Star key={i} className="h-2.5 w-2.5 text-yellow-400 fill-yellow-400" />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <button 
                        className={`h-full w-full flex items-center justify-center text-gray-400 border-2 border-dashed border-turquoise/20 rounded-lg hover:border-turquoise/40 hover:bg-turquoise/5 transition-all group ${isReviewMode ? '' : 'cursor-pointer'} ${
                          dragOverSlot?.day === day.id && dragOverSlot?.slot === slot.id ? 'border-turquoise bg-turquoise/10' : ''
                        }`}
                        onClick={() => !isReviewMode && setDrawerOpen(true)}
                        data-testid={`empty-slot-${day.id}-${slot.id}`}
                        disabled={isReviewMode}
                      >
                        {dragOverSlot?.day === day.id && dragOverSlot?.slot === slot.id ? (
                          <span className="text-xs text-turquoise font-semibold">Drop Here</span>
                        ) : !isReviewMode ? (
                          <>
                            <Plus className="h-3 w-3 mr-1 opacity-50 group-hover:opacity-70 text-turquoise" />
                            <span className="text-xs opacity-50 group-hover:opacity-70 text-turquoise">Drop Activity</span>
                          </>
                        ) : null}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
            </div>
          </Card>
        </div>

        {/* Activity Library Side Panel */}
        <div className={`transition-all duration-300 ${drawerOpen && !isReviewMode ? 'w-[400px]' : 'w-0'} overflow-hidden`}>
          <Card className={`h-full material-shadow ${drawerOpen && !isReviewMode ? 'p-6' : 'p-0'}`}>
            {drawerOpen && !isReviewMode && (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-charcoal flex items-center">
                    <Package className="mr-2 text-coral-red" />
                    Activity Library
                  </h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDrawerOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {/* Search */}
                  <div className="flex space-x-2">
                    <Input 
                      type="text" 
                      placeholder="Search activities..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1"
                      data-testid="input-search-activities"
                    />
                    <Button variant="outline" size="icon" data-testid="button-search-activities">
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Filters */}
                  <div className="flex gap-2">
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all-categories">All Categories</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.name}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={selectedAgeGroup} onValueChange={setSelectedAgeGroup}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="All Age Groups" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all-age-groups">All Age Groups</SelectItem>
                        {ageGroups.map((ageGroup) => (
                          <SelectItem key={ageGroup.id} value={ageGroup.id}>
                            {ageGroup.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Activities Grid */}
                  <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
                    {isLoading ? (
                      <div className="grid grid-cols-1 gap-4">
                        {[...Array(6)].map((_, i) => (
                          <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
                            <div className="h-4 bg-gray-200 rounded mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded mb-3"></div>
                            <div className="h-2 bg-gray-200 rounded"></div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {filteredActivities.map((activity) => (
                          <DraggableActivity 
                            key={activity.id} 
                            activity={activity} 
                            onDragStart={handleDragStart}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
      
      {/* Alert Dialog for modifying approved lesson plans */}
      <AlertDialog open={showApprovedWarning} onOpenChange={setShowApprovedWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Modify Approved Lesson Plan?</AlertDialogTitle>
            <AlertDialogDescription>
              This lesson plan has been approved. Making changes will reset it to draft status and require re-approval.
              
              Do you want to continue with this modification?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setPendingAction(null);
              setDraggedActivity(null);
              setDraggedScheduledActivity(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (pendingAction) {
                if (pendingAction.type === 'schedule') {
                  scheduleMutation.mutate(pendingAction.data);
                } else if (pendingAction.type === 'move') {
                  moveActivityMutation.mutate(pendingAction.data);
                } else if (pendingAction.type === 'delete') {
                  deleteScheduledMutation.mutate(pendingAction.data);
                }
              }
              setShowApprovedWarning(false);
            }}>
              Continue and Reset to Draft
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
