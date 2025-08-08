import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { TabletWeeklyCalendar } from "../components/tablet/tablet-weekly-calendar";
import { TabletHeader } from "../components/tablet/tablet-header";
import { TabletActivityDrawer } from "../components/tablet/tablet-activity-drawer";
import { startOfWeek } from "date-fns";
import { toast } from "@/hooks/use-toast";
import type { Activity } from "@shared/schema";

export default function TabletPlanner() {
  const [currentWeekDate, setCurrentWeekDate] = useState(() => 
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [selectedRoom, setSelectedRoom] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{day: number, slot: number} | null>(null);

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

  return (
    <div className="tablet-planner h-screen flex flex-col bg-gradient-to-br from-sky-blue/5 to-mint-green/5">
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
      />

      <div className="flex-1 overflow-hidden relative">
        <TabletWeeklyCalendar
          currentWeekDate={currentWeekDate}
          selectedLocation={selectedLocation}
          selectedRoom={selectedRoom}
          selectedActivity={selectedActivity}
          onSlotTap={handleSlotTap}
        />

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