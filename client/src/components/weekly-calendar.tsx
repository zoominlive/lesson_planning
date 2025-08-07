import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Play, Package, Filter, X } from "lucide-react";
import DraggableActivity from "./draggable-activity";
import { toast } from "@/hooks/use-toast";
import type { Activity, Category, AgeGroup } from "@shared/schema";

const timeSlots = [
  { id: 0, label: "6:00 AM", name: "Early Arrival" },
  { id: 1, label: "7:00 AM", name: "Breakfast" },
  { id: 2, label: "8:00 AM", name: "Free Play" },
  { id: 3, label: "9:00 AM", name: "Morning Circle" },
  { id: 4, label: "10:00 AM", name: "Activity Time" },
  { id: 5, label: "11:00 AM", name: "Learning Centers" },
  { id: 6, label: "12:00 PM", name: "Lunch" },
  { id: 7, label: "1:00 PM", name: "Rest/Quiet Time" },
  { id: 8, label: "2:00 PM", name: "Afternoon Activities" },
  { id: 9, label: "3:00 PM", name: "Snack Time" },
  { id: 10, label: "4:00 PM", name: "Outdoor Play" },
  { id: 11, label: "5:00 PM", name: "Free Choice" },
  { id: 12, label: "6:00 PM", name: "Pickup Time" },
];

const weekDays = [
  { id: 0, name: "Monday", date: "Mar 13" },
  { id: 1, name: "Tuesday", date: "Mar 14" },
  { id: 2, name: "Wednesday", date: "Mar 15" },
  { id: 3, name: "Thursday", date: "Mar 16" },
  { id: 4, name: "Friday", date: "Mar 17" },
];

export default function WeeklyCalendar() {
  const [searchTerm, setSearchTerm] = useState("");
  const [draggedActivity, setDraggedActivity] = useState<Activity | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all-categories");
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>("all-age-groups");
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data: activities = [], isLoading } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: ageGroups = [] } = useQuery<AgeGroup[]>({
    queryKey: ["/api/age-groups"],
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

  const handleDragStart = (activity: Activity) => {
    console.log('[handleDragStart] Setting dragged activity:', activity.title);
    setDraggedActivity(activity);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const dropZone = e.currentTarget as HTMLElement;
    dropZone.classList.add("drag-over");
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const dropZone = e.currentTarget as HTMLElement;
    dropZone.classList.remove("drag-over");
  };

  // Get locations
  const { data: locations = [] } = useQuery<any[]>({
    queryKey: ["/api/locations"],
  });
  
  // Set default location when locations load
  useEffect(() => {
    if (locations.length > 0 && !selectedLocation) {
      setSelectedLocation(locations[0].id);
    }
  }, [locations, selectedLocation]);
  
  // Reset room when location changes
  useEffect(() => {
    setSelectedRoom("");
  }, [selectedLocation]);
  
  // Get all rooms
  const { data: allRooms = [] } = useQuery<any[]>({
    queryKey: ["/api/rooms"],
  });
  
  // Filter rooms for the selected location
  const rooms = allRooms.filter((room: any) => room.locationId === selectedLocation);
  
  // Set default room when rooms load
  useEffect(() => {
    if (rooms.length > 0 && !selectedRoom) {
      setSelectedRoom(rooms[0].id);
    }
  }, [rooms, selectedRoom]);

  const scheduleMutation = useMutation({
    mutationFn: async ({ activityId, dayOfWeek, timeSlot }: { activityId: string; dayOfWeek: number; timeSlot: number }) => {
      console.log('Scheduling activity:', { 
        activityId, 
        dayOfWeek, 
        timeSlot, 
        selectedLocation, 
        selectedRoom,
        locations: locations.length,
        rooms: rooms.length
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
      queryClient.invalidateQueries({ queryKey: ['/api/scheduled-activities'] });
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
    
    console.log('[handleDrop] draggedActivity:', draggedActivity);
    console.log('[handleDrop] dayOfWeek:', dayOfWeek, 'timeSlot:', timeSlot);
    console.log('[handleDrop] selectedLocation:', selectedLocation);
    console.log('[handleDrop] selectedRoom:', selectedRoom);
    
    if (draggedActivity) {
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
      
      console.log('[handleDrop] Calling scheduleMutation.mutate');
      scheduleMutation.mutate({
        activityId: draggedActivity.id,
        dayOfWeek,
        timeSlot,
      });
      setDraggedActivity(null);
    } else {
      console.log('[handleDrop] No dragged activity to schedule');
    }
  };

  const isSlotOccupied = (dayOfWeek: number, timeSlot: number) => {
    // TODO: Fetch actual scheduled activities from the database
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-charcoal">Weekly Schedule</h2>
          
          {/* Location Selector */}
          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select Location" />
            </SelectTrigger>
            <SelectContent>
              {locations.map((location: any) => (
                <SelectItem key={location.id} value={location.id}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Room Selector */}
          <Select value={selectedRoom} onValueChange={setSelectedRoom} disabled={!selectedLocation}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select Room" />
            </SelectTrigger>
            <SelectContent>
              {rooms.map((room: any) => (
                <SelectItem key={room.id} value={room.id}>
                  {room.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
      <div className={`flex ${drawerOpen ? 'gap-4' : ''}`}>
        {/* Calendar Grid */}
        <div className={`transition-all duration-300 ${drawerOpen ? 'flex-1' : 'w-full'}`}>
          <Card className="material-shadow overflow-hidden">
            <div className="grid grid-cols-6 gap-0">
          {/* Time Column */}
          <div className="bg-gray-50 border-r border-gray-200">
            <div className="h-16 border-b border-gray-200 flex items-center justify-center font-semibold text-gray-700">
              Time
            </div>
            {timeSlots.map((slot) => (
              <div key={slot.id} className="h-24 border-b border-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                <span data-testid={`time-slot-${slot.id}`}>{slot.label}</span>
              </div>
            ))}
          </div>

          {/* Days of Week */}
          {weekDays.map((day) => (
            <div key={day.id} className="border-r border-gray-200 last:border-r-0">
              {/* Day Header */}
              <div className="h-16 bg-white text-black border-b border-gray-200 flex flex-col items-center justify-center">
                <span className="font-bold text-xl tracking-wide" data-testid={`day-name-${day.id}`}>{day.name}</span>
                <span className="text-xs text-gray-600 mt-1" data-testid={`day-date-${day.id}`}>{day.date}</span>
              </div>
              
              {/* Time Slots */}
              {timeSlots.map((slot) => {
                const scheduledActivity = isSlotOccupied(day.id, slot.id);
                
                return (
                  <div 
                    key={slot.id} 
                    className="h-24 p-2 border-2 border-dashed border-gray-300 hover:border-turquoise transition-all"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, day.id, slot.id)}
                    data-testid={`calendar-slot-${day.id}-${slot.id}`}
                  >
                    {scheduledActivity ? (
                      <div className={`${getCategoryStyle(scheduledActivity.activity.category)} text-white rounded-lg p-2 h-full flex flex-col justify-between cursor-move material-shadow-hover`}>
                        <div>
                          <h4 className="font-semibold text-sm" data-testid={`activity-title-${scheduledActivity.activity.id}`}>
                            {scheduledActivity.activity.title}
                          </h4>
                          <p className="text-xs opacity-90">{scheduledActivity.activity.category}</p>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs">{scheduledActivity.activity.duration} min</span>
                          <span className="material-icons text-sm">⋮⋮</span>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-300 rounded-lg">
                        <Plus className="h-4 w-4 mr-1" />
                        <span className="text-sm">Add Activity</span>
                      </div>
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
