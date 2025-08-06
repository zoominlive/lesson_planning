import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2, Users, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const ageGroupSchema = z.object({
  name: z.string().min(1, "Age group name is required"),
  description: z.string().optional(),
  ageRangeStart: z.number().min(0, "Age range start must be 0 or greater"),
  ageRangeEnd: z.number().min(0, "Age range end must be 0 or greater"),
  isActive: z.boolean().default(true),
}).refine(data => data.ageRangeEnd >= data.ageRangeStart, {
  message: "End age must be greater than or equal to start age",
  path: ["ageRangeEnd"],
});

type AgeGroupFormData = z.infer<typeof ageGroupSchema>;
type AgeGroup = AgeGroupFormData & { id: string; createdAt: string; tenantId: string };

export function AgeGroupsSettings() {
  const [editingAgeGroup, setEditingAgeGroup] = useState<AgeGroup | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<AgeGroupFormData>({
    resolver: zodResolver(ageGroupSchema),
    defaultValues: {
      name: "",
      description: "",
      ageRangeStart: 0,
      ageRangeEnd: 12,
      isActive: true,
    },
  });

  const { data: ageGroups = [], isLoading } = useQuery<AgeGroup[]>({
    queryKey: ["/api/age-groups"],
  });

  const createMutation = useMutation({
    mutationFn: (data: AgeGroupFormData) => 
      fetch("/api/age-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(res => {
        if (!res.ok) throw new Error('Failed to create age group');
        return res.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/age-groups"] });
      setIsDialogOpen(false);
      form.reset();
      toast({ title: "Age group created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: `Failed to create age group: ${error.message}`, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AgeGroupFormData }) =>
      fetch(`/api/age-groups/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(res => {
        if (!res.ok) throw new Error('Failed to update age group');
        return res.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/age-groups"] });
      setEditingAgeGroup(null);
      setIsDialogOpen(false);
      form.reset();
      toast({ title: "Age group updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update age group", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => 
      fetch(`/api/age-groups/${id}`, {
        method: "DELETE",
      }).then(res => {
        if (!res.ok) throw new Error('Failed to delete age group');
        return res.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/age-groups"] });
      toast({ title: "Age group deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete age group", variant: "destructive" });
    },
  });

  const handleSubmit = (data: AgeGroupFormData) => {
    if (editingAgeGroup) {
      updateMutation.mutate({ id: editingAgeGroup.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (ageGroup: AgeGroup) => {
    setEditingAgeGroup(ageGroup);
    form.reset({
      name: ageGroup.name,
      description: ageGroup.description || "",
      ageRangeStart: ageGroup.ageRangeStart,
      ageRangeEnd: ageGroup.ageRangeEnd,
      isActive: ageGroup.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const resetForm = () => {
    setEditingAgeGroup(null);
    form.reset({
      name: "",
      description: "",
      ageRangeStart: 0,
      ageRangeEnd: 12,
      isActive: true,
    });
  };

  const formatAgeRange = (start: number, end: number) => {
    const formatAge = (months: number) => {
      if (months < 12) return `${months}m`;
      const years = Math.floor(months / 12);
      const remainingMonths = months % 12;
      if (remainingMonths === 0) return `${years}y`;
      return `${years}y ${remainingMonths}m`;
    };
    
    return `${formatAge(start)} - ${formatAge(end)}`;
  };

  if (isLoading) {
    return <div>Loading age groups...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Age Groups</h3>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-age-group">
              <Plus className="h-4 w-4 mr-2" />
              Add Age Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingAgeGroup ? "Edit Age Group" : "Add Age Group"}</DialogTitle>
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
                        <Input placeholder="Age group name" {...field} data-testid="input-age-group-name" />
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
                        <Textarea placeholder="Optional description" {...field} data-testid="input-age-group-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="ageRangeStart"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Age (months)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Start age" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            data-testid="input-age-group-start"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="ageRangeEnd"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Age (months)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="End age" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            data-testid="input-age-group-end"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} data-testid="button-cancel">
                    Cancel
                  </Button>
                  <Button type="submit" data-testid="button-save-age-group">
                    {editingAgeGroup ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {ageGroups.map((ageGroup) => (
          <Card key={ageGroup.id} data-testid={`card-age-group-${ageGroup.id}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span data-testid={`text-age-group-name-${ageGroup.id}`}>{ageGroup.name}</span>
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="flex items-center gap-1" data-testid={`badge-age-range-${ageGroup.id}`}>
                  <Calendar className="h-3 w-3" />
                  {formatAgeRange(ageGroup.ageRangeStart, ageGroup.ageRangeEnd)}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(ageGroup)}
                  data-testid={`button-edit-age-group-${ageGroup.id}`}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" data-testid={`button-delete-age-group-${ageGroup.id}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Age Group</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{ageGroup.name}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(ageGroup.id)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardHeader>
            {ageGroup.description && (
              <CardContent>
                <p className="text-muted-foreground" data-testid={`text-age-group-description-${ageGroup.id}`}>
                  {ageGroup.description}
                </p>
              </CardContent>
            )}
          </Card>
        ))}
        {ageGroups.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No age groups found. Create your first age group to get started.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}