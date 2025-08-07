import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, List, Copy, Play, Package } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { getUserAuthorizedLocations } from "@/lib/auth";
import ActivityForm from "./activity-form";
import type { Activity } from "@shared/schema";

export default function ActivityLibrary() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [ageFilter, setAgeFilter] = useState("all");
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState("");

  const { data: activities = [], isLoading } = useQuery<Activity[]>({
    queryKey: ["/api/activities", selectedLocationId],
    queryFn: selectedLocationId 
      ? async () => {
          const data = await apiRequest("GET", `/api/activities?locationId=${selectedLocationId}`);
          return data;
        }
      : undefined,
    enabled: !!selectedLocationId,
  });

  // Fetch locations - API now filters to only authorized locations
  const { data: locations = [] } = useQuery({
    queryKey: ["/api/locations"],
  });

  // Auto-select first authorized location if none selected  
  useEffect(() => {
    if (!selectedLocationId && Array.isArray(locations) && locations.length > 0) {
      // Try to find "Main Campus" first if user has access to it
      const authorizedLocations = getUserAuthorizedLocations();
      const mainCampus = locations.find(loc => 
        loc.name === "Main Campus" && authorizedLocations.includes(loc.name)
      );
      const locationToSelect = mainCampus || locations[0];
      setSelectedLocationId(locationToSelect.id);
    }
  }, [locations, selectedLocationId]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/activities/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete activity");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
    },
  });

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || activity.category === categoryFilter;
    const matchesAge = ageFilter === "all" || 
                      (ageFilter === "2-3" && activity.ageGroupIds && activity.ageGroupIds.length > 0) ||
                      (ageFilter === "3-4" && activity.ageGroupIds && activity.ageGroupIds.length > 0) ||
                      (ageFilter === "4-5" && activity.ageGroupIds && activity.ageGroupIds.length > 0);
    
    return matchesSearch && matchesCategory && matchesAge;
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Social Development":
        return "bg-mint-green text-white";
      case "Art & Creativity":
        return "bg-coral-red text-white";
      case "Physical Development":
        return "bg-turquoise text-white";
      case "Cognitive Development":
        return "bg-sky-blue text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const formatAgeRange = (startMonths: number, endMonths: number) => {
    const startYears = Math.floor(startMonths / 12);
    const endYears = Math.floor(endMonths / 12);
    return `${startYears}-${endYears} years`;
  };

  const handleEdit = (activity: Activity) => {
    setEditingActivity(activity);
  };

  const handleDuplicate = (activity: Activity) => {
    // TODO: Implement activity duplication
    console.log("Duplicate activity:", activity.title);
  };

  const handleViewSteps = (activity: Activity) => {
    // TODO: Implement view steps modal
    console.log("View steps for:", activity.title);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="material-shadow">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-charcoal" data-testid="activities-title">
              Activity Library
            </h2>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-gradient-to-r from-coral-red to-turquoise text-white hover:shadow-lg transition-all duration-300"
                  data-testid="button-create-activity"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Activity
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Activity</DialogTitle>
                </DialogHeader>
                <ActivityForm 
                  onSuccess={() => setIsCreateDialogOpen(false)}
                  onCancel={() => setIsCreateDialogOpen(false)}
                  selectedLocationId={selectedLocationId}
                />
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-64">
              <Input 
                type="text"
                placeholder="Search activities by title, description, or objective..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search-activities"
              />
            </div>
            
            <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
              <SelectTrigger className="w-48" data-testid="select-location-filter">
                <SelectValue placeholder="Select Location" />
              </SelectTrigger>
              <SelectContent>
                {Array.isArray(locations) && locations.length > 0 ? (
                  locations.map((location: any) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>No authorized locations</SelectItem>
                )}
              </SelectContent>
            </Select>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48" data-testid="select-category-filter">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Social Development">Social Development</SelectItem>
                <SelectItem value="Art & Creativity">Art & Creativity</SelectItem>
                <SelectItem value="Physical Development">Physical Development</SelectItem>
                <SelectItem value="Cognitive Development">Cognitive Development</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={ageFilter} onValueChange={setAgeFilter}>
              <SelectTrigger className="w-40" data-testid="select-age-filter">
                <SelectValue placeholder="All Ages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Age Groups</SelectItem>
                <SelectItem value="2-3">2-3 Years</SelectItem>
                <SelectItem value="3-4">3-4 Years</SelectItem>
                <SelectItem value="4-5">4-5 Years</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Activities Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="material-shadow animate-pulse">
              <div className="h-48 bg-gray-200"></div>
              <CardContent className="p-6">
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredActivities.map((activity) => (
            <Card key={activity.id} className="material-shadow overflow-hidden material-shadow-hover">
              {/* Activity Image/Video Thumbnail */}
              <div className="relative h-48 bg-gradient-to-br from-coral-red to-turquoise">
                {activity.imageUrl ? (
                  <img 
                    src={activity.imageUrl} 
                    alt={activity.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white">
                    <Package className="h-12 w-12" />
                  </div>
                )}
                {activity.videoUrl && (
                  <div className="absolute top-3 right-3 bg-black bg-opacity-70 text-white px-2 py-1 rounded-full text-xs">
                    <Play className="inline h-3 w-3 mr-1" />
                    Video
                  </div>
                )}
                <div className="absolute top-3 left-3">
                  <Badge className={getCategoryColor(activity.category)}>
                    {activity.category}
                  </Badge>
                </div>
              </div>
              
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-charcoal mb-2" data-testid={`activity-title-${activity.id}`}>
                  {activity.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4" data-testid={`activity-description-${activity.id}`}>
                  {activity.description}
                </p>
                
                <div className="space-y-3 mb-4">
                  <div>
                    <h4 className="font-semibold text-sm text-charcoal mb-1">Milestones:</h4>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {activity.milestoneIds && activity.milestoneIds.length > 0 ? (
                        activity.milestoneIds.map((milestoneId, index) => (
                          <li key={index}>• Milestone {index + 1}</li>
                        ))
                      ) : (
                        <li className="text-gray-400">• No milestones linked</li>
                      )}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-sm text-charcoal mb-1">Materials Needed:</h4>
                    <div className="flex flex-wrap gap-1">
                      {activity.materialIds.length > 0 ? (
                        activity.materialIds.map((materialId, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            Material {index + 1}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-gray-500">No materials specified</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                  <span data-testid={`activity-duration-${activity.id}`}>
                    Duration: {activity.duration} minutes
                  </span>
                  <span data-testid={`activity-age-${activity.id}`}>
                    Age Groups: {activity.ageGroupIds && activity.ageGroupIds.length > 0 ? `${activity.ageGroupIds.length} groups` : 'All ages'}
                  </span>
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEdit(activity)}
                    data-testid={`button-edit-${activity.id}`}
                  >
                    <Edit className="mr-1 h-3 w-3" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleViewSteps(activity)}
                    data-testid={`button-steps-${activity.id}`}
                  >
                    <List className="mr-1 h-3 w-3" />
                    Steps
                  </Button>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => handleDuplicate(activity)}
                    data-testid={`button-duplicate-${activity.id}`}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Activity Dialog */}
      {editingActivity && (
        <Dialog open={!!editingActivity} onOpenChange={() => setEditingActivity(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Activity</DialogTitle>
            </DialogHeader>
            <ActivityForm 
              activity={editingActivity}
              onSuccess={() => setEditingActivity(null)}
              onCancel={() => setEditingActivity(null)}
              selectedLocationId={selectedLocationId}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
