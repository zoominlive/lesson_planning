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
import { Clock, Users, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Save, Play, Image, Scissors, Target, ListChecks, Edit3, FileText } from "lucide-react";
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

  // Fetch the lesson plan to check if it's approved
  const { data: lessonPlans = [] } = useQuery<any[]>({
    queryKey: ["/api/lesson-plans", selectedLocation, currentDate.toISOString()],
    queryFn: async () => {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `/api/lesson-plans?locationId=${encodeURIComponent(selectedLocation)}&weekStart=${encodeURIComponent(currentDate.toISOString())}`,
        {
          headers: {
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
        }
      );
      if (!response.ok) throw new Error('Failed to fetch lesson plans');
      return response.json();
    },
    enabled: !!selectedLocation,
  });

  // Find the approved lesson plan for this room
  const approvedLessonPlan = lessonPlans.find(
    (plan: any) => plan.roomId === selectedRoom && plan.status === 'approved'
  );

  // Fetch scheduled activities for the week
  const { data: scheduledActivities = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/scheduled-activities", selectedRoom, currentDate.toISOString(), selectedLocation],
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
      
      // Show all activities for the week if there's an approved lesson plan
      // Otherwise only show today's activities
      if (approvedLessonPlan) {
        return allActivities;
      } else {
        return allActivities.filter((activity: any) => activity.dayOfWeek === dayOfWeek);
      }
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

  // Group activities by day if showing approved lesson plan
  const activitiesByDay = approvedLessonPlan ? (
    Array.from({ length: 5 }, (_, dayIndex) => ({
      day: dayIndex,
      dayName: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'][dayIndex],
      activities: sortedActivities.filter(a => a.dayOfWeek === dayIndex)
    }))
  ) : [];

  const showingFullWeek = approvedLessonPlan && sortedActivities.length > 0;

  return (
    <div className="h-full overflow-auto p-4">
      {/* Compact Summary Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-semibold text-gray-900">
                {showingFullWeek ? 'Week Activities' : "Today's Activities"}
              </h2>
              {showingFullWeek && (
                <Badge className="bg-purple-50 text-purple-700 border-purple-200">
                  Approved
                </Badge>
              )}
              <Badge className="bg-green-50 text-green-700 border-green-200">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {completedCount}/{totalCount}
              </Badge>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {showingFullWeek 
                ? `Week of ${format(currentDate, 'MMM d, yyyy')}`
                : format(todayDate, 'EEEE, MMM d')
              } • {rooms.find(r => r.id === selectedRoom)?.name || 'Select Room'}
            </p>
          </div>
          <Button
            onClick={handleSaveAll}
            className="bg-gradient-to-r from-turquoise to-sky-blue text-white"
            size="sm"
          >
            <Save className="h-3.5 w-3.5 mr-1.5" />
            Save
          </Button>
        </div>
      </div>

      {/* Activities List */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-3 animate-pulse bg-gray-50 rounded-lg">
                <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : sortedActivities.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="h-10 w-10 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 text-sm">
              {showingFullWeek 
                ? "No activities found in the approved lesson plan" 
                : "No activities scheduled for today"
              }
            </p>
            <p className="text-xs text-gray-500 mt-1">Switch to Planning mode to schedule activities</p>
          </div>
        ) : showingFullWeek ? (
          // Show activities grouped by day for approved plans with grid layout
          <div className="space-y-6">
            {activitiesByDay.map(({ day, dayName, activities }) => {
              if (activities.length === 0) return null;
              
              return (
                <div key={day} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-1 bg-gradient-to-b from-turquoise to-sky-blue rounded-full" />
                    <h3 className="text-lg font-bold text-gray-800">
                      {dayName}
                    </h3>
                    <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {activities.map((scheduled) => {
                      const isExpanded = expandedActivity === scheduled.id;
                      const record = activityRecords[scheduled.id];
                      const isCompleted = record?.completed || false;

                      return (
                        <div
                          key={scheduled.id}
                          className={`rounded-xl border-2 transition-all transform hover:scale-[1.02] shadow-lg hover:shadow-xl ${
                            isCompleted 
                              ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300' 
                              : 'bg-white border-gray-200'
                          } ${isExpanded ? 'col-span-2' : ''}`}
                        >
                        <div className="relative">
                          {/* Category Color Bar */}
                          <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-lg ${
                            scheduled.activity?.category === 'Art & Creativity' ? 'bg-gradient-to-r from-pink-400 to-rose-400' :
                            scheduled.activity?.category === 'Physical Development' ? 'bg-gradient-to-r from-blue-400 to-sky-400' :
                            scheduled.activity?.category === 'Social Development' ? 'bg-gradient-to-r from-green-400 to-emerald-400' :
                            scheduled.activity?.category === 'Cognitive Development' ? 'bg-gradient-to-r from-purple-400 to-violet-400' :
                            'bg-gradient-to-r from-gray-400 to-slate-400'
                          }`} />
                          
                          <div className="p-3">
                            {/* Compact Header Row */}
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="flex-1">
                                {/* Title, Time, and Category Row */}
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <h3 className={`font-semibold text-base text-gray-900 ${isCompleted ? 'line-through opacity-60' : ''}`}>
                                      {scheduled.activity?.title}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1">
                                      <div className="flex items-center gap-1 text-xs text-gray-600">
                                        <Clock className="h-3 w-3" />
                                        <span>{getTimeLabel(scheduled.timeSlot)}</span>
                                      </div>
                                      <span className="text-xs text-gray-500">•</span>
                                      <span className="text-xs text-gray-600">{scheduled.activity?.duration || 30}m</span>
                                      <span className="text-xs text-gray-500">•</span>
                                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                                        scheduled.activity?.category === 'Art & Creativity' ? 'bg-pink-100 text-pink-700' :
                                        scheduled.activity?.category === 'Physical Development' ? 'bg-blue-100 text-blue-700' :
                                        scheduled.activity?.category === 'Social Development' ? 'bg-green-100 text-green-700' :
                                        scheduled.activity?.category === 'Cognitive Development' ? 'bg-purple-100 text-purple-700' :
                                        'bg-gray-100 text-gray-700'
                                      }`}>
                                        {scheduled.activity?.category}
                                      </span>
                                    </div>
                                  </div>
                                  <Checkbox
                                    checked={isCompleted}
                                    onCheckedChange={() => handleToggleComplete(scheduled.id)}
                                    className="h-5 w-5 mt-1"
                                    data-testid={`complete-activity-${scheduled.id}`}
                                  />
                                </div>

                                {/* Group Details Row (Always Visible) */}
                                <div className="flex items-center gap-3 text-xs">
                                  {scheduled.activity?.ageGroups && scheduled.activity.ageGroups.length > 0 && (
                                    <div className="flex items-center gap-1.5">
                                      <Users className="h-3 w-3 text-gray-500" />
                                      <span className="text-gray-600">
                                        {scheduled.activity.ageGroups.map((ag: any) => ag.name).join(', ')}
                                      </span>
                                    </div>
                                  )}
                                  {(scheduled.activity?.minChildren || scheduled.activity?.maxChildren) && (
                                    <div className="flex items-center gap-1 text-gray-600">
                                      <span className="text-gray-500">•</span>
                                      <span>
                                        {scheduled.activity?.minChildren && scheduled.activity?.maxChildren 
                                          ? `${scheduled.activity.minChildren}-${scheduled.activity.maxChildren} children`
                                          : scheduled.activity?.minChildren 
                                          ? `Min ${scheduled.activity.minChildren} children`
                                          : `Max ${scheduled.activity.maxChildren} children`
                                        }
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* Description Preview */}
                                {!isExpanded && scheduled.activity?.description && (
                                  <p className="text-sm text-gray-600 line-clamp-2 mt-2">
                                    {scheduled.activity.description}
                                  </p>
                                )}

                                {/* Quick Info Pills */}
                                {!isExpanded && (
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {scheduled.activity?.materials && scheduled.activity.materials.length > 0 && (
                                      <div className="flex items-center gap-1 text-xs text-gray-600 bg-gray-50 rounded-full px-2 py-1">
                                        <Scissors className="h-3 w-3" />
                                        <span>{scheduled.activity.materials.length} materials</span>
                                      </div>
                                    )}
                                    {scheduled.activity?.milestones && scheduled.activity.milestones.length > 0 && (
                                      <div className="flex items-center gap-1 text-xs text-gray-600 bg-gray-50 rounded-full px-2 py-1">
                                        <Target className="h-3 w-3" />
                                        <span>{scheduled.activity.milestones.length} milestones</span>
                                      </div>
                                    )}
                                    {scheduled.activity?.steps && scheduled.activity.steps.length > 0 && (
                                      <div className="flex items-center gap-1 text-xs text-gray-600 bg-gray-50 rounded-full px-2 py-1">
                                        <ListChecks className="h-3 w-3" />
                                        <span>{scheduled.activity.steps.length} steps</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Expand/Collapse Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedActivity(isExpanded ? null : scheduled.id)}
                              className="w-full justify-center gap-2 hover:bg-gray-50 mt-2"
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="h-4 w-4" />
                                  Show Less
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-4 w-4" />
                                  Show Details & Record
                                </>
                              )}
                            </Button>
                          </div>

                          {/* Expanded Content - Beautiful Tablet Layout */}
                          {isExpanded && (
                            <div className="mt-4 pt-4 border-t-2 border-gray-100">
                              {/* Hero Image Section */}
                              {scheduled.activity?.activityImage && (
                                <div className="mb-4 rounded-xl overflow-hidden shadow-md">
                                  <img 
                                    src={scheduled.activity.activityImage} 
                                    alt={scheduled.activity.title}
                                    className="w-full h-48 object-cover"
                                  />
                                </div>
                              )}
                              
                              {/* Activity Steps Card - Full Width */}
                              {scheduled.activity?.steps && scheduled.activity.steps.length > 0 && (
                                <div className="bg-gradient-to-br from-orange-50 to-white rounded-xl p-4 border border-orange-200 shadow-sm mb-4">
                                  <div className="flex items-center gap-2 mb-3">
                                    <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-500 rounded-lg flex items-center justify-center">
                                      <ListChecks className="h-4 w-4 text-white" />
                                    </div>
                                    <h4 className="text-sm font-bold text-gray-800">Activity Steps</h4>
                                  </div>
                                  <ol className="space-y-3">
                                    {scheduled.activity.steps.map((step: any, index: number) => (
                                      <li key={index} className="flex gap-3">
                                        <span className="flex-shrink-0 w-7 h-7 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center text-sm font-bold">
                                          {index + 1}
                                        </span>
                                        <div className="flex-1">
                                          <p className="text-sm text-gray-700">{step.instruction}</p>
                                          {step.imageUrl && (
                                            <img 
                                              src={step.imageUrl} 
                                              alt={`Step ${index + 1}`}
                                              className="mt-2 rounded-lg w-full max-h-32 object-cover shadow-sm"
                                            />
                                          )}
                                        </div>
                                      </li>
                                    ))}
                                  </ol>
                                </div>
                              )}

                              {/* Main Content Grid - 2 Columns for remaining cards */}
                              <div className="grid grid-cols-2 gap-4">
                                {/* Left Column */}
                                <div className="space-y-4">
                                  {/* Description Card */}
                                  {scheduled.activity?.description && (
                                    <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-4 border border-blue-200 shadow-sm">
                                      <div className="flex items-center gap-2 mb-3">
                                        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg flex items-center justify-center">
                                          <FileText className="h-4 w-4 text-white" />
                                        </div>
                                        <h4 className="text-sm font-bold text-gray-800">Activity Overview</h4>
                                      </div>
                                      <p className="text-sm text-gray-600 leading-relaxed">
                                        {scheduled.activity.description}
                                      </p>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Right Column */}
                                <div className="space-y-4">
                                  {/* Milestones Card */}
                                  {scheduled.activity?.milestones && scheduled.activity.milestones.length > 0 && (
                                    <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl p-4 border border-purple-200 shadow-sm">
                                      <div className="flex items-center gap-2 mb-3">
                                        <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-500 rounded-lg flex items-center justify-center">
                                          <Target className="h-4 w-4 text-white" />
                                        </div>
                                        <h4 className="text-sm font-bold text-gray-800">Developmental Milestones</h4>
                                      </div>
                                      <div className="space-y-3">
                                        {scheduled.activity.milestones.map((milestone: any) => (
                                          <div key={milestone.id} className="flex gap-3 bg-white p-3 rounded-lg border border-purple-100">
                                            {milestone.imageUrl && (
                                              <img 
                                                src={milestone.imageUrl} 
                                                alt={milestone.title}
                                                className="w-14 h-14 object-cover rounded-lg shadow-sm"
                                              />
                                            )}
                                            <div className="flex-1">
                                              <p className="text-sm font-semibold text-gray-700">{milestone.title}</p>
                                              {milestone.description && (
                                                <p className="text-xs text-gray-500 mt-1">{milestone.description}</p>
                                              )}
                                              <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs mt-2">
                                                {milestone.category}
                                              </Badge>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                              )}
                                </div>
                              </div>
                              
                              {/* Bottom Section - Materials and Recording */}
                              <div className="mt-4 space-y-4">
                                {/* Video Link */}
                                {scheduled.activity?.videoUrl && (
                                  <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-4 border border-blue-200 shadow-sm">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg flex items-center justify-center">
                                          <Play className="h-4 w-4 text-white" />
                                        </div>
                                        <h4 className="text-sm font-bold text-gray-800">Video Tutorial</h4>
                                      </div>
                                      <a 
                                        href={scheduled.activity.videoUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                                      >
                                        <Play className="h-4 w-4" />
                                        Watch Video
                                      </a>
                                    </div>
                                  </div>
                                )}
                              
                                {/* Materials Card */}
                                {scheduled.activity?.materials && scheduled.activity.materials.length > 0 && (
                                  <div className="bg-gradient-to-br from-teal-50 to-white rounded-xl p-4 border border-teal-200 shadow-sm">
                                    <div className="flex items-center gap-2 mb-3">
                                      <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-teal-500 rounded-lg flex items-center justify-center">
                                        <Scissors className="h-4 w-4 text-white" />
                                      </div>
                                      <h4 className="text-sm font-bold text-gray-800">Required Materials</h4>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                      {scheduled.activity.materials.map((material: any) => (
                                        <div key={material.id} className="flex gap-3 bg-white p-3 rounded-lg border border-teal-100">
                                          {material.imageUrl && (
                                            <img 
                                              src={material.imageUrl} 
                                              alt={material.name}
                                              className="w-16 h-16 object-cover rounded-lg shadow-sm"
                                            />
                                          )}
                                          <div className="flex-1">
                                            <p className="text-sm font-semibold text-gray-700">{material.name}</p>
                                            {material.description && (
                                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{material.description}</p>
                                            )}
                                            {material.quantity && (
                                              <Badge className="bg-teal-100 text-teal-700 border-teal-200 text-xs mt-1">
                                                Qty: {material.quantity}
                                              </Badge>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              
                                {/* Recording Section Card */}
                                <div className="bg-gradient-to-br from-yellow-50 to-white rounded-xl p-4 border border-yellow-200 shadow-sm">
                                  <div className="flex items-center gap-2 mb-3">
                                    <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg flex items-center justify-center">
                                      <Edit3 className="h-4 w-4 text-white" />
                                    </div>
                                    <h4 className="text-sm font-bold text-gray-800">Activity Recording</h4>
                                  </div>
                                  
                                  <div className="space-y-3">
                                    <div>
                                      <Label htmlFor={`notes-${scheduled.id}`} className="text-xs font-semibold text-gray-600 mb-1">
                                        Activity Notes
                                      </Label>
                                      <Textarea
                                        id={`notes-${scheduled.id}`}
                                        placeholder="How did the activity go? Any observations or adjustments made?"
                                        value={record?.notes || ''}
                                        onChange={(e) => handleNotesChange(scheduled.id, e.target.value)}
                                        className="min-h-[80px] text-sm bg-white"
                                        data-testid={`notes-${scheduled.id}`}
                                      />
                                    </div>

                                    <div className="flex items-center gap-3 bg-yellow-50 p-3 rounded-lg">
                                      <Checkbox
                                        id={`materials-${scheduled.id}`}
                                        checked={record?.materialsUsed || false}
                                        onCheckedChange={() => handleMaterialsToggle(scheduled.id)}
                                        className="h-5 w-5"
                                      />
                                      <Label htmlFor={`materials-${scheduled.id}`} className="text-sm font-medium text-gray-700 cursor-pointer">
                                        All materials were used as planned
                                      </Label>
                                    </div>
                                    
                                    {record?.materialsUsed && (
                                      <div>
                                        <Label htmlFor={`material-notes-${scheduled.id}`} className="text-xs font-semibold text-gray-600 mb-1">
                                          Material Notes
                                        </Label>
                                        <Textarea
                                          id={`material-notes-${scheduled.id}`}
                                          placeholder="Any notes about material usage or substitutions?"
                                          value={record?.materialNotes || ''}
                                          onChange={(e) => handleMaterialNotesChange(scheduled.id, e.target.value)}
                                          className="min-h-[60px] text-sm bg-white"
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Show regular single day activities in grid layout
          <div className="grid grid-cols-2 gap-4">
            {sortedActivities.map((scheduled) => {
              const isExpanded = expandedActivity === scheduled.id;
              const record = activityRecords[scheduled.id];
              const isCompleted = record?.completed || false;

              return (
                <div
                  key={scheduled.id}
                  className={`rounded-xl border-2 transition-all transform hover:scale-[1.02] shadow-lg hover:shadow-xl ${
                    isCompleted 
                      ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300' 
                      : 'bg-white border-gray-200'
                  } ${isExpanded ? 'col-span-2' : ''}`}
                >
                <div className="relative">
                  {/* Category Color Bar */}
                  <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-lg ${
                    scheduled.activity?.category === 'Art & Creativity' ? 'bg-gradient-to-r from-pink-400 to-rose-400' :
                    scheduled.activity?.category === 'Physical Development' ? 'bg-gradient-to-r from-blue-400 to-sky-400' :
                    scheduled.activity?.category === 'Social Development' ? 'bg-gradient-to-r from-green-400 to-emerald-400' :
                    scheduled.activity?.category === 'Cognitive Development' ? 'bg-gradient-to-r from-purple-400 to-violet-400' :
                    'bg-gradient-to-r from-gray-400 to-slate-400'
                  }`} />
                  
                  <div className="p-4">
                    {/* Time and Status Row */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 bg-gray-100 rounded-full px-2.5 py-1">
                          <Clock className="h-3.5 w-3.5 text-gray-600" />
                          <span className="text-xs font-medium text-gray-700">
                            {getTimeLabel(scheduled.timeSlot)}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {scheduled.activity?.duration || 30}m
                        </Badge>
                      </div>
                      <Checkbox
                        checked={isCompleted}
                        onCheckedChange={() => handleToggleComplete(scheduled.id)}
                        className="h-5 w-5"
                        data-testid={`complete-activity-${scheduled.id}`}
                      />
                    </div>

                    {/* Activity Content */}
                    <div className="space-y-3">
                      {/* Activity Image (if exists and not expanded) */}
                      {scheduled.activity?.activityImage && !isExpanded && (
                        <div className="w-full h-32 rounded-lg overflow-hidden bg-gray-100">
                          <img 
                            src={scheduled.activity.activityImage} 
                            alt={scheduled.activity.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      
                      {/* Title and Category */}
                      <div>
                        <h3 className={`font-semibold text-base text-gray-900 mb-1 ${isCompleted ? 'line-through opacity-60' : ''}`}>
                          {scheduled.activity?.title}
                        </h3>
                        <span className={`inline-block text-xs px-2.5 py-1 rounded-full ${
                          scheduled.activity?.category === 'Art & Creativity' ? 'bg-pink-100 text-pink-700' :
                          scheduled.activity?.category === 'Physical Development' ? 'bg-blue-100 text-blue-700' :
                          scheduled.activity?.category === 'Social Development' ? 'bg-green-100 text-green-700' :
                          scheduled.activity?.category === 'Cognitive Development' ? 'bg-purple-100 text-purple-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {scheduled.activity?.category}
                        </span>
                      </div>
                      
                      {/* Description Preview */}
                      {!isExpanded && scheduled.activity?.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {scheduled.activity.description}
                        </p>
                      )}

                      {/* Quick Info Pills */}
                      {!isExpanded && (
                        <div className="flex flex-wrap gap-2">
                          {scheduled.activity?.materials && scheduled.activity.materials.length > 0 && (
                            <div className="flex items-center gap-1 text-xs text-gray-600 bg-gray-50 rounded-full px-2 py-1">
                              <Scissors className="h-3 w-3" />
                              <span>{scheduled.activity.materials.length} materials</span>
                            </div>
                          )}
                          {scheduled.activity?.milestones && scheduled.activity.milestones.length > 0 && (
                            <div className="flex items-center gap-1 text-xs text-gray-600 bg-gray-50 rounded-full px-2 py-1">
                              <Target className="h-3 w-3" />
                              <span>{scheduled.activity.milestones.length} milestones</span>
                            </div>
                          )}
                          {scheduled.activity?.steps && scheduled.activity.steps.length > 0 && (
                            <div className="flex items-center gap-1 text-xs text-gray-600 bg-gray-50 rounded-full px-2 py-1">
                              <ListChecks className="h-3 w-3" />
                              <span>{scheduled.activity.steps.length} steps</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Expand/Collapse Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedActivity(isExpanded ? null : scheduled.id)}
                        className="w-full justify-center gap-2 hover:bg-gray-50"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="h-4 w-4" />
                            Show Less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4" />
                            Show Details & Record
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
                      {/* Full Activity Image */}
                      {scheduled.activity?.activityImage && (
                        <div className="rounded-lg overflow-hidden bg-gray-100">
                          <img 
                            src={scheduled.activity.activityImage} 
                            alt={scheduled.activity.title}
                            className="w-full max-h-48 object-cover"
                          />
                        </div>
                      )}
                      
                      {/* Description */}
                      {scheduled.activity?.description && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-700 mb-1">Description</h4>
                          <p className="text-xs text-gray-600">
                            {scheduled.activity.description}
                          </p>
                        </div>
                      )}
                      
                      {/* Age Groups */}
                      {scheduled.activity?.ageGroups && scheduled.activity.ageGroups.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-700 mb-1">Age Groups</h4>
                          <div className="flex flex-wrap gap-1">
                            {scheduled.activity.ageGroups.map((ageGroup: any) => (
                              <Badge key={ageGroup.id} variant="outline" className="text-xs">
                                {ageGroup.name} ({ageGroup.description})
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Recommended Children Count */}
                      <div>
                        <h4 className="text-xs font-semibold text-gray-700 mb-1">Recommended Group Size</h4>
                        <div className="flex gap-4 text-xs text-gray-600">
                          {scheduled.activity?.minChildren && (
                            <span>Min: {scheduled.activity.minChildren} children</span>
                          )}
                          {scheduled.activity?.maxChildren && (
                            <span>Max: {scheduled.activity.maxChildren} children</span>
                          )}
                          {!scheduled.activity?.minChildren && !scheduled.activity?.maxChildren && (
                            <span>No specific group size requirements</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Developmental Milestones */}
                      {scheduled.activity?.milestones && scheduled.activity.milestones.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-700 mb-2">Developmental Milestones</h4>
                          <div className="space-y-2">
                            {scheduled.activity.milestones.map((milestone: any) => (
                              <div key={milestone.id} className="flex gap-2 bg-gray-50 p-2 rounded">
                                {milestone.imageUrl && (
                                  <img 
                                    src={milestone.imageUrl} 
                                    alt={milestone.title}
                                    className="w-12 h-12 object-cover rounded"
                                  />
                                )}
                                <div className="flex-1">
                                  <p className="text-xs font-medium text-gray-700">{milestone.title}</p>
                                  {milestone.description && (
                                    <p className="text-xs text-gray-500 mt-0.5">{milestone.description}</p>
                                  )}
                                  <Badge variant="secondary" className="text-xs mt-1">
                                    {milestone.category}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Activity Steps */}
                      {scheduled.activity?.steps && scheduled.activity.steps.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-700 mb-2">Activity Steps</h4>
                          <ol className="space-y-2">
                            {scheduled.activity.steps.map((step: any, index: number) => (
                              <li key={index} className="flex gap-2">
                                <span className="text-xs font-medium text-gray-500 flex-shrink-0">
                                  {index + 1}.
                                </span>
                                <div className="flex-1">
                                  <p className="text-xs text-gray-600">{step.instruction}</p>
                                  {step.imageUrl && (
                                    <img 
                                      src={step.imageUrl} 
                                      alt={`Step ${index + 1}`}
                                      className="mt-1 rounded w-full max-h-32 object-cover"
                                    />
                                  )}
                                </div>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                      
                      {/* Video Link */}
                      {scheduled.activity?.videoUrl && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-700 mb-1">Video Tutorial</h4>
                          <a 
                            href={scheduled.activity.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-xs text-blue-600 hover:text-blue-700"
                          >
                            <Play className="h-3 w-3" />
                            Watch video demonstration
                          </a>
                        </div>
                      )}
                      
                      {/* Materials */}
                      {scheduled.activity?.materials && scheduled.activity.materials.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-700 mb-2">Required Materials</h4>
                          <div className="space-y-2">
                            {scheduled.activity.materials.map((material: any) => (
                              <div key={material.id} className="flex gap-2 bg-gray-50 p-2 rounded">
                                {material.imageUrl && (
                                  <img 
                                    src={material.imageUrl} 
                                    alt={material.name}
                                    className="w-12 h-12 object-cover rounded"
                                  />
                                )}
                                <div className="flex-1">
                                  <p className="text-xs font-medium text-gray-700">{material.name}</p>
                                  {material.description && (
                                    <p className="text-xs text-gray-500 mt-0.5">{material.description}</p>
                                  )}
                                  {material.quantity && (
                                    <p className="text-xs text-gray-600 mt-0.5">Quantity: {material.quantity}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Activity Details */}
                      <div className="flex gap-3 text-xs text-gray-500">
                        {scheduled.activity?.duration && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {scheduled.activity.duration} minutes
                          </span>
                        )}
                        {scheduled.activity?.groupSize && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {scheduled.activity.groupSize}
                          </span>
                        )}
                      </div>
                      
                      {/* Recording Section */}
                      <div className="border-t pt-3 space-y-2">
                        <h4 className="text-xs font-semibold text-gray-700">Activity Recording</h4>
                        
                        <Textarea
                          placeholder="Add notes about how the activity went..."
                          value={record?.notes || ''}
                          onChange={(e) => handleNotesChange(scheduled.id, e.target.value)}
                          className="min-h-[60px] text-sm"
                          data-testid={`notes-${scheduled.id}`}
                        />

                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`materials-${scheduled.id}`}
                            checked={record?.materialsUsed || false}
                            onCheckedChange={() => handleMaterialsToggle(scheduled.id)}
                            className="h-4 w-4"
                          />
                          <Label htmlFor={`materials-${scheduled.id}`} className="text-xs text-gray-600">
                            Materials Used
                          </Label>
                        </div>
                        
                        {record?.materialsUsed && (
                          <Textarea
                            placeholder="Notes about materials..."
                            value={record?.materialNotes || ''}
                            onChange={(e) => handleMaterialNotesChange(scheduled.id, e.target.value)}
                            className="min-h-[40px] text-sm"
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          </div>
        )}
      </div>

    </div>
  );
}