import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Check, Package } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import MaterialForm from "./material-form";
import type { Material } from "@shared/schema";

export default function MaterialsLibrary() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [ageGroupFilter, setAgeGroupFilter] = useState("all");
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState("");

  const { data: materials = [], isLoading } = useQuery<Material[]>({
    queryKey: ["/api/materials"],
  });

  // Fetch locations to get the first available location
  const { data: locations = [] } = useQuery({
    queryKey: ["/api/locations"],
  });

  // Fetch age groups for filtering
  const { data: ageGroups = [] } = useQuery({
    queryKey: ["/api/age-groups", selectedLocationId],
    queryFn: async () => {
      console.log("Fetching age groups for locationId:", selectedLocationId);
      const data = await apiRequest("GET", `/api/age-groups?locationId=${selectedLocationId}`);
      console.log("Age groups API response:", data);
      console.log("Age groups response type:", typeof data);
      console.log("Is Array?", Array.isArray(data));
      return data || [];
    },
    enabled: !!selectedLocationId,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  console.log("Age groups data:", ageGroups);
  console.log("Age groups array check:", Array.isArray(ageGroups), "Length:", ageGroups?.length);

  // Auto-select first location if none selected  
  useEffect(() => {
    console.log("Locations:", locations, "selectedLocationId:", selectedLocationId);
    if (!selectedLocationId && Array.isArray(locations) && locations.length > 0) {
      // Try to find "Main Campus" first since that's where the age groups are
      const mainCampus = locations.find(loc => loc.name === "Main Campus");
      const locationToSelect = mainCampus || locations[0];
      console.log("Setting selectedLocationId to:", locationToSelect.id);
      setSelectedLocationId(locationToSelect.id);
      // Force invalidate the age groups query when location changes
      queryClient.invalidateQueries({ queryKey: ["/api/age-groups"] });
    }
  }, [locations, selectedLocationId]);

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAgeGroup = ageGroupFilter === "all" || (material.ageGroups && material.ageGroups.includes(ageGroupFilter));
    
    return matchesSearch && matchesAgeGroup;
  });

  const getAgeGroupNames = (ageGroupIds: string[]) => {
    if (!Array.isArray(ageGroups) || !Array.isArray(ageGroupIds)) return "";
    
    const names = ageGroupIds
      .map(id => ageGroups.find((ag: any) => ag.id === id)?.name)
      .filter(Boolean);
    
    return names.join(", ");
  };

  const handleEdit = (material: Material) => {
    setEditingMaterial(material);
  };

  const handleUse = (material: Material) => {
    // TODO: Implement material usage tracking
    console.log("Use material:", material.name);
  };

  // Calculate statistics
  const totalMaterials = materials.length;
  const allAgeGroups = new Set();
  materials.forEach(m => {
    if (Array.isArray(m.ageGroups)) {
      m.ageGroups.forEach(agId => allAgeGroups.add(agId));
    }
  });
  const ageGroupsCount = allAgeGroups.size;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="material-shadow">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-charcoal" data-testid="materials-title">
              Materials Library
            </h2>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-gradient-to-r from-turquoise to-sky-blue text-white hover:shadow-lg transition-all duration-300"
                  data-testid="button-add-material"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Material
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Material</DialogTitle>
                </DialogHeader>
                <MaterialForm 
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
                placeholder="Search materials by name, category, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search-materials"
              />
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48" data-testid="select-category-filter">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Art Supplies">Art Supplies</SelectItem>
                <SelectItem value="Building Materials">Building Materials</SelectItem>
                <SelectItem value="Books & Reading">Books & Reading</SelectItem>
                <SelectItem value="Science & Nature">Science & Nature</SelectItem>
                <SelectItem value="Music & Movement">Music & Movement</SelectItem>
                <SelectItem value="Dramatic Play">Dramatic Play</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={ageGroupFilter} onValueChange={setAgeGroupFilter}>
              <SelectTrigger className="w-48" data-testid="select-age-group-filter">
                <SelectValue placeholder="All Age Groups" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Age Groups</SelectItem>
                {Array.isArray(ageGroups) && ageGroups.length > 0 ? (
                  ageGroups.map((ageGroup: any) => (
                    <SelectItem key={ageGroup.id} value={ageGroup.id}>
                      {ageGroup.name} ({ageGroup.ageRangeStart}-{ageGroup.ageRangeEnd} years)
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>No age groups available</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Materials Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="material-shadow animate-pulse">
              <div className="h-40 bg-gray-200"></div>
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-3"></div>
                <div className="space-y-2">
                  <div className="h-2 bg-gray-200 rounded"></div>
                  <div className="h-2 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredMaterials.map((material) => (
            <Card key={material.id} className="material-shadow overflow-hidden material-shadow-hover">
              <div className="relative h-40 bg-gradient-to-br from-turquoise to-sky-blue">
                <div className="w-full h-full flex items-center justify-center text-white">
                  <Package className="h-12 w-12" />
                </div>
                <div className="absolute top-2 right-2">
                  {material.photoUrl && (
                    <Badge variant="secondary" className="bg-white/80 text-gray-700">
                      Photo
                    </Badge>
                  )}
                </div>
              </div>
              
              <CardContent className="p-4">
                <h3 className="font-bold text-charcoal mb-2" data-testid={`material-name-${material.id}`}>
                  {material.name}
                </h3>
                <p className="text-sm text-gray-600 mb-3" data-testid={`material-description-${material.id}`}>
                  {material.description}
                </p>
                
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Age Groups:</span>
                    <span className="font-medium text-right" data-testid={`material-age-groups-${material.id}`}>
                      {getAgeGroupNames(material.ageGroups || [])}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Quantity:</span>
                    <span className="font-medium" data-testid={`material-quantity-${material.id}`}>
                      {material.quantity}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Location:</span>
                    <span className="font-medium" data-testid={`material-location-${material.id}`}>
                      {material.location}
                    </span>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEdit(material)}
                    data-testid={`button-edit-material-${material.id}`}
                  >
                    <Edit className="mr-1 h-3 w-3" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleUse(material)}
                    data-testid={`button-use-material-${material.id}`}
                  >
                    <Check className="mr-1 h-3 w-3" />
                    Use
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="material-shadow text-center">
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-coral-red mb-2" data-testid="stat-total-materials">
              {totalMaterials}
            </div>
            <div className="text-gray-600">Total Materials</div>
          </CardContent>
        </Card>
        <Card className="material-shadow text-center">
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-mint-green mb-2" data-testid="stat-age-groups">
              {ageGroupsCount}
            </div>
            <div className="text-gray-600">Age Groups</div>
          </CardContent>
        </Card>
        <Card className="material-shadow text-center">
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-sky-blue mb-2" data-testid="stat-with-photos">
              {materials.filter(m => m.photoUrl).length}
            </div>
            <div className="text-gray-600">With Photos</div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Material Dialog */}
      {editingMaterial && (
        <Dialog open={!!editingMaterial} onOpenChange={() => setEditingMaterial(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Material</DialogTitle>
            </DialogHeader>
            <MaterialForm 
              material={editingMaterial}
              onSuccess={() => setEditingMaterial(null)}
              onCancel={() => setEditingMaterial(null)}
              selectedLocationId={selectedLocationId}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
