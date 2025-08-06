import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { NavigationTabs } from "@/components/navigation-tabs";
import { CalendarControls } from "@/components/calendar-controls";
import { FloatingActionButton } from "@/components/floating-action-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WeeklyCalendar from "@/components/weekly-calendar";

export default function LessonPlanner() {
  const [currentWeek, setCurrentWeek] = useState("Week of March 13-17, 2024");
  const [selectedRoom, setSelectedRoom] = useState("all");

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
                  Ms. Johnson
                </p>
                <p className="text-sm text-gray-500" data-testid="classroom-name">
                  Rainbow Room - Ages 3-4
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-coral-red to-turquoise rounded-full flex items-center justify-center text-white font-bold text-lg">
                <span data-testid="teacher-initials">MJ</span>
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