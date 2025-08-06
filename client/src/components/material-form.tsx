import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { insertMaterialSchema, type Material } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";

interface MaterialFormProps {
  material?: Material;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function MaterialForm({ material, onSuccess, onCancel }: MaterialFormProps) {
  const { register, handleSubmit, formState: { errors }, setValue } = useForm({
    resolver: zodResolver(insertMaterialSchema),
    defaultValues: {
      name: material?.name || "",
      description: material?.description || "",
      category: material?.category || "",
      quantity: material?.quantity || 1,
      location: material?.location || "",
      status: material?.status || "in_stock",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create material");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      onSuccess();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/materials/${material!.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update material");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      onSuccess();
    },
  });

  const onSubmit = (data: any) => {
    if (material) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
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
        <Label htmlFor="category">Category *</Label>
        <Select onValueChange={(value) => setValue("category", value)} defaultValue={material?.category}>
          <SelectTrigger data-testid="select-material-category">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Art Supplies">Art Supplies</SelectItem>
            <SelectItem value="Building Materials">Building Materials</SelectItem>
            <SelectItem value="Books & Reading">Books & Reading</SelectItem>
            <SelectItem value="Science & Nature">Science & Nature</SelectItem>
            <SelectItem value="Music & Movement">Music & Movement</SelectItem>
            <SelectItem value="Dramatic Play">Dramatic Play</SelectItem>
          </SelectContent>
        </Select>
        {errors.category && <p className="text-red-500 text-sm">{errors.category.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
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
          <Label htmlFor="status">Status *</Label>
          <Select onValueChange={(value) => setValue("status", value)} defaultValue={material?.status || "in_stock"}>
            <SelectTrigger data-testid="select-material-status">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="in_stock">In Stock</SelectItem>
              <SelectItem value="low_stock">Low Stock</SelectItem>
              <SelectItem value="out_of_stock">Out of Stock</SelectItem>
              <SelectItem value="on_order">On Order</SelectItem>
            </SelectContent>
          </Select>
          {errors.status && <p className="text-red-500 text-sm">{errors.status.message}</p>}
        </div>
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
