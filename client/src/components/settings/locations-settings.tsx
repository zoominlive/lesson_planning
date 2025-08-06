import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const locationSchema = z.object({
  name: z.string().min(1, "Location name is required"),
  description: z.string().optional(),
  address: z.string().optional(),
  capacity: z.number().min(1).optional(),
  isActive: z.boolean().default(true),
});

type LocationFormData = z.infer<typeof locationSchema>;
type Location = LocationFormData & { id: string; createdAt: string; tenantId: string };

export function LocationsSettings() {
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<LocationFormData>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      name: "",
      description: "",
      address: "",
      capacity: undefined,
      isActive: true,
    },
  });

  const { data: locations = [], isLoading } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });

  const createMutation = useMutation({
    mutationFn: (data: LocationFormData) => apiRequest("POST", "/api/locations", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
      setIsDialogOpen(false);
      form.reset();
      toast({ title: "Location created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create location", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: LocationFormData }) =>
      apiRequest("PUT", `/api/locations/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
      setEditingLocation(null);
      setIsDialogOpen(false);
      form.reset();
      toast({ title: "Location updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update location", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/locations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
      toast({ title: "Location deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete location", variant: "destructive" });
    },
  });

  const handleSubmit = (data: LocationFormData) => {
    // Add tenantId to the data for proper multi-tenant support
    const dataWithTenant = {
      ...data,
      tenantId: "7cb6c28d-164c-49fa-b461-dfc47a8a3fed" // This should come from auth context in production
    };
    
    if (editingLocation) {
      updateMutation.mutate({ id: editingLocation.id, data: dataWithTenant });
    } else {
      createMutation.mutate(dataWithTenant);
    }
  };

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    form.reset({
      name: location.name,
      description: location.description || "",
      address: location.address || "",
      capacity: location.capacity || undefined,
      isActive: location.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const resetForm = () => {
    setEditingLocation(null);
    form.reset({
      name: "",
      description: "",
      address: "",
      capacity: undefined,
      isActive: true,
    });
  };

  if (isLoading) {
    return <div>Loading locations...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Locations</h3>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-location">
              <Plus className="h-4 w-4 mr-2" />
              Add Location
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingLocation ? "Edit Location" : "Add Location"}</DialogTitle>
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
                        <Input placeholder="Location name" {...field} data-testid="input-location-name" />
                      </FormControl>
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
                        <Textarea placeholder="Optional description" {...field} data-testid="input-location-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Optional address" {...field} data-testid="input-location-address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacity</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Optional capacity" 
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          data-testid="input-location-capacity"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} data-testid="button-cancel">
                    Cancel
                  </Button>
                  <Button type="submit" data-testid="button-save-location">
                    {editingLocation ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {locations.map((location) => (
          <Card key={location.id} data-testid={`card-location-${location.id}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span data-testid={`text-location-name-${location.id}`}>{location.name}</span>
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(location)}
                  data-testid={`button-edit-location-${location.id}`}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" data-testid={`button-delete-location-${location.id}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Location</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{location.name}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(location.id)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardHeader>
            <CardContent>
              {location.description && (
                <p className="text-muted-foreground mb-2" data-testid={`text-location-description-${location.id}`}>
                  {location.description}
                </p>
              )}
              {location.address && (
                <p className="text-sm text-muted-foreground mb-2" data-testid={`text-location-address-${location.id}`}>
                  📍 {location.address}
                </p>
              )}
              {location.capacity && (
                <p className="text-sm text-muted-foreground" data-testid={`text-location-capacity-${location.id}`}>
                  Capacity: {location.capacity}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
        {locations.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No locations found. Create your first location to get started.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}