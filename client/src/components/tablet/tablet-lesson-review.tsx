import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getUserInfo } from "@/lib/auth";
import { hasPermission } from "@/lib/permission-utils";
import { format, parseISO, addDays } from "date-fns";
import { CheckCircle, XCircle, MessageSquare, User, MapPin, Calendar, Send, ChevronDown, ChevronUp } from "lucide-react";
import WeeklyCalendar from "@/components/weekly-calendar";

interface LessonPlanWithDetails {
  id: string;
  tenantId: string;
  locationId: string;
  roomId: string;
  teacherId: string;
  weekStart: string;
  scheduleType: string;
  status: string;
  submittedAt: string;
  submittedBy: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
  teacher?: { userFirstName: string; userLastName: string };
  location?: { name: string };
  room?: { name: string };
  submitter?: { userFirstName: string; userLastName: string };
}

export function TabletLessonReview() {
  const { toast } = useToast();
  const userInfo = getUserInfo();
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"submitted" | "approved" | "rejected">("submitted");
  
  // Check if user has permission to access review page
  const hasAccess = hasPermission('lesson_plan.approve');
  
  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center h-full px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600 text-xl">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-lg">
              You don't have permission to review lesson plans.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch lesson plans for review
  const { data: lessonPlans = [], isLoading } = useQuery<LessonPlanWithDetails[]>({
    queryKey: ["/api/lesson-plans/review"],
    enabled: !!userInfo?.role && ['director', 'assistant_director', 'admin', 'superadmin'].includes(userInfo.role.toLowerCase()),
    staleTime: 0,
    refetchOnMount: 'always',
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async ({ planId, notes }: { planId: string; notes?: string }) => {
      return apiRequest("POST", `/api/lesson-plans/${planId}/approve`, { reviewNotes: notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lesson-plans/review"] });
      toast({
        title: "Lesson Plan Approved",
        description: "The lesson plan has been approved successfully.",
      });
      setExpandedCard(null);
    },
    onError: (error: any) => {
      toast({
        title: "Approval Failed",
        description: error.message || "Failed to approve the lesson plan.",
        variant: "destructive",
      });
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ planId, notes }: { planId: string; notes: string }) => {
      return apiRequest("POST", `/api/lesson-plans/${planId}/reject`, { reviewNotes: notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lesson-plans/review"] });
      toast({
        title: "Lesson Plan Returned",
        description: "The lesson plan has been returned for revision.",
      });
      setReviewNotes({});
      setExpandedCard(null);
    },
    onError: (error: any) => {
      toast({
        title: "Action Failed",
        description: error.message || "Failed to return the lesson plan.",
        variant: "destructive",
      });
    },
  });

  // Helper function to format week range  
  const formatWeekRange = (weekStart: string) => {
    const dateStr = weekStart.split('T')[0];
    const [year, month, day] = dateStr.split('-').map(Number);
    const startDate = new Date(year, month - 1, day);
    const endDate = addDays(startDate, 4);
    return `${format(startDate, 'MMM d')}-${format(endDate, endDate.getMonth() === startDate.getMonth() ? 'd' : 'MMM d')}, ${format(startDate, 'yyyy')}`;
  };

  // Filter lesson plans by status
  const filteredPlans = lessonPlans.filter((plan) => {
    switch (activeTab) {
      case 'submitted':
        return plan.status === 'submitted';
      case 'approved':
        return plan.status === 'approved';
      case 'rejected':
        return plan.status === 'rejected';
      default:
        return false;
    }
  });

  const handleApprove = (planId: string) => {
    approveMutation.mutate({ planId, notes: reviewNotes[planId] });
  };

  const handleReject = (planId: string) => {
    const notes = reviewNotes[planId];
    if (!notes || notes.trim() === '') {
      toast({
        title: "Review Notes Required",
        description: "Please provide feedback when returning a lesson plan for revision.",
        variant: "destructive",
      });
      return;
    }
    rejectMutation.mutate({ planId, notes });
  };

  const toggleCardExpansion = (planId: string) => {
    setExpandedCard(expandedCard === planId ? null : planId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral-red mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading lesson plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col px-4 py-2">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-charcoal">Lesson Plan Review</h2>
        <p className="text-gray-600">Review and approve submitted lesson plans</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="flex-1 flex flex-col min-h-0">
        <TabsList className="grid w-full grid-cols-3 mb-4 h-14 relative z-20">
          <TabsTrigger 
            value="submitted" 
            className="text-lg font-semibold data-[state=active]:bg-amber-500 data-[state=active]:text-white cursor-pointer"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            Pending ({lessonPlans.filter(p => p.status === 'submitted').length})
          </TabsTrigger>
          <TabsTrigger 
            value="approved" 
            className="text-lg font-semibold data-[state=active]:bg-green-500 data-[state=active]:text-white cursor-pointer"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            Approved ({lessonPlans.filter(p => p.status === 'approved').length})
          </TabsTrigger>
          <TabsTrigger 
            value="rejected" 
            className="text-lg font-semibold data-[state=active]:bg-red-500 data-[state=active]:text-white cursor-pointer"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            Returned ({lessonPlans.filter(p => p.status === 'rejected').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="flex-1 overflow-y-auto space-y-4 pb-4 -webkit-overflow-scrolling-touch relative z-10">
          {filteredPlans.length === 0 ? (
            <Card className="p-8">
              <p className="text-center text-gray-500 text-lg">
                No {activeTab === 'submitted' ? 'pending' : activeTab} lesson plans
              </p>
            </Card>
          ) : (
            filteredPlans.map((plan) => (
              <Card key={plan.id} className={`transition-all ${expandedCard === plan.id ? 'shadow-xl' : 'shadow-md'}`}>
                <CardContent className="p-4">
                  {/* Header Row */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-5 w-5 text-turquoise" />
                        <span className="font-bold text-lg">{formatWeekRange(plan.weekStart)}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4 text-gray-500" />
                          <span>{plan.teacher ? `${plan.teacher.userFirstName} ${plan.teacher.userLastName}` : 'Unknown'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span>{plan.location?.name || 'Unknown'} - {plan.room?.name || 'Unknown'}</span>
                        </div>
                      </div>
                    </div>
                    <Badge 
                      className={`text-sm px-3 py-1 ${
                        plan.status === 'submitted' ? 'bg-amber-100 text-amber-800' :
                        plan.status === 'approved' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}
                    >
                      {plan.status === 'submitted' ? 'Pending Review' :
                       plan.status === 'approved' ? 'Approved' : 'Returned'}
                    </Badge>
                  </div>

                  {/* Expand/Collapse Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2 flex items-center justify-center gap-2 relative z-30 cursor-pointer active:scale-95 transition-transform"
                    onClick={() => toggleCardExpansion(plan.id)}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    {expandedCard === plan.id ? (
                      <>
                        <ChevronUp className="h-4 w-4" />
                        Hide Details
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4" />
                        View Details
                      </>
                    )}
                  </Button>

                  {/* Expanded Content */}
                  {expandedCard === plan.id && (
                    <div className="mt-4 space-y-4">
                      {/* Review Actions for Submitted Plans */}
                      {plan.status === "submitted" && (
                        <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                          <Textarea
                            placeholder="Add review notes (required for rejection)..."
                            value={reviewNotes[plan.id] || ""}
                            onChange={(e) => setReviewNotes({...reviewNotes, [plan.id]: e.target.value})}
                            className="min-h-[100px] text-base"
                          />
                          <div className="flex gap-2">
                            <Button
                              className="flex-1 bg-red-600 hover:bg-red-700 text-white h-12 text-base cursor-pointer active:scale-95 transition-transform relative z-30"
                              onClick={() => handleReject(plan.id)}
                              disabled={rejectMutation.isPending}
                              style={{ WebkitTapHighlightColor: 'transparent' }}
                            >
                              <XCircle className="mr-2 h-5 w-5" />
                              {rejectMutation.isPending ? "Processing..." : "Return for Revision"}
                            </Button>
                            <Button
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white h-12 text-base cursor-pointer active:scale-95 transition-transform relative z-30"
                              onClick={() => handleApprove(plan.id)}
                              disabled={approveMutation.isPending}
                              style={{ WebkitTapHighlightColor: 'transparent' }}
                            >
                              <CheckCircle className="mr-2 h-5 w-5" />
                              {approveMutation.isPending ? "Processing..." : "Approve"}
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Show Review Notes for Non-Submitted Plans */}
                      {plan.reviewNotes && plan.status !== "submitted" && (
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <p className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            Review Notes:
                          </p>
                          <p className="text-blue-700">{plan.reviewNotes}</p>
                        </div>
                      )}

                      {/* Weekly Calendar View */}
                      <div className="border-t pt-4">
                        <h3 className="text-lg font-semibold mb-3">Lesson Plan Details</h3>
                        <div className="max-h-[400px] overflow-y-auto">
                          <WeeklyCalendar
                            selectedLocation={plan.locationId}
                            selectedRoom={plan.roomId}
                            currentWeekDate={(() => {
                              const dateStr = plan.weekStart.split('T')[0];
                              const [year, month, day] = dateStr.split('-').map(Number);
                              return new Date(year, month - 1, day);
                            })()}
                            currentLessonPlan={plan}
                            isReviewMode={true}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}