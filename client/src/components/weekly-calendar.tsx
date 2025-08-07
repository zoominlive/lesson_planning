import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Play, Package } from "lucide-react";
import DraggableActivity from "./draggable-activity";
import type { Activity } from "@shared/schema";

const timeSlots = [
  { id: 0, label: "9:00 AM", name: "Morning Circle" },
  { id: 1, label: "10:00 AM", name: "Activity Time" },
  { id: 2, label: "11:00 AM", name: "Learning Centers" },
  { id: 3, label: "1:00 PM", name: "Rest/Quiet Time" },
  { id: 4, label: "2:00 PM", name: "Outdoor Play" },
];

const weekDays = [
  { id: 0, name: "Monday", date: "Mar 13" },
  { id: 1, name: "Tuesday", date: "Mar 14" },
  { id: 2, name: "Wednesday", date: "Mar 15" },
  { id: 3, name: "Thursday", date: "Mar 16" },
  { id: 4, name: "Friday", date: "Mar 17" },
];

const sampleScheduledActivities = [
  {
    dayOfWeek: 0,
    timeSlot: 0,
    activity: {
      id: "activity-1",
      title: "Morning Circle",
      category: "Social Development",
      duration: 25,
    }
  },
  {
    dayOfWeek: 0,
    timeSlot: 1,
    activity: {
      id: "activity-2",
      title: "Finger Painting",
      category: "Art & Creativity",
      duration: 45,
    }
  },
  {
    dayOfWeek: 1,
    timeSlot: 1,
    activity: {
      id: "activity-3",
      title: "Music & Movement",
      category: "Physical Development",
      duration: 30,
    }
  },
];

export default function WeeklyCalendar() {
  const [searchTerm, setSearchTerm] = useState("");
  const [draggedActivity, setDraggedActivity] = useState<Activity | null>(null);

  const { data: activities = [], isLoading } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
  });

  const filteredActivities = activities.filter(activity =>
    activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    setDraggedActivity(activity);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    const dropZone = e.currentTarget as HTMLElement;
    dropZone.classList.add("drag-over");
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const dropZone = e.currentTarget as HTMLElement;
    dropZone.classList.remove("drag-over");
  };

  const handleDrop = (e: React.DragEvent, dayOfWeek: number, timeSlot: number) => {
    e.preventDefault();
    const dropZone = e.currentTarget as HTMLElement;
    dropZone.classList.remove("drag-over");
    
    if (draggedActivity) {
      console.log(`Dropped ${draggedActivity.title} on ${weekDays[dayOfWeek].name} at ${timeSlots[timeSlot].label}`);
      // TODO: Implement actual scheduling logic
      setDraggedActivity(null);
    }
  };

  const isSlotOccupied = (dayOfWeek: number, timeSlot: number) => {
    return sampleScheduledActivities.find(sa => sa.dayOfWeek === dayOfWeek && sa.timeSlot === timeSlot);
  };

  return (
    <div className="space-y-6">
      {/* Calendar Grid */}
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
                    className="h-24 border-b border-gray-200 p-2 drag-zone"
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

      {/* Activity Library Sidebar */}
      <Card className="material-shadow">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold text-charcoal mb-4 flex items-center">
            <Package className="mr-2 text-coral-red" />
            Activity Library
          </h3>
          
          <div className="flex space-x-2 mb-4">
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

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-3"></div>
                  <div className="h-2 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredActivities.map((activity) => (
                <DraggableActivity 
                  key={activity.id} 
                  activity={activity} 
                  onDragStart={handleDragStart}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
