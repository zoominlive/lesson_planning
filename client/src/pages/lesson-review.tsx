import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, User, MapPin, Home, CheckCircle, XCircle, AlertCircle, FileText, ChevronRight, BookOpen } from "lucide-react";
import { format } from "date-fns";
import { getUserInfo } from "@/lib/auth";
import { hasPermission } from "@/lib/permission-utils";
import { useLocation } from "wouter";
import type { LessonPlan, User as UserType, Location, Room } from "@shared/schema";
import WeeklyCalendar from "@/components/weekly-calendar";
import { NavigationTabs } from "@/components/navigation-tabs";

interface LessonPlanWithDetails extends LessonPlan {
  teacher?: UserType;
  submitter?: UserType;
  approver?: UserType;
  rejector?: UserType;
  location?: Location;
  room?: Room;
  activitiesCount?: number;
}

interface ReviewAccordionContentProps {
  plan: LessonPlanWithDetails;
}

function ReviewAccordionContent({ plan }: ReviewAccordionContentProps) {
  const { toast } = useToast();
  const [reviewNotes, setReviewNotes] = useState("");
  
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
      setReviewNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Approval Failed",
        description: error.message || "Failed to approve the lesson plan.",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ planId, notes }: { planId: string; notes: string }) => {
      return apiRequest("POST", `/api/lesson-plans/${planId}/reject`, { reviewNotes: notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lesson-plans/review"] });
      toast({
        title: "Lesson Plan Returned",
        description: "The lesson plan has been returned with feedback.",
      });
      setReviewNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Return Failed",
        description: error.message || "Failed to return the lesson plan.",
        variant: "destructive",
      });
    },
  });

  const handleApprove = () => {
    approveMutation.mutate({ planId: plan.id, notes: reviewNotes });
  };

  const handleReject = () => {
    if (!reviewNotes.trim()) {
      toast({
        title: "Feedback Required",
        description: "Please provide feedback when returning a lesson plan.",
        variant: "destructive",
      });
      return;
    }
    rejectMutation.mutate({ planId: plan.id, notes: reviewNotes });
  };

  return (
    <div className="space-y-6">
      {/* Review Controls */}
      {plan.status === "submitted" && (
        <div className="bg-gray-50 p-4 rounded-lg border">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Review Notes (Optional for approval, required for return)
              </label>
              <Textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Enter feedback or notes about this lesson plan..."
                rows={3}
                className="w-full"
              />
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50"
                onClick={handleReject}
                disabled={rejectMutation.isPending}
              >
                {rejectMutation.isPending ? "Returning..." : "Return with Feedback"}
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={handleApprove}
                disabled={approveMutation.isPending}
              >
                {approveMutation.isPending ? "Approving..." : "Approve"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Show existing review notes for non-submitted plans */}
      {plan.reviewNotes && plan.status !== "submitted" && (
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm font-medium text-blue-800 mb-2">Review Notes:</p>
          <p className="text-sm text-blue-700">{plan.reviewNotes}</p>
        </div>
      )}

      {/* Lesson Plan Calendar */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">Lesson Plan Details</h3>
        <WeeklyCalendar
          selectedLocation={plan.locationId}
          selectedRoom={plan.roomId}
          currentWeekDate={new Date(plan.weekStart)}
          currentLessonPlan={plan}
        />
      </div>
    </div>
  );
}

export function LessonReview() {
  const { toast } = useToast();
  const userInfo = getUserInfo();
  const [, setLocation] = useLocation();
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<"submitted" | "approved" | "rejected">("submitted");
  
  // Clear cache on mount to ensure fresh data
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/lesson-plans/review"] });
  }, []);

  // Check if user has permission to access review page
  const hasAccess = hasPermission('lesson_plan.approve');
  
  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              You don't have permission to access the Review page.
            </p>
            <Button onClick={() => setLocation('/')} className="w-full">
              Return to Lesson Planner
            </Button>
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



  // Fetch additional data for enriching lesson plans  
  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
    enabled: lessonPlans && lessonPlans.length > 0,
  });

  const { data: locations = [] } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });

  const { data: rooms = [] } = useQuery<Room[]>({
    queryKey: ["/api/rooms"],
  });



  // Enrich lesson plans with related data (preserve existing data if present)
  const enrichedPlans = lessonPlans.map((plan: LessonPlanWithDetails) => ({
    ...plan,
    teacher: plan.teacher || users.find((u: UserType) => u.id === plan.teacherId),
    submitter: plan.submitter || (plan.submittedBy ? users.find((u: UserType) => u.id === plan.submittedBy) : undefined),
    approver: plan.approver || (plan.approvedBy ? users.find((u: UserType) => u.id === plan.approvedBy) : undefined),
    rejector: plan.rejector || (plan.rejectedBy ? users.find((u: UserType) => u.id === plan.rejectedBy) : undefined),
    location: plan.location || locations.find((l: Location) => l.id === plan.locationId),
    room: plan.room || rooms.find((r: Room) => r.id === plan.roomId),
  }));

  // Filter plans by status
  const filteredPlans = enrichedPlans.filter((plan: LessonPlanWithDetails) => {
    if (activeTab === "submitted") return plan.status === "submitted";
    if (activeTab === "approved") return plan.status === "approved";
    if (activeTab === "rejected") return plan.status === "rejected";
    return false;
  });



  const getStatusBadge = (status: string) => {
    switch (status) {
      case "submitted":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Pending Review</Badge>;
      case "approved":
        return <Badge className="bg-green-100 text-green-800 border-green-300">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800 border-red-300">Returned</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatWeekRange = (weekStart: string) => {
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(end.getDate() + 4); // Monday to Friday
    return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
  };

  if (!userInfo?.role || !['director', 'assistant_director', 'admin', 'superadmin'].includes(userInfo.role.toLowerCase())) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
            <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
            <p className="text-gray-600">You don't have permission to review lesson plans.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Lesson Plan Review</h1>
        <p className="text-gray-600">Review and approve submitted lesson plans</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="mb-6">
          <TabsTrigger value="submitted" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Pending ({enrichedPlans.filter((p: LessonPlanWithDetails) => p.status === "submitted").length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Approved ({enrichedPlans.filter((p: LessonPlanWithDetails) => p.status === "approved").length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Returned ({enrichedPlans.filter((p: LessonPlanWithDetails) => p.status === "rejected").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {isLoading ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading lesson plans...</p>
              </CardContent>
            </Card>
          ) : filteredPlans.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">No Lesson Plans</h3>
                <p className="text-gray-600">
                  {activeTab === "submitted" && "No lesson plans are pending review."}
                  {activeTab === "approved" && "No approved lesson plans yet."}
                  {activeTab === "rejected" && "No returned lesson plans."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Accordion type="single" collapsible className="space-y-4">
              {filteredPlans.map((plan: LessonPlanWithDetails) => (
                <AccordionItem key={plan.id} value={plan.id} className="border rounded-lg shadow-sm">
                  <AccordionTrigger className="hover:no-underline p-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-4 mb-3">
                          {getStatusBadge(plan.status)}
                          <span className="text-lg font-semibold text-gray-900">
                            {formatWeekRange(plan.weekStart)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span>{plan.location?.name || "Unknown Location"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Home className="h-4 w-4 text-gray-400" />
                            <span>{plan.room?.name || "Unknown Room"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span>{plan.teacher ? `${plan.teacher.firstName} ${plan.teacher.lastName}` : (plan.submitter ? `${plan.submitter.firstName} ${plan.submitter.lastName}` : "Unknown Teacher")}</span>
                          </div>
                        </div>

                        {plan.submittedAt && (
                          <div className="mt-3 text-sm text-gray-600">
                            Submitted on {format(new Date(plan.submittedAt), "MMM d, yyyy 'at' h:mm a")}
                            {plan.submitter && ` by ${plan.submitter.firstName} ${plan.submitter.lastName}`}
                          </div>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6">
                    <ReviewAccordionContent plan={plan} />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </TabsContent>
      </Tabs>


    </div>
  );
}