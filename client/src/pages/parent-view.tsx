import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users, BookOpen, Target, Package, ChevronDown, ChevronUp, Star, CheckCircle } from 'lucide-react';
import { format, startOfWeek, addDays, parseISO } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';
import { getUserInfo, getAuthToken } from '@/lib/auth';

interface Activity {
  id: string;
  title: string;
  description?: string;
  dayOfWeek: number;
  position?: number;
  startTime?: string;
  endTime?: string;
  completed?: boolean;
  rating?: number;
  milestones?: Array<{ id: string; name: string; }>;
  materials?: Array<{ id: string; name: string; }>;
  steps?: Array<{ orderIndex: number; instruction: string; }>;
}

interface LessonPlan {
  id: string;
  weekStart: string;
  status: string;
  approvedAt?: string;
  scheduleType: 'position-based' | 'time-based';
  activities?: Activity[];
  room?: { id: string; name: string; };
  location?: { id: string; name: string; };
}

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export default function ParentView() {
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    return startOfWeek(today, { weekStartsOn: 1 });
  });

  // Get user info from token
  const userInfo = getUserInfo();
  const roomId = (userInfo as any)?.roomId || (userInfo as any)?.childRoom;
  const roomName = (userInfo as any)?.roomName;
  
  // Use Aug 18 week for testing
  const testWeek = '2025-08-18';

  // Fetch approved lesson plans based on room from token
  const { data: lessonPlans, isLoading, error } = useQuery<LessonPlan[]>({
    queryKey: ['/api/parent/lesson-plans', testWeek, roomId],
    queryFn: async () => {
      try {
        // Use roomId from token if available, otherwise fall back to test data
        const queryParams = new URLSearchParams({ weekStart: testWeek });
        if (roomId) {
          queryParams.append('roomId', roomId);
        }
        const response = await apiRequest('GET', `/api/parent/lesson-plans?${queryParams.toString()}`);
        return response;
      } catch (error) {
        console.warn('Failed to fetch parent lesson plans:', error);
        throw error;
      }
    },
    enabled: !!userInfo && !!getAuthToken(), // Only fetch if we have user info and auth token
    retry: false, // Don't retry on failure to avoid repeated errors
    refetchOnWindowFocus: false // Don't refetch when window gains focus
  });

  // Group activities by day
  const getActivitiesForDay = (activities: Activity[], dayIndex: number) => {
    return activities
      ?.filter(a => a.dayOfWeek === dayIndex)
      ?.sort((a, b) => {
        if (a.position !== undefined && b.position !== undefined) {
          return a.position - b.position;
        }
        if (a.startTime && b.startTime) {
          return a.startTime.localeCompare(b.startTime);
        }
        return 0;
      }) || [];
  };

  const formatWeekRange = (weekStart: string) => {
    const start = parseISO(weekStart);
    const end = addDays(start, 4);
    return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-green-50">
      {/* Mobile Header */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="px-4 py-3">
          <h1 className="text-xl font-bold bg-gradient-to-r from-[#2BABE2] to-[#297AB1] bg-clip-text text-transparent">
            Weekly Lesson Plans
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {roomName ? `${roomName} Room - ` : ''}See what your child is learning
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 pb-20">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2BABE2]"></div>
          </div>
        ) : lessonPlans && lessonPlans.length > 0 ? (
          <div className="space-y-4">
            {lessonPlans.map((plan) => (
              <Card 
                key={plan.id} 
                className="overflow-hidden border-0 shadow-lg"
              >
                {/* Week Header */}
                <Button
                  variant="ghost"
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 rounded-none"
                  onClick={() => setExpandedWeek(expandedWeek === plan.id ? null : plan.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-[#2BABE2] to-[#297AB1] rounded-lg">
                      <Calendar className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">
                        {formatWeekRange(plan.weekStart)}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Approved
                        </Badge>
                        {plan.room && (
                          <span className="text-xs text-gray-500">
                            {plan.room.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {expandedWeek === plan.id ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </Button>

                {/* Expanded Week Content */}
                {expandedWeek === plan.id && plan.activities && (
                  <div className="border-t border-gray-100">
                    {daysOfWeek.map((day, dayIndex) => {
                      const dayActivities = getActivitiesForDay(plan.activities!, dayIndex);
                      const isExpanded = expandedDay === dayIndex;
                      
                      return (
                        <div key={day} className="border-b border-gray-50 last:border-0">
                          <Button
                            variant="ghost"
                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 rounded-none"
                            onClick={() => setExpandedDay(isExpanded ? null : dayIndex)}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-700">{day}</span>
                              <Badge variant="secondary" className="text-xs">
                                {dayActivities.length} activities
                              </Badge>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-gray-400" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>

                          {/* Day's Activities */}
                          {isExpanded && (
                            <div className="px-4 pb-3 space-y-3">
                              {dayActivities.map((activity, index) => (
                                <Card 
                                  key={activity.id}
                                  className={`p-3 border ${
                                    activity.completed 
                                      ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
                                      : 'bg-white border-gray-200'
                                  }`}
                                >
                                  {/* Activity Header */}
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                      <h4 className="font-semibold text-gray-900 text-sm">
                                        {activity.title}
                                      </h4>
                                      {plan.scheduleType === 'time-based' && activity.startTime && (
                                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                                          <Clock className="h-3 w-3" />
                                          {formatTime(activity.startTime)} - {activity.endTime && formatTime(activity.endTime)}
                                        </div>
                                      )}
                                      {plan.scheduleType === 'position-based' && (
                                        <div className="text-xs text-gray-500 mt-1">
                                          Activity {(activity.position || 0) + 1}
                                        </div>
                                      )}
                                    </div>
                                    {activity.completed && (
                                      <div className="flex flex-col items-end gap-1">
                                        <Badge className="bg-green-100 text-green-700 border-0 text-xs">
                                          <CheckCircle className="h-3 w-3 mr-1" />
                                          Done
                                        </Badge>
                                        {activity.rating && (
                                          <div className="flex gap-0.5">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                              <Star
                                                key={star}
                                                className={`h-3 w-3 ${
                                                  star <= activity.rating!
                                                    ? 'fill-yellow-400 text-yellow-400'
                                                    : 'text-gray-300'
                                                }`}
                                              />
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  {/* Activity Details */}
                                  {activity.description && (
                                    <p className="text-xs text-gray-600 mb-2">
                                      {activity.description}
                                    </p>
                                  )}

                                  {/* Milestones & Materials */}
                                  <div className="space-y-2">
                                    {activity.milestones && activity.milestones.length > 0 && (
                                      <div className="flex items-start gap-2">
                                        <Target className="h-3 w-3 text-[#8100FF] mt-0.5" />
                                        <div className="flex-1">
                                          <p className="text-xs font-medium text-gray-700">Learning Goals:</p>
                                          <div className="flex flex-wrap gap-1 mt-1">
                                            {activity.milestones.map(m => (
                                              <Badge 
                                                key={m.id} 
                                                variant="secondary"
                                                className="text-xs bg-purple-50 text-purple-700 border-purple-200"
                                              >
                                                {m.name}
                                              </Badge>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {activity.materials && activity.materials.length > 0 && (
                                      <div className="flex items-start gap-2">
                                        <Package className="h-3 w-3 text-[#88B73E] mt-0.5" />
                                        <div className="flex-1">
                                          <p className="text-xs font-medium text-gray-700">Materials Used:</p>
                                          <div className="flex flex-wrap gap-1 mt-1">
                                            {activity.materials.map(m => (
                                              <Badge 
                                                key={m.id} 
                                                variant="secondary"
                                                className="text-xs bg-green-50 text-green-700 border-green-200"
                                              >
                                                {m.name}
                                              </Badge>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* Activity Steps */}
                                    {activity.steps && activity.steps.length > 0 && (
                                      <div className="mt-2 pt-2 border-t border-gray-100">
                                        <p className="text-xs font-medium text-gray-700 mb-1">
                                          <BookOpen className="h-3 w-3 inline mr-1" />
                                          Activity Steps:
                                        </p>
                                        <ol className="list-decimal list-inside space-y-1 ml-2">
                                          {activity.steps
                                            .sort((a, b) => a.orderIndex - b.orderIndex)
                                            .map((step, idx) => (
                                              <li key={idx} className="text-xs text-gray-600">
                                                {step.instruction}
                                              </li>
                                            ))}
                                        </ol>
                                      </div>
                                    )}
                                  </div>
                                </Card>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center border-0 shadow-lg">
            <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Lesson Plans Available
            </h3>
            <p className="text-sm text-gray-600">
              Approved lesson plans for your child's room will appear here.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}