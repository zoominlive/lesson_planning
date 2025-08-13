import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, School, Package, Trophy, Scissors, ClipboardCheck } from "lucide-react";
import ActivityLibrary from "./activity-library";
import MaterialsLibrary from "./materials-library";
import MilestonesLibrary from "./milestones-library";
import { LessonReview } from "@/pages/lesson-review";
import { getUserInfo } from "@/lib/auth";
import { hasPermission } from "@/lib/permission-utils";


interface NavigationTabsProps {
  children: React.ReactNode; // Calendar content
  defaultTab?: string; // Allow overriding the default tab
}

export function NavigationTabs({ children, defaultTab = "calendar" }: NavigationTabsProps) {
  const userInfo = getUserInfo();
  const canReview = hasPermission('lesson_plan.approve');
  const gridCols = canReview ? 'grid-cols-5' : 'grid-cols-4';
  
  return (
    <Tabs defaultValue={defaultTab} className="space-y-6">
      <Card className="material-shadow">
        <CardContent className="p-2">

          <TabsList className={`grid w-full ${gridCols} bg-white dark:bg-gray-800 p-1 rounded-lg h-12`}>
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
              <Scissors className="mr-2 h-4 w-4" />
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
            {canReview && (
              <TabsTrigger 
                value="review" 
                className="flex items-center justify-center h-10 px-4 rounded-md font-semibold transition-all duration-300 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white data-[state=active]:!bg-purple-500 data-[state=active]:!text-white data-[state=active]:shadow-lg"
                data-testid="tab-review"
              >
                <ClipboardCheck className="mr-2 h-4 w-4" />
                Review
              </TabsTrigger>
            )}
          </TabsList>
        </CardContent>
      </Card>

      {/* Weekly Calendar Tab */}
      <TabsContent value="calendar" className="space-y-6">
        {children}
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

      {/* Review Tab */}
      {canReview && (
        <TabsContent value="review">
          <LessonReview />
        </TabsContent>
      )}
    </Tabs>
  );
}