import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { insertMaterialSchema, type Material } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
// Simple file upload button since we're handling upload directly
function SimpleUploadButton({ onFileSelect, children, className }: any) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <label className={className}>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      {children}
    </label>
  );
}
import { Camera, X, Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MaterialFormProps {
  material?: Material;
  onSuccess: () => void;
  onCancel: () => void;
  selectedLocationId: string; // For default selection
}

export default function MaterialForm({
  material,
  onSuccess,
  onCancel,
  selectedLocationId,
}: MaterialFormProps) {
  const { toast } = useToast();
  const [selectedAgeGroups, setSelectedAgeGroups] = useState<string[]>(
    material?.ageGroups || [],
  );
  const [selectedLocations, setSelectedLocations] = useState<string[]>(
    material?.locationIds || [selectedLocationId],
  );
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [photoUrl, setPhotoUrl] = useState<string>(material?.photoUrl || "");
  const [generatingImage, setGeneratingImage] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    control,
  } = useForm({
    resolver: zodResolver(insertMaterialSchema),
    defaultValues: {
      name: material?.name || "",
      description: material?.description || "",
      ageGroups: material?.ageGroups || [],
      location: material?.location || "",
      locationIds: material?.locationIds || [selectedLocationId],
      tenantId: "", // Will be set by backend
      photoUrl: material?.photoUrl || "",
    },
  });

  // Fetch available age groups for multi-select (from first selected location)
  const firstSelectedLocation = selectedLocations[0] || selectedLocationId;
  const { data: ageGroups = [] } = useQuery({
    queryKey: ["/api/age-groups", firstSelectedLocation],
    queryFn: () =>
      apiRequest("GET", `/api/age-groups?locationId=${firstSelectedLocation}`),
    enabled: !!firstSelectedLocation,
  });

  // Fetch all locations for multi-select
  const { data: locations = [] } = useQuery({
    queryKey: ["/api/locations"],
  });

  // Fetch available material collections
  const { data: collections = [] } = useQuery<any[]>({
    queryKey: ["/api/material-collections"],
  });

  // Fetch existing collections for this material if editing
  const { data: materialCollections = [] } = useQuery<any[]>({
    queryKey: [`/api/materials/${material?.id}/collections`],
    enabled: !!material?.id,
  });

  // Set selected collections when editing
  useEffect(() => {
    if (materialCollections.length > 0) {
      setSelectedCollections(materialCollections.map((c: any) => c.id));
    }
  }, [materialCollections]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      // First create the material
      const material = await apiRequest("POST", "/api/materials", {
        ...data,
        ageGroups: selectedAgeGroups,
        locationIds: selectedLocations,
        photoUrl,
      });
      
      // Then update its collections
      if (selectedCollections.length > 0) {
        await apiRequest("PUT", `/api/materials/${material.id}/collections`, {
          collectionIds: selectedCollections,
        });
      }
      
      return material;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      queryClient.invalidateQueries({ queryKey: ["/api/material-collections"] });
      onSuccess();
      toast({ title: "Material created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create material", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      // First update the material
      const updatedMaterial = await apiRequest("PUT", `/api/materials/${material!.id}`, {
        ...data,
        ageGroups: selectedAgeGroups,
        locationIds: selectedLocations,
        photoUrl,
      });
      
      // Then update its collections
      await apiRequest("PUT", `/api/materials/${material!.id}/collections`, {
        collectionIds: selectedCollections,
      });
      
      return updatedMaterial;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      queryClient.invalidateQueries({ queryKey: ["/api/material-collections"] });
      onSuccess();
      toast({ title: "Material updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update material", variant: "destructive" });
    },
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      // Get upload parameters
      const uploadData: any = await apiRequest("POST", "/api/materials/upload-url");
      
      // Create form data for direct upload
      const formData = new FormData();
      formData.append("file", file);
      formData.append("key", uploadData.key);
      
      // Upload directly to object storage endpoint
      const response = await fetch("/api/materials/upload-direct", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("Upload failed");
      }
      
      return response.json();
    },
    onSuccess: (result: any) => {
      setPhotoUrl(result.photoPath);
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      toast({ title: "Photo uploaded successfully" });
    },
    onError: () => {
      toast({ title: "Failed to upload photo", variant: "destructive" });
    },
  });

  const handlePhotoSelect = (file: File) => {
    uploadPhotoMutation.mutate(file);
  };

  const handleGenerateImage = async () => {
    const materialName = control._formValues.name;
    const materialDescription = control._formValues.description;
    
    if (!materialName && !materialDescription) {
      toast({
        title: "Please provide material details",
        description: "Add a name or description for the material before generating an image.",
        variant: "destructive",
      });
      return;
    }

    setGeneratingImage(true);
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/materials/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ 
          name: materialName,
          description: materialDescription,
          // Create a detailed prompt for material image generation
          prompt: `Educational material or supply: ${materialName || ""}. ${materialDescription || ""}. Show the actual physical item clearly, suitable for a childcare classroom inventory.` 
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate image");
      }

      const result = await response.json();
      setPhotoUrl(result.url);
      setValue("photoUrl", result.url);
      
      toast({
        title: "Image generated successfully",
        description: "An AI-generated image has been created for your material.",
      });
    } catch (error) {
      console.error("Image generation failed:", error);
      toast({
        title: "Failed to generate image",
        description: error instanceof Error ? error.message : "Please try again or upload an image manually.",
        variant: "destructive",
      });
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleAgeGroupToggle = (ageGroupId: string) => {
    setSelectedAgeGroups((prev) =>
      prev.includes(ageGroupId)
        ? prev.filter((id) => id !== ageGroupId)
        : [...prev, ageGroupId],
    );
  };

  const handleLocationToggle = (locationId: string) => {
    setSelectedLocations((prev) =>
      prev.includes(locationId)
        ? prev.filter((id) => id !== locationId)
        : [...prev, locationId],
    );
  };

  const handleCollectionToggle = (collectionId: string) => {
    setSelectedCollections((prev) =>
      prev.includes(collectionId)
        ? prev.filter((id) => id !== collectionId)
        : [...prev, collectionId],
    );
  };

  const onSubmit = (data: any) => {
    const submissionData = {
      ...data,
      ageGroups: selectedAgeGroups,
      locationIds: selectedLocations,
      photoUrl,
    };

    if (material) {
      updateMutation.mutate(submissionData);
    } else {
      createMutation.mutate(submissionData);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">Material Name *</Label>
        <Input
          id="name"
          {...register("name")}
          data-testid="input-material-name"
        />
        {errors.name && (
          <p className="text-red-500 text-sm">{errors.name.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          {...register("description")}
          rows={3}
          data-testid="textarea-material-description"
        />
        {errors.description && (
          <p className="text-red-500 text-sm">{errors.description.message}</p>
        )}
      </div>

      <div>
        <Label>Locations *</Label>
        <p className="text-sm text-gray-600 mb-2">
          Select which locations have this material
        </p>
        <div className="flex flex-wrap gap-2 p-3 border rounded-md min-h-[40px]">
          {Array.isArray(locations) &&
            locations.map((location: any) => {
              const isSelected = selectedLocations.includes(location.id);
              return (
                <Badge
                  key={location.id}
                  variant={isSelected ? "default" : "outline"}
                  className={`cursor-pointer hover:scale-105 transition-transform ${
                    isSelected ? "bg-turquoise text-white" : "hover:bg-gray-100"
                  }`}
                  onClick={() => handleLocationToggle(location.id)}
                  data-testid={`badge-location-${location.id}`}
                >
                  {location.name}
                  {isSelected && <X className="w-3 h-3 ml-1" />}
                </Badge>
              );
            })}
          {selectedLocations.length === 0 && (
            <span className="text-gray-500 text-sm">
              Click locations to select
            </span>
          )}
        </div>
        {selectedLocations.length === 0 && (
          <p className="text-red-500 text-sm">
            At least one location is required
          </p>
        )}
      </div>

      <div>
        <Label>Age Groups *</Label>
        <p className="text-sm text-gray-600 mb-2">
          Select which age groups can safely use this material
        </p>
        <div className="flex flex-wrap gap-2 p-3 border rounded-md min-h-[40px]">
          {Array.isArray(ageGroups) &&
            ageGroups.map((ageGroup: any) => {
              const isSelected = selectedAgeGroups.includes(ageGroup.id);
              return (
                <Badge
                  key={ageGroup.id}
                  variant={isSelected ? "default" : "outline"}
                  className={`cursor-pointer hover:scale-105 transition-transform ${
                    isSelected ? "bg-coral-red text-white" : "hover:bg-gray-100"
                  }`}
                  onClick={() => handleAgeGroupToggle(ageGroup.id)}
                  data-testid={`badge-age-group-${ageGroup.id}`}
                >
                  {ageGroup.name}
                  {isSelected && <X className="w-3 h-3 ml-1" />}
                </Badge>
              );
            })}
          {selectedAgeGroups.length === 0 && (
            <span className="text-gray-500 text-sm">
              Click age groups to select
            </span>
          )}
        </div>
        {selectedAgeGroups.length === 0 && (
          <p className="text-red-500 text-sm">
            At least one age group is required for safety
          </p>
        )}
      </div>

      <div>
        <Label>Collections</Label>
        <p className="text-sm text-gray-600 mb-2">
          Organize this material into collections for easier browsing
        </p>
        <div className="border rounded-md">
          {collections.length === 0 ? (
            <div className="p-3 text-center">
              <span className="text-gray-500 text-sm">
                No collections available yet
              </span>
            </div>
          ) : (
            <ScrollArea className={collections.length > 5 ? "h-[200px]" : ""}>
              <div className="space-y-2 p-3">
                {collections.map((collection: any) => {
                  const isSelected = selectedCollections.includes(collection.id);
                  return (
                    <div
                      key={collection.id}
                      className="flex items-start space-x-2 py-2 px-2 rounded hover:bg-gray-50"
                    >
                      <Checkbox
                        id={`collection-${collection.id}`}
                        checked={isSelected}
                        onCheckedChange={() => handleCollectionToggle(collection.id)}
                        className="mt-0.5"
                        data-testid={`checkbox-collection-${collection.id}`}
                      />
                      <label
                        htmlFor={`collection-${collection.id}`}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="font-medium text-sm">{collection.name}</div>
                        {collection.description && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            {collection.description}
                          </div>
                        )}
                      </label>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
          {collections.length > 0 && (
            <div className="border-t px-3 py-2 bg-gray-50">
              <span className="text-xs text-gray-600">
                {selectedCollections.length} collection{selectedCollections.length !== 1 ? 's' : ''} selected
              </span>
            </div>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="location">Storage Location *</Label>
        <Input
          id="location"
          {...register("location")}
          placeholder="e.g., Art Cabinet A, Block Area..."
          data-testid="input-material-location"
        />
        {errors.location && (
          <p className="text-red-500 text-sm">{errors.location.message}</p>
        )}
      </div>

      <div>
        <Label>Photo</Label>
        <div className="flex items-center gap-4">
          {photoUrl ? (
            <div className="relative">
              <img
                src={photoUrl}
                alt="Material"
                className="w-20 h-20 object-cover rounded-lg"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="absolute -top-2 -right-2 h-6 w-6 p-0"
                onClick={() => setPhotoUrl("")}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
              <Camera className="h-8 w-8 text-gray-400" />
            </div>
          )}
          <div className="flex gap-2">
            <SimpleUploadButton
              onFileSelect={handlePhotoSelect}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-sky-blue text-white hover:bg-sky-blue/90 h-10 px-4 py-2 cursor-pointer"
            >
              <Camera className="h-4 w-4 mr-2" />
              {photoUrl ? "Change Photo" : "Add Photo"}
            </SimpleUploadButton>
            <Button
              type="button"
              onClick={handleGenerateImage}
              disabled={generatingImage}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
            >
              {generatingImage ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  AI Generate
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          data-testid="button-cancel"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-gradient-to-r from-turquoise to-sky-blue text-white"
          disabled={createMutation.isPending || updateMutation.isPending}
          data-testid="button-save-material"
        >
          {material ? "Update Material" : "Add Material"}
        </Button>
      </div>
    </form>
  );
}
