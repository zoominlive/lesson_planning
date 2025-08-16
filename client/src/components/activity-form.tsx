import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, X, Upload, ImageIcon, VideoIcon } from "lucide-react";
import {
  insertActivitySchema,
  type Activity,
  type InstructionStep,
} from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

interface ActivityFormProps {
  activity?: Activity;
  onSuccess: () => void;
  onCancel: () => void;
  selectedLocationId?: string;
  initialData?: any; // AI-generated data
}

export default function ActivityForm({
  activity,
  onSuccess,
  onCancel,
  selectedLocationId,
  initialData,
}: ActivityFormProps) {
  const { toast } = useToast();

  // Use AI-generated data if available, otherwise use activity data
  const [instructions, setInstructions] = useState<InstructionStep[]>(
    initialData?.instructions || activity?.instructions || [{ text: "" }],
  );
  const [selectedAgeGroups, setSelectedAgeGroups] = useState<string[]>(
    activity?.ageGroupIds ||
      (initialData?.selectedAgeGroupId ? [initialData.selectedAgeGroupId] : []),
  );
  const [selectedMilestones, setSelectedMilestones] = useState<string[]>(
    activity?.milestoneIds || [],
  );
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>(
    activity?.materialIds || [],
  );
  const [materialCategoryFilter, setMaterialCategoryFilter] =
    useState<string>("all");
  const [materialAgeGroupFilter, setMaterialAgeGroupFilter] =
    useState<string>("all");
  const [milestoneCategoryFilter, setMilestoneCategoryFilter] =
    useState<string>("all");
  const [milestoneAgeGroupFilter, setMilestoneAgeGroupFilter] =
    useState<string>("all");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingInstructionImage, setUploadingInstructionImage] = useState<
    number | null
  >(null);
  const [activityImageUrl, setActivityImageUrl] = useState(
    activity?.imageUrl || "",
  );
  const [activityVideoUrl, setActivityVideoUrl] = useState(
    activity?.videoUrl || "",
  );

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const instructionImageRefs = useRef<{
    [key: number]: HTMLInputElement | null;
  }>({});

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(
      insertActivitySchema.omit({
        id: true,
        tenantId: true,
        locationId: true,
      }),
    ),
    defaultValues: {
      title: initialData?.title || activity?.title || "",
      description: initialData?.description || activity?.description || "",
      duration: initialData?.duration || activity?.duration || 30,
      category: initialData?.category || activity?.category || "",
      milestoneIds: activity?.milestoneIds || [],
      materialIds: activity?.materialIds || [],
      instructions: initialData?.instructions || activity?.instructions || [],
      videoUrl: activity?.videoUrl || "",
      imageUrl: activity?.imageUrl || "",
      locationId: activity?.locationId || selectedLocationId || "",
      tenantId: "", // Will be set by backend
      ageGroupIds: activity?.ageGroupIds || [],
      // Additional fields from AI generation (stored as extended data)
      ...(initialData && {
        objectives: initialData.objectives,
        preparationTime: initialData.preparationTime,
        safetyConsiderations: initialData.safetyConsiderations,
        spaceRequired: initialData.spaceRequired,
        groupSize: initialData.groupSize,
        minChildren: initialData.minChildren || activity?.minChildren || 1,
        maxChildren: initialData.maxChildren || activity?.maxChildren || 10,
        messLevel: initialData.messLevel,
        variations: initialData.variations,
      }),
      // Include min/max children even when not from AI data
      ...(!initialData && {
        minChildren: activity?.minChildren || 1,
        maxChildren: activity?.maxChildren || 10,
      }),
    },
  });

  // Fetch age groups for the selected location
  const { data: ageGroups = [] } = useQuery({
    queryKey: ["/api/age-groups", selectedLocationId],
    queryFn: selectedLocationId
      ? async () => {
          const data = await apiRequest(
            "GET",
            `/api/age-groups?locationId=${selectedLocationId}`,
          );
          return data;
        }
      : undefined,
    enabled: !!selectedLocationId,
  });

  // Fetch milestones for the selected location
  const { data: milestones = [] } = useQuery({
    queryKey: ["/api/milestones", selectedLocationId],
    queryFn: selectedLocationId
      ? async () => {
          const data = await apiRequest(
            "GET",
            `/api/milestones?locationId=${selectedLocationId}`,
          );
          return data;
        }
      : undefined,
    enabled: !!selectedLocationId,
  });

  // Fetch categories for the selected location
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories", selectedLocationId],
    queryFn: selectedLocationId
      ? async () => {
          const data = await apiRequest(
            "GET",
            `/api/categories?locationId=${selectedLocationId}`,
          );
          return data;
        }
      : undefined,
    enabled: !!selectedLocationId,
  });

  // Fetch materials for the selected location
  const { data: materials = [] } = useQuery({
    queryKey: ["/api/materials", selectedLocationId],
    queryFn: selectedLocationId
      ? async () => {
          const data = await apiRequest(
            "GET",
            `/api/materials?locationId=${selectedLocationId}`,
          );
          return data;
        }
      : undefined,
    enabled: !!selectedLocationId,
  });

  const uploadImageMutation = useMutation({
    mutationFn: async ({
      file,
      type,
    }: {
      file: File;
      type: "image" | "video" | "instruction";
    }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/activities/upload", {
        method: "POST",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");
      return response.json();
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const result = await uploadImageMutation.mutateAsync({
        file,
        type: "image",
      });
      setActivityImageUrl(result.url);
      setValue("imageUrl", result.url);
      toast({
        title: "Image uploaded",
        description: "The activity image has been uploaded successfully.",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleVideoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingVideo(true);
    try {
      const result = await uploadImageMutation.mutateAsync({
        file,
        type: "video",
      });
      setActivityVideoUrl(result.url);
      setValue("videoUrl", result.url);
      toast({
        title: "Video uploaded",
        description: "The activity video has been uploaded successfully.",
      });
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleInstructionImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingInstructionImage(index);
    try {
      const result = await uploadImageMutation.mutateAsync({
        file,
        type: "instruction",
      });
      const updated = [...instructions];
      updated[index] = { ...updated[index], imageUrl: result.url };
      setInstructions(updated);
      toast({
        title: "Image uploaded",
        description: `Image for step ${index + 1} has been uploaded successfully.`,
      });
    } finally {
      setUploadingInstructionImage(null);
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/activities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create activity");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      onSuccess();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`/api/activities/${activity!.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update activity");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      onSuccess();
    },
  });

  const onSubmit = (data: any) => {
    console.log("[ActivityForm] Submitting activity with raw data:", data);

    // Remove only the imagePrompt field as it's not stored in the database
    const { imagePrompt, ...dataWithoutPrompt } = data;

    const formData = {
      ...dataWithoutPrompt,
      ageGroupIds: selectedAgeGroups,
      milestoneIds: selectedMilestones,
      materialIds: selectedMaterials,
      instructions: instructions.filter(
        (inst) => inst.text.trim() !== "" || inst.imageUrl,
      ),
      locationId: dataWithoutPrompt.locationId || selectedLocationId,
      imageUrl: activityImageUrl,
      videoUrl: activityVideoUrl,
      // Include AI-generated fields if they exist
      objectives: dataWithoutPrompt.objectives || [],
      preparationTime: dataWithoutPrompt.preparationTime || null,
      safetyConsiderations: dataWithoutPrompt.safetyConsiderations || [],
      spaceRequired: dataWithoutPrompt.spaceRequired || null,
      groupSize: dataWithoutPrompt.groupSize || null,
      messLevel: dataWithoutPrompt.messLevel || null,
      variations: dataWithoutPrompt.variations || [],
    };

    console.log("[ActivityForm] Final form data being sent:", formData);

    if (activity) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const addInstruction = () => {
    setInstructions([...instructions, { text: "" }]);
  };

  const removeInstruction = (index: number) => {
    setInstructions(instructions.filter((_, i) => i !== index));
  };

  const updateInstructionText = (index: number, text: string) => {
    const updated = [...instructions];
    updated[index] = { ...updated[index], text };
    setInstructions(updated);
  };

  const toggleAgeGroup = (ageGroupId: string) => {
    setSelectedAgeGroups((prev) =>
      prev.includes(ageGroupId)
        ? prev.filter((id) => id !== ageGroupId)
        : [...prev, ageGroupId],
    );
  };

  const toggleMilestone = (milestoneId: string) => {
    setSelectedMilestones((prev) =>
      prev.includes(milestoneId)
        ? prev.filter((id) => id !== milestoneId)
        : [...prev, milestoneId],
    );
  };

  const toggleMaterial = (materialId: string) => {
    setSelectedMaterials((prev) =>
      prev.includes(materialId)
        ? prev.filter((id) => id !== materialId)
        : [...prev, materialId],
    );
  };

  // Filter materials based on selected filters
  const filteredMaterials = materials.filter((material: any) => {
    const categoryMatch =
      materialCategoryFilter === "all" ||
      material.category === materialCategoryFilter;
    const ageGroupMatch =
      materialAgeGroupFilter === "all" ||
      (material.ageGroups &&
        material.ageGroups.includes(materialAgeGroupFilter));
    return categoryMatch && ageGroupMatch;
  });

  // Get unique categories from materials
  const materialCategories = Array.from(
    new Set(materials.map((m: any) => m.category).filter(Boolean)),
  );

  // Filter milestones based on selected filters
  const filteredMilestones = milestones.filter((milestone: any) => {
    const categoryMatch =
      milestoneCategoryFilter === "all" ||
      milestone.category === milestoneCategoryFilter;
    const ageGroupMatch =
      milestoneAgeGroupFilter === "all" ||
      (milestone.ageGroupIds &&
        milestone.ageGroupIds.includes(milestoneAgeGroupFilter));
    return categoryMatch && ageGroupMatch;
  });

  // Get unique categories from milestones
  const milestoneCategories = Array.from(
    new Set(milestones.map((m: any) => m.category).filter(Boolean)),
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <h3 className="font-semibold text-lg">Basic Information</h3>

            <div>
              <Label htmlFor="title">Activity Title *</Label>
              <Input
                id="title"
                {...register("title")}
                data-testid="input-activity-title"
              />
              {errors.title && (
                <p className="text-red-500 text-sm">{errors.title.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                {...register("description")}
                rows={3}
                data-testid="textarea-activity-description"
              />
              {errors.description && (
                <p className="text-red-500 text-sm">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <Select
                onValueChange={(value) => setValue("category", value)}
                defaultValue={initialData?.category || activity?.category}
              >
                <SelectTrigger data-testid="select-activity-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat: any) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-red-500 text-sm">
                  {errors.category.message}
                </p>
              )}
            </div>

            <div>
              <Label>Age Groups *</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                {ageGroups.map((group: any) => (
                  <div key={group.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`age-group-${group.id}`}
                      checked={selectedAgeGroups.includes(group.id)}
                      onCheckedChange={() => toggleAgeGroup(group.id)}
                      data-testid={`checkbox-age-group-${group.id}`}
                    />
                    <label
                      htmlFor={`age-group-${group.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {group.name} ({group.ageRangeStart}-{group.ageRangeEnd}{" "}
                      months)
                    </label>
                  </div>
                ))}
              </div>
              {selectedAgeGroups.length === 0 && (
                <p className="text-amber-600 text-sm mt-1">
                  Please select at least one age group
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="duration">Duration (minutes) *</Label>
              <Input
                id="duration"
                type="number"
                {...register("duration", { valueAsNumber: true })}
                data-testid="input-activity-duration"
              />
              {errors.duration && (
                <p className="text-red-500 text-sm">
                  {errors.duration.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minChildren">Min Children Recomended</Label>
                <Input
                  id="minChildren"
                  type="number"
                  min="1"
                  {...register("minChildren", { valueAsNumber: true })}
                  data-testid="input-min-children"
                />
                {errors.minChildren && (
                  <p className="text-red-500 text-sm">
                    {errors.minChildren.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="maxChildren">Max Children Recomended</Label>
                <Input
                  id="maxChildren"
                  type="number"
                  min="1"
                  {...register("maxChildren", { valueAsNumber: true })}
                  data-testid="input-max-children"
                />
                {errors.maxChildren && (
                  <p className="text-red-500 text-sm">
                    {errors.maxChildren.message}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Details (from AI generation) */}
        {initialData && (
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold text-lg">Additional Details</h3>

              {initialData.objectives && (
                <div>
                  <Label>Learning Objectives</Label>
                  <div className="space-y-2">
                    {initialData.objectives.map(
                      (objective: string, index: number) => (
                        <div key={index} className="flex items-start gap-2">
                          <span className="text-sm text-gray-500 mt-0.5">
                            •
                          </span>
                          <p className="text-sm">{objective}</p>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}

              {initialData.preparationTime && (
                <div>
                  <Label>Preparation Time</Label>
                  <p className="text-sm">
                    {initialData.preparationTime} minutes
                  </p>
                </div>
              )}

              {initialData.spaceRequired && (
                <div>
                  <Label>Space Required</Label>
                  <p className="text-sm">{initialData.spaceRequired}</p>
                </div>
              )}

              {initialData.groupSize && (
                <div>
                  <Label>Group Size</Label>
                  <p className="text-sm">{initialData.groupSize}</p>
                </div>
              )}

              {initialData.messLevel && (
                <div>
                  <Label>Mess Level</Label>
                  <p className="text-sm">{initialData.messLevel}</p>
                </div>
              )}

              {initialData.safetyConsiderations &&
                initialData.safetyConsiderations.length > 0 && (
                  <div>
                    <Label>Safety Considerations</Label>
                    <div className="space-y-2">
                      {initialData.safetyConsiderations.map(
                        (safety: string, index: number) => (
                          <div key={index} className="flex items-start gap-2">
                            <span className="text-sm text-amber-500 mt-0.5">
                              ⚠
                            </span>
                            <p className="text-sm">{safety}</p>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}

              {initialData.variations && initialData.variations.length > 0 && (
                <div>
                  <Label>Activity Variations</Label>
                  <div className="space-y-2">
                    {initialData.variations.map(
                      (variation: string, index: number) => (
                        <div key={index} className="flex items-start gap-2">
                          <span className="text-sm text-turquoise mt-0.5">
                            ✦
                          </span>
                          <p className="text-sm">{variation}</p>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Media */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <h3 className="font-semibold text-lg">Media</h3>

            <div>
              <Label>Activity Image</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                {activityImageUrl ? (
                  <div className="relative">
                    <img
                      src={activityImageUrl}
                      alt="Activity"
                      className="max-h-32 mx-auto rounded"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => imageInputRef.current?.click()}
                    >
                      Change Image
                    </Button>
                  </div>
                ) : (
                  <div>
                    <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-2"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={uploadingImage}
                    >
                      {uploadingImage ? "Uploading..." : "Upload Image"}
                    </Button>
                  </div>
                )}
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>
            </div>

            <div>
              <Label>Activity Video</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                {activityVideoUrl ? (
                  <div>
                    <VideoIcon className="mx-auto h-12 w-12 text-green-600" />
                    <p className="text-sm text-gray-600 mt-1">Video uploaded</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => videoInputRef.current?.click()}
                    >
                      Change Video
                    </Button>
                  </div>
                ) : (
                  <div>
                    <VideoIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-2"
                      onClick={() => videoInputRef.current?.click()}
                      disabled={uploadingVideo}
                    >
                      {uploadingVideo ? "Uploading..." : "Upload Video"}
                    </Button>
                  </div>
                )}
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={handleVideoUpload}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Milestones */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <h3 className="font-semibold text-lg">Learning Milestones</h3>

          {/* Milestone Filters */}
          <div className="flex gap-3 items-center">
            <div className="flex-1">
              <Select
                value={milestoneCategoryFilter}
                onValueChange={setMilestoneCategoryFilter}
              >
                <SelectTrigger
                  className="h-8 text-sm"
                  data-testid="filter-milestone-category"
                >
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {milestoneCategories.map((category: string) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Select
                value={milestoneAgeGroupFilter}
                onValueChange={setMilestoneAgeGroupFilter}
              >
                <SelectTrigger
                  className="h-8 text-sm"
                  data-testid="filter-milestone-age-group"
                >
                  <SelectValue placeholder="Filter by age group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Age Groups</SelectItem>
                  {ageGroups.map((group: any) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(milestoneCategoryFilter !== "all" ||
              milestoneAgeGroupFilter !== "all") && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setMilestoneCategoryFilter("all");
                  setMilestoneAgeGroupFilter("all");
                }}
                data-testid="button-clear-milestone-filters"
              >
                Clear Filters
              </Button>
            )}
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto border rounded-md p-3">
            {filteredMilestones.length > 0 ? (
              filteredMilestones.map((milestone: any) => (
                <div key={milestone.id} className="flex items-start space-x-2">
                  <Checkbox
                    id={`milestone-${milestone.id}`}
                    checked={selectedMilestones.includes(milestone.id)}
                    onCheckedChange={() => toggleMilestone(milestone.id)}
                    data-testid={`checkbox-milestone-${milestone.id}`}
                    className="mt-1"
                  />
                  <label
                    htmlFor={`milestone-${milestone.id}`}
                    className="text-sm leading-relaxed cursor-pointer"
                  >
                    <span className="font-medium">{milestone.title}</span>
                    <span className="text-gray-600 ml-2">
                      ({milestone.category})
                    </span>
                    <p className="text-xs text-gray-500">
                      {milestone.description}
                    </p>
                  </label>
                </div>
              ))
            ) : milestones.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm mb-2">
                  No milestones found for this location
                </p>
                <p className="text-xs">
                  Add milestones in the Milestones Library to select them here
                </p>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm mb-2">
                  No milestones match the selected filters
                </p>
                <p className="text-xs">
                  Try adjusting or clearing the filters above
                </p>
              </div>
            )}
          </div>
          {selectedMilestones.length === 0 && filteredMilestones.length > 0 && (
            <p className="text-amber-600 text-sm">
              Consider selecting relevant milestones for this activity
            </p>
          )}
        </CardContent>
      </Card>

      {/* Materials Required */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-lg">Materials Required</h3>
            <span className="text-sm text-gray-500">
              {selectedMaterials.length} item
              {selectedMaterials.length !== 1 ? "s" : ""} selected
            </span>
          </div>

          {/* AI Suggested Materials Section */}
          {console.log('[ActivityForm] initialData:', initialData)}
          {console.log('[ActivityForm] suggestedMaterials:', initialData?.suggestedMaterials)}
          {console.log('[ActivityForm] suggestedMaterials length:', initialData?.suggestedMaterials?.length)}
          {initialData?.suggestedMaterials && initialData.suggestedMaterials.length > 0 && (
            <div className="border-2 border-dashed border-turquoise/50 rounded-lg p-4 bg-gradient-to-br from-turquoise/5 to-coral-red/5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-coral-red to-turquoise flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-sm">AI Suggested Materials</h4>
                <span className="text-xs text-gray-500">
                  Ready to add to your materials library
                </span>
              </div>
              <div className="space-y-2">
                {initialData.suggestedMaterials.map((material: any, index: number) => (
                  <div key={index} className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{material.name}</span>
                          <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                            {material.category || "General"}
                          </span>
                          {material.quantity && (
                            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                              Qty: {material.quantity}
                            </span>
                          )}
                        </div>
                        {material.description && (
                          <p className="text-xs text-gray-600">{material.description}</p>
                        )}
                        {material.safetyNotes && (
                          <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                            <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
                            Safety: {material.safetyNotes}
                          </p>
                        )}
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="ml-2"
                        onClick={() => {
                          // TODO: Add material to database
                          toast({
                            title: "Coming Soon",
                            description: "Quick add to materials library will be available soon",
                          });
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Quick Add
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 p-2 bg-amber-50 rounded-md">
                <p className="text-xs text-amber-800">
                  💡 <strong>Tip:</strong> Use "Quick Add" to instantly save these materials to your library, 
                  or manually select from existing materials below.
                </p>
              </div>
            </div>
          )}

          {/* Materials Filters */}
          <div className="flex gap-3 items-center">
            <div className="flex-1">
              <Select
                value={materialCategoryFilter}
                onValueChange={setMaterialCategoryFilter}
              >
                <SelectTrigger
                  className="h-8 text-sm"
                  data-testid="filter-material-category"
                >
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {materialCategories.map((category: string) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Select
                value={materialAgeGroupFilter}
                onValueChange={setMaterialAgeGroupFilter}
              >
                <SelectTrigger
                  className="h-8 text-sm"
                  data-testid="filter-material-age-group"
                >
                  <SelectValue placeholder="Filter by age group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Age Groups</SelectItem>
                  {ageGroups.map((group: any) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(materialCategoryFilter !== "all" ||
              materialAgeGroupFilter !== "all") && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setMaterialCategoryFilter("all");
                  setMaterialAgeGroupFilter("all");
                }}
                data-testid="button-clear-filters"
              >
                Clear Filters
              </Button>
            )}
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto border rounded-md p-3">
            {filteredMaterials.length > 0 ? (
              filteredMaterials.map((material: any) => (
                <div
                  key={material.id}
                  className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded-md transition-colors"
                >
                  <Checkbox
                    id={`material-${material.id}`}
                    checked={selectedMaterials.includes(material.id)}
                    onCheckedChange={() => toggleMaterial(material.id)}
                    data-testid={`checkbox-material-${material.id}`}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <label
                      htmlFor={`material-${material.id}`}
                      className="text-sm leading-relaxed cursor-pointer block"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">
                          {material.name}
                        </span>
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                          {material.category}
                        </span>
                        {material.ageGroups &&
                          material.ageGroups.length > 0 && (
                            <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                              {material.ageGroups
                                .map((ageGroupId: string) => {
                                  const ageGroup = ageGroups.find(
                                    (ag: any) => ag.id === ageGroupId,
                                  );
                                  return ageGroup?.name || "Unknown";
                                })
                                .join(", ")}
                            </span>
                          )}
                      </div>
                      {material.description && (
                        <p className="text-xs text-gray-600 mt-1">
                          {material.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        {material.safetyNotes && (
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
                            Safety notes available
                          </span>
                        )}
                        <span>Quantity: {material.quantity || "N/A"}</span>
                        {material.location && (
                          <span>Location: {material.location}</span>
                        )}
                      </div>
                    </label>
                  </div>
                </div>
              ))
            ) : materials.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm mb-2">
                  No materials found for this location
                </p>
                <p className="text-xs">
                  Add materials in the Materials Library to select them here
                </p>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm mb-2">
                  No materials match the selected filters
                </p>
                <p className="text-xs">
                  Try adjusting or clearing the filters above
                </p>
              </div>
            )}
          </div>
          {selectedMaterials.length === 0 && filteredMaterials.length > 0 && (
            <p className="text-amber-600 text-sm">
              Select the materials needed for this activity
            </p>
          )}
          {selectedMaterials.length > 0 && (
            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-sm text-blue-800 font-medium mb-1">
                Materials Selected ({selectedMaterials.length}):
              </p>
              <div className="flex flex-wrap gap-1">
                {selectedMaterials.map((materialId) => {
                  const material = materials.find(
                    (m: any) => m.id === materialId,
                  );
                  return material ? (
                    <span
                      key={materialId}
                      className="text-xs bg-blue-200 text-blue-900 px-2 py-1 rounded-full"
                    >
                      {material.name}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step-by-step Instructions */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-lg">Step-by-step Instructions</h3>
            <Button
              type="button"
              onClick={addInstruction}
              size="sm"
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Step
            </Button>
          </div>

          {instructions.map((instruction, index) => (
            <div key={index} className="space-y-2 p-3 border rounded-lg">
              <div className="flex gap-2">
                <span className="flex-shrink-0 w-6 h-6 bg-coral-red text-white rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                <div className="flex-1 space-y-2">
                  <Input
                    value={instruction.text}
                    onChange={(e) =>
                      updateInstructionText(index, e.target.value)
                    }
                    placeholder="Enter instruction step..."
                    data-testid={`input-instruction-${index}`}
                  />

                  {/* Instruction Image Upload */}
                  <div className="flex items-center gap-2">
                    {instruction.imageUrl ? (
                      <div className="flex items-center gap-2">
                        <img
                          src={instruction.imageUrl}
                          alt={`Step ${index + 1}`}
                          className="h-16 w-16 object-cover rounded"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            instructionImageRefs.current[index]?.click()
                          }
                        >
                          Change Image
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          instructionImageRefs.current[index]?.click()
                        }
                        disabled={uploadingInstructionImage === index}
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        {uploadingInstructionImage === index
                          ? "Uploading..."
                          : "Add Image"}
                      </Button>
                    )}
                    <input
                      ref={(el) => {
                        instructionImageRefs.current[index] = el;
                      }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleInstructionImageUpload(e, index)}
                    />
                  </div>
                </div>
                {instructions.length > 1 && (
                  <Button
                    type="button"
                    onClick={() => removeInstruction(index)}
                    size="sm"
                    variant="outline"
                    data-testid={`button-remove-instruction-${index}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end space-x-2">
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
          className="bg-gradient-to-r from-coral-red to-turquoise text-white"
          disabled={createMutation.isPending || updateMutation.isPending}
          data-testid="button-save-activity"
        >
          {activity ? "Update Activity" : "Create Activity"}
        </Button>
      </div>
    </form>
  );
}
