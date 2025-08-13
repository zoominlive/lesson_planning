import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { TabletWeeklyCalendar } from "../components/tablet/tablet-weekly-calendar";
import { TabletHeader } from "../components/tablet/tablet-header";
import { TabletActivityDrawer } from "../components/tablet/tablet-activity-drawer";
import { TabletRecordingView } from "../components/tablet/tablet-recording-view";
import { TabletLessonReview } from "@/components/tablet/tablet-lesson-review";
import { NotificationCarousel } from "../components/notification-carousel";
import { startOfWeek, format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { ChevronUp, Box, Calendar, ClipboardCheck } from "lucide-react";
import { useLocation } from "wouter";
import { hasPermission } from "@/lib/permission-utils";
import type { Activity } from "@shared/schema";

export default function TabletPlanner() {
  const [currentWeekDate, setCurrentWeekDate] = useState(() => 
    startOfWeek(new Date(), { weekStartsOn: 1 }) // Use Monday as week start to match system
  );
  const [selectedRoom, setSelectedRoom] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{day: number, slot: number} | null>(null);
  const [viewMode, setViewMode] = useState<'planning' | 'recording'>('planning');
  const bottomTabRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);
  const [location] = useLocation();
  
  // Check for tab query parameter
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  const defaultTab = searchParams.get('tab') || 'calendar';
  const [activeTab, setActiveTab] = useState<'calendar' | 'review'>(defaultTab as 'calendar' | 'review');
  
  // Check if user has permission to review
  const canReview = hasPermission('lesson_plan.approve');

  // Fetch user info
  const { data: userInfo } = useQuery({
    queryKey: ["/api/user"],
  });

  // Fetch locations
  const { data: locations = [] } = useQuery<any[]>({
    queryKey: ["/api/locations"],
  });

  // Fetch all rooms
  const { data: allRooms = [] } = useQuery<any[]>({
    queryKey: ["/api/rooms"],
  });

  // Filter rooms for selected location
  const rooms = allRooms.filter((room: any) => room.locationId === selectedLocation);

  // Auto-select first location
  useEffect(() => {
    if (!selectedLocation && Array.isArray(locations) && locations.length > 0) {
      const firstLocation = locations[0];
      setSelectedLocation(firstLocation.id);
    }
  }, [locations, selectedLocation]);

  // Reset room selection when location changes
  useEffect(() => {
    if (selectedLocation) {
      setSelectedRoom("");
    }
  }, [selectedLocation]);

  // Auto-select first room when rooms are available
  useEffect(() => {
    if (rooms.length > 0 && !selectedRoom && selectedLocation) {
      setSelectedRoom(rooms[0].id);
    }
  }, [rooms, selectedRoom, selectedLocation]);

  // Fetch lesson plans to get current status for header
  const { data: lessonPlans = [] } = useQuery<any[]>({
    queryKey: [`/api/lesson-plans?locationId=${selectedLocation}&roomId=${selectedRoom}`],
    enabled: !!selectedLocation && !!selectedRoom,
  });
  
  // Find the current lesson plan for this week to show status in header
  const currentLessonPlan = lessonPlans.find((plan: any) => {
    const planDate = plan.weekStart.split('T')[0];
    const currentDate = format(currentWeekDate, 'yyyy-MM-dd');
    return planDate === currentDate;
  });

  const handleWeekChange = (newDate: Date) => {
    setCurrentWeekDate(newDate);
  };

  const handleActivitySelect = (activity: Activity) => {
    setSelectedActivity(activity);
    setDrawerOpen(false);
    toast({
      title: "Activity Selected",
      description: `Tap a time slot to schedule "${activity.title}"`,
    });
  };

  const handleSlotTap = (day: number, slot: number) => {
    if (selectedActivity) {
      setSelectedSlot({ day, slot });
      // Schedule the activity
      handleScheduleActivity(selectedActivity, day, slot);
    } else {
      // Open drawer to select activity
      setSelectedSlot({ day, slot });
      setDrawerOpen(true);
    }
  };

  // Schedule activity mutation
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
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to schedule activity');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scheduled-activities', selectedRoom, currentWeekDate.toISOString(), selectedLocation] });
      toast({
        title: "Activity Scheduled",
        description: "The activity has been added to the calendar.",
      });
      setSelectedActivity(null);
      setSelectedSlot(null);
    },
    onError: (error: any) => {
      toast({
        title: "Scheduling Failed",
        description: error.message || "Unable to schedule the activity. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleScheduleActivity = (activity: Activity, day: number, slot: number) => {
    if (!selectedLocation || !selectedRoom) {
      toast({
        title: "Cannot schedule activity",
        description: "Please select a location and room first",
        variant: "destructive"
      });
      return;
    }

    scheduleMutation.mutate({
      activityId: activity.id,
      dayOfWeek: day,
      timeSlot: slot,
      weekStart: currentWeekDate.toISOString(),
    });
  };

  // Handle swipe up gesture on the bottom tab
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    
    const currentY = e.touches[0].clientY;
    const deltaY = touchStartY.current - currentY;
    
    // If swiped up more than 50px, open the drawer
    if (deltaY > 50 && !drawerOpen) {
      setDrawerOpen(true);
      touchStartY.current = null;
    }
  };

  const handleTouchEnd = () => {
    touchStartY.current = null;
  };

  return (
    <div className="tablet-planner h-screen flex flex-col bg-gradient-to-br from-sky-blue/10 via-white to-mint-green/10">
      {/* Viewport meta tags are in index.html */}
      
      {/* Integrated Header with Tabs */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <TabletHeader
          userInfo={userInfo}
          currentWeekDate={currentWeekDate}
          selectedLocation={selectedLocation}
          selectedRoom={selectedRoom}
          locations={locations as any[]}
          rooms={rooms}
          onWeekChange={handleWeekChange}
          onLocationChange={setSelectedLocation}
          onRoomChange={setSelectedRoom}
          onActivityButtonClick={() => setDrawerOpen(true)}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          lessonPlanStatus={currentLessonPlan?.status}
        />
        
        {/* Tab Navigation integrated below header */}
        <div className="px-4 pb-2">
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-semibold transition-all ${
                activeTab === 'calendar' 
                  ? 'bg-coral-red text-white shadow-md' 
                  : 'text-gray-700 hover:bg-white/50'
              }`}
              data-testid="tablet-tab-calendar"
            >
              <Calendar className="h-4 w-4" />
              <span className="text-sm">Calendar</span>
            </button>
            {canReview && (
              <button
                onClick={() => setActiveTab('review')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-semibold transition-all ${
                  activeTab === 'review' 
                    ? 'bg-purple-500 text-white shadow-md' 
                    : 'text-gray-700 hover:bg-white/50'
                }`}
                data-testid="tablet-tab-review"
              >
                <ClipboardCheck className="h-4 w-4" />
                <span className="text-sm">Review</span>
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Notification Carousel - Positioned under tabs */}
      {activeTab === 'calendar' && (
        <div className="px-4 py-1 bg-white/50">
          <NotificationCarousel 
            currentWeekDate={currentWeekDate}
            onWeekChange={setCurrentWeekDate}
          />
        </div>
      )}

      <div className="flex-1 overflow-hidden relative">
        {/* Beautiful background pattern - pointer-events-none ensures it doesn't block clicks */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 bg-turquoise rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-coral-red rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-soft-yellow rounded-full blur-3xl" />
        </div>
        
        {/* Content with proper z-index */}
        <div className={`relative z-10 h-full ${activeTab === 'review' ? 'overflow-y-auto' : ''}`}>
          {activeTab === 'calendar' ? (
            viewMode === 'planning' ? (
              <TabletWeeklyCalendar
                currentWeekDate={currentWeekDate}
                selectedLocation={selectedLocation}
                selectedRoom={selectedRoom}
                selectedActivity={selectedActivity}
                onSlotTap={handleSlotTap}
              />
            ) : (
              <TabletRecordingView
                currentDate={new Date()}
                selectedLocation={selectedLocation}
                selectedRoom={selectedRoom}
                locations={locations as any[]}
                rooms={rooms}
              />
            )
          ) : (
            <TabletLessonReview />
          )}
        </div>

        {/* Bottom Tab for Activity Drawer - Only show in calendar tab and planning mode */}
        {activeTab === 'calendar' && viewMode === 'planning' && (
          <div
            ref={bottomTabRef}
            className={`fixed bottom-0 left-0 right-0 z-40 transition-all duration-300 ${
              drawerOpen ? 'translate-y-full' : 'translate-y-0'
            }`}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div 
              className="bg-gradient-to-t from-blue-600 via-sky-500 to-blue-400 backdrop-blur-sm shadow-[0_-4px_20px_rgba(0,0,0,0.15)] rounded-t-3xl px-6 py-3 cursor-pointer border-t-2 border-white/20"
              onClick={() => setDrawerOpen(true)}
            >
              {/* Swipe indicator */}
              <div className="w-12 h-1 bg-white/80 rounded-full mx-auto mb-2 shadow-sm" />
              
              <div className="flex items-center justify-center gap-2">
                <Box className="h-5 w-5 text-white drop-shadow animate-pulse" />
                <span className="text-sm font-semibold text-white drop-shadow">
                  Swipe up for Activities
                </span>
                <ChevronUp className="h-5 w-5 text-white drop-shadow animate-bounce" />
              </div>
            </div>
          </div>
        )}

        <TabletActivityDrawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onActivitySelect={handleActivitySelect}
          selectedSlot={selectedSlot}
        />
      </div>
    </div>
  );
}