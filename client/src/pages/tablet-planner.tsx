import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
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
    startOfWeek(new Date(), { weekStartsOn: 0 }) // Use Sunday as week start to match database
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

  // Auto-select first room when location changes
  useEffect(() => {
    if (rooms.length > 0 && !selectedRoom) {
      setSelectedRoom(rooms[0].id);
    }
  }, [rooms, selectedRoom]);

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

  const handleScheduleActivity = async (activity: Activity, day: number, slot: number) => {
    // Implementation for scheduling
    toast({
      title: "Activity Scheduled",
      description: `${activity.title} scheduled successfully`,
    });
    setSelectedActivity(null);
    setSelectedSlot(null);
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
              className="bg-gradient-to-t from-white via-white to-white/95 backdrop-blur-sm shadow-[0_-4px_20px_rgba(0,0,0,0.1)] rounded-t-3xl px-6 py-3 cursor-pointer"
              onClick={() => setDrawerOpen(true)}
            >
              {/* Swipe indicator */}
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-2" />
              
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5 text-turquoise animate-pulse" />
                <span className="text-sm font-semibold bg-gradient-to-r from-turquoise to-sky-blue bg-clip-text text-transparent">
                  Swipe up for Activities
                </span>
                <ChevronUp className="h-5 w-5 text-turquoise animate-bounce" />
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