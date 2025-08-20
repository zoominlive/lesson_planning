import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Download, Star, Users, TrendingUp, Package, Filter, ChevronDown } from "lucide-react";
import { format, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { getAuthToken } from "@/lib/auth";

interface CompletedActivityRecord {
  id: string;
  rating: number | null;
  ratingFeedback: string | null;
  notes: string | null;
  materialsUsed: boolean | null;
  materialFeedback: string | null;
  completedAt: string;
  dayOfWeek: number;
  timeSlot: number;
  activityId: string;
  activityTitle: string;
  activityDescription: string;
  userId: string;
  teacherName: string;
  teacherUsername: string;
  roomId: string;
  roomName: string;
  locationId: string;
  locationName: string;
  lessonPlanId: string;
  weekStart: string;
  scheduleType: string;
}

interface ActivityStats {
  totalActivities: number;
  averageRating: number;
  materialsUsedCount: number;
  materialsNotUsedCount: number;
  materialsUsageRate: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export function CompletedActivities() {
  const { toast } = useToast();
  const [filters, setFilters] = useState<{
    locationId: string;
    roomId: string;
    dateFrom: Date;
    dateTo: Date;
    minRating: string;
    materialsUsed: string;
    exactRating?: number;
  }>({
    locationId: "all",
    roomId: "all",
    dateFrom: subDays(new Date(), 30),
    dateTo: new Date(),
    minRating: "all",
    materialsUsed: "all",
  });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch locations
  const { data: locations = [] } = useQuery<any[]>({
    queryKey: ["/api/locations"],
  });

  // Fetch rooms based on selected location
  const { data: rooms = [] } = useQuery<any[]>({
    queryKey: ["/api/rooms", filters.locationId],
    enabled: !!filters.locationId && filters.locationId !== "all",
  });

  // Fetch completed activities
  const { data: completedData, isLoading } = useQuery({
    queryKey: [
      "/api/activity-records/completed",
      filters.locationId,
      filters.roomId,
      filters.dateFrom?.toISOString(),
      filters.dateTo?.toISOString(),
      filters.minRating,
      filters.materialsUsed,
      filters.exactRating,
    ],
    queryFn: async () => {
      const token = getAuthToken();
      const params = new URLSearchParams();
      
      if (filters.locationId && filters.locationId !== "all") params.append("locationId", filters.locationId);
      if (filters.roomId && filters.roomId !== "all") params.append("roomId", filters.roomId);
      if (filters.dateFrom) params.append("dateFrom", filters.dateFrom.toISOString());
      if (filters.dateTo) params.append("dateTo", filters.dateTo.toISOString());
      if (filters.exactRating) {
        params.append("exactRating", filters.exactRating.toString());
      } else if (filters.minRating && filters.minRating !== "all") {
        params.append("minRating", filters.minRating);
      }
      if (filters.materialsUsed && filters.materialsUsed !== "all") params.append("materialsUsed", filters.materialsUsed);
      
      const response = await fetch(`/api/activity-records/completed?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) throw new Error("Failed to fetch completed activities");
      return response.json();
    },
  });

  const records: CompletedActivityRecord[] = completedData?.records || [];
  const stats: ActivityStats = completedData?.stats || {
    totalActivities: 0,
    averageRating: 0,
    materialsUsedCount: 0,
    materialsNotUsedCount: 0,
    materialsUsageRate: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  };

  const handleExport = async () => {
    try {
      const token = getAuthToken();
      const params = new URLSearchParams();
      
      if (filters.locationId && filters.locationId !== "all") params.append("locationId", filters.locationId);
      if (filters.roomId && filters.roomId !== "all") params.append("roomId", filters.roomId);
      if (filters.dateFrom) params.append("dateFrom", filters.dateFrom.toISOString());
      if (filters.dateTo) params.append("dateTo", filters.dateTo.toISOString());
      if (filters.exactRating) {
        params.append("exactRating", filters.exactRating.toString());
      } else if (filters.minRating && filters.minRating !== "all") {
        params.append("minRating", filters.minRating);
      }
      if (filters.materialsUsed && filters.materialsUsed !== "all") params.append("materialsUsed", filters.materialsUsed);
      
      const response = await fetch(`/api/activity-records/export?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) throw new Error("Failed to export data");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `completed-activities-${format(new Date(), "yyyy-MM-dd")}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Export Successful",
        description: "The data has been exported to CSV.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export the data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const StarRating = ({ rating }: { rating: number | null }) => {
    if (!rating) return <span className="text-gray-400">Not rated</span>;
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              "h-4 w-4",
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            )}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">({rating})</span>
      </div>
    );
  };

  const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const timeSlotNames = ["Morning", "Mid-Morning", "Afternoon", "Late Afternoon", "Evening"];

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalActivities}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Average Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <span className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Materials Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.materialsUsageRate.toFixed(0)}%</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.materialsUsedCount} used / {stats.materialsNotUsedCount} not used
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Rating Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1.5">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution];
                const isSelected = filters.exactRating === rating;
                
                return (
                  <button
                    key={rating}
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded-md transition-colors text-xs",
                      "hover:bg-amber-50 hover:border-amber-300",
                      isSelected 
                        ? "bg-amber-100 border border-amber-400" 
                        : "bg-gray-50 border border-gray-200"
                    )}
                    onClick={() => {
                      if (isSelected) {
                        setFilters({ ...filters, minRating: "all", exactRating: undefined });
                      } else {
                        setFilters({ ...filters, minRating: rating.toString(), exactRating: rating });
                      }
                    }}
                    title={`Filter by ${rating} star rating`}
                  >
                    <span className="font-bold text-gray-700">{count}</span>
                    <div className="flex items-center">
                      <span className="text-gray-600">{rating}</span>
                      <svg className="w-3 h-3 text-amber-400 fill-current ml-0.5" viewBox="0 0 20 20">
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                      </svg>
                    </div>
                  </button>
                );
              })}
            </div>
            {filters.exactRating && (
              <div className="mt-2 text-xs text-amber-600 font-medium text-center">
                Showing only {filters.exactRating}-star activities
                <button 
                  className="ml-2 text-gray-500 hover:text-gray-700"
                  onClick={() => setFilters({ ...filters, minRating: "all", exactRating: undefined })}
                >
                  ✕
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Filters</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-1" />
                {showFilters ? "Hide" : "Show"} Filters
                <ChevronDown className={cn("h-4 w-4 ml-1 transition-transform", showFilters && "rotate-180")} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={records.length === 0}
              >
                <Download className="h-4 w-4 mr-1" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        {showFilters && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Date Range */}
              <div className="space-y-2">
                <Label>Date From</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateFrom ? format(filters.dateFrom, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.dateFrom}
                      onSelect={(date) => setFilters({ ...filters, dateFrom: date || new Date() })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label>Date To</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateTo ? format(filters.dateTo, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.dateTo}
                      onSelect={(date) => setFilters({ ...filters, dateTo: date || new Date() })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              {/* Location */}
              <div className="space-y-2">
                <Label>Location</Label>
                <Select
                  value={filters.locationId}
                  onValueChange={(value) => setFilters({ ...filters, locationId: value, roomId: "all" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {locations.map((location: any) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Room */}
              <div className="space-y-2">
                <Label>Room</Label>
                <Select
                  value={filters.roomId}
                  onValueChange={(value) => setFilters({ ...filters, roomId: value })}
                  disabled={!filters.locationId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Rooms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Rooms</SelectItem>
                    {rooms.map((room: any) => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Minimum Rating */}
              <div className="space-y-2">
                <Label>Minimum Rating</Label>
                <Select
                  value={filters.minRating}
                  onValueChange={(value) => setFilters({ ...filters, minRating: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any Rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Rating</SelectItem>
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <SelectItem key={rating} value={rating.toString()}>
                        {rating} Star{rating !== 1 ? "s" : ""} & Above
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Materials Used */}
              <div className="space-y-2">
                <Label>Materials Used</Label>
                <Select
                  value={filters.materialsUsed}
                  onValueChange={(value) => setFilters({ ...filters, materialsUsed: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="true">Yes</SelectItem>
                    <SelectItem value="false">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters({
                  locationId: "all",
                  roomId: "all",
                  dateFrom: subDays(new Date(), 30),
                  dateTo: new Date(),
                  minRating: "all",
                  materialsUsed: "all",
                  exactRating: undefined,
                })}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
      {/* Activity Records */}
      {isLoading ? (
        <div className="text-center py-8">Loading completed activities...</div>
      ) : records.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No completed activities found for the selected filters.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Completed Activities ({records.length})</h3>
          <Accordion type="multiple" className="space-y-2">
            {records.map((record) => (
              <AccordionItem key={record.id} value={record.id} className="border rounded-lg">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center gap-4">
                      <div className="text-left">
                        <h4 className="font-semibold">{record.activityTitle}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {record.roomName}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {record.locationName}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {dayNames[record.dayOfWeek]} - {timeSlotNames[record.timeSlot]}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <StarRating rating={record.rating} />
                      {record.materialsUsed !== null && (
                        <Badge variant={record.materialsUsed ? "default" : "secondary"}>
                          Materials: {record.materialsUsed ? "Used" : "Not Used"}
                        </Badge>
                      )}
                      <div className="text-sm text-gray-500">
                        {format(new Date(record.completedAt), "MMM d, yyyy")}
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div>
                      <h5 className="font-medium mb-2">Activity Details</h5>
                      <p className="text-sm text-gray-600 mb-2">{record.activityDescription}</p>
                      <p className="text-sm">
                        <span className="font-medium">Teacher:</span> {record.teacherName}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Week Starting:</span> {format(new Date(record.weekStart), "MMM d, yyyy")}
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      {record.notes && (
                        <div>
                          <h5 className="font-medium mb-1">Teaching Notes</h5>
                          <p className="text-sm text-gray-600">{record.notes}</p>
                        </div>
                      )}
                      
                      {record.ratingFeedback && (
                        <div>
                          <h5 className="font-medium mb-1">Activity Feedback</h5>
                          <p className="text-sm text-gray-600">{record.ratingFeedback}</p>
                        </div>
                      )}
                      
                      {record.materialFeedback && (
                        <div>
                          <h5 className="font-medium mb-1">Material Feedback</h5>
                          <p className="text-sm text-gray-600">{record.materialFeedback}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}
    </div>
  );
}