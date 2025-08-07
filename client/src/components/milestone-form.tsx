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
import { queryClient } from "@/lib/queryClient";
import { useState } from "react";

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

  const { register, handleSubmit, formState: { errors }, setValue } = useForm({
    resolver: zodResolver(insertMilestoneSchema.omit({ locationIds: true })),
    defaultValues: {
      title: milestone?.title || "",
      description: milestone?.description || "",
      category: milestone?.category || "",
      ageRangeStart: milestone?.ageRangeStart || 36,
      ageRangeEnd: milestone?.ageRangeEnd || 48,
      learningObjective: milestone?.learningObjective || "",
      tenantId: "", // Will be set by backend
    },
  });

  // Fetch all authorized locations
  const { data: locations = [] } = useQuery({
    queryKey: ["/api/locations"],
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

  const onSubmit = (data: any) => {
    const formData = {
      ...data,
      locationIds: selectedLocationIds,
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="ageRangeStart">Minimum Age (months) *</Label>
          <Input 
            id="ageRangeStart" 
            type="number" 
            min="12"
            max="84"
            step="6"
            {...register("ageRangeStart", { valueAsNumber: true })} 
            data-testid="input-age-start"
          />
          {errors.ageRangeStart && <p className="text-red-500 text-sm">{errors.ageRangeStart.message}</p>}
        </div>

        <div>
          <Label htmlFor="ageRangeEnd">Maximum Age (months) *</Label>
          <Input 
            id="ageRangeEnd" 
            type="number" 
            min="12"
            max="84"
            step="6"
            {...register("ageRangeEnd", { valueAsNumber: true })} 
            data-testid="input-age-end"
          />
          {errors.ageRangeEnd && <p className="text-red-500 text-sm">{errors.ageRangeEnd.message}</p>}
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