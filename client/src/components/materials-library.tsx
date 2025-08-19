import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Package, FolderOpen, Sparkles } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { getUserAuthorizedLocations } from "@/lib/auth";
import MaterialForm from "./material-form";
import CollectionsManager from "./collections-manager";
import type { Material } from "@shared/schema";

export default function MaterialsLibrary() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [ageGroupFilter, setAgeGroupFilter] = useState("all");
  const [selectedCollectionId, setSelectedCollectionId] = useState("all");
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCollectionsDialogOpen, setIsCollectionsDialogOpen] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const { data: materials = [], isLoading } = useQuery<Material[]>({
    queryKey: ["/api/materials", selectedLocationId],
    queryFn: selectedLocationId 
      ? async () => {
          const data = await apiRequest("GET", `/api/materials?locationId=${selectedLocationId}`);
          return data;
        }
      : undefined,
    enabled: !!selectedLocationId,
  });

  // Fetch locations - API now filters to only authorized locations
  const { data: locations = [] } = useQuery({
    queryKey: ["/api/locations"],
  });

  // Fetch age groups for filtering
  const { data: ageGroups = [] } = useQuery({
    queryKey: ["/api/age-groups", selectedLocationId],
    queryFn: async () => {
      const data = await apiRequest("GET", `/api/age-groups?locationId=${selectedLocationId}`);
      return data || [];
    },
    enabled: !!selectedLocationId,
  });

  // Fetch material collections for filtering
  const { data: collections = [] } = useQuery({
    queryKey: ["/api/material-collections"],
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
      // Force invalidate the age groups query when location changes
      queryClient.invalidateQueries({ queryKey: ["/api/age-groups"] });
    }
  }, [locations, selectedLocationId]);

  // Fetch materials in selected collection if a collection is selected
  const { data: collectionMaterials = [] } = useQuery({
    queryKey: [`/api/material-collections/${selectedCollectionId}/materials`],
    queryFn: async () => {
      const data = await apiRequest("GET", `/api/material-collections/${selectedCollectionId}/materials`);
      return data || [];
    },
    enabled: selectedCollectionId !== "all" && !!selectedCollectionId,
  });

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAgeGroup = ageGroupFilter === "all" || (material.ageGroups && material.ageGroups.includes(ageGroupFilter));
    
    // If a collection is selected, only show materials in that collection
    const matchesCollection = selectedCollectionId === "all" || 
                             collectionMaterials.some((m: any) => m.id === material.id);
    
    return matchesSearch && matchesAgeGroup && matchesCollection;
  });

  const getAgeGroupNames = (ageGroupIds: string[]) => {
    if (!Array.isArray(ageGroups) || !Array.isArray(ageGroupIds)) return "";
    
    const names = ageGroupIds
      .map(id => ageGroups.find((ag: any) => ag.id === id)?.name)
      .filter(Boolean);
    
    return names.join(", ");
  };

  const getLocationNames = (locationIds: string[]) => {
    if (!Array.isArray(locations) || !Array.isArray(locationIds)) return "";
    
    const names = locationIds
      .map(id => locations.find((loc: any) => loc.id === id)?.name)
      .filter(Boolean);
    
    return names.join(", ");
  };

  const handleEdit = (material: Material) => {
    setEditingMaterial(material);
  };

  const handleDelete = async (material: Material) => {
    if (!confirm(`Are you sure you want to delete "${material.name}"?`)) {
      return;
    }
    
    try {
      await apiRequest("DELETE", `/api/materials/${material.id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      toast({
        title: "Material deleted",
        description: `"${material.name}" has been deleted successfully.`,
      });
    } catch (error) {
      console.error("Failed to delete material:", error);
      toast({
        title: "Failed to delete material",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleImageError = (materialId: string) => {
    setFailedImages(prev => new Set(prev).add(materialId));
  };

  // Calculate statistics
  const totalMaterials = materials.length;
  const allAgeGroups = new Set();
  const allLocations = new Set();
  materials.forEach(m => {
    if (Array.isArray(m.ageGroups)) {
      m.ageGroups.forEach(agId => allAgeGroups.add(agId));
    }
    if (Array.isArray(m.locationIds)) {
      m.locationIds.forEach(locId => allLocations.add(locId));
    }
  });
  const ageGroupsCount = allAgeGroups.size;
  const locationsCount = allLocations.size;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="material-shadow">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-charcoal" data-testid="materials-title">
              Materials Library
            </h2>
            <div className="flex gap-2">
              <Dialog open={isCollectionsDialogOpen} onOpenChange={setIsCollectionsDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline"
                    className="border-purple-600 text-purple-600 hover:bg-purple-50"
                    data-testid="button-manage-collections"
                  >
                    <FolderOpen className="mr-2 h-4 w-4" />
                    Manage Collections
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Manage Collections</DialogTitle>
                  </DialogHeader>
                  <CollectionsManager />
                </DialogContent>
              </Dialog>
              
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
                <DialogContent className="max-h-[90vh] overflow-hidden flex flex-col">
                  <DialogHeader>
                    <DialogTitle>Add New Material</DialogTitle>
                  </DialogHeader>
                  <div className="overflow-y-auto flex-1">
                    <MaterialForm 
                      onSuccess={() => setIsCreateDialogOpen(false)}
                      onCancel={() => setIsCreateDialogOpen(false)}
                      selectedLocationId={selectedLocationId}
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
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
            
            <Select value={selectedCollectionId} onValueChange={setSelectedCollectionId}>
              <SelectTrigger className="w-48" data-testid="select-collection-filter">
                <SelectValue placeholder="All Collections" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Collections</SelectItem>
                {Array.isArray(collections) && collections.length > 0 ? (
                  collections.map((collection: any) => (
                    <SelectItem key={collection.id} value={collection.id}>
                      {collection.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>No collections available</SelectItem>
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
            <Card key={material.id} className="material-shadow overflow-hidden material-shadow-hover flex flex-col">
              <div className="relative h-40 bg-gradient-to-br from-turquoise to-sky-blue flex-shrink-0">
                {material.photoUrl && !failedImages.has(material.id) ? (
                  <img 
                    src={material.photoUrl} 
                    alt={material.name}
                    className="w-full h-full object-cover"
                    onError={() => handleImageError(material.id)}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-purple-100 to-pink-100">
                    <Sparkles className="h-10 w-10 mb-2 text-purple-600" />
                    <p className="text-sm font-medium text-center text-gray-700">
                      No image yet
                    </p>
                    <p className="text-xs text-gray-600 text-center mt-1">
                      Click Edit to add or generate with AI
                    </p>
                  </div>
                )}
                {material.photoUrl && !failedImages.has(material.id) && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="bg-white/80 text-gray-700">
                      Photo
                    </Badge>
                  </div>
                )}
              </div>
              
              <CardContent className="p-4 flex flex-col flex-grow">
                <h3 className="font-bold text-charcoal mb-2" data-testid={`material-name-${material.id}`}>
                  {material.name}
                </h3>
                <p className="text-sm text-gray-600 mb-3" data-testid={`material-description-${material.id}`}>
                  {material.description}
                </p>
                
                <div className="space-y-2 mb-3 flex-grow">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Age Groups:</span>
                    <span className="font-medium text-right" data-testid={`material-age-groups-${material.id}`}>
                      {getAgeGroupNames(material.ageGroups || [])}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Locations:</span>
                    <span className="font-medium text-right" data-testid={`material-locations-${material.id}`}>
                      {getLocationNames(material.locationIds || [])}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Storage:</span>
                    <span className="font-medium" data-testid={`material-storage-${material.id}`}>
                      {material.location}
                    </span>
                  </div>
                </div>
                
                <div className="flex space-x-2 mt-auto">
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
                    onClick={() => handleDelete(material)}
                    data-testid={`button-delete-material-${material.id}`}
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Material Dialog */}
      {editingMaterial && (
        <Dialog open={!!editingMaterial} onOpenChange={() => setEditingMaterial(null)}>
          <DialogContent className="max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Edit Material</DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto flex-1">
              <MaterialForm 
                material={editingMaterial}
                onSuccess={() => setEditingMaterial(null)}
                onCancel={() => setEditingMaterial(null)}
                selectedLocationId={selectedLocationId}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
