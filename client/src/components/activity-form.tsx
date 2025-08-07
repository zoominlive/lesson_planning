import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, X, Upload, ImageIcon, VideoIcon } from "lucide-react";
import { insertActivitySchema, type Activity, type InstructionStep } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

interface ActivityFormProps {
  activity?: Activity;
  onSuccess: () => void;
  onCancel: () => void;
  selectedLocationId?: string;
}

export default function ActivityForm({ activity, onSuccess, onCancel, selectedLocationId }: ActivityFormProps) {
  const { toast } = useToast();
  const [instructions, setInstructions] = useState<InstructionStep[]>(
    activity?.instructions || [{ text: "" }]
  );
  const [selectedAgeGroups, setSelectedAgeGroups] = useState<string[]>(
    activity?.ageGroupIds || []
  );
  const [selectedMilestones, setSelectedMilestones] = useState<string[]>(
    activity?.milestoneIds || []
  );
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingInstructionImage, setUploadingInstructionImage] = useState<number | null>(null);
  const [activityImageUrl, setActivityImageUrl] = useState(activity?.imageUrl || "");
  const [activityVideoUrl, setActivityVideoUrl] = useState(activity?.videoUrl || "");
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const instructionImageRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    resolver: zodResolver(insertActivitySchema.omit({ 
      ageRangeStart: true, 
      ageRangeEnd: true,
      teachingObjectives: true,
      usageCount: true,
      lastUsedAt: true,
      createdAt: true,
      updatedAt: true
    }).extend({
      ageGroupIds: insertActivitySchema.shape.ageGroupIds || [],
    })),
    defaultValues: {
      title: activity?.title || "",
      description: activity?.description || "",
      duration: activity?.duration || 30,
      category: activity?.category || "",
      milestoneIds: activity?.milestoneIds || [],
      materialIds: activity?.materialIds || [],
      instructions: activity?.instructions || [],
      videoUrl: activity?.videoUrl || "",
      imageUrl: activity?.imageUrl || "",
      locationId: activity?.locationId || selectedLocationId || "",
      tenantId: "", // Will be set by backend
      ageGroupIds: activity?.ageGroupIds || [],
    },
  });

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

  // Fetch milestones for the selected location
  const { data: milestones = [] } = useQuery({
    queryKey: ["/api/milestones", selectedLocationId],
    queryFn: selectedLocationId 
      ? async () => {
          const data = await apiRequest("GET", `/api/milestones?locationId=${selectedLocationId}`);
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
          const data = await apiRequest("GET", `/api/categories?locationId=${selectedLocationId}`);
          return data;
        }
      : undefined,
    enabled: !!selectedLocationId,
  });

  const uploadImageMutation = useMutation({
    mutationFn: async ({ file, type }: { file: File; type: 'image' | 'video' | 'instruction' }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      
      const response = await fetch('/api/activities/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Upload failed');
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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const result = await uploadImageMutation.mutateAsync({ file, type: 'image' });
      setActivityImageUrl(result.url);
      setValue('imageUrl', result.url);
      toast({
        title: "Image uploaded",
        description: "The activity image has been uploaded successfully.",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingVideo(true);
    try {
      const result = await uploadImageMutation.mutateAsync({ file, type: 'video' });
      setActivityVideoUrl(result.url);
      setValue('videoUrl', result.url);
      toast({
        title: "Video uploaded",
        description: "The activity video has been uploaded successfully.",
      });
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleInstructionImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingInstructionImage(index);
    try {
      const result = await uploadImageMutation.mutateAsync({ file, type: 'instruction' });
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
      const response = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      const response = await fetch(`/api/activities/${activity!.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
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
    const formData = {
      ...data,
      ageGroupIds: selectedAgeGroups,
      milestoneIds: selectedMilestones,
      instructions: instructions.filter(inst => inst.text.trim() !== "" || inst.imageUrl),
      locationId: data.locationId || selectedLocationId,
      imageUrl: activityImageUrl,
      videoUrl: activityVideoUrl,
    };

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
    setSelectedAgeGroups(prev => 
      prev.includes(ageGroupId) 
        ? prev.filter(id => id !== ageGroupId)
        : [...prev, ageGroupId]
    );
  };

  const toggleMilestone = (milestoneId: string) => {
    setSelectedMilestones(prev => 
      prev.includes(milestoneId) 
        ? prev.filter(id => id !== milestoneId)
        : [...prev, milestoneId]
    );
  };

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
              {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea 
                id="description" 
                {...register("description")} 
                rows={3}
                data-testid="textarea-activity-description"
              />
              {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <Select onValueChange={(value) => setValue("category", value)} defaultValue={activity?.category}>
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
              {errors.category && <p className="text-red-500 text-sm">{errors.category.message}</p>}
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
                      {group.name} ({group.ageRangeStart}-{group.ageRangeEnd} months)
                    </label>
                  </div>
                ))}
              </div>
              {selectedAgeGroups.length === 0 && (
                <p className="text-amber-600 text-sm mt-1">Please select at least one age group</p>
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
              {errors.duration && <p className="text-red-500 text-sm">{errors.duration.message}</p>}
            </div>
          </CardContent>
        </Card>

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
          <div className="space-y-2 max-h-64 overflow-y-auto border rounded-md p-3">
            {milestones.map((milestone: any) => (
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
                  <span className="text-gray-600 ml-2">({milestone.category})</span>
                  <p className="text-xs text-gray-500">{milestone.description}</p>
                </label>
              </div>
            ))}
          </div>
          {selectedMilestones.length === 0 && (
            <p className="text-amber-600 text-sm">Consider selecting relevant milestones for this activity</p>
          )}
        </CardContent>
      </Card>

      {/* Step-by-step Instructions */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-lg">Step-by-step Instructions</h3>
            <Button type="button" onClick={addInstruction} size="sm" variant="outline">
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
                    onChange={(e) => updateInstructionText(index, e.target.value)}
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
                          onClick={() => instructionImageRefs.current[index]?.click()}
                        >
                          Change Image
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => instructionImageRefs.current[index]?.click()}
                        disabled={uploadingInstructionImage === index}
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        {uploadingInstructionImage === index ? "Uploading..." : "Add Image"}
                      </Button>
                    )}
                    <input
                      ref={(el) => { instructionImageRefs.current[index] = el; }}
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
        <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel">
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