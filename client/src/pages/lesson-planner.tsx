import { useState, useEffect } from "react";
import { startOfWeek, format } from "date-fns";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import WeeklyCalendar from "@/components/weekly-calendar";
import { NotificationCarousel } from "@/components/notification-carousel";
import { CopyLessonPlanModal } from "@/components/copy-lesson-plan-modal";
import { Settings, AlertTriangle, Eye, Edit, Copy, Sparkles, Stars, Zap } from "lucide-react";
import { useLocation } from "wouter";
import { getUserInfo } from "@/lib/auth";
import { hasPermission, requiresLessonPlanApproval } from "@/lib/permission-utils";
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
  const [location, setLocation] = useLocation();
  const [showCopyModal, setShowCopyModal] = useState(false);
  const { toast } = useToast();
  
  // Check for tab query parameter
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  const defaultTab = searchParams.get('tab') || 'calendar';
  
  // Get user info directly from the token
  const userInfo = getUserInfo();

  // Fetch all rooms to auto-select first room for location
  const { data: allRooms = [] } = useQuery<any[]>({
    queryKey: ["/api/rooms"],
  });
  
  // Filter rooms for the selected location
  const filteredRooms = allRooms.filter((room: any) => room.locationId === selectedLocation);

  // Reset room selection when location changes
  useEffect(() => {
    if (selectedLocation) {
      // Don't reset if we're going to auto-select anyway
      const roomsForLocation = allRooms.filter((room: any) => room.locationId === selectedLocation);
      if (roomsForLocation.length > 0) {
        setSelectedRoom(roomsForLocation[0].id);
      } else {
        setSelectedRoom("");
      }
    }
  }, [selectedLocation, allRooms]);

  // Auto-select first room when rooms are available and no room is selected
  useEffect(() => {
    if (filteredRooms.length > 0 && !selectedRoom && selectedLocation) {
      setSelectedRoom(filteredRooms[0].id);
    }
  }, [filteredRooms.length, selectedLocation]); // Removed selectedRoom from deps to prevent infinite loop

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

  // Fetch lesson plans to find the current one and check for any returned plans
  const { data: lessonPlans = [], refetch: refetchLessonPlans } = useQuery<any[]>({
    queryKey: ["/api/lesson-plans"],
    enabled: !!selectedLocation && !!selectedRoom,
  });
  
  // Log fetched lesson plans for debugging
  useEffect(() => {
    if (lessonPlans && lessonPlans.length > 0) {
      console.log('[LESSON PLANNER] Fetched lesson plans:', lessonPlans.length, 'plans');
      lessonPlans.forEach((lp: any) => {
        console.log('[LESSON PLAN]', {
          id: lp.id,
          roomId: lp.roomId,
          weekStart: lp.weekStart,
          status: lp.status,
          teacherId: lp.teacherId,
          submittedBy: lp.submittedBy
        });
      });
    }
  }, [lessonPlans]);
  


  // Fetch location settings to get schedule type
  const { data: locationSettings } = useQuery<{ scheduleType: 'time-based' | 'position-based' }>({
    queryKey: [`/api/locations/${selectedLocation}/settings`],
    enabled: !!selectedLocation,
  });

  // Find current lesson plan
  console.log('[LESSON PLANNER] Looking for lesson plan with:', {
    selectedRoom,
    selectedLocation,
    currentWeek: currentWeekDate.toISOString(),
    scheduleType: locationSettings?.scheduleType || 'position-based',
    totalLessonPlans: lessonPlans.length
  });

  const currentLessonPlan = lessonPlans.find((lp: any) => {
    // The lesson plan weekStart is already at the start of the week (Monday at midnight UTC)
    // The currentWeekDate is also already at the start of the week
    const lpDate = new Date(lp.weekStart);
    const currentDate = new Date(currentWeekDate);
    
    // Set both to UTC midnight to avoid timezone issues
    lpDate.setUTCHours(0, 0, 0, 0);
    currentDate.setUTCHours(0, 0, 0, 0);
    
    // Match by week, location, room, and schedule type
    const matches = lpDate.getTime() === currentDate.getTime() &&
           lp.locationId === selectedLocation &&
           lp.roomId === selectedRoom &&
           lp.scheduleType === (locationSettings?.scheduleType || 'position-based');
    
    // Log detailed matching for debugging
    if (lp.roomId === selectedRoom || lpDate.getTime() === currentDate.getTime()) {
      console.log('[LESSON PLAN MATCH CHECK]', {
        lpId: lp.id,
        lpRoom: lp.roomId,
        selectedRoom: selectedRoom,
        roomMatch: lp.roomId === selectedRoom,
        lpLocation: lp.locationId,
        selectedLocation: selectedLocation,
        locationMatch: lp.locationId === selectedLocation,
        lpScheduleType: lp.scheduleType,
        expectedScheduleType: locationSettings?.scheduleType || 'position-based',
        scheduleTypeMatch: lp.scheduleType === (locationSettings?.scheduleType || 'position-based'),
        lpWeek: lp.weekStart,
        currentWeek: currentWeekDate.toISOString(),
        weekMatch: lpDate.getTime() === currentDate.getTime(),
        status: lp.status,
        overallMatch: matches
      });
    }
    
    return matches;
  });
  
  if (currentLessonPlan) {
    console.log('[LESSON PLANNER] Found current lesson plan:', currentLessonPlan.id, 'status:', currentLessonPlan.status);
  } else {
    console.log('[LESSON PLANNER] No lesson plan found for current selection');
  }
  


  // Fetch scheduled activities to check if lesson plan is empty
  const weekStartDate = startOfWeek(currentWeekDate, { weekStartsOn: 1 });
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

  // Withdraw from review mutation
  const withdrawMutation = useMutation({
    mutationFn: async () => {
      if (!currentLessonPlan) {
        throw new Error("No lesson plan to withdraw");
      }
      return apiRequest("POST", `/api/lesson-plans/${currentLessonPlan.id}/withdraw`);
    },
    onSuccess: async () => {
      // Immediately refetch lesson plans to update UI
      await refetchLessonPlans();
      queryClient.invalidateQueries({ queryKey: ["/api/lesson-plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/scheduled-activities"] });
      toast({
        title: "Withdrawn from Review",
        description: "Your lesson plan has been withdrawn from review and is now in draft status.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Withdrawal Failed",
        description: error.message || "Failed to withdraw the lesson plan from review.",
        variant: "destructive",
      });
    },
  });

  // Create or submit lesson plan mutation
  const submitMutation = useMutation({
    mutationFn: async () => {
      if (currentLessonPlan) {
        // Submit existing plan
        return apiRequest("POST", `/api/lesson-plans/${currentLessonPlan.id}/submit`);
      } else {
        // Create a new lesson plan first, then submit it
        const scheduleType = locationSettings?.scheduleType || 'position-based';
        const newPlan = await apiRequest("POST", `/api/lesson-plans`, {
          weekStart: currentWeekDate.toISOString(),
          locationId: selectedLocation,
          roomId: selectedRoom,
          scheduleType: scheduleType,
          status: 'draft'
        });
        
        // Now submit the newly created plan
        return apiRequest("POST", `/api/lesson-plans/${newPlan.id}/submit`);
      }
    },
    onSuccess: async (data) => {
      // Immediately refetch lesson plans to update UI
      await refetchLessonPlans();
      queryClient.invalidateQueries({ queryKey: ["/api/lesson-plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/scheduled-activities"] });
      const requiresApproval = requiresLessonPlanApproval();
      if (!requiresApproval) {
        toast({
          title: "Lesson Plan Finalized",
          description: "Your lesson plan has been finalized for this week.",
        });
      } else {
        toast({
          title: "Submitted for Review",
          description: "Your lesson plan for this week has been submitted for review.",
        });
      }
    },
    onError: (error: any) => {
      // Provide user-friendly error messages
      let errorMessage = "Failed to submit the lesson plan for review.";
      
      if (error.message) {
        // Check for specific error types and provide better messages
        if (error.message.includes("teacherId") || error.message.includes("Required")) {
          errorMessage = "There was an issue creating the lesson plan. Please try again or contact support.";
        } else if (error.message.includes("blank") || error.message.includes("empty")) {
          errorMessage = "You cannot submit a blank lesson plan. Please add some activities first.";
        } else if (error.message.includes("network") || error.message.includes("fetch")) {
          errorMessage = "Network error. Please check your connection and try again.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Submission Failed",
        description: errorMessage,
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

    // Check if there are any activities scheduled
    const hasActivities = scheduledActivities && scheduledActivities.length > 0;
    
    // If there's no current lesson plan and no activities, prevent submission
    if (!currentLessonPlan && !hasActivities) {
      toast({
        title: "Empty Lesson Plan",
        description: "You cannot submit a blank lesson plan. Please add some activities first.",
        variant: "destructive",
      });
      return;
    }

    submitMutation.mutate();
  };

  const handleWithdrawFromReview = () => {
    withdrawMutation.mutate();
  };

  const handleQuickAddActivity = () => {
    // TODO: Implement quick add activity modal
    console.log("Quick add activity");
  };

  // Check for ANY rejected lesson plans (not just current week)
  const returnedLessonPlans = lessonPlans.filter((lp: any) => 
    lp.status === 'rejected' && 
    lp.reviewNotes &&
    lp.locationId === selectedLocation &&
    lp.roomId === selectedRoom
  );
  
  // State for showing review notes
  const [showReviewNotes, setShowReviewNotes] = useState<Record<string, boolean>>({});

  return (
    <div className="w-full max-w-7xl mx-auto p-4" data-testid="lesson-planner">
      {/* Notification carousel for returned lesson plans */}
      <div className="mb-6">
        <NotificationCarousel 
          currentWeekDate={currentWeekDate}
          onWeekChange={setCurrentWeekDate}
        />
      </div>

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
              <div className="flex items-center gap-2">
                <p className="text-gray-600" data-testid="app-subtitle">
                  Create engaging weekly lesson plans powered by AI
                </p>
                <Sparkles className="h-4 w-4 text-purple-500" />
              </div>
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
              </div>
              <div className="flex items-center gap-2">
                {hasPermission('settings.access') && (
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
      <NavigationTabs defaultTab={defaultTab}>
        <CalendarControls
          currentWeekDate={currentWeekDate}
          selectedRoom={selectedRoom}
          selectedLocation={selectedLocation}
          onWeekChange={handleWeekChange}
          onRoomChange={setSelectedRoom}
          onLocationChange={setSelectedLocation}
          onSubmitToSupervisor={handleSubmitToSupervisor}
          currentLessonPlan={currentLessonPlan}
          onWithdrawFromReview={handleWithdrawFromReview}
          onCopyLessonPlan={() => setShowCopyModal(true)}
        />
        <WeeklyCalendar
          selectedLocation={selectedLocation}
          selectedRoom={selectedRoom}
          currentWeekDate={currentWeekDate}
          currentLessonPlan={currentLessonPlan}
        />
      </NavigationTabs>

      {/* Floating Action Button */}
      <FloatingActionButton onClick={handleQuickAddActivity} />
      
      {/* Copy Lesson Plan Modal */}
      {showCopyModal && currentLessonPlan && (
        <CopyLessonPlanModal
          isOpen={showCopyModal}
          onClose={() => setShowCopyModal(false)}
          lessonPlan={currentLessonPlan}
          currentRoom={selectedRoom}
          currentLocation={selectedLocation}
        />
      )}
    </div>
  );
}
