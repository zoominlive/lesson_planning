import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Link, Users, Heart, Brain, Activity } from "lucide-react";
import { getUserAuthorizedLocations } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import MilestoneForm from "./milestone-form";
import type { Milestone } from "@shared/schema";

export default function MilestonesLibrary() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAgeGroupId, setSelectedAgeGroupId] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState("");

  const { data: milestones = [], isLoading } = useQuery<Milestone[]>({
    queryKey: ["/api/milestones", selectedLocationId],
    queryFn: selectedLocationId 
      ? async () => {
          const data = await apiRequest("GET", `/api/milestones?locationId=${selectedLocationId}`);
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

  // Fetch age groups for the selected location
  const { data: ageGroups = [] } = useQuery({
    queryKey: ["/api/age-groups", selectedLocationId],
    queryFn: selectedLocationId 
      ? async () => {
          const data = await apiRequest("GET", `/api/age-groups?locationId=${selectedLocationId}`);
          return data;
        }
      : undefined,
    enabled: !!selectedLocationId,
  });
  
  const filteredMilestones = milestones.filter(milestone => {
    const matchesSearch = milestone.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         milestone.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAge = selectedAgeGroupId === "all" || 
                      (milestone.ageGroupIds && milestone.ageGroupIds.includes(selectedAgeGroupId));
    const matchesCategory = selectedCategory === "all" || milestone.category === selectedCategory;
    
    return matchesSearch && matchesAge && matchesCategory;
  });

  const getMilestonesByCategory = (category: string) => {
    return filteredMilestones.filter(milestone => milestone.category === category);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Social":
        return <Users className="h-8 w-8" />;
      case "Emotional":
        return <Heart className="h-8 w-8" />;
      case "Cognitive":
        return <Brain className="h-8 w-8" />;
      case "Physical":
        return <Activity className="h-8 w-8" />;
      default:
        return <Users className="h-8 w-8" />;
    }
  };

  const getCategoryGradient = (category: string) => {
    switch (category) {
      case "Social":
        return "from-mint-green to-sky-blue";
      case "Emotional":
        return "from-coral-red to-soft-yellow";
      case "Cognitive":
        return "from-sky-blue to-turquoise";
      case "Physical":
        return "from-turquoise to-coral-red";
      default:
        return "from-mint-green to-sky-blue";
    }
  };

  const getAgeGroupNames = (ageGroupIds: string[]) => {
    if (!ageGroupIds || ageGroupIds.length === 0) return "No age groups";
    const names = ageGroupIds
      .map(id => ageGroups.find((g: any) => g.id === id)?.name)
      .filter(Boolean);
    return names.length > 0 ? names.join(", ") : "Unknown age groups";
  };

  const handleEdit = (milestone: Milestone) => {
    setEditingMilestone(milestone);
  };

  const handleLinkActivities = (milestone: Milestone) => {
    // TODO: Implement activity linking modal
    console.log("Link activities for:", milestone.title);
  };

  const categories = ["Social", "Emotional", "Cognitive", "Physical"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="material-shadow">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-charcoal" data-testid="milestones-title">
              Developmental Milestones
            </h2>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-gradient-to-r from-mint-green to-turquoise text-white hover:shadow-lg transition-all duration-300"
                  data-testid="button-add-milestone"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Milestone
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Milestone</DialogTitle>
                </DialogHeader>
                <MilestoneForm 
                  onSuccess={() => setIsCreateDialogOpen(false)}
                  onCancel={() => setIsCreateDialogOpen(false)}
                  selectedLocationId={selectedLocationId}
                />
              </DialogContent>
            </Dialog>
          </div>
          
          <p className="text-gray-600 mb-4">
            Track and manage developmental milestones across all four key domains. Associate activities with specific milestones to ensure comprehensive child development.
          </p>
          
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-64">
              <Input 
                type="text"
                placeholder="Search milestones by description or learning objective..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search-milestones"
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
            
            <Select value={selectedAgeGroupId} onValueChange={setSelectedAgeGroupId}>
              <SelectTrigger className="w-48" data-testid="select-age-filter">
                <SelectValue placeholder="All Age Groups" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Age Groups</SelectItem>
                {Array.isArray(ageGroups) && ageGroups.map((group: any) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48" data-testid="select-category-filter">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category} Development
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Milestone Categories */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="material-shadow animate-pulse">
              <div className={`h-24 bg-gray-200`}></div>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="border border-gray-200 rounded-lg p-4">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded mb-3"></div>
                      <div className="h-2 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {categories.map((category) => {
            const categoryMilestones = getMilestonesByCategory(category);
            
            return (
              <Card key={category} className="material-shadow overflow-hidden">
                <div className={`bg-gradient-to-r ${getCategoryGradient(category)} text-white p-6`}>
                  <div className="flex items-center">
                    {getCategoryIcon(category)}
                    <div className="ml-3">
                      <h3 className="text-xl font-bold">{category} Development</h3>
                      <p className="text-sm opacity-90">
                        {category === "Social" && "Building relationships and social skills"}
                        {category === "Emotional" && "Managing emotions and self-awareness"}
                        {category === "Cognitive" && "Thinking, learning, and problem-solving"}
                        {category === "Physical" && "Gross and fine motor skills"}
                      </p>
                    </div>
                  </div>
                </div>
                
                <CardContent className="p-6 space-y-4">
                  {categoryMilestones.length > 0 ? (
                    categoryMilestones.map((milestone) => (
                      <div 
                        key={milestone.id} 
                        className="border border-gray-200 rounded-lg p-4 hover:border-turquoise transition-colors"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-charcoal" data-testid={`milestone-title-${milestone.id}`}>
                            {milestone.title}
                          </h4>
                          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs" data-testid={`milestone-age-${milestone.id}`}>
                            {getAgeGroupNames(milestone.ageGroupIds || [])}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3" data-testid={`milestone-description-${milestone.id}`}>
                          {milestone.description}
                        </p>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center text-sm text-gray-500">
                            <Link className="mr-1 h-3 w-3" />
                            <span>0 activities linked</span>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(milestone)}
                              data-testid={`button-edit-milestone-${milestone.id}`}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleLinkActivities(milestone)}
                              data-testid={`button-link-milestone-${milestone.id}`}
                            >
                              <Link className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      <p>No milestones found for this category.</p>
                      <Button 
                        variant="outline" 
                        className="mt-2"
                        onClick={() => setIsCreateDialogOpen(true)}
                      >
                        Add First Milestone
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Milestone Dialog */}
      {editingMilestone && (
        <Dialog open={!!editingMilestone} onOpenChange={() => setEditingMilestone(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Milestone</DialogTitle>
            </DialogHeader>
            <MilestoneForm 
              milestone={editingMilestone}
              onSuccess={() => setEditingMilestone(null)}
              onCancel={() => setEditingMilestone(null)}
              selectedLocationId={selectedLocationId}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
