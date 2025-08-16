import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2, Tag, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
  locationId: z.string().min(1, "Location is required"),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Please enter a valid hex color").optional(),
  isActive: z.boolean().default(true),
});

type CategoryFormData = z.infer<typeof categorySchema>;
type Category = CategoryFormData & { id: string; createdAt: string; tenantId: string };
type Location = { id: string; name: string; description?: string };



const defaultColors = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", 
  "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899"
];

export function CategoriesSettings() {
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
      locationId: "",
      color: "",
      isActive: true,
    },
  });

  const { data: locations = [] } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });

  // Auto-select Main Campus when locations are loaded
  useEffect(() => {
    if (locations.length > 0 && !selectedLocationId) {
      const mainCampus = locations.find(loc => loc.name === "Main Campus") || locations[0];
      console.log("Auto-selecting location:", mainCampus.name, mainCampus.id);
      setSelectedLocationId(mainCampus.id);
    }
  }, [locations, selectedLocationId]);

  const { data: categories = [], isLoading, error } = useQuery<Category[]>({
    queryKey: ["/api/categories", selectedLocationId],
    queryFn: selectedLocationId 
      ? async () => {
          const data = await apiRequest("GET", `/api/categories?locationId=${selectedLocationId}`);
          return data;
        }
      : undefined,
    enabled: !!selectedLocationId,
  });

  // Debug log for categories data
  useEffect(() => {
    console.log("Categories data:", categories);
    console.log("Categories type:", typeof categories);
    console.log("Is array:", Array.isArray(categories));
    console.log("Selected location ID:", selectedLocationId);
    console.log("Is loading:", isLoading);
    console.log("Error:", error);
  }, [categories, selectedLocationId, isLoading, error]);

  const createMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      const response = await apiRequest("POST", "/api/categories", data);
      return response; // apiRequest already returns parsed JSON
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories", selectedLocationId] });
      setIsDialogOpen(false);
      form.reset();
      setSelectedColor("");
      toast({ title: "Category created successfully" });
    },
    onError: (error) => {
      console.error("Failed to create category:", error);
      toast({ title: "Failed to create category", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CategoryFormData }) => {
      const response = await apiRequest("PUT", `/api/categories/${id}?locationId=${selectedLocationId}`, data);
      return response; // apiRequest already returns parsed JSON
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories", selectedLocationId] });
      setEditingCategory(null);
      setIsDialogOpen(false);
      form.reset();
      setSelectedColor("");
      toast({ title: "Category updated successfully" });
    },
    onError: (error) => {
      console.error("Failed to update category:", error);
      toast({ title: "Failed to update category", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/categories/${id}?locationId=${selectedLocationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories", selectedLocationId] });
      toast({ title: "Category deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete category", variant: "destructive" });
    },
  });

  const handleSubmit = async (data: CategoryFormData) => {
    try {
      console.log("Form submitted with data:", data);
      const submissionData = { 
        ...data, 
        locationId: selectedLocationId,
        color: selectedColor || data.color 
      };
      console.log("Final submission data:", submissionData);
      
      if (editingCategory) {
        updateMutation.mutate({ id: editingCategory.id, data: submissionData });
      } else {
        createMutation.mutate(submissionData);
      }
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      toast({ 
        title: "An error occurred", 
        description: "Please check the console for details",
        variant: "destructive" 
      });
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setSelectedColor(category.color || "");
    form.reset({
      name: category.name,
      description: category.description || "",
      locationId: category.locationId,
      color: category.color || "",
      isActive: category.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const resetForm = () => {
    setEditingCategory(null);
    setSelectedColor("");
    form.reset({
      name: "",
      description: "",
      locationId: selectedLocationId,
      color: "",
      isActive: true,
    });
  };



  // Show loading state if no location selected
  if (!selectedLocationId) {
    return <div>Loading locations and categories...</div>;
  }

  // Show loading state while fetching categories
  if (isLoading) {
    return <div>Loading categories...</div>;
  }

  // Show error state if query failed
  if (error) {
    return <div>Error loading categories. Please try again.</div>;
  }

  // Ensure categories is always an array
  const categoryList = Array.isArray(categories) ? categories : [];

  return (
    <div className="space-y-4">
      {/* Location Selector */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <MapPin className="h-5 w-5 text-muted-foreground" />
          <div className="flex-1">
            <label className="text-sm font-medium">Select Location</label>
            <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Choose a location to manage categories" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">
          Categories {selectedLocationId && locations.find(l => l.id === selectedLocationId)?.name && 
          `for ${locations.find(l => l.id === selectedLocationId)?.name}`}
        </h3>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          console.log("[Categories] Dialog open state changed to:", open);
          setIsDialogOpen(open);
          if (!open) {
            console.log("[Categories] Dialog closing, resetting form");
            resetForm();
          } else {
            console.log("[Categories] Dialog opened");
            console.log("[Categories] Current form state:", form.getValues());
            console.log("[Categories] Selected location ID:", selectedLocationId);
          }
        }}>
          <DialogTrigger asChild>
            <Button 
              data-testid="button-add-category"
              disabled={!selectedLocationId}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCategory ? "Edit Category" : "Add Category"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={(e) => {
                console.log("[Categories] Form submit event triggered");
                console.log("[Categories] Form is valid:", form.formState.isValid);
                console.log("[Categories] Form errors:", form.formState.errors);
                console.log("[Categories] Form values:", form.getValues());
                form.handleSubmit(handleSubmit)(e);
              }} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Category name" {...field} data-testid="input-category-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="locationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-category-location">
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {locations.map((location) => (
                            <SelectItem key={location.id} value={location.id}>
                              {location.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Optional description" {...field} data-testid="input-category-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="space-y-2">
                  <FormLabel>Color (optional)</FormLabel>
                  <div className="flex gap-2 flex-wrap">
                    {defaultColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-8 h-8 rounded border-2 ${selectedColor === color ? 'border-gray-900' : 'border-gray-300'}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setSelectedColor(color)}
                        data-testid={`button-color-${color}`}
                      />
                    ))}
                  </div>
                  <Input
                    placeholder="#000000"
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    data-testid="input-category-color"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} data-testid="button-cancel">
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    data-testid="button-save-category"
                    onClick={(e) => {
                      console.log("[Categories] Create/Update button clicked");
                      console.log("[Categories] Button event type:", e.type);
                      console.log("[Categories] Is form submitting:", form.formState.isSubmitting);
                      console.log("[Categories] Form validation errors:", form.formState.errors);
                      console.log("[Categories] Form isDirty:", form.formState.isDirty);
                      console.log("[Categories] Current form values:", form.getValues());
                      // Don't prevent default - let form submission handle it
                    }}
                  >
                    {editingCategory ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {categoryList.map((category) => (
          <Card key={category.id} data-testid={`card-category-${category.id}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                <span data-testid={`text-category-name-${category.id}`}>{category.name}</span>
                {category.color && (
                  <div 
                    className="w-4 h-4 rounded border" 
                    style={{ backgroundColor: category.color }}
                    data-testid={`color-indicator-${category.id}`}
                  />
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(category)}
                  data-testid={`button-edit-category-${category.id}`}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" data-testid={`button-delete-category-${category.id}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Category</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{category.name}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(category.id)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardHeader>
            {category.description && (
              <CardContent>
                <p className="text-muted-foreground" data-testid={`text-category-description-${category.id}`}>
                  {category.description}
                </p>
              </CardContent>
            )}
          </Card>
        ))}
        {categoryList.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No categories found. Create your first category to get started.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}