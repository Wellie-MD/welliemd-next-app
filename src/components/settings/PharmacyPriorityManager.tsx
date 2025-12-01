import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GripVertical, Save, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axiosInstance from "@/api/axiosInstance";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Pharmacy {
  id: string;
  pharmacy_id: string;
  pharmacy_name: string;
  service_states: string[];
  priority: number;
  is_active: boolean;
}

interface PharmacyPriorityManagerProps {
  clientId: string;
}

export function PharmacyPriorityManager({ clientId }: PharmacyPriorityManagerProps) {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPharmacies();
  }, [clientId]);

  const fetchPharmacies = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/clients/${clientId}/pharmacies/`);
      setPharmacies(response.data.pharmacies || []);
    } catch (error) {
      console.error("Failed to fetch pharmacies:", error);
      toast({
        title: "Error",
        description: "Failed to load pharmacies",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(pharmacies);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update priorities based on new order
    const updatedItems = items.map((item, index) => ({
      ...item,
      priority: index + 1,
    }));

    setPharmacies(updatedItems);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        pharmacies: pharmacies.map((p) => ({
          pharmacy_id: p.pharmacy_id,
          priority: p.priority,
        })),
      };

      await axiosInstance.post(`/clients/${clientId}/pharmacies/priorities/`, payload);

      toast({
        title: "Success",
        description: "Pharmacy priorities updated successfully",
      });
    } catch (error) {
      console.error("Failed to save priorities:", error);
      toast({
        title: "Error",
        description: "Failed to save pharmacy priorities",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getPriorityBadge = (priority: number) => {
    if (priority <= 3) {
      return <Badge className="bg-green-500">⭐ Priority {priority}</Badge>;
    } else if (priority <= 10) {
      return <Badge className="bg-orange-500">🔸 Priority {priority}</Badge>;
    } else {
      return <Badge variant="secondary">◽ Priority {priority}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading pharmacies...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Pharmacy Priority</CardTitle>
            <CardDescription>
              Drag to reorder. Higher pharmacies are preferred when multiple options are available.
            </CardDescription>
          </div>
          <Button onClick={handleSave} disabled={saving || pharmacies.length === 0} size="sm">
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Priority Order"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            These pharmacies are automatically derived from your assigned products. 
            When multiple pharmacies serve the same state, the one with the highest priority (lowest number) will be selected.
          </AlertDescription>
        </Alert>

        {pharmacies.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No pharmacies available. Pharmacies are automatically added when products are assigned to your account.
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="pharmacies">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                  {pharmacies.map((pharmacy, index) => (
                    <Draggable key={pharmacy.id} draggableId={pharmacy.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`flex items-center gap-3 p-4 bg-white border rounded-lg transition-shadow ${
                            snapshot.isDragging ? "shadow-lg" : ""
                          }`}
                        >
                          <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                            <GripVertical className="h-5 w-5 text-gray-400" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {getPriorityBadge(pharmacy.priority)}
                              <h3 className="font-semibold">{pharmacy.pharmacy_name}</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Serves: {pharmacy.service_states.join(", ")}
                            </p>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </CardContent>
    </Card>
  );
}
