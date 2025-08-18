import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Target, Package, BookOpen, Star, CheckCircle, Award, Image as ImageIcon, Play, ChevronDown, ChevronUp } from 'lucide-react';
import { format, startOfWeek, addDays, parseISO } from 'date-fns';
import { getUserInfo, getAuthToken } from '@/lib/auth';
import { useState } from 'react';

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Activity {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  category?: Category;
  dayOfWeek: number;
  position?: number;
  startTime?: string;
  endTime?: string;
  duration?: number;
  completed?: boolean;
  rating?: number;
  milestones?: Array<{ id: string; name: string; description?: string }>;
  materials?: Array<{ id: string; name: string; photoUrl?: string }>;
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

const CategoryBadge = ({ category }: { category: Category }) => (
  <Badge 
    className="text-xs font-medium text-white border-0 shadow-md"
    style={{ 
      backgroundColor: category.color,
      background: `linear-gradient(135deg, ${category.color}, ${category.color}dd)`
    }}
  >
    {category.name}
  </Badge>
);

const ActivityImage = ({ activity }: { activity: Activity }) => {
  if (activity.imageUrl) {
    return (
      <div className="relative w-full h-48 overflow-hidden rounded-t-xl">
        <img 
          src={activity.imageUrl.startsWith('/') ? activity.imageUrl : `/api/activities/images/${activity.imageUrl}`}
          alt={activity.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const fallback = target.nextElementSibling as HTMLElement;
            if (fallback) fallback.classList.remove('hidden');
          }}
        />
        <div className="hidden absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-500 to-green-400">
          <div className="flex items-center justify-center h-full">
            <ImageIcon className="h-12 w-12 text-white/70" />
          </div>
        </div>

        {activity.completed && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-green-500 text-white border-0 shadow-lg">
              <CheckCircle className="h-3 w-3 mr-1" />
              Completed
            </Badge>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full h-48 bg-gradient-to-br from-blue-400 via-purple-500 to-green-400 rounded-t-xl">
      <div className="flex items-center justify-center h-full">
        <Play className="h-16 w-16 text-white/80" />
      </div>

      {activity.completed && (
        <div className="absolute top-3 right-3">
          <Badge className="bg-green-500 text-white border-0 shadow-lg">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        </div>
      )}
    </div>
  );
};

export default function ParentView() {
  const userInfo = getUserInfo();
  const roomId = (userInfo as any)?.roomId || (userInfo as any)?.childRoom;
  const roomName = (userInfo as any)?.roomName;
  
  // Week toggle state - start with current week (Aug 18, 2025 is a Monday)
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  // Track which activities have expanded "How it works" sections
  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(new Set());
  const getCurrentMondayWeek = (offset: number = 0) => {
    const aug18Monday = parseISO('2025-08-18'); // This is already a Monday
    return format(addDays(aug18Monday, offset * 7), 'yyyy-MM-dd');
  };
  const currentWeek = getCurrentMondayWeek(currentWeekOffset);

  const { data: lessonPlans, isLoading } = useQuery<LessonPlan[]>({
    queryKey: ['/api/parent/lesson-plans', currentWeek, roomId],
    queryFn: async () => {
      const queryParams = new URLSearchParams({ weekStart: currentWeek });
      if (roomId) queryParams.append('roomId', roomId);
      
      const response = await fetch(`/api/parent/lesson-plans?${queryParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` },
      });
      
      if (!response.ok) throw new Error('Failed to fetch lesson plans');
      return response.json();
    },
    enabled: !!userInfo && !!getAuthToken(),
    retry: false,
    refetchOnWindowFocus: false
  });

  const getActivitiesByDay = () => {
    if (!lessonPlans?.length) return {};
    
    const activitiesByDay: { [key: number]: Activity[] } = {};
    
    lessonPlans.forEach(plan => {
      plan.activities?.forEach(activity => {
        const dayIndex = activity.dayOfWeek;
        if (!activitiesByDay[dayIndex]) activitiesByDay[dayIndex] = [];
        activitiesByDay[dayIndex].push(activity);
      });
    });
    
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
    // Ensure we start on Monday and end on Friday (Mon=0, Fri=4)
    const monday = startOfWeek(start, { weekStartsOn: 1 });
    const friday = addDays(monday, 4);
    return `${format(monday, 'MMM d')} - ${format(friday, 'MMM d, yyyy')}`;
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  };

  const renderStepInstruction = (step: any) => {
    if (typeof step.instruction === 'string') return step.instruction;
    if (typeof step.instruction === 'object' && step.instruction?.text) return step.instruction.text;
    if (typeof step === 'string') return step;
    return String(step.instruction || step || '');
  };

  const activitiesByDay = getActivitiesByDay();



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600"></div>
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative px-6 py-8 text-white">
          <div className="max-w-md mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4 backdrop-blur-sm">
              <Calendar className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold mb-2">
              {currentWeekOffset === 0 ? "This Week's Learning Journey" : "Next Week's Learning Journey"}
            </h1>
            <p className="text-blue-100 mb-1">
              {roomName ? `${roomName} Room` : 'Your Child\'s Activities'}
            </p>
            <p className="text-xs text-blue-200">
              {formatWeekRange(currentWeek)}
            </p>
            
            {/* Week Toggle */}
            <div className="flex justify-center gap-1 mt-4">
              <Button
                variant={currentWeekOffset === 0 ? "default" : "ghost"}
                size="sm"
                onClick={() => setCurrentWeekOffset(0)}
                className={currentWeekOffset === 0 
                  ? "bg-white text-blue-600 hover:bg-white/90" 
                  : "text-white hover:bg-white/10"
                }
              >
                This Week
              </Button>
              <Button
                variant={currentWeekOffset === 1 ? "default" : "ghost"}
                size="sm"
                onClick={() => setCurrentWeekOffset(1)}
                className={currentWeekOffset === 1 
                  ? "bg-white text-blue-600 hover:bg-white/90" 
                  : "text-white hover:bg-white/10"
                }
              >
                Next Week
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 pb-20 max-w-md mx-auto -mt-4 relative">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent absolute inset-0"></div>
            </div>
          </div>
        ) : lessonPlans?.length ? (
          <div className="space-y-8">
            {daysOfWeek.map((dayName, dayIndex) => {
              const dayActivities = activitiesByDay[dayIndex] || [];
              if (!dayActivities.length) return null;
              
              return (
                <div key={dayIndex} className="space-y-4">
                  <div className="text-center">
                    <h2 className="text-xl font-bold text-gray-800 mb-1">{dayName}</h2>
                    <div className="w-12 h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mx-auto"></div>
                  </div>

                  <div className="space-y-6">
                    {dayActivities.map((activity) => (
                      <Card 
                        key={activity.id}
                        className="overflow-hidden border-0 shadow-xl bg-white/95 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]"
                      >
                        <ActivityImage activity={activity} />

                        <div className="p-5 space-y-4">
                          <div className="space-y-2">
                            <h3 className="text-lg font-bold text-gray-900 leading-tight">
                              {activity.title}
                            </h3>
                            
                            {/* Category and Time Row */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 text-sm text-gray-600">
                                {activity.category && (
                                  <CategoryBadge category={activity.category} />
                                )}
                                {activity.startTime && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4 text-blue-500" />
                                    <span>{formatTime(activity.startTime)}</span>
                                    {activity.endTime && <span>- {formatTime(activity.endTime)}</span>}
                                  </div>
                                )}
                                {activity.duration && (
                                  <Badge variant="outline" className="text-gray-600 border-gray-300">
                                    {formatDuration(activity.duration)}
                                  </Badge>
                                )}
                              </div>
                              
                              {activity.rating && (
                                <div className="flex gap-0.5">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`h-4 w-4 ${
                                        star <= activity.rating!
                                          ? 'fill-yellow-400 text-yellow-400'
                                          : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {activity.description && (
                            <p className="text-gray-700 leading-relaxed">
                              {activity.description}
                            </p>
                          )}

                          {activity.milestones && activity.milestones.length > 0 && (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-purple-100 rounded-lg">
                                  <Target className="h-4 w-4 text-purple-600" />
                                </div>
                                <span className="font-semibold text-gray-800">Developmental Milestones</span>
                              </div>
                              <div className="grid gap-2">
                                {activity.milestones.map(milestone => (
                                  <div 
                                    key={milestone.id} 
                                    className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg border border-purple-100"
                                  >
                                    <Award className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                                    <div>
                                      <p className="font-medium text-purple-800 text-sm">{milestone.name}</p>
                                      {milestone.description && (
                                        <p className="text-xs text-purple-600 mt-1">{milestone.description}</p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {activity.materials && activity.materials.length > 0 && (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-green-100 rounded-lg">
                                  <Package className="h-4 w-4 text-green-600" />
                                </div>
                                <span className="font-semibold text-gray-800">Materials Used</span>
                              </div>
                              <div className="grid gap-2">
                                {activity.materials.map(material => (
                                  <div 
                                    key={material.id} 
                                    className="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-100"
                                  >
                                    {material.photoUrl ? (
                                      <img 
                                        src={material.photoUrl} 
                                        alt={material.name}
                                        className="w-8 h-8 object-cover rounded"
                                      />
                                    ) : (
                                      <div className="w-8 h-8 bg-green-200 rounded flex items-center justify-center">
                                        <Package className="h-4 w-4 text-green-600" />
                                      </div>
                                    )}
                                    <span className="text-sm font-medium text-green-800">
                                      {material.name}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {activity.steps && activity.steps.length > 0 && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="p-1.5 bg-blue-100 rounded-lg">
                                    <BookOpen className="h-4 w-4 text-blue-600" />
                                  </div>
                                  <span className="font-semibold text-gray-800">How It Works</span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const newExpanded = new Set(expandedActivities);
                                    if (newExpanded.has(activity.id)) {
                                      newExpanded.delete(activity.id);
                                    } else {
                                      newExpanded.add(activity.id);
                                    }
                                    setExpandedActivities(newExpanded);
                                  }}
                                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                >
                                  {expandedActivities.has(activity.id) ? (
                                    <>
                                      <ChevronUp className="h-4 w-4 mr-1" />
                                      Hide Steps
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown className="h-4 w-4 mr-1" />
                                      Show Steps
                                    </>
                                  )}
                                </Button>
                              </div>
                              
                              {expandedActivities.has(activity.id) && (
                                <div className="space-y-2">
                                  {activity.steps
                                    .sort((a, b) => a.orderIndex - b.orderIndex)
                                    .map((step, idx) => (
                                      <div key={idx} className="flex gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                        <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                          {idx + 1}
                                        </div>
                                        <p className="text-sm text-blue-900 leading-relaxed">
                                          {renderStepInstruction(step)}
                                        </p>
                                      </div>
                                    ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <Card className="text-center py-16 border-0 shadow-xl bg-white/95">
            <div className="space-y-6 max-w-xs mx-auto">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto">
                <Calendar className="h-10 w-10 text-white" />
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-gray-900">No Activities Posted Yet...</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Check back soon for exciting new learning adventures!
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}