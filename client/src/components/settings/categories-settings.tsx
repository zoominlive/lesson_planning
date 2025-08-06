import { useState } from "react";
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

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories", selectedLocationId],
    queryFn: selectedLocationId 
      ? () => apiRequest("GET", `/api/categories?locationId=${selectedLocationId}`)
      : undefined,
    enabled: !!selectedLocationId,
  });

  const createMutation = useMutation({
    mutationFn: (data: CategoryFormData) => apiRequest("POST", "/api/categories", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories", selectedLocationId] });
      setIsDialogOpen(false);
      form.reset();
      setSelectedColor("");
      toast({ title: "Category created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create category", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CategoryFormData }) =>
      apiRequest("PUT", `/api/categories/${id}?locationId=${selectedLocationId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories", selectedLocationId] });
      setEditingCategory(null);
      setIsDialogOpen(false);
      form.reset();
      setSelectedColor("");
      toast({ title: "Category updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update category", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/categories/${id}?locationId=${selectedLocationId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories", selectedLocationId] });
      toast({ title: "Category deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete category", variant: "destructive" });
    },
  });

  const handleSubmit = (data: CategoryFormData) => {
    const submissionData = { ...data, color: selectedColor || data.color };
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data: submissionData });
    } else {
      createMutation.mutate(submissionData);
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



  if (isLoading) {
    return <div>Loading categories...</div>;
  }

  // Auto-select first location if none selected
  if (locations.length > 0 && !selectedLocationId) {
    setSelectedLocationId(locations[0].id);
  }

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
          setIsDialogOpen(open);
          if (!open) resetForm();
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
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
                  <Button type="submit" data-testid="button-save-category">
                    {editingCategory ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {categories.map((category) => (
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
        {categories.length === 0 && (
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