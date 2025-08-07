import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { insertMilestoneSchema, type Milestone } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useState, useEffect, useRef } from "react";

interface MilestoneFormProps {
  milestone?: Milestone;
  onSuccess: () => void;
  onCancel: () => void;
  selectedLocationId?: string;
}

export default function MilestoneForm({ milestone, onSuccess, onCancel, selectedLocationId }: MilestoneFormProps) {
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>(
    milestone?.locationIds || (selectedLocationId ? [selectedLocationId] : [])
  );
  const [selectedAgeGroupIds, setSelectedAgeGroupIds] = useState<string[]>(
    milestone?.ageGroupIds || []
  );
  const [imageUrl, setImageUrl] = useState<string>(milestone?.imageUrl || "");
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, formState: { errors }, setValue } = useForm({
    resolver: zodResolver(insertMilestoneSchema.omit({ locationIds: true, ageGroupIds: true })),
    defaultValues: {
      title: milestone?.title || "",
      description: milestone?.description || "",
      category: milestone?.category || "",
      learningObjective: milestone?.learningObjective || "",
      tenantId: "", // Will be set by backend
    },
  });

  // Fetch all authorized locations
  const { data: locations = [] } = useQuery({
    queryKey: ["/api/locations"],
  });
  
  // Auto-select first location if none selected and locations are available
  useEffect(() => {
    if (selectedLocationIds.length === 0 && Array.isArray(locations) && locations.length > 0) {
      // If selectedLocationId prop is provided, use it; otherwise use first location
      const locationToSelect = selectedLocationId && locations.find(loc => loc.id === selectedLocationId)
        ? selectedLocationId
        : locations[0]?.id;
      
      if (locationToSelect) {
        setSelectedLocationIds([locationToSelect]);
      }
    }
  }, [locations, selectedLocationId, selectedLocationIds.length]);
  
  // Fetch age groups for selected locations
  const { data: ageGroups = [] } = useQuery({
    queryKey: ["/api/age-groups", selectedLocationIds],
    queryFn: async () => {
      // Fetch age groups for all selected locations
      const allAgeGroups = [];
      for (const locId of selectedLocationIds) {
        try {
          const data = await apiRequest("GET", `/api/age-groups?locationId=${locId}`);
          allAgeGroups.push(...data);
        } catch (error) {
          console.error(`Failed to fetch age groups for location ${locId}:`, error);
        }
      }
      // Remove duplicates based on ID
      const uniqueGroups = allAgeGroups.filter((group, index, self) =>
        index === self.findIndex((g) => g.id === group.id)
      );
      return uniqueGroups;
    },
    enabled: selectedLocationIds.length > 0,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/milestones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create milestone");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/milestones"] });
      onSuccess();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/milestones/${milestone!.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update milestone");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/milestones"] });
      onSuccess();
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/milestones/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to upload image');
      const data = await response.json();
      setImageUrl(data.imageUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setUploadingImage(false);
    }
  };

  const onSubmit = (data: any) => {
    const formData = {
      ...data,
      locationIds: selectedLocationIds,
      ageGroupIds: selectedAgeGroupIds,
      imageUrl,
    };

    if (milestone) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const toggleLocation = (locationId: string) => {
    setSelectedLocationIds(prev => 
      prev.includes(locationId) 
        ? prev.filter(id => id !== locationId)
        : [...prev, locationId]
    );
  };
  
  const toggleAgeGroup = (ageGroupId: string) => {
    setSelectedAgeGroupIds(prev => 
      prev.includes(ageGroupId) 
        ? prev.filter(id => id !== ageGroupId)
        : [...prev, ageGroupId]
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="title">Milestone Title *</Label>
        <Input 
          id="title" 
          {...register("title")} 
          placeholder="e.g., Shares toys with peers"
          data-testid="input-milestone-title"
        />
        {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
      </div>

      <div>
        <Label htmlFor="description">Description *</Label>
        <Textarea 
          id="description" 
          {...register("description")} 
          rows={3}
          placeholder="Describe what this milestone looks like when achieved..."
          data-testid="textarea-milestone-description"
        />
        {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
      </div>

      <div>
        <Label htmlFor="category">Development Category *</Label>
        <Select onValueChange={(value) => setValue("category", value)} defaultValue={milestone?.category}>
          <SelectTrigger data-testid="select-milestone-category">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Social">Social Development</SelectItem>
            <SelectItem value="Emotional">Emotional Development</SelectItem>
            <SelectItem value="Cognitive">Cognitive Development</SelectItem>
            <SelectItem value="Physical">Physical Development</SelectItem>
          </SelectContent>
        </Select>
        {errors.category && <p className="text-red-500 text-sm">{errors.category.message}</p>}
      </div>

      <div>
        <Label>Locations *</Label>
        <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
          {Array.isArray(locations) && locations.map((location: any) => (
            <div key={location.id} className="flex items-center space-x-2">
              <Checkbox
                id={`location-${location.id}`}
                checked={selectedLocationIds.includes(location.id)}
                onCheckedChange={() => toggleLocation(location.id)}
                data-testid={`checkbox-location-${location.id}`}
              />
              <label
                htmlFor={`location-${location.id}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {location.name}
                {location.description && (
                  <span className="text-gray-500 ml-2">({location.description})</span>
                )}
              </label>
            </div>
          ))}
        </div>
        {selectedLocationIds.length === 0 && (
          <p className="text-amber-600 text-sm mt-1">Please select at least one location</p>
        )}
      </div>

      <div>
        <Label>Age Groups *</Label>
        <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
          {Array.isArray(ageGroups) && ageGroups.length > 0 ? (
            ageGroups.map((group: any) => (
              <div key={group.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`age-group-${group.id}`}
                  checked={selectedAgeGroupIds.includes(group.id)}
                  onCheckedChange={() => toggleAgeGroup(group.id)}
                  data-testid={`checkbox-age-group-${group.id}`}
                />
                <label
                  htmlFor={`age-group-${group.id}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {group.name} ({group.ageRangeStart}-{group.ageRangeEnd} months)
                </label>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm">Select locations first to see available age groups</p>
          )}
        </div>
        {selectedAgeGroupIds.length === 0 && (
          <p className="text-amber-600 text-sm mt-1">Please select at least one age group</p>
        )}
      </div>

      <div>
        <Label>Milestone Image</Label>
        <div className="space-y-2">
          {imageUrl && (
            <div className="relative w-full h-48 border rounded-md overflow-hidden">
              <img 
                src={imageUrl} 
                alt="Milestone" 
                className="w-full h-full object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => setImageUrl("")}
                data-testid="button-remove-image"
              >
                Remove
              </Button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              data-testid="input-milestone-image"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
              data-testid="button-upload-image"
            >
              {uploadingImage ? "Uploading..." : imageUrl ? "Change Image" : "Upload Image"}
            </Button>
            <span className="text-sm text-gray-500">
              Recommended: 400x300px, JPG or PNG
            </span>
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="learningObjective">Learning Objective *</Label>
        <Textarea 
          id="learningObjective" 
          {...register("learningObjective")} 
          rows={2}
          placeholder="What specific learning outcome does this milestone represent?"
          data-testid="textarea-learning-objective"
        />
        {errors.learningObjective && <p className="text-red-500 text-sm">{errors.learningObjective.message}</p>}
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel">
          Cancel
        </Button>
        <Button 
          type="submit" 
          className="bg-gradient-to-r from-mint-green to-turquoise text-white"
          disabled={createMutation.isPending || updateMutation.isPending}
          data-testid="button-save-milestone"
        >
          {milestone ? "Update Milestone" : "Add Milestone"}
        </Button>
      </div>
    </form>
  );
}