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
import { Plus, X, Upload, ImageIcon, VideoIcon, Check, Star, Loader2, RefreshCw, Sparkles } from "lucide-react";
import {
  insertActivitySchema,
  type Activity,
  type InstructionStep,
} from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ActivityFormProps {
  activity?: Activity;
  onSuccess: () => void;
  onCancel: () => void;
  selectedLocationId?: string;
  initialData?: any; // AI-generated data
  readOnly?: boolean;
}

export default function ActivityForm({
  activity,
  onSuccess,
  onCancel,
  selectedLocationId,
  initialData,
  readOnly = false,
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
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatingStepImages, setGeneratingStepImages] = useState(false);
  const [regeneratingStepImage, setRegeneratingStepImage] = useState<number | null>(null);
  const [uploadingInstructionImage, setUploadingInstructionImage] = useState<
    number | null
  >(null);
  const [activityImageUrl, setActivityImageUrl] = useState(
    activity?.imageUrl || "",
  );
  const [activityVideoUrl, setActivityVideoUrl] = useState(
    activity?.videoUrl || "",
  );

  // Quick Add dialog state
  const [quickAddDialogOpen, setQuickAddDialogOpen] = useState(false);
  const [currentQuickAddMaterial, setCurrentQuickAddMaterial] =
    useState<any>(null);
  const [storageLocation, setStorageLocation] = useState("");
  const [processingQuickAdd, setProcessingQuickAdd] = useState(false);
  const [remainingMaterials, setRemainingMaterials] = useState<any[]>([]);
  const [activityCollectionId, setActivityCollectionId] = useState<
    string | null
  >(null);
  const [batchProcessMode, setBatchProcessMode] = useState(false);
  const [addedMaterials, setAddedMaterials] = useState<Set<string>>(new Set()); // Track which materials have been added
  const [expandedImageUrl, setExpandedImageUrl] = useState<string | null>(null); // For image expansion dialog
  const [expandedImageTitle, setExpandedImageTitle] = useState<string>("Activity Image"); // Title for expanded image
  const [showVideoModal, setShowVideoModal] = useState(false); // For video modal
  const [videoThumbnail, setVideoThumbnail] = useState<string | null>(null); // For video thumbnail

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
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
      objectives: initialData?.objectives || activity?.objectives || [],
      preparationTime: initialData?.preparationTime || activity?.preparationTime || null,
      safetyConsiderations: initialData?.safetyConsiderations || activity?.safetyConsiderations || [],
      spaceRequired: initialData?.spaceRequired || activity?.spaceRequired || null,
      groupSize: initialData?.groupSize || activity?.groupSize || null,
      minChildren: initialData?.minChildren || activity?.minChildren || 1,
      maxChildren: initialData?.maxChildren || activity?.maxChildren || 10,
      messLevel: initialData?.messLevel || activity?.messLevel || null,
      variations: initialData?.variations || activity?.variations || [],
    },
  });

  // Fetch locations to get the current location name
  const { data: locations = [] } = useQuery({
    queryKey: ["/api/locations"],
  });

  const currentLocation = locations.find((loc: any) => loc.id === selectedLocationId);

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

  // Generate thumbnail for existing video
  useEffect(() => {
    if (activityVideoUrl && !videoThumbnail) {
      // Try to generate thumbnail from existing video
      const generateThumbnailFromUrl = async () => {
        try {
          const video = document.createElement('video');
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          
          video.src = activityVideoUrl;
          video.crossOrigin = 'anonymous';
          video.currentTime = 0.5;
          
          await new Promise<void>((resolve, reject) => {
            video.onloadeddata = () => {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              if (context) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
                setVideoThumbnail(thumbnail);
              }
              resolve();
            };
            video.onerror = () => {
              // If we can't generate thumbnail from URL, that's okay
              resolve();
            };
          });
        } catch (error) {
          // Silently fail - thumbnail is optional
          console.log("Could not generate video thumbnail from URL");
        }
      };
      
      generateThumbnailFromUrl();
    }
  }, [activityVideoUrl]);

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
      // Upload the video first
      const result = await uploadImageMutation.mutateAsync({
        file,
        type: "video",
      });
      setActivityVideoUrl(result.url);
      setValue("videoUrl", result.url);
      
      // Create a video element to extract thumbnail
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      video.src = URL.createObjectURL(file);
      video.currentTime = 0.5; // Capture frame at 0.5 seconds
      
      await new Promise<void>((resolve) => {
        video.onloadeddata = () => {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          if (context) {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
            setVideoThumbnail(thumbnail);
          }
          URL.revokeObjectURL(video.src);
          resolve();
        };
      });
      
      toast({
        title: "Video uploaded",
        description: "The activity video has been uploaded successfully.",
      });
    } catch (error) {
      console.error("Video upload error:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleGenerateImage = async () => {
    const activityTitle = watch("title");
    const activityDescription = watch("description");
    const spaceRequired = watch("spaceRequired");
    const category = watch("category");
    
    if (!activityTitle && !activityDescription) {
      toast({
        title: "Please provide activity details",
        description: "Add a title or description for the activity before generating an image.",
        variant: "destructive",
      });
      return;
    }

    // Get selected age group details
    const selectedAgeGroupDetails = selectedAgeGroups.length > 0 
      ? ageGroups.find((g: any) => g.id === selectedAgeGroups[0]) 
      : null;
    const ageGroupDesc = selectedAgeGroupDetails 
      ? `${selectedAgeGroupDetails.name} (${selectedAgeGroupDetails.description})`
      : null;

    setGeneratingImage(true);
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/activities/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ 
          title: activityTitle,
          description: activityDescription,
          spaceRequired: spaceRequired || initialData?.spaceRequired || activity?.spaceRequired,
          ageGroup: ageGroupDesc,
          category: category || initialData?.category || activity?.category,
          // Also send prompt for backward compatibility
          prompt: `${activityTitle || ""}. ${activityDescription || ""}` 
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate image");
      }

      const result = await response.json();
      setActivityImageUrl(result.url);
      setValue("imageUrl", result.url);
      
      toast({
        title: "Image generated successfully",
        description: "An AI-generated image has been created for your activity.",
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

  const handleRegenerateStepImage = async (index: number) => {
    const activityTitle = watch("title");
    const activityDescription = watch("description");
    const spaceRequired = watch("spaceRequired");
    const category = watch("category");
    const instruction = instructions[index];
    
    if (!instruction.text.trim()) {
      toast({
        title: "Cannot generate image",
        description: "Please add instruction text before generating an image.",
        variant: "destructive",
      });
      return;
    }

    // Get selected age group details
    const selectedAgeGroupDetails = selectedAgeGroups.length > 0 
      ? ageGroups.find((g: any) => g.id === selectedAgeGroups[0]) 
      : null;
    const ageGroupDesc = selectedAgeGroupDetails 
      ? `${selectedAgeGroupDetails.name} (${selectedAgeGroupDetails.description})`
      : null;

    setRegeneratingStepImage(index);
    const token = localStorage.getItem("authToken");

    try {
      const response = await fetch("/api/activities/generate-step-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ 
          activityTitle: activityTitle || 'Activity',
          activityDescription: activityDescription || '',
          stepNumber: index + 1,
          stepText: instruction.text,
          spaceRequired: spaceRequired || initialData?.spaceRequired || activity?.spaceRequired,
          ageGroup: ageGroupDesc,
          category: category || initialData?.category || activity?.category
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate image");
      }

      const result = await response.json();
      
      // Update the instruction with the new image
      const updated = [...instructions];
      updated[index] = { ...updated[index], imageUrl: result.url };
      setInstructions(updated);
      
      toast({
        title: "Image regenerated successfully",
        description: `Step ${index + 1} image has been updated.`,
      });
    } catch (error) {
      console.error(`Failed to regenerate image for step ${index + 1}:`, error);
      toast({
        title: "Failed to regenerate image",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setRegeneratingStepImage(null);
    }
  };

  const handleGenerateAllStepImages = async () => {
    const activityTitle = watch("title");
    const activityDescription = watch("description");
    const spaceRequired = watch("spaceRequired");
    const category = watch("category");
    const stepsWithoutImages = instructions
      .map((inst, index) => ({ ...inst, index }))
      .filter(inst => inst.text.trim() && !inst.imageUrl);

    if (stepsWithoutImages.length === 0) {
      toast({
        title: "No steps to generate images for",
        description: "All steps either have images or are empty.",
        variant: "default",
      });
      return;
    }

    // Get selected age group details
    const selectedAgeGroupDetails = selectedAgeGroups.length > 0 
      ? ageGroups.find((g: any) => g.id === selectedAgeGroups[0]) 
      : null;
    const ageGroupDesc = selectedAgeGroupDetails 
      ? `${selectedAgeGroupDetails.name} (${selectedAgeGroupDetails.description})`
      : null;

    setGeneratingStepImages(true);
    const token = localStorage.getItem("authToken");
    let successCount = 0;
    let failCount = 0;

    try {
      // Keep track of the updated instructions
      let updatedInstructions = [...instructions];
      
      for (const step of stepsWithoutImages) {
        try {
          const response = await fetch("/api/activities/generate-step-image", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: JSON.stringify({ 
              activityTitle: activityTitle || 'Activity',
              activityDescription: activityDescription || '',
              stepNumber: step.index + 1,
              stepText: step.text,
              spaceRequired: spaceRequired || initialData?.spaceRequired || activity?.spaceRequired,
              ageGroup: ageGroupDesc,
              category: category || initialData?.category || activity?.category
            }),
          });

          if (!response.ok) {
            failCount++;
            continue;
          }

          const result = await response.json();
          
          // Update the instruction with the generated image in our local copy
          updatedInstructions[step.index] = { ...updatedInstructions[step.index], imageUrl: result.url };
          // Update the state with the accumulated changes
          setInstructions([...updatedInstructions]);
          
          successCount++;
        } catch (error) {
          console.error(`Failed to generate image for step ${step.index + 1}:`, error);
          failCount++;
        }
      }

      if (successCount > 0) {
        toast({
          title: "Images generated successfully",
          description: `Generated ${successCount} image${successCount > 1 ? 's' : ''} for activity steps.${failCount > 0 ? ` ${failCount} failed.` : ''}`,
        });
      } else {
        toast({
          title: "Failed to generate images",
          description: "Could not generate images for the steps. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Bulk image generation failed:", error);
      toast({
        title: "Failed to generate images",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingStepImages(false);
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

  // Quick Add functions
  const handleQuickAdd = (material: any, allMaterials: any[]) => {
    // Check if this material was already added
    const materialKey = `${material.name}-${material.category}`;
    if (addedMaterials.has(materialKey)) {
      toast({
        title: "Material already added",
        description: `${material.name} has already been added to your library`,
      });
      return;
    }
    
    // Reset collection ID when starting a new quick add session
    setActivityCollectionId(null);
    setCurrentQuickAddMaterial(material);
    setRemainingMaterials(allMaterials.filter((m) => m !== material));
    setQuickAddDialogOpen(true);
    setStorageLocation("");
    setBatchProcessMode(false);
  };

  const createMaterialFromSuggestion = async (
    material: any,
    storageLocation: string,
    existingCollectionId?: string,
  ) => {
    const activityTitle = watch("title") || initialData?.title || "Activity";

    // Get appropriate age groups based on the activity's age range
    const activityAgeStart = initialData?.ageRangeStart || 3;
    const activityAgeEnd = initialData?.ageRangeEnd || 5;

    // Map activity age range to age group IDs
    const materialAgeGroups = ageGroups
      .filter((ag: any) => {
        return (
          ag.ageRangeStart <= activityAgeEnd &&
          ag.ageRangeEnd >= activityAgeStart
        );
      })
      .map((ag: any) => ag.id);

    // Use existing collection ID if provided, otherwise create or get collection for this activity
    let collectionId = existingCollectionId || activityCollectionId;
    console.log("[QuickAdd] In createMaterialFromSuggestion - existingCollectionId:", existingCollectionId, "activityCollectionId:", activityCollectionId, "collectionId:", collectionId);
    if (!collectionId) {
      // Create collection with activity name
      console.log("[QuickAdd] Creating new collection for activity:", activityTitle);
      const collectionResponse = await apiRequest(
        "POST",
        "/api/material-collections",
        {
          name: activityTitle,
          description: `Materials for ${activityTitle} activity`,
        },
      );
      collectionId = collectionResponse.id;
      console.log("[QuickAdd] Created collection with ID:", collectionId);
      setActivityCollectionId(collectionId);
    } else {
      console.log("[QuickAdd] Using existing collection ID:", collectionId);
    }

    // Use the selected location from the activity form
    const locationIds = selectedLocationId ? [selectedLocationId] : [];
    
    if (locationIds.length === 0) {
      throw new Error("No location selected for this activity");
    }

    // Create the material - only include fields that exist in the materials table
    const materialData = {
      name: material.name,
      description:
        material.description ||
        `${material.quantity || "As needed"} - Required for: ${activityTitle}`,
      location: storageLocation,
      locationIds: locationIds, // Only the selected location
      ageGroups: materialAgeGroups, // Note: it's ageGroups not ageGroupIds in the schema
      photoUrl: `/api/materials/images/${material.name.toLowerCase().replace(/\s+/g, "_")}.png`,
    };



    const createdMaterial = await apiRequest(
      "POST",
      "/api/materials",
      materialData,
    );
    console.log("[QuickAdd] Created material with ID:", createdMaterial.id);

    // Add material to collection
    console.log("[QuickAdd] Adding material", createdMaterial.id, "to collection:", collectionId);
    await apiRequest(
      "POST",
      `/api/material-collections/${collectionId}/materials`,
      {
        materialIds: [createdMaterial.id],
      },
    );
    console.log("[QuickAdd] Successfully added material to collection:", collectionId);

    // Add material to selected materials for this activity
    setSelectedMaterials((prev) => [...prev, createdMaterial.id]);
    
    // Track that this material has been added
    const materialKey = `${material.name}-${material.category || "General"}`;
    setAddedMaterials((prev) => new Set(Array.from(prev).concat(materialKey)));

    return { material: createdMaterial, collectionId };
  };

  const handleBatchAddAll = async () => {
    if (!storageLocation.trim()) {
      toast({
        title: "Storage location required",
        description:
          "Please enter a default storage location for all materials",
        variant: "destructive",
      });
      return;
    }

    setProcessingQuickAdd(true);
    try {
      // Add all remaining materials with the same storage location
      const addedMaterials = [];
      let collectionId = activityCollectionId;

      for (const material of remainingMaterials) {
        const result = await createMaterialFromSuggestion(
          material,
          storageLocation,
          collectionId || undefined,
        );
        addedMaterials.push(result.material);
        // Use the collection ID from the first material for all subsequent ones
        if (!collectionId) {
          collectionId = result.collectionId;
        }
      }

      toast({
        title: `${remainingMaterials.length} materials added`,
        description: `All materials have been added to the "${watch("title") || "Activity"}" collection`,
      });

      setQuickAddDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/material-collections"],
      });
    } catch (error) {
      console.error("[QuickAdd] Error adding materials:", error);
      toast({
        title: "Failed to add materials",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setProcessingQuickAdd(false);
    }
  };

  const handleQuickAddSubmit = async () => {
    if (!storageLocation.trim()) {
      toast({
        title: "Storage location required",
        description: "Please enter where this material will be stored",
        variant: "destructive",
      });
      return;
    }

    setProcessingQuickAdd(true);
    try {
      console.log("[QuickAdd] Submitting material with collection ID:", activityCollectionId);
      const result = await createMaterialFromSuggestion(
        currentQuickAddMaterial,
        storageLocation,
        activityCollectionId || undefined,
      );

      // Update the collection ID if it was created for the first material
      if (!activityCollectionId && result.collectionId) {
        console.log("[QuickAdd] Setting collection ID:", result.collectionId);
        setActivityCollectionId(result.collectionId);
      }

      toast({
        title: "Material added",
        description: `${currentQuickAddMaterial.name} has been added to your materials library`,
      });

      // After first material, ask if they want to add ALL remaining materials
      if (remainingMaterials.length > 0 && !batchProcessMode) {
        setBatchProcessMode(true);
        setCurrentQuickAddMaterial(null); // Clear to show batch choice UI
        setStorageLocation(""); // Reset for batch mode
      } else if (batchProcessMode && remainingMaterials.length > 1) {
        // Continue one-by-one processing
        const nextMaterials = remainingMaterials.slice(1);
        setRemainingMaterials(nextMaterials);
        setCurrentQuickAddMaterial(nextMaterials[0]);
        setStorageLocation("");
      } else {
        // All done
        setQuickAddDialogOpen(false);
        queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
        queryClient.invalidateQueries({
          queryKey: ["/api/material-collections"],
        });
        toast({
          title: "All materials added",
          description: `Materials have been added to the "${watch("title") || "Activity"}" collection`,
        });
      }
    } catch (error) {
      toast({
        title: "Failed to add material",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setProcessingQuickAdd(false);
    }
  };

  const onSubmit = (data: any) => {
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
  const materialCategories: string[] = Array.from(
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
  const milestoneCategories: string[] = Array.from(
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
              <Label htmlFor="title">Activity Title {!readOnly && "*"}</Label>
              <Input
                id="title"
                {...register("title")}
                data-testid="input-activity-title"
                disabled={readOnly}
                className={readOnly ? "disabled:opacity-100 disabled:cursor-default" : ""}
              />
              {errors.title && !readOnly && (
                <p className="text-red-500 text-sm">{errors.title.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description {!readOnly && "*"}</Label>
              <Textarea
                id="description"
                {...register("description")}
                className={`min-h-[200px] resize-y ${readOnly ? "disabled:opacity-100 disabled:cursor-default" : ""}`}
                data-testid="textarea-activity-description"
                disabled={readOnly}
              />
              {errors.description && !readOnly && (
                <p className="text-red-500 text-sm">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="category">Category {!readOnly && "*"}</Label>
              <Select
                onValueChange={(value) => setValue("category", value)}
                defaultValue={initialData?.category || activity?.category}
                disabled={readOnly}
              >
                <SelectTrigger data-testid="select-activity-category" disabled={readOnly}>
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
              <Label>Age Groups {!readOnly && "*"}</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                {ageGroups.map((group: any) => (
                  <div key={group.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`age-group-${group.id}`}
                      checked={selectedAgeGroups.includes(group.id)}
                      onCheckedChange={() => toggleAgeGroup(group.id)}
                      data-testid={`checkbox-age-group-${group.id}`}
                      disabled={readOnly}
                    />
                    <label
                      htmlFor={`age-group-${group.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {group.name} ({group.description})
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
              <Label htmlFor="duration">Duration (minutes) {!readOnly && "*"}</Label>
              <Input
                id="duration"
                type="number"
                {...register("duration", { valueAsNumber: true })}
                data-testid="input-activity-duration"
                disabled={readOnly}
              />
              {errors.duration && (
                <p className="text-red-500 text-sm">
                  {errors.duration.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minChildren">Min Children Recommended</Label>
                <Input
                  id="minChildren"
                  type="number"
                  min="1"
                  {...register("minChildren", { valueAsNumber: true })}
                  data-testid="input-min-children"
                  disabled={readOnly}
                />
                {errors.minChildren && !readOnly && (
                  <p className="text-red-500 text-sm">
                    {errors.minChildren.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="maxChildren">Max Children Recommended</Label>
                <Input
                  id="maxChildren"
                  type="number"
                  min="1"
                  {...register("maxChildren", { valueAsNumber: true })}
                  data-testid="input-max-children"
                  disabled={readOnly}
                  className={readOnly ? "disabled:opacity-100 disabled:cursor-default" : ""}
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

        {/* Additional Details (from AI generation or existing activity) */}
        {(initialData || activity) && (
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold text-lg">Additional Details</h3>
              
              {/* Show message if no additional details are available */}
              {!((initialData?.objectives?.length > 0 || activity?.objectives?.length > 0) ||
                 (initialData?.preparationTime || activity?.preparationTime) ||
                 (initialData?.spaceRequired || activity?.spaceRequired) ||
                 (initialData?.groupSize || activity?.groupSize) ||
                 (initialData?.messLevel || activity?.messLevel) ||
                 (initialData?.safetyConsiderations?.length > 0 || activity?.safetyConsiderations?.length > 0) ||
                 (initialData?.variations?.length > 0 || activity?.variations?.length > 0)) && (
                <p className="text-sm text-gray-500 italic">
                  No additional details available. These fields are typically added when generating activities with AI.
                </p>
              )}

              {(initialData?.objectives || activity?.objectives) && (initialData?.objectives?.length > 0 || activity?.objectives?.length > 0) && (
                <div>
                  <Label>Learning Objectives</Label>
                  <div className="space-y-2">
                    {(initialData?.objectives || activity?.objectives || []).map(
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

              {(initialData?.preparationTime || activity?.preparationTime) && (
                <div>
                  <Label>Preparation Time</Label>
                  <p className="text-sm">
                    {initialData?.preparationTime || activity?.preparationTime} minutes
                  </p>
                </div>
              )}

              {(initialData?.spaceRequired || activity?.spaceRequired) && (
                <div>
                  <Label>Space Required</Label>
                  <p className="text-sm">{initialData?.spaceRequired || activity?.spaceRequired}</p>
                </div>
              )}

              {(initialData?.groupSize || activity?.groupSize) && (
                <div>
                  <Label>Group Size</Label>
                  <p className="text-sm">{initialData?.groupSize || activity?.groupSize}</p>
                </div>
              )}

              {(initialData?.messLevel || activity?.messLevel) && (
                <div>
                  <Label>Mess Level</Label>
                  <p className="text-sm">{initialData?.messLevel || activity?.messLevel}</p>
                </div>
              )}

              {((initialData?.safetyConsiderations && initialData.safetyConsiderations.length > 0) ||
                (activity?.safetyConsiderations && activity.safetyConsiderations.length > 0)) && (
                  <div>
                    <Label>Safety Considerations</Label>
                    <div className="space-y-2">
                      {(initialData?.safetyConsiderations || activity?.safetyConsiderations || []).map(
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

              {((initialData?.variations && initialData.variations.length > 0) ||
                (activity?.variations && activity.variations.length > 0)) && (
                <div>
                  <Label>Activity Variations</Label>
                  <div className="space-y-2">
                    {(initialData?.variations || activity?.variations || []).map(
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
        <Card className="md:col-span-2">
          <CardContent className="p-4 space-y-4">
            <h3 className="font-semibold text-lg">Media</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Activity Image</Label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center min-h-[200px] flex flex-col justify-center">
                  {activityImageUrl ? (
                    <div className="relative">
                      <div className="relative group inline-block">
                        <img
                          src={activityImageUrl}
                          alt="Activity"
                          className="max-h-32 rounded cursor-pointer hover:opacity-90 transition-opacity mx-auto"
                          onClick={() => {
                            setExpandedImageUrl(activityImageUrl);
                            setExpandedImageTitle("Activity Image");
                          }}
                        />
                        {!readOnly && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGenerateImage();
                            }}
                            disabled={generatingImage}
                            className="absolute top-1 right-1 bg-white/90 hover:bg-white rounded-full p-1.5 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Regenerate image"
                          >
                            {generatingImage ? (
                              <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                            ) : (
                              <RefreshCw className="h-4 w-4 text-purple-600" />
                            )}
                          </button>
                        )}
                      </div>
                      {!readOnly && (
                        <div className="flex gap-2 justify-center mt-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => imageInputRef.current?.click()}
                            disabled={uploadingImage}
                          >
                            {uploadingImage ? "Uploading..." : "Change Image"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleGenerateImage}
                            disabled={generatingImage}
                            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 hover:from-purple-600 hover:to-pink-600"
                          >
                            {generatingImage ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Generate New
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="text-sm text-gray-500 mt-2 mb-2">No image uploaded</p>
                      {!readOnly && (
                        <div className="flex gap-2 justify-center">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => imageInputRef.current?.click()}
                            disabled={uploadingImage || generatingImage}
                          >
                            {uploadingImage ? "Uploading..." : "Upload"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleGenerateImage}
                            disabled={uploadingImage || generatingImage}
                            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 hover:from-purple-600 hover:to-pink-600"
                          >
                            {generatingImage ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Generate
                              </>
                            )}
                          </Button>
                        </div>
                      )}
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
                <div className="border-2 border-dashed rounded-lg p-4 text-center min-h-[200px] flex flex-col justify-center">
                  {activityVideoUrl ? (
                    <div className="relative">
                      {videoThumbnail ? (
                        <div 
                          className="relative cursor-pointer group"
                          onClick={() => setShowVideoModal(true)}
                        >
                          <img 
                            src={videoThumbnail} 
                            alt="Video thumbnail" 
                            className="w-full h-48 object-cover rounded-lg"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 rounded-lg group-hover:bg-opacity-50 transition-all">
                            <div className="bg-white rounded-full p-3">
                              <svg className="w-8 h-8 text-gray-800" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div 
                          className="cursor-pointer"
                          onClick={() => setShowVideoModal(true)}
                        >
                          <VideoIcon className="mx-auto h-12 w-12 text-green-600" />
                          <p className="text-sm text-gray-600 mt-2">Click to play video</p>
                        </div>
                      )}
                      {!readOnly && (
                        <div className="flex justify-center mt-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              videoInputRef.current?.click();
                            }}
                          >
                            Change Video
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <VideoIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="text-sm text-gray-500 mt-2 mb-2">No video uploaded</p>
                      {!readOnly && (
                        <Button
                          type="button"
                          variant="outline"
                          className="mt-2"
                          onClick={() => videoInputRef.current?.click()}
                          disabled={uploadingVideo}
                        >
                          {uploadingVideo ? "Uploading..." : "Upload Video"}
                        </Button>
                      )}
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
                disabled={readOnly}
              >
                <SelectTrigger
                  className="h-8 text-sm"
                  data-testid="filter-milestone-category"
                  disabled={readOnly}
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
                disabled={readOnly}
              >
                <SelectTrigger
                  className="h-8 text-sm"
                  data-testid="filter-milestone-age-group"
                  disabled={readOnly}
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
              milestoneAgeGroupFilter !== "all") && !readOnly && (
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
                    disabled={readOnly}
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
          {initialData?.suggestedMaterials !== undefined ? (
            initialData.suggestedMaterials.length > 0 ? (
              <div className="border-2 border-dashed border-turquoise/50 rounded-lg p-4 bg-gradient-to-br from-turquoise/5 to-coral-red/5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-coral-red to-turquoise flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-sm">AI Suggested Materials</h4>
                  <span className="text-xs text-gray-500">
                    Materials needed for this activity
                  </span>
                </div>
                <div className="space-y-2">
                  {initialData.suggestedMaterials.map(
                    (material: any, index: number) => {
                      const materialKey = `${material.name}-${material.category || "General"}`;
                      const isAdded = addedMaterials.has(materialKey);
                      const isExisting = material.isExisting;
                      const isSelected = isExisting && selectedMaterials.includes(material.existingMaterialId);
                      
                      return (
                        <div
                          key={index}
                          className={`bg-white rounded-lg p-3 border ${
                            isSelected ? 'border-turquoise bg-turquoise/5' : 
                            isAdded ? 'border-green-400 bg-green-50' : 
                            isExisting ? 'border-blue-300' : 'border-gray-200'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">
                                  {isExisting ? material.existingMaterialName : material.name}
                                </span>
                                <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                                  {isExisting ? material.existingMaterialCategory : (material.category || "General")}
                                </span>
                                {material.quantity && (
                                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                                    Qty: {material.quantity}
                                  </span>
                                )}
                                {isExisting && (
                                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                                    ✓ Already in library
                                  </span>
                                )}
                                {isSelected && (
                                  <span className="text-xs px-2 py-0.5 bg-turquoise text-white rounded-full">
                                    ✓ Selected
                                  </span>
                                )}
                                {isAdded && !isExisting && (
                                  <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                                    ✓ Added to library
                                  </span>
                                )}
                              </div>
                              {material.description && (
                                <p className="text-xs text-gray-600">
                                  {material.description}
                                </p>
                              )}
                              {material.safetyNotes && (
                                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                  <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
                                  Safety: {material.safetyNotes}
                                </p>
                              )}
                            </div>
                            {!readOnly && (
                              <>
                                {isExisting && !isSelected ? (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="ml-2 border-blue-300 text-blue-700 hover:bg-blue-50"
                                    onClick={() => {
                                      // Add to selected materials
                                      const newSelection = [...selectedMaterials, material.existingMaterialId];
                                      setSelectedMaterials(newSelection);
                                      setValue("materialIds", newSelection);
                                    }}
                                  >
                                    <Check className="h-3 w-3 mr-1" />
                                    Select
                                  </Button>
                                ) : isExisting && isSelected ? (
                                  <div className="ml-2 text-turquoise">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  </div>
                                ) : !isAdded ? (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="ml-2"
                                    onClick={() =>
                                      handleQuickAdd(
                                        material,
                                        initialData.suggestedMaterials,
                                      )
                                    }
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Quick Add
                                  </Button>
                                ) : (
                                  <div className="ml-2 text-green-600">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
                <div className="mt-3 p-2 bg-amber-50 rounded-md">
                  <p className="text-xs text-amber-800">
                    💡 <strong>Tip:</strong> Materials already in your library are marked and can be selected directly. 
                    New materials can be added using "Quick Add" to save them to your library.
                  </p>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-sm text-gray-700">No Special Materials Suggested</h4>
                </div>
                <p className="text-sm text-gray-600">
                  This activity uses common classroom supplies that are typically available. 
                  Standard items like paper, crayons, scissors, and glue should suffice.
                </p>
              </div>
            )
          ) : null}

          {/* Materials Filters */}
          <div className="flex gap-3 items-center">
            <div className="flex-1">
              <Select
                value={materialCategoryFilter}
                onValueChange={setMaterialCategoryFilter}
                disabled={readOnly}
              >
                <SelectTrigger
                  className="h-8 text-sm"
                  data-testid="filter-material-category"
                  disabled={readOnly}
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
                disabled={readOnly}
              >
                <SelectTrigger
                  className="h-8 text-sm"
                  data-testid="filter-material-age-group"
                  disabled={readOnly}
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
              materialAgeGroupFilter !== "all") && !readOnly && (
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
                    disabled={readOnly}
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
            {!readOnly && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={handleGenerateAllStepImages}
                  size="sm"
                  variant="outline"
                  disabled={generatingStepImages || instructions.every(inst => !inst.text.trim() || inst.imageUrl)}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 hover:from-purple-600 hover:to-pink-600"
                >
                  {generatingStepImages ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-1" />
                      Generate All Step Images
                    </>
                  )}
                </Button>
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
            )}
          </div>

          {instructions.map((instruction, index) => (
            <div key={index} className="space-y-2 p-3 border rounded-lg">
              <div className="flex gap-2">
                <span className="flex-shrink-0 w-6 h-6 bg-coral-red text-white rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                <div className="flex-1 space-y-2">
                  <Textarea
                    value={instruction.text}
                    onChange={(e) =>
                      updateInstructionText(index, e.target.value)
                    }
                    placeholder="Enter instruction step..."
                    data-testid={`input-instruction-${index}`}
                    className={`min-h-[80px] resize-y ${readOnly ? "disabled:opacity-100 disabled:cursor-default" : ""}`}
                    disabled={readOnly}
                  />

                  {/* Instruction Image Upload */}
                  <div className="flex items-center gap-2">
                    {instruction.imageUrl ? (
                      <div className="flex items-center gap-2">
                        <img
                          src={instruction.imageUrl}
                          alt={`Step ${index + 1}`}
                          className="h-16 w-16 object-cover rounded cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => {
                            setExpandedImageUrl(instruction.imageUrl || null);
                            setExpandedImageTitle(`Step ${index + 1}`);
                          }}
                        />
                        {!readOnly && (
                          <>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                instructionImageRefs.current[index]?.click()
                              }
                            >
                              Upload
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleRegenerateStepImage(index)}
                              disabled={regeneratingStepImage === index}
                            >
                              {regeneratingStepImage === index ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Sparkles className="h-4 w-4" />
                              )}
                              {regeneratingStepImage === index ? "Generating..." : "Generate"}
                            </Button>
                          </>
                        )}
                      </div>
                    ) : !readOnly ? (
                      <>
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
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRegenerateStepImage(index)}
                          disabled={regeneratingStepImage === index || !instruction.text.trim()}
                        >
                          {regeneratingStepImage === index ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4" />
                          )}
                          {regeneratingStepImage === index ? "Generating..." : "Generate"}
                        </Button>
                      </>
                    ) : null}
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
                {instructions.length > 1 && !readOnly && (
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
      {!readOnly && (
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
      )}

      {/* Quick Add Dialog */}
      <Dialog 
        open={quickAddDialogOpen} 
        onOpenChange={(open) => {
          setQuickAddDialogOpen(open);
          // Clean up state when dialog is closed (but keep collection ID for the activity)
          if (!open) {
            setCurrentQuickAddMaterial(null);
            setRemainingMaterials([]);
            setBatchProcessMode(false);
            setStorageLocation("");
            // Don't reset activityCollectionId here - it's valid for the whole activity
          }
        }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {batchProcessMode && remainingMaterials.length > 0
                ? `${remainingMaterials.length} Materials Remaining`
                : "Quick Add Material"}
            </DialogTitle>
            <DialogDescription>
              {batchProcessMode && remainingMaterials.length > 0
                ? "Choose how you'd like to add the remaining materials"
                : `This will create a new material and add it to your library${currentLocation ? ` at ${currentLocation.name}` : ""}.`}
            </DialogDescription>
          </DialogHeader>

          {/* Batch mode choice after first material */}
          {batchProcessMode &&
            remainingMaterials.length > 0 &&
            !currentQuickAddMaterial && (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm font-medium mb-2">
                    You've successfully added the first material!
                  </p>
                  <p className="text-sm text-gray-600">
                    {remainingMaterials.length} material
                    {remainingMaterials.length !== 1 ? "s" : ""} remaining. How
                    would you like to proceed?
                  </p>
                  {currentLocation && (
                    <p className="text-xs text-blue-700 mt-2">
                      Materials will be added to: {currentLocation.name}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="batch-storage-location">
                    Default Storage Location (for all materials)
                  </Label>
                  <Input
                    id="batch-storage-location"
                    placeholder="e.g., Art Cabinet A, Supply Closet 2, etc."
                    value={storageLocation}
                    onChange={(e) => setStorageLocation(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    onClick={handleBatchAddAll}
                    disabled={processingQuickAdd || !storageLocation.trim()}
                    className="w-full"
                  >
                    {processingQuickAdd
                      ? "Adding All..."
                      : `Add All ${remainingMaterials.length} Materials`}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setCurrentQuickAddMaterial(remainingMaterials[0]);
                      setStorageLocation("");
                    }}
                    disabled={processingQuickAdd}
                    className="w-full"
                  >
                    Add One by One
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setQuickAddDialogOpen(false);
                      setBatchProcessMode(false);
                      setRemainingMaterials([]);
                    }}
                    disabled={processingQuickAdd}
                    className="w-full"
                  >
                    Skip Remaining
                  </Button>
                </div>
              </div>
            )}

          {/* Individual material add */}
          {currentQuickAddMaterial && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-md space-y-2">
                <p className="font-medium text-sm">
                  {currentQuickAddMaterial.name}
                </p>
                {currentQuickAddMaterial.description && (
                  <p className="text-xs text-gray-600">
                    {currentQuickAddMaterial.description}
                  </p>
                )}
                <div className="flex gap-2 text-xs">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                    {currentQuickAddMaterial.category || "General Supplies"}
                  </span>
                  {currentQuickAddMaterial.quantity && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                      Qty: {currentQuickAddMaterial.quantity}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="storage-location">Storage Location</Label>
                <Input
                  id="storage-location"
                  placeholder="e.g., Art Cabinet A, Supply Closet 2, etc."
                  value={storageLocation}
                  onChange={(e) => setStorageLocation(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && storageLocation.trim()) {
                      handleQuickAddSubmit();
                    }
                  }}
                />
                <p className="text-xs text-gray-500">
                  Where will this material be stored {currentLocation ? `at ${currentLocation.name}` : "in your facility"}?
                </p>
              </div>

              {batchProcessMode && remainingMaterials.length > 1 && (
                <div className="bg-blue-50 p-3 rounded-md">
                  <p className="text-sm text-blue-800">
                    {remainingMaterials.length - 1} more material
                    {remainingMaterials.length - 1 !== 1 ? "s" : ""} after this
                    one
                  </p>
                </div>
              )}

              <DialogFooter className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setQuickAddDialogOpen(false);
                    setBatchProcessMode(false);
                    setRemainingMaterials([]);
                  }}
                  disabled={processingQuickAdd}
                >
                  {batchProcessMode ? "Skip Remaining" : "Cancel"}
                </Button>
                <Button
                  type="button"
                  onClick={handleQuickAddSubmit}
                  disabled={processingQuickAdd || !storageLocation.trim()}
                >
                  {processingQuickAdd ? "Adding..." : "Add Material"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Expansion Dialog */}
      <Dialog open={!!expandedImageUrl} onOpenChange={(open) => !open && setExpandedImageUrl(null)}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-4 pb-2">
            <DialogTitle>{expandedImageTitle}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto p-4 pt-0 flex items-center justify-center">
            {expandedImageUrl && (
              <img
                src={expandedImageUrl}
                alt="Activity"
                className="max-w-full max-h-full object-contain"
              />
            )}
          </div>
          <DialogFooter className="p-4 pt-2">
            <Button onClick={() => setExpandedImageUrl(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Video Modal */}
      <Dialog open={showVideoModal} onOpenChange={setShowVideoModal}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
          <DialogHeader className="p-4 pb-2">
            <DialogTitle>Activity Video</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto p-4 pt-0 flex items-center justify-center bg-black">
            {activityVideoUrl && (
              <video
                ref={videoRef}
                src={activityVideoUrl}
                controls
                autoPlay
                className="max-w-full max-h-full"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              >
                Your browser does not support the video tag.
              </video>
            )}
          </div>
          <DialogFooter className="p-4 pt-2">
            <Button 
              onClick={() => {
                setShowVideoModal(false);
                if (videoRef.current) {
                  videoRef.current.pause();
                }
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </form>
  );
}
