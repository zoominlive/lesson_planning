import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "wouter";
import type { Notification, LessonPlan } from "@shared/schema";

interface NotificationCarouselProps {
  currentWeekDate: Date;
  onWeekChange: (date: Date) => void;
}

export function NotificationCarousel({ currentWeekDate, onWeekChange }: NotificationCarouselProps) {
  const [, setLocation] = useLocation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showReviewNotes, setShowReviewNotes] = useState<Record<string, boolean>>({});

  // Fetch active notifications
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Filter for lesson plan returned notifications
  const returnedNotifications = notifications.filter(
    n => n.type === 'lesson_plan_returned' && !n.isDismissed
  );

  // Dismiss notification mutation
  const dismissMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return apiRequest("POST", `/api/notifications/${notificationId}/dismiss`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      // Move to next notification or reset index
      if (currentIndex >= returnedNotifications.length - 1) {
        setCurrentIndex(Math.max(0, returnedNotifications.length - 2));
      }
    },
  });

  // Mark as read mutation
  const markReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return apiRequest("POST", `/api/notifications/${notificationId}/mark-read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  // Reset index when notifications change
  useEffect(() => {
    if (currentIndex >= returnedNotifications.length && returnedNotifications.length > 0) {
      setCurrentIndex(0);
    }
  }, [returnedNotifications.length, currentIndex]);

  // Mark current notification as read when it's displayed
  useEffect(() => {
    const currentNotification = returnedNotifications[currentIndex];
    if (currentNotification && !currentNotification.isRead && !markReadMutation.isPending) {
      markReadMutation.mutate(currentNotification.id);
    }
  }, [currentIndex]);

  if (isLoading || returnedNotifications.length === 0) {
    return null;
  }

  const currentNotification = returnedNotifications[currentIndex];
  if (!currentNotification) return null;

  const handleNavigateToWeek = () => {
    if (currentNotification.weekStart) {
      const weekStart = new Date(currentNotification.weekStart);
      onWeekChange(weekStart);
    }
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : returnedNotifications.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < returnedNotifications.length - 1 ? prev + 1 : 0));
  };

  const handleDismiss = () => {
    dismissMutation.mutate(currentNotification.id);
  };

  const formatWeekDate = (date: Date | string | null) => {
    if (!date) return "Unknown Week";
    const d = typeof date === 'string' ? new Date(date) : date;
    return format(d, "MMM d, yyyy");
  };

  return (
    <Alert className="bg-amber-50 border-amber-300">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
        <div className="flex-1">
          <AlertTitle className="text-amber-900 font-semibold flex items-center justify-between">
            <span>{currentNotification.title}</span>
            <div className="flex items-center gap-2">
              {returnedNotifications.length > 1 && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePrevious}
                    className="h-6 w-6 p-0"
                    data-testid="notification-prev"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs text-amber-700">
                    {currentIndex + 1} of {returnedNotifications.length}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleNext}
                    className="h-6 w-6 p-0"
                    data-testid="notification-next"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="h-6 w-6 p-0 hover:bg-amber-200"
                data-testid="notification-dismiss"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </AlertTitle>
          <AlertDescription className="text-amber-800 mt-2">
            <div className="space-y-3">
              <p>{currentNotification.message}</p>
              
              {currentNotification.weekStart && (
                <p className="text-sm">
                  <span className="font-medium">Week:</span> {formatWeekDate(currentNotification.weekStart)}
                </p>
              )}
              
              {showReviewNotes[currentNotification.id] && currentNotification.reviewNotes && (
                <div className="bg-amber-100 p-3 rounded-md">
                  <p className="font-medium text-amber-900 mb-1">Feedback from Reviewer:</p>
                  <p className="text-sm text-amber-800">{currentNotification.reviewNotes}</p>
                </div>
              )}
              
              <div className="flex gap-2">
                {currentNotification.reviewNotes && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowReviewNotes({
                      ...showReviewNotes,
                      [currentNotification.id]: !showReviewNotes[currentNotification.id]
                    })}
                    className="border-amber-300 text-amber-700 hover:bg-amber-100"
                    data-testid="notification-toggle-feedback"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    {showReviewNotes[currentNotification.id] ? "Hide" : "View"} Feedback
                  </Button>
                )}
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleNavigateToWeek}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                  data-testid="notification-revise"
                >
                  Revise Lesson Plan
                </Button>
              </div>
            </div>
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}