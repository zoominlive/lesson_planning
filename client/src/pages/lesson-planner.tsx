import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { NavigationTabs } from "@/components/navigation-tabs";
import { CalendarControls } from "@/components/calendar-controls";
import { FloatingActionButton } from "@/components/floating-action-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import WeeklyCalendar from "@/components/weekly-calendar";
import { Settings, MapPin } from "lucide-react";
import { useLocation } from "wouter";
import { getUserInfo } from "@/lib/auth";

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
  const [currentWeek, setCurrentWeek] = useState("Week of March 13-17, 2024");
  const [selectedRoom, setSelectedRoom] = useState("all");
  const [, setLocation] = useLocation();

  const { data: userInfo } = useQuery<UserInfo>({
    queryKey: ["/api/user"],
  });

  const handlePreviousWeek = () => {
    // TODO: Implement week navigation
    console.log("Previous week");
  };

  const handleNextWeek = () => {
    // TODO: Implement week navigation
    console.log("Next week");
  };

  const handleSubmitToSupervisor = () => {
    // TODO: Implement supervisor submission
    console.log("Submit to supervisor");
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
              <h1 className="text-3xl font-bold text-charcoal mb-2" data-testid="app-title">
                Lesson Planning Studio
              </h1>
              <p className="text-gray-600" data-testid="app-subtitle">
                Create engaging weekly lesson plans for your classroom
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="font-semibold text-charcoal" data-testid="teacher-name">
                  {userInfo ? `${userInfo.userFirstName} ${userInfo.userLastName}` : "Teacher"}
                </p>
                <p className="text-sm text-gray-500" data-testid="classroom-name">
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
                {userInfo?.role === "Admin" && (
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
          currentWeek={currentWeek}
          selectedRoom={selectedRoom}
          onPreviousWeek={handlePreviousWeek}
          onNextWeek={handleNextWeek}
          onRoomChange={setSelectedRoom}
          onSubmitToSupervisor={handleSubmitToSupervisor}
        />
        <WeeklyCalendar />
      </NavigationTabs>

      {/* Floating Action Button */}
      <FloatingActionButton onClick={handleQuickAddActivity} />
    </div>
  );
}