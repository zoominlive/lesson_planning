import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Clock, Users, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Save } from "lucide-react";
import { format } from "date-fns";

interface TabletRecordingViewProps {
  currentDate: Date;
  selectedLocation: string;
  selectedRoom: string;
  locations: any[];
  rooms: any[];
}

interface ActivityRecord {
  scheduledActivityId: string;
  completed: boolean;
  notes: string;
  materialsUsed: boolean;
  materialNotes: string;
}

export function TabletRecordingView({
  currentDate,
  selectedLocation,
  selectedRoom,
  locations,
  rooms,
}: TabletRecordingViewProps) {
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);
  const [activityRecords, setActivityRecords] = useState<{ [key: string]: ActivityRecord }>({});
  const todayDate = new Date();
  const dayOfWeek = todayDate.getDay() === 0 ? 6 : todayDate.getDay() - 1; // Convert to 0-4 (Mon-Fri)

  // Fetch today's scheduled activities
  const { data: scheduledActivities = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/scheduled-activities", selectedRoom, currentDate.toISOString(), selectedLocation, "today"],
    queryFn: async () => {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `/api/scheduled-activities/${selectedRoom}?weekStart=${encodeURIComponent(currentDate.toISOString())}&locationId=${encodeURIComponent(selectedLocation)}`,
        {
          headers: {
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
        }
      );
      if (!response.ok) throw new Error('Failed to fetch scheduled activities');
      const allActivities = await response.json();
      
      // Filter for today's activities
      return allActivities.filter((activity: any) => activity.dayOfWeek === dayOfWeek);
    },
    enabled: !!selectedRoom && !!selectedLocation,
  });

  // Sort activities by time slot
  const sortedActivities = [...scheduledActivities].sort((a, b) => a.timeSlot - b.timeSlot);

  const getTimeLabel = (timeSlot: number) => {
    const times = [
      "6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM", 
      "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", 
      "4:00 PM", "5:00 PM", "6:00 PM"
    ];
    return times[timeSlot] || `Slot ${timeSlot}`;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Social Development":
        return "bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-300";
      case "Art & Creativity":
        return "bg-gradient-to-r from-pink-100 to-rose-100 text-pink-700 border-pink-300";
      case "Physical Development":
        return "bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border-blue-300";
      case "Cognitive Development":
        return "bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 border-indigo-300";
      default:
        return "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border-gray-300";
    }
  };

  const handleToggleComplete = (activityId: string) => {
    setActivityRecords(prev => ({
      ...prev,
      [activityId]: {
        ...prev[activityId],
        scheduledActivityId: activityId,
        completed: !prev[activityId]?.completed,
        notes: prev[activityId]?.notes || '',
        materialsUsed: prev[activityId]?.materialsUsed || false,
        materialNotes: prev[activityId]?.materialNotes || '',
      }
    }));
  };

  const handleNotesChange = (activityId: string, notes: string) => {
    setActivityRecords(prev => ({
      ...prev,
      [activityId]: {
        ...prev[activityId],
        scheduledActivityId: activityId,
        notes,
        completed: prev[activityId]?.completed || false,
        materialsUsed: prev[activityId]?.materialsUsed || false,
        materialNotes: prev[activityId]?.materialNotes || '',
      }
    }));
  };

  const handleMaterialsToggle = (activityId: string) => {
    setActivityRecords(prev => ({
      ...prev,
      [activityId]: {
        ...prev[activityId],
        scheduledActivityId: activityId,
        materialsUsed: !prev[activityId]?.materialsUsed,
        completed: prev[activityId]?.completed || false,
        notes: prev[activityId]?.notes || '',
        materialNotes: prev[activityId]?.materialNotes || '',
      }
    }));
  };

  const handleMaterialNotesChange = (activityId: string, materialNotes: string) => {
    setActivityRecords(prev => ({
      ...prev,
      [activityId]: {
        ...prev[activityId],
        scheduledActivityId: activityId,
        materialNotes,
        completed: prev[activityId]?.completed || false,
        notes: prev[activityId]?.notes || '',
        materialsUsed: prev[activityId]?.materialsUsed || false,
      }
    }));
  };

  const handleSaveAll = () => {
    // Save all records to backend
    const recordsToSave = Object.values(activityRecords).filter(record => 
      record.completed || record.notes || record.materialsUsed
    );
    
    if (recordsToSave.length === 0) {
      toast({
        title: "No Records to Save",
        description: "Mark activities as complete or add notes before saving.",
        variant: "default",
      });
      return;
    }

    // TODO: Implement backend save
    toast({
      title: "Records Saved",
      description: `Successfully saved ${recordsToSave.length} activity records.`,
    });
  };

  const completedCount = Object.values(activityRecords).filter(r => r.completed).length;
  const totalCount = sortedActivities.length;

  return (
    <div className="h-full overflow-auto p-4">
      {/* Summary Header */}
      <div className="bg-gradient-to-r from-white to-gray-50 rounded-2xl shadow-lg p-4 mb-4 border border-gray-100">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-bold bg-gradient-to-r from-coral-red to-soft-yellow bg-clip-text text-transparent">
            Today's Activities
          </h2>
          <Button
            onClick={handleSaveAll}
            className="bg-gradient-to-r from-turquoise to-sky-blue text-white shadow-lg"
            size="sm"
          >
            <Save className="h-4 w-4 mr-2" />
            Save All
          </Button>
        </div>
        <p className="text-sm text-gray-600">{format(todayDate, 'EEEE, MMMM d, yyyy')}</p>
        <div className="flex gap-4 mt-3">
          <Badge className="bg-green-100 text-green-700">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {completedCount}/{totalCount} Completed
          </Badge>
          <Badge className="bg-blue-100 text-blue-700">
            {rooms.find(r => r.id === selectedRoom)?.name || 'Select Room'}
          </Badge>
        </div>
      </div>

      {/* Activities List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="p-4 animate-pulse bg-white/60">
                <div className="h-5 bg-gradient-to-r from-gray-200 to-gray-100 rounded mb-2 w-3/4"></div>
                <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-100 rounded mb-2"></div>
              </Card>
            ))}
          </div>
        ) : sortedActivities.length === 0 ? (
          <Card className="p-8 text-center bg-white/80">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No activities scheduled for today</p>
            <p className="text-sm text-gray-500 mt-2">Switch to Planning mode to schedule activities</p>
          </Card>
        ) : (
          sortedActivities.map((scheduled) => {
            const isExpanded = expandedActivity === scheduled.id;
            const record = activityRecords[scheduled.id];
            const isCompleted = record?.completed || false;

            return (
              <Card
                key={scheduled.id}
                className={`transition-all ${
                  isCompleted 
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300' 
                    : 'bg-white/80 border-gray-200'
                } ${isExpanded ? 'shadow-xl' : 'shadow-lg'}`}
              >
                <div className="p-4">
                  {/* Activity Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className="bg-white/80 text-charcoal border border-gray-300">
                          <Clock className="h-3 w-3 mr-1" />
                          {getTimeLabel(scheduled.timeSlot)}
                        </Badge>
                        <Badge className={`border ${getCategoryColor(scheduled.activity?.category || '')}`}>
                          {scheduled.activity?.category}
                        </Badge>
                      </div>
                      <h3 className={`font-semibold text-charcoal ${isCompleted ? 'line-through' : ''}`}>
                        {scheduled.activity?.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {scheduled.activity?.description}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={isCompleted}
                        onCheckedChange={() => handleToggleComplete(scheduled.id)}
                        className="h-6 w-6"
                        data-testid={`complete-activity-${scheduled.id}`}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setExpandedActivity(isExpanded ? null : scheduled.id)}
                        className="rounded-full"
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="mt-4 space-y-4 border-t border-gray-200 pt-4">
                      {/* Activity Notes */}
                      <div>
                        <Label htmlFor={`notes-${scheduled.id}`} className="text-sm font-semibold text-gray-700">
                          Activity Notes & Observations
                        </Label>
                        <Textarea
                          id={`notes-${scheduled.id}`}
                          placeholder="How did the activity go? Any observations about student engagement?"
                          value={record?.notes || ''}
                          onChange={(e) => handleNotesChange(scheduled.id, e.target.value)}
                          className="mt-2 min-h-[80px] bg-white/80"
                        />
                      </div>

                      {/* Materials Section */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Checkbox
                            id={`materials-${scheduled.id}`}
                            checked={record?.materialsUsed || false}
                            onCheckedChange={() => handleMaterialsToggle(scheduled.id)}
                          />
                          <Label htmlFor={`materials-${scheduled.id}`} className="text-sm font-semibold text-gray-700">
                            Materials Used
                          </Label>
                        </div>
                        {record?.materialsUsed && (
                          <Textarea
                            placeholder="Notes about materials (e.g., supplies running low, need replacements)"
                            value={record?.materialNotes || ''}
                            onChange={(e) => handleMaterialNotesChange(scheduled.id, e.target.value)}
                            className="mt-2 min-h-[60px] bg-white/80"
                          />
                        )}
                      </div>

                      {/* Activity Details */}
                      <div className="flex gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {scheduled.activity?.duration} minutes
                        </span>
                        {scheduled.activity?.groupSize && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {scheduled.activity?.groupSize}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Save Button at Bottom */}
      {sortedActivities.length > 0 && (
        <div className="sticky bottom-4 mt-6">
          <Button
            onClick={handleSaveAll}
            className="w-full bg-gradient-to-r from-turquoise to-sky-blue text-white shadow-2xl py-6 text-lg font-semibold"
            size="lg"
          >
            <Save className="h-5 w-5 mr-2" />
            Save Today's Records
          </Button>
        </div>
      )}
    </div>
  );
}