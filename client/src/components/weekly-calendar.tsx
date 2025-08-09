import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Play, Package, Filter, X, Trash2, Clock, Scissors } from "lucide-react";
import DraggableActivity from "./draggable-activity";
import { toast } from "@/hooks/use-toast";
import type { Activity, Category, AgeGroup } from "@shared/schema";
import { format, addDays, startOfWeek } from "date-fns";

interface WeeklyCalendarProps {
  selectedLocation: string;
  selectedRoom: string;
  currentWeekDate?: Date;
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

export default function WeeklyCalendar({ selectedLocation, selectedRoom, currentWeekDate }: WeeklyCalendarProps) {
  const weekStartDate = currentWeekDate || startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = generateWeekDays(weekStartDate);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [draggedActivity, setDraggedActivity] = useState<Activity | null>(null);
  const [draggedScheduledActivity, setDraggedScheduledActivity] = useState<any>(null);
  const [dragOverSlot, setDragOverSlot] = useState<{day: number, slot: number} | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all-categories");
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>("all-age-groups");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scheduleSettings, setScheduleSettings] = useState<any>({
    type: 'time-based',
    startTime: '06:00',
    endTime: '18:00',
    slotsPerDay: 8
  });

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
    
    // Listen for global schedule type changes
    const handleScheduleTypeChange = () => {
      // Reload settings from localStorage
      loadSettings();
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['/api/scheduled-activities'] });
    };
    
    window.addEventListener('scheduleTypeChanged', handleScheduleTypeChange);
    
    return () => {
      window.removeEventListener('scheduleSettingsChanged' as any, handleSettingsChange as any);
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
    console.log('[handleDragStart] Setting dragged activity:', activity.title);
    setDraggedActivity(activity);
  };

  const handleScheduledActivityDragStart = (e: React.DragEvent, scheduledActivity: any) => {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scheduled-activities', selectedRoom, weekStartDate.toISOString(), selectedLocation] });
      toast({
        title: "Activity Removed",
        description: "The activity has been removed from the schedule.",
      });
    },
    onError: () => {
      toast({
        title: "Delete Failed",
        description: "Unable to remove the activity. Please try again.",
        variant: "destructive",
      });
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
      queryClient.invalidateQueries({ queryKey: ['/api/scheduled-activities', selectedRoom, weekStartDate.toISOString(), selectedLocation] });
      toast({
        title: "Activity Moved",
        description: "The activity has been moved to the new time slot.",
      });
      setDraggedScheduledActivity(null);
      setDragOverSlot(null);
    },
    onError: () => {
      toast({
        title: "Move Failed",
        description: "Unable to move the activity. Please try again.",
        variant: "destructive",
      });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scheduled-activities', selectedRoom, weekStartDate.toISOString(), selectedLocation] });
      toast({
        title: "Activity Scheduled",
        description: "The activity has been added to the calendar.",
      });
    },
    onError: () => {
      toast({
        title: "Scheduling Failed",
        description: "Unable to schedule the activity. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDrop = (e: React.DragEvent, dayOfWeek: number, timeSlot: number) => {
    console.log('[handleDrop] Drop event triggered');
    e.preventDefault();
    e.stopPropagation();
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
      
      moveActivityMutation.mutate({
        scheduledActivityId: draggedScheduledActivity.id,
        newDay: dayOfWeek,
        newSlot: timeSlot,
      });
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
      
      console.log('[handleDrop] Calling scheduleMutation.mutate');
      scheduleMutation.mutate({
        activityId: draggedActivity.id,
        dayOfWeek,
        timeSlot,
        weekStart: weekStartDate.toISOString(),
      });
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
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-charcoal">Weekly Schedule</h2>
        </div>
        
        <Button
          onClick={() => setDrawerOpen(!drawerOpen)}
          className="bg-gradient-to-r from-coral-red to-turquoise text-white shadow-lg hover:shadow-xl"
          size="default"
        >
          <Package className="mr-2 h-5 w-5" />
          Activities
        </Button>
      </div>
      {/* Main Content Area with Calendar and Drawer */}
      <div className="flex">
        {/* Calendar Grid */}
        <div className={`transition-all duration-300 ${drawerOpen ? 'w-[calc(100%-416px)] mr-4' : 'w-full'}`}>
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
                        draggable={true}
                        onDragStart={(e) => handleScheduledActivityDragStart(e, scheduledActivity)}
                        onDragEnd={handleDragEnd}
                        className={`bg-gradient-to-br ${getCategoryGradient(scheduledActivity.activity?.category || 'Other')} border border-gray-200 rounded-lg p-2 h-full flex flex-col justify-between cursor-move shadow-sm hover:shadow-md transition-all relative group ${
                          draggedScheduledActivity?.id === scheduledActivity.id ? 'opacity-50 scale-95' : ''
                        }`}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            deleteScheduledMutation.mutate(scheduledActivity.id);
                          }}
                          className="absolute top-1 right-1 p-1 rounded bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100"
                          title="Remove from schedule"
                        >
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </button>
                        <div>
                          <h4 className="font-semibold text-xs text-charcoal line-clamp-2 pr-6" data-testid={`activity-title-${scheduledActivity.activity?.id}`}>
                            {scheduledActivity.activity?.title || 'Untitled Activity'}
                          </h4>
                          <p className="text-xs text-gray-600 mt-1">{scheduledActivity.activity?.category || 'Uncategorized'}</p>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5 text-gray-600" />
                            <span className="text-xs text-gray-500 font-medium">{scheduledActivity.activity?.duration || 30}m</span>
                          </div>
                          {scheduledActivity.activity?.materialIds && scheduledActivity.activity.materialIds.length > 0 && (
                            <div className="flex items-center" title="Materials required">
                              <Scissors className="h-2.5 w-2.5 text-gray-600" />
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <button 
                        className={`h-full w-full flex items-center justify-center text-gray-400 border-2 border-dashed border-turquoise/20 rounded-lg hover:border-turquoise/40 hover:bg-turquoise/5 transition-all group cursor-pointer ${
                          dragOverSlot?.day === day.id && dragOverSlot?.slot === slot.id ? 'border-turquoise bg-turquoise/10' : ''
                        }`}
                        onClick={() => setDrawerOpen(true)}
                        data-testid={`empty-slot-${day.id}-${slot.id}`}
                      >
                        {dragOverSlot?.day === day.id && dragOverSlot?.slot === slot.id ? (
                          <span className="text-xs text-turquoise font-semibold">Drop Here</span>
                        ) : (
                          <>
                            <Plus className="h-3 w-3 mr-1 opacity-50 group-hover:opacity-70 text-turquoise" />
                            <span className="text-xs opacity-50 group-hover:opacity-70 text-turquoise">Drop Activity</span>
                          </>
                        )}
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
        <div className={`transition-all duration-300 ${drawerOpen ? 'w-[400px]' : 'w-0'} overflow-hidden`}>
          <Card className={`h-full material-shadow ${drawerOpen ? 'p-6' : 'p-0'}`}>
            {drawerOpen && (
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
    </div>
  );
}
