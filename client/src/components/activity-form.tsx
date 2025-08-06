import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, X } from "lucide-react";
import { insertActivitySchema, type Activity } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { useState } from "react";

interface ActivityFormProps {
  activity?: Activity;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ActivityForm({ activity, onSuccess, onCancel }: ActivityFormProps) {
  const [objectives, setObjectives] = useState<string[]>(activity?.teachingObjectives || [""]);
  const [instructions, setInstructions] = useState<string[]>(activity?.instructions || [""]);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    resolver: zodResolver(insertActivitySchema),
    defaultValues: {
      title: activity?.title || "",
      description: activity?.description || "",
      duration: activity?.duration || 30,
      ageRangeStart: activity?.ageRangeStart || 36,
      ageRangeEnd: activity?.ageRangeEnd || 48,
      category: activity?.category || "",
      teachingObjectives: activity?.teachingObjectives || [],
      milestoneIds: activity?.milestoneIds || [],
      materialIds: activity?.materialIds || [],
      instructions: activity?.instructions || [],
      videoUrl: activity?.videoUrl || "",
      imageUrl: activity?.imageUrl || "",
    },
  });

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
      teachingObjectives: objectives.filter(obj => obj.trim() !== ""),
      instructions: instructions.filter(inst => inst.trim() !== ""),
    };

    if (activity) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const addObjective = () => {
    setObjectives([...objectives, ""]);
  };

  const removeObjective = (index: number) => {
    setObjectives(objectives.filter((_, i) => i !== index));
  };

  const updateObjective = (index: number, value: string) => {
    const updated = [...objectives];
    updated[index] = value;
    setObjectives(updated);
  };

  const addInstruction = () => {
    setInstructions([...instructions, ""]);
  };

  const removeInstruction = (index: number) => {
    setInstructions(instructions.filter((_, i) => i !== index));
  };

  const updateInstruction = (index: number, value: string) => {
    const updated = [...instructions];
    updated[index] = value;
    setInstructions(updated);
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
                  <SelectItem value="Social Development">Social Development</SelectItem>
                  <SelectItem value="Emotional Development">Emotional Development</SelectItem>
                  <SelectItem value="Cognitive Development">Cognitive Development</SelectItem>
                  <SelectItem value="Physical Development">Physical Development</SelectItem>
                  <SelectItem value="Art & Creativity">Art & Creativity</SelectItem>
                  <SelectItem value="Music & Movement">Music & Movement</SelectItem>
                </SelectContent>
              </Select>
              {errors.category && <p className="text-red-500 text-sm">{errors.category.message}</p>}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label htmlFor="duration">Duration (min) *</Label>
                <Input 
                  id="duration" 
                  type="number" 
                  {...register("duration", { valueAsNumber: true })} 
                  data-testid="input-activity-duration"
                />
                {errors.duration && <p className="text-red-500 text-sm">{errors.duration.message}</p>}
              </div>
              <div>
                <Label htmlFor="ageRangeStart">Min Age (months) *</Label>
                <Input 
                  id="ageRangeStart" 
                  type="number" 
                  {...register("ageRangeStart", { valueAsNumber: true })} 
                  data-testid="input-age-start"
                />
                {errors.ageRangeStart && <p className="text-red-500 text-sm">{errors.ageRangeStart.message}</p>}
              </div>
              <div>
                <Label htmlFor="ageRangeEnd">Max Age (months) *</Label>
                <Input 
                  id="ageRangeEnd" 
                  type="number" 
                  {...register("ageRangeEnd", { valueAsNumber: true })} 
                  data-testid="input-age-end"
                />
                {errors.ageRangeEnd && <p className="text-red-500 text-sm">{errors.ageRangeEnd.message}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Media */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <h3 className="font-semibold text-lg">Media</h3>
            
            <div>
              <Label htmlFor="videoUrl">Video URL</Label>
              <Input 
                id="videoUrl" 
                {...register("videoUrl")} 
                placeholder="https://example.com/video.mp4"
                data-testid="input-video-url"
              />
            </div>

            <div>
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input 
                id="imageUrl" 
                {...register("imageUrl")} 
                placeholder="https://example.com/image.jpg"
                data-testid="input-image-url"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Teaching Objectives */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-lg">Teaching Objectives</h3>
            <Button type="button" onClick={addObjective} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              Add Objective
            </Button>
          </div>
          
          {objectives.map((objective, index) => (
            <div key={index} className="flex gap-2">
              <Input 
                value={objective}
                onChange={(e) => updateObjective(index, e.target.value)}
                placeholder="Enter teaching objective..."
                data-testid={`input-objective-${index}`}
              />
              {objectives.length > 1 && (
                <Button 
                  type="button" 
                  onClick={() => removeObjective(index)} 
                  size="sm" 
                  variant="outline"
                  data-testid={`button-remove-objective-${index}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
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
            <div key={index} className="flex gap-2">
              <span className="flex-shrink-0 w-6 h-6 bg-coral-red text-white rounded-full flex items-center justify-center text-sm font-medium mt-2">
                {index + 1}
              </span>
              <Input 
                value={instruction}
                onChange={(e) => updateInstruction(index, e.target.value)}
                placeholder="Enter instruction step..."
                data-testid={`input-instruction-${index}`}
              />
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
