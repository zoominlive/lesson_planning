import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { TabletWeeklyCalendar } from "../components/tablet/tablet-weekly-calendar";
import { TabletHeader } from "../components/tablet/tablet-header";
import { TabletActivityDrawer } from "../components/tablet/tablet-activity-drawer";
import { TabletRecordingView } from "../components/tablet/tablet-recording-view";
import { startOfWeek } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { ChevronUp, Sparkles } from "lucide-react";
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
      />

      <div className="flex-1 overflow-hidden relative">
        {/* Beautiful background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-96 h-96 bg-turquoise rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-coral-red rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-soft-yellow rounded-full blur-3xl" />
        </div>
        
        {viewMode === 'planning' ? (
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
        )}

        {/* Bottom Tab for Activity Drawer - Only show in planning mode */}
        {viewMode === 'planning' && (
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
              className="bg-gradient-to-t from-teal-500 via-cyan-500 to-emerald-400 backdrop-blur-sm shadow-[0_-4px_20px_rgba(0,0,0,0.15)] rounded-t-3xl px-6 py-3 cursor-pointer border-t-2 border-white/20"
              onClick={() => setDrawerOpen(true)}
            >
              {/* Swipe indicator */}
              <div className="w-12 h-1 bg-white/80 rounded-full mx-auto mb-2 shadow-sm" />
              
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5 text-white drop-shadow animate-pulse" />
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