import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, School, Package, Trophy } from "lucide-react";
import ActivityLibrary from "./activity-library";
import MaterialsLibrary from "./materials-library";
import MilestonesLibrary from "./milestones-library";


interface NavigationTabsProps {
  children: React.ReactNode; // Calendar content
}

export function NavigationTabs({ children }: NavigationTabsProps) {
  return (
    <Tabs defaultValue="calendar" className="space-y-6">
      <Card className="material-shadow">
        <CardContent className="p-2">

          <TabsList className="grid w-full grid-cols-4 bg-white dark:bg-gray-800 p-1 rounded-lg h-12">
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
    </Tabs>
  );
}