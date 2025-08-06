import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { insertMaterialSchema, type Material } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ObjectUploader } from "./ObjectUploader";
import { Camera, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { UploadResult } from '@uppy/core';

interface MaterialFormProps {
  material?: Material;
  onSuccess: () => void;
  onCancel: () => void;
  selectedLocationId: string;
}

export default function MaterialForm({ material, onSuccess, onCancel, selectedLocationId }: MaterialFormProps) {
  const { toast } = useToast();
  const [selectedCategories, setSelectedCategories] = useState<string[]>(material?.categories || []);
  const [photoUrl, setPhotoUrl] = useState<string>(material?.photoUrl || "");

  const { register, handleSubmit, formState: { errors }, setValue, control } = useForm({
    resolver: zodResolver(insertMaterialSchema),
    defaultValues: {
      name: material?.name || "",
      description: material?.description || "",
      categories: material?.categories || [],
      quantity: material?.quantity || 1,
      location: material?.location || "",
      locationId: selectedLocationId,
      tenantId: "", // Will be set by backend
      photoUrl: material?.photoUrl || "",
    },
  });

  // Fetch available categories for multi-select
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories", selectedLocationId],
    queryFn: () => apiRequest("GET", `/api/categories?locationId=${selectedLocationId}`),
    enabled: !!selectedLocationId,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/materials", { 
      ...data, 
      categories: selectedCategories, 
      photoUrl 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      onSuccess();
      toast({ title: "Material created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create material", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PUT", `/api/materials/${material!.id}`, { 
      ...data, 
      categories: selectedCategories, 
      photoUrl 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      onSuccess();
      toast({ title: "Material updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update material", variant: "destructive" });
    },
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: ({ materialId, photoURL }: { materialId: string, photoURL: string }) => 
      apiRequest("PUT", `/api/materials/${materialId}/photo`, { photoURL }),
    onSuccess: (result: any) => {
      setPhotoUrl(result.objectPath);
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      toast({ title: "Photo uploaded successfully" });
    },
    onError: () => {
      toast({ title: "Failed to upload photo", variant: "destructive" });
    },
  });

  const handleGetUploadParameters = async () => {
    const response: any = await apiRequest("POST", "/api/objects/upload");
    return {
      method: "PUT" as const,
      url: response.uploadURL,
    };
  };

  const handleUploadComplete = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful[0]?.uploadURL && material?.id) {
      uploadPhotoMutation.mutate({
        materialId: material.id,
        photoURL: result.successful[0].uploadURL,
      });
    }
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const onSubmit = (data: any) => {
    const submissionData = { 
      ...data, 
      categories: selectedCategories, 
      photoUrl,
      locationId: selectedLocationId 
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
        {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
      </div>

      <div>
        <Label htmlFor="description">Description *</Label>
        <Textarea 
          id="description" 
          {...register("description")} 
          rows={3}
          data-testid="textarea-material-description"
        />
        {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
      </div>

      <div>
        <Label>Categories *</Label>
        <div className="flex flex-wrap gap-2 p-3 border rounded-md min-h-[40px]">
          {Array.isArray(categories) && categories.map((category: any) => {
            const isSelected = selectedCategories.includes(category.id);
            return (
              <Badge
                key={category.id}
                variant={isSelected ? "default" : "outline"}
                className={`cursor-pointer hover:scale-105 transition-transform ${
                  isSelected ? "bg-turquoise text-white" : "hover:bg-gray-100"
                }`}
                onClick={() => handleCategoryToggle(category.id)}
                data-testid={`badge-category-${category.id}`}
              >
                {category.name}
                {isSelected && <X className="w-3 h-3 ml-1" />}
              </Badge>
            );
          })}
          {selectedCategories.length === 0 && (
            <span className="text-gray-500 text-sm">Click categories to select</span>
          )}
        </div>
        {selectedCategories.length === 0 && (
          <p className="text-red-500 text-sm">At least one category is required</p>
        )}
      </div>

      <div>
        <Label htmlFor="quantity">Quantity *</Label>
        <Input 
          id="quantity" 
          type="number" 
          min="0"
          {...register("quantity", { valueAsNumber: true })} 
          data-testid="input-material-quantity"
        />
        {errors.quantity && <p className="text-red-500 text-sm">{errors.quantity.message}</p>}
      </div>

      <div>
        <Label htmlFor="location">Storage Location *</Label>
        <Input 
          id="location" 
          {...register("location")} 
          placeholder="e.g., Art Cabinet A, Block Area..."
          data-testid="input-material-location"
        />
        {errors.location && <p className="text-red-500 text-sm">{errors.location.message}</p>}
      </div>

      <div>
        <Label>Photo</Label>
        <div className="flex items-center gap-4">
          {photoUrl ? (
            <div className="relative">
              <img src={photoUrl} alt="Material" className="w-20 h-20 object-cover rounded-lg" />
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
          <ObjectUploader
            onGetUploadParameters={handleGetUploadParameters}
            onComplete={handleUploadComplete}
            buttonClassName="bg-sky-blue text-white hover:bg-sky-blue/90"
          >
            <Camera className="h-4 w-4 mr-2" />
            {photoUrl ? "Change Photo" : "Add Photo"}
          </ObjectUploader>
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel">
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
