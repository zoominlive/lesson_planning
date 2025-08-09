import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { NavigationTabs } from "@/components/navigation-tabs";
import { CalendarControls } from "@/components/calendar-controls";
import { FloatingActionButton } from "@/components/floating-action-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import WeeklyCalendar from "@/components/weekly-calendar";
import { Settings, MapPin } from "lucide-react";
import { useLocation } from "wouter";
import { getUserInfo } from "@/lib/auth";
import { startOfWeek } from "date-fns";
import { useToast } from "@/hooks/use-toast";

type UserInfo = {
  tenantId: string;
  userId: string;
  userFirstName: string;
  userLastName: string;
  username: string;
  role: string;
  locations?: string[];
};

export default function LessonPlanner() {
  const [currentWeekDate, setCurrentWeekDate] = useState(
    () => startOfWeek(new Date(), { weekStartsOn: 1 }), // Start on Monday
  );
  const [selectedRoom, setSelectedRoom] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: userInfo } = useQuery<UserInfo>({
    queryKey: ["/api/user"],
  });

  // Fetch all rooms to auto-select first room for location
  const { data: allRooms = [] } = useQuery<any[]>({
    queryKey: ["/api/rooms"],
  });
  
  // Filter rooms for the selected location
  const filteredRooms = allRooms.filter((room: any) => room.locationId === selectedLocation);

  // Reset room selection when location changes
  useEffect(() => {
    if (selectedLocation) {
      setSelectedRoom("");
    }
  }, [selectedLocation]);

  // Auto-select first room when rooms are available and no room is selected
  useEffect(() => {
    if (filteredRooms.length > 0 && !selectedRoom && selectedLocation) {
      setSelectedRoom(filteredRooms[0].id);
    }
  }, [filteredRooms, selectedRoom, selectedLocation]);

  // Listen for schedule type changes to refresh data
  useEffect(() => {
    const handleScheduleTypeChange = () => {
      // Invalidate all calendar-related queries to force refresh
      queryClient.invalidateQueries({ queryKey: ['/api/scheduled-activities'] });
      queryClient.invalidateQueries({ queryKey: ['/api/lesson-plans'] });
      queryClient.invalidateQueries({ queryKey: ['/api/rooms'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
    };

    window.addEventListener('scheduleTypeChanged', handleScheduleTypeChange);
    
    return () => {
      window.removeEventListener('scheduleTypeChanged', handleScheduleTypeChange);
    };
  }, []);

  // Fetch lesson plans to find the current one
  const { data: lessonPlans = [] } = useQuery<any[]>({
    queryKey: ["/api/lesson-plans"],
    enabled: !!selectedLocation && !!selectedRoom,
  });

  // Fetch location settings to get schedule type
  const { data: locationSettings } = useQuery({
    queryKey: [`/api/locations/${selectedLocation}/settings`],
    enabled: !!selectedLocation,
  });

  // Find current lesson plan
  const currentLessonPlan = lessonPlans.find((lp: any) => {
    const lpWeekStart = new Date(lp.weekStart);
    lpWeekStart.setHours(0, 0, 0, 0);
    const currentWeek = new Date(currentWeekDate);
    currentWeek.setHours(0, 0, 0, 0);
    
    // Match by week, location, room, and schedule type
    return lpWeekStart.getTime() === currentWeek.getTime() &&
           lp.locationId === selectedLocation &&
           lp.roomId === selectedRoom &&
           lp.scheduleType === (locationSettings?.scheduleType || 'position-based');
  });

  // Create or submit lesson plan mutation
  const submitMutation = useMutation({
    mutationFn: async () => {
      if (currentLessonPlan) {
        // Submit existing plan
        return apiRequest(`/api/lesson-plans/${currentLessonPlan.id}/submit`, "POST");
      } else {
        // Create a new lesson plan first, then submit it
        const scheduleType = locationSettings?.scheduleType || 'position-based';
        const newPlan = await apiRequest(`/api/lesson-plans`, "POST", {
          weekStart: currentWeekDate.toISOString(),
          locationId: selectedLocation,
          roomId: selectedRoom,
          scheduleType: scheduleType,
          status: 'draft'
        });
        
        // Now submit the newly created plan
        return apiRequest(`/api/lesson-plans/${newPlan.id}/submit`, "POST");
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/lesson-plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/scheduled-activities"] });
      const role = userInfo?.role?.toLowerCase();
      if (role === 'admin' || role === 'superadmin') {
        toast({
          title: "Lesson Plan Approved",
          description: "Your lesson plan has been automatically approved for this week.",
        });
      } else {
        toast({
          title: "Submitted for Review",
          description: "Your lesson plan for this week has been submitted for review.",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit the lesson plan for review.",
        variant: "destructive",
      });
    },
  });

  const handleWeekChange = (newDate: Date) => {
    setCurrentWeekDate(newDate);
  };

  const handleSubmitToSupervisor = () => {
    if (!selectedLocation || !selectedRoom) {
      toast({
        title: "Missing Information",
        description: "Please select a location and room before submitting.",
        variant: "destructive",
      });
      return;
    }

    submitMutation.mutate();
  };

  const handleQuickAddActivity = () => {
    // TODO: Implement quick add activity modal
    console.log("Quick add activity");
  };



  return (
    <div className="w-full max-w-7xl mx-auto p-4" data-testid="lesson-planner">
      {/* Header Section */}
      <Card className="material-shadow mb-6">
        <CardContent className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1
                className="text-3xl font-bold text-charcoal mb-2"
                data-testid="app-title"
              >
                Lesson Planning Studio
              </h1>
              <p className="text-gray-600" data-testid="app-subtitle">
                Create engaging weekly lesson plans for your classrooms
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p
                  className="font-semibold text-charcoal"
                  data-testid="teacher-name"
                >
                  {userInfo
                    ? `${userInfo.userFirstName} ${userInfo.userLastName}`
                    : "Teacher"}
                </p>
                <p
                  className="text-sm text-gray-500"
                  data-testid="classroom-name"
                >
                  {userInfo?.role ? userInfo.role : "Loading..."}
                </p>
                {userInfo?.locations && userInfo.locations.length > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3 text-gray-400" />
                    <div className="flex gap-1">
                      {userInfo.locations.map((location, idx) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className="text-xs py-0 h-5"
                          data-testid={`location-badge-${idx}`}
                        >
                          {location}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {userInfo?.role?.toLowerCase() === "admin" && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setLocation("/settings")}
                        data-testid="button-settings"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Settings</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                <div className="w-12 h-12 bg-gradient-to-br from-coral-red to-turquoise rounded-full flex items-center justify-center text-white font-bold text-lg">
                  <span data-testid="teacher-initials">
                    {userInfo && userInfo.userFirstName && userInfo.userLastName
                      ? `${userInfo.userFirstName[0]}${userInfo.userLastName[0]}`
                      : "?"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <NavigationTabs>
        <CalendarControls
          currentWeekDate={currentWeekDate}
          selectedRoom={selectedRoom}
          selectedLocation={selectedLocation}
          onWeekChange={handleWeekChange}
          onRoomChange={setSelectedRoom}
          onLocationChange={setSelectedLocation}
          onSubmitToSupervisor={handleSubmitToSupervisor}
        />
        <WeeklyCalendar
          selectedLocation={selectedLocation}
          selectedRoom={selectedRoom}
          currentWeekDate={currentWeekDate}
        />
      </NavigationTabs>

      {/* Floating Action Button */}
      <FloatingActionButton onClick={handleQuickAddActivity} />
    </div>
  );
}
