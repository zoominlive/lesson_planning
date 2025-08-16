import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Target, Package, BookOpen, Star, CheckCircle } from 'lucide-react';
import { format, startOfWeek, addDays, parseISO } from 'date-fns';
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
  steps?: Array<{ orderIndex: number; instruction: string | { text: string; imageUrl?: string } }>;
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
        const queryParams = new URLSearchParams({ weekStart: testWeek });
        if (roomId) {
          queryParams.append('roomId', roomId);
        }
        const response = await fetch(`/api/parent/lesson-plans?${queryParams.toString()}`, {
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch lesson plans');
        }
        return response.json();
      } catch (error) {
        console.warn('Failed to fetch parent lesson plans:', error);
        throw error;
      }
    },
    enabled: !!userInfo && !!getAuthToken(),
    retry: false,
    refetchOnWindowFocus: false
  });

  // Get all activities and group by day
  const getActivitiesByDay = () => {
    if (!lessonPlans || lessonPlans.length === 0) return {};
    
    const activitiesByDay: { [key: number]: Activity[] } = {};
    
    lessonPlans.forEach(plan => {
      if (plan.activities) {
        plan.activities.forEach(activity => {
          const dayIndex = activity.dayOfWeek;
          if (!activitiesByDay[dayIndex]) {
            activitiesByDay[dayIndex] = [];
          }
          activitiesByDay[dayIndex].push({
            ...activity,
            scheduleType: plan.scheduleType
          } as any);
        });
      }
    });
    
    // Sort activities within each day
    Object.keys(activitiesByDay).forEach(dayKey => {
      const dayIndex = parseInt(dayKey);
      activitiesByDay[dayIndex].sort((a, b) => {
        if (a.position !== undefined && b.position !== undefined) {
          return a.position - b.position;
        }
        if (a.startTime && b.startTime) {
          return a.startTime.localeCompare(b.startTime);
        }
        return 0;
      });
    });
    
    return activitiesByDay;
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

  const renderStepInstruction = (step: any) => {
    if (typeof step.instruction === 'string') {
      return step.instruction;
    }
    if (typeof step.instruction === 'object' && step.instruction?.text) {
      return step.instruction.text;
    }
    if (typeof step === 'string') {
      return step;
    }
    return String(step.instruction || step || '');
  };

  const activitiesByDay = getActivitiesByDay();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-green-50">
      {/* Mobile Header */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="px-4 py-3">
          <h1 className="text-xl font-bold bg-gradient-to-r from-[#2BABE2] to-[#297AB1] bg-clip-text text-transparent">
            This Week's Activities
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {roomName ? `${roomName} Room - ` : ''}See what your child is learning
          </p>
          {lessonPlans && lessonPlans.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              {formatWeekRange(lessonPlans[0].weekStart)}
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 pb-20">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2BABE2]"></div>
          </div>
        ) : lessonPlans && lessonPlans.length > 0 ? (
          <div className="space-y-6">
            {daysOfWeek.map((dayName, dayIndex) => {
              const dayActivities = activitiesByDay[dayIndex] || [];
              
              if (dayActivities.length === 0) return null;
              
              return (
                <div key={dayIndex} className="space-y-3">
                  {/* Day Header */}
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-[#2BABE2] to-[#297AB1] rounded-lg">
                      <Calendar className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">{dayName}</h2>
                      <p className="text-sm text-gray-500">{dayActivities.length} activities</p>
                    </div>
                  </div>

                  {/* Activities for this day */}
                  <div className="space-y-3">
                    {dayActivities.map((activity, index) => (
                      <Card 
                        key={activity.id}
                        className={`p-4 border ${
                          activity.completed 
                            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
                            : 'bg-white border-gray-200'
                        } shadow-sm`}
                      >
                        {/* Activity Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">
                              {activity.title}
                            </h3>
                            {activity.scheduleType === 'time-based' && activity.startTime && (
                              <div className="flex items-center gap-1 text-sm text-gray-500">
                                <Clock className="h-4 w-4" />
                                {formatTime(activity.startTime)}
                                {activity.endTime && ` - ${formatTime(activity.endTime)}`}
                              </div>
                            )}
                            {activity.scheduleType === 'position-based' && (
                              <div className="text-sm text-gray-500">
                                Activity {(activity.position || 0) + 1}
                              </div>
                            )}
                          </div>
                          {activity.completed && (
                            <div className="flex flex-col items-end gap-1">
                              <Badge className="bg-green-100 text-green-700 border-0 text-xs">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Completed
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

                        {/* Activity Description */}
                        {activity.description && (
                          <p className="text-sm text-gray-600 mb-3">
                            {activity.description}
                          </p>
                        )}

                        {/* Learning Goals */}
                        {activity.milestones && activity.milestones.length > 0 && (
                          <div className="mb-3">
                            <div className="flex items-start gap-2 mb-2">
                              <Target className="h-4 w-4 text-[#8100FF] mt-0.5" />
                              <span className="text-sm font-medium text-gray-700">Learning Goals:</span>
                            </div>
                            <div className="flex flex-wrap gap-2 ml-6">
                              {activity.milestones.map(milestone => (
                                <Badge 
                                  key={milestone.id} 
                                  variant="secondary"
                                  className="text-xs bg-purple-50 text-purple-700 border-purple-200"
                                >
                                  {milestone.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Materials */}
                        {activity.materials && activity.materials.length > 0 && (
                          <div className="mb-3">
                            <div className="flex items-start gap-2 mb-2">
                              <Package className="h-4 w-4 text-[#88B73E] mt-0.5" />
                              <span className="text-sm font-medium text-gray-700">Materials:</span>
                            </div>
                            <div className="flex flex-wrap gap-2 ml-6">
                              {activity.materials.map(material => (
                                <Badge 
                                  key={material.id} 
                                  variant="secondary"
                                  className="text-xs bg-green-50 text-green-700 border-green-200"
                                >
                                  {material.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Activity Steps */}
                        {activity.steps && activity.steps.length > 0 && (
                          <div className="pt-3 border-t border-gray-100">
                            <div className="flex items-start gap-2 mb-2">
                              <BookOpen className="h-4 w-4 text-gray-600 mt-0.5" />
                              <span className="text-sm font-medium text-gray-700">How it works:</span>
                            </div>
                            <ol className="list-decimal list-inside space-y-1 ml-6 text-sm text-gray-600">
                              {activity.steps
                                .sort((a, b) => a.orderIndex - b.orderIndex)
                                .map((step, idx) => (
                                  <li key={idx}>
                                    {renderStepInstruction(step)}
                                  </li>
                                ))}
                            </ol>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Activities This Week</h3>
            <p className="text-gray-500">
              Check back later for updated lesson plans.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}