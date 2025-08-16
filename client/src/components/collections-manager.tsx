import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, FolderOpen } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function CollectionsManager() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<any>(null);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDescription, setNewCollectionDescription] = useState("");

  // Fetch all collections
  const { data: collections = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/material-collections"],
  });

  // Create collection mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/material-collections", {
        name: newCollectionName,
        description: newCollectionDescription,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/material-collections"] });
      setIsCreateDialogOpen(false);
      setNewCollectionName("");
      setNewCollectionDescription("");
      toast({ title: "Collection created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create collection", variant: "destructive" });
    },
  });

  // Update collection mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, name, description }: any) => {
      return apiRequest("PUT", `/api/material-collections/${id}`, {
        name,
        description,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/material-collections"] });
      setEditingCollection(null);
      toast({ title: "Collection updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update collection", variant: "destructive" });
    },
  });

  // Delete collection mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/material-collections/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/material-collections"] });
      toast({ title: "Collection deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete collection", variant: "destructive" });
    },
  });

  const handleCreate = () => {
    if (!newCollectionName.trim()) {
      toast({ title: "Collection name is required", variant: "destructive" });
      return;
    }
    createMutation.mutate();
  };

  const handleUpdate = () => {
    if (!editingCollection.name.trim()) {
      toast({ title: "Collection name is required", variant: "destructive" });
      return;
    }
    updateMutation.mutate({
      id: editingCollection.id,
      name: editingCollection.name,
      description: editingCollection.description,
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this collection? Materials will not be deleted.")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Material Collections
            </CardTitle>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-gradient-to-r from-purple-600 to-purple-700 text-white"
              data-testid="button-create-collection"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Collection
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading collections...</div>
          ) : collections.length === 0 ? (
            <div className="text-center py-8">
              <FolderOpen className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <p className="text-gray-500">No collections yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Create collections to organize your materials
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {collections.map((collection: any) => (
                <div
                  key={collection.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <h3 className="font-medium">{collection.name}</h3>
                    {collection.description && (
                      <p className="text-sm text-gray-600 mt-1">{collection.description}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      {collection.materialCount || 0} materials
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingCollection({ ...collection })}
                      data-testid={`button-edit-collection-${collection.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(collection.id)}
                      data-testid={`button-delete-collection-${collection.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Collection Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Collection</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="collection-name">Collection Name *</Label>
              <Input
                id="collection-name"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder="e.g., Sensory Materials, Art Supplies..."
                data-testid="input-collection-name"
              />
            </div>
            <div>
              <Label htmlFor="collection-description">Description</Label>
              <Textarea
                id="collection-description"
                value={newCollectionDescription}
                onChange={(e) => setNewCollectionDescription(e.target.value)}
                placeholder="Describe what materials belong in this collection..."
                rows={3}
                data-testid="textarea-collection-description"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                data-testid="button-cancel-create"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={createMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700 text-white"
                data-testid="button-save-collection"
              >
                {createMutation.isPending ? "Creating..." : "Create Collection"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Collection Dialog */}
      {editingCollection && (
        <Dialog open={!!editingCollection} onOpenChange={() => setEditingCollection(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Collection</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-collection-name">Collection Name *</Label>
                <Input
                  id="edit-collection-name"
                  value={editingCollection.name}
                  onChange={(e) =>
                    setEditingCollection({ ...editingCollection, name: e.target.value })
                  }
                  data-testid="input-edit-collection-name"
                />
              </div>
              <div>
                <Label htmlFor="edit-collection-description">Description</Label>
                <Textarea
                  id="edit-collection-description"
                  value={editingCollection.description || ""}
                  onChange={(e) =>
                    setEditingCollection({ ...editingCollection, description: e.target.value })
                  }
                  rows={3}
                  data-testid="textarea-edit-collection-description"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setEditingCollection(null)}
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdate}
                  disabled={updateMutation.isPending}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  data-testid="button-update-collection"
                >
                  {updateMutation.isPending ? "Updating..." : "Update Collection"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}