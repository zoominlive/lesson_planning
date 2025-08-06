import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, School, Package, Trophy, ChevronLeft, ChevronRight, Send, Plus } from "lucide-react";
import WeeklyCalendar from "@/components/weekly-calendar";
import ActivityLibrary from "@/components/activity-library";
import MaterialsLibrary from "@/components/materials-library";
import MilestonesLibrary from "@/components/milestones-library";

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
      <Tabs defaultValue="calendar" className="space-y-6">
        <Card className="material-shadow">
          <CardContent className="p-4">
            <TabsList className="grid w-full grid-cols-4 bg-white dark:bg-gray-800 p-2 rounded-lg h-14">
              <TabsTrigger 
                value="calendar" 
                className="flex items-center justify-center h-10 px-4 rounded-md font-semibold transition-all duration-300 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white data-[state=active]:!bg-coral-red data-[state=active]:!text-white data-[state=active]:shadow-lg"
                data-testid="tab-calendar"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Weekly Calendar
              </TabsTrigger>
              <TabsTrigger 
                value="activities" 
                className="flex items-center justify-center h-10 px-4 rounded-md font-semibold transition-all duration-300 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white data-[state=active]:!bg-turquoise data-[state=active]:!text-white data-[state=active]:shadow-lg"
                data-testid="tab-activities"
              >
                <School className="mr-2 h-4 w-4" />
                Activities
              </TabsTrigger>
              <TabsTrigger 
                value="materials" 
                className="flex items-center justify-center h-10 px-4 rounded-md font-semibold transition-all duration-300 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white data-[state=active]:!bg-sky-blue data-[state=active]:!text-white data-[state=active]:shadow-lg"
                data-testid="tab-materials"
              >
                <Package className="mr-2 h-4 w-4" />
                Materials
              </TabsTrigger>
              <TabsTrigger 
                value="milestones" 
                className="flex items-center justify-center h-10 px-4 rounded-md font-semibold transition-all duration-300 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white data-[state=active]:!bg-mint-green data-[state=active]:!text-white data-[state=active]:shadow-lg"
                data-testid="tab-milestones"
              >
                <Trophy className="mr-2 h-4 w-4" />
                Milestones
              </TabsTrigger>
            </TabsList>
          </CardContent>
        </Card>

        {/* Weekly Calendar Tab */}
        <TabsContent value="calendar" className="space-y-6">
          {/* Calendar Controls */}
          <Card className="material-shadow">
            <CardContent className="p-6">
              <div className="flex flex-wrap justify-between items-center gap-4">
                <div className="flex items-center space-x-4">
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={handlePreviousWeek}
                    data-testid="button-previous-week"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-center">
                    <h2 className="text-xl font-bold text-charcoal" data-testid="current-week">
                      {currentWeek}
                    </h2>
                    <p className="text-sm text-gray-500">Spring Semester</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={handleNextWeek}
                    data-testid="button-next-week"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                    <SelectTrigger className="w-48" data-testid="select-room">
                      <SelectValue placeholder="Select room" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Rooms</SelectItem>
                      <SelectItem value="rainbow">Rainbow Room</SelectItem>
                      <SelectItem value="sunshine">Sunshine Room</SelectItem>
                      <SelectItem value="garden">Garden Room</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    onClick={handleSubmitToSupervisor}
                    className="bg-gradient-to-r from-mint-green to-sky-blue text-white hover:shadow-lg transition-all duration-300"
                    data-testid="button-submit-supervisor"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Submit to Supervisor
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <WeeklyCalendar />
        </TabsContent>

        {/* Activities Tab */}
        <TabsContent value="activities">
          <ActivityLibrary />
        </TabsContent>

        {/* Materials Tab */}
        <TabsContent value="materials">
          <MaterialsLibrary />
        </TabsContent>

        {/* Milestones Tab */}
        <TabsContent value="milestones">
          <MilestonesLibrary />
        </TabsContent>
      </Tabs>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={handleQuickAddActivity}
          size="icon"
          className="w-16 h-16 rounded-full bg-gradient-to-r from-coral-red to-turquoise text-white material-shadow material-shadow-hover"
          data-testid="button-quick-add"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}
