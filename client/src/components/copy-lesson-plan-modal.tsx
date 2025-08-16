import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { startOfWeek, format, isAfter, isSameWeek } from "date-fns";
import { Copy, AlertCircle, CalendarIcon, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface CopyLessonPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessonPlan: any;
  currentRoom: string;
  currentLocation: string;
}

export function CopyLessonPlanModal({
  isOpen,
  onClose,
  lessonPlan,
  currentRoom,
  currentLocation,
}: CopyLessonPlanModalProps) {
  const { toast } = useToast();
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
  const [selectedWeeks, setSelectedWeeks] = useState<Date[]>([]);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [showOverwriteDialog, setShowOverwriteDialog] = useState(false);
  const [existingPlans, setExistingPlans] = useState<any[]>([]);
  const [pendingCopy, setPendingCopy] = useState<any>(null);

  // Fetch rooms for the current location
  const { data: allRooms = [] } = useQuery<any[]>({
    queryKey: ["/api/rooms"],
    enabled: isOpen && !!currentLocation,
  });

  // Filter rooms for current location, excluding the current room
  const availableRooms = allRooms.filter(
    (room) => room.locationId === currentLocation && room.id !== currentRoom,
  );

  // Check for existing lesson plans
  const checkExistingPlans = async () => {
    if (!selectedRooms.length || !selectedWeeks.length) return;

    try {
      const results = await apiRequest(
        "POST",
        "/api/lesson-plans/check-existing",
        {
          roomIds: selectedRooms,
          weekStarts: selectedWeeks.map((week) => format(week, "yyyy-MM-dd")),
        },
      );

      if (results.existingPlans && results.existingPlans.length > 0) {
        setExistingPlans(results.existingPlans);
        setPendingCopy({
          sourceLessonPlanId: lessonPlan.id,
          targetRoomIds: selectedRooms,
          targetWeekStarts: selectedWeeks.map((week) =>
            format(week, "yyyy-MM-dd"),
          ),
          overwrite: true,
        });
        setShowOverwriteDialog(true);
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error checking existing plans:", error);
      return true; // Proceed if check fails
    }
  };

  // Copy mutation
  const copyMutation = useMutation({
    mutationFn: async (params?: any) => {
      const copyParams = params || {
        sourceLessonPlanId: lessonPlan.id,
        targetRoomIds: selectedRooms,
        targetWeekStarts: selectedWeeks.map((week) =>
          format(week, "yyyy-MM-dd"),
        ),
        overwrite: false,
      };

      if (
        !copyParams.targetRoomIds.length ||
        !copyParams.targetWeekStarts.length
      ) {
        throw new Error("Please select at least one room and one week");
      }

      return apiRequest("POST", "/api/lesson-plans/copy", copyParams);
    },
    onSuccess: (data) => {
      const totalCopied = selectedRooms.length * selectedWeeks.length;
      toast({
        title: "Success",
        description: `Lesson plan copied to ${totalCopied} room(s)`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/lesson-plans"] });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to copy lesson plan",
        variant: "destructive",
      });
    },
  });

  const handleRoomToggle = (roomId: string) => {
    setSelectedRooms((prev) =>
      prev.includes(roomId)
        ? prev.filter((id) => id !== roomId)
        : [...prev, roomId],
    );
  };

  const handleSelectAllRooms = () => {
    if (selectedRooms.length === availableRooms.length) {
      setSelectedRooms([]);
    } else {
      setSelectedRooms(availableRooms.map((room) => room.id));
    }
  };

  const toggleWeek = (date: Date) => {
    const clickedWeekStart = startOfWeek(date, { weekStartsOn: 1 });
    const clickedWeekKey = format(clickedWeekStart, "yyyy-MM-dd");

    setSelectedWeeks((prev) => {
      const prevWeekKeys = prev.map((w) =>
        format(startOfWeek(w, { weekStartsOn: 1 }), "yyyy-MM-dd"),
      );
      const isSelected = prevWeekKeys.includes(clickedWeekKey);

      if (isSelected) {
        // Remove the week
        return prev.filter((week) => {
          const weekKey = format(
            startOfWeek(week, { weekStartsOn: 1 }),
            "yyyy-MM-dd",
          );
          return weekKey !== clickedWeekKey;
        });
      } else {
        // Add the week
        return [...prev, clickedWeekStart];
      }
    });
  };

  const handleCopy = async () => {
    const canProceed = await checkExistingPlans();
    if (canProceed) {
      copyMutation.mutate(undefined);
    }
  };

  const handleOverwriteConfirm = () => {
    setShowOverwriteDialog(false);
    if (pendingCopy) {
      copyMutation.mutate(pendingCopy);
    }
  };

  const handleClose = () => {
    setSelectedRooms([]);
    setSelectedWeeks([]);
    setExistingPlans([]);
    setPendingCopy(null);
    onClose();
  };

  const isDateDisabled = (date: Date) => {
    const weekStart = startOfWeek(date, { weekStartsOn: 1 });
    const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    return !isAfter(weekStart, currentWeekStart);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Copy className="h-5 w-5" />
              Copy Lesson Plan
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Week Selection */}
            <div className="space-y-2">
              <Label>Select Weeks (Click to select multiple)</Label>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedWeeks.length && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedWeeks.length > 0
                      ? `${selectedWeeks.length} week(s) selected`
                      : "Select weeks to copy to"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-3 space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Click any weekday to select/deselect that week
                    </p>
                    <Calendar
                      mode="single"
                      selected={undefined}
                      onSelect={(date) => {
                        // Handle date selection
                        if (date) {
                          toggleWeek(date);
                        }
                      }}
                      disabled={isDateDisabled}
                      modifiers={{
                        weekSelected: (date) => {
                          // Only highlight Monday through Friday
                          const dayOfWeek = date.getDay();
                          if (dayOfWeek === 0 || dayOfWeek === 6) {
                            return false; // Don't highlight weekends
                          }

                          const weekStart = startOfWeek(date, {
                            weekStartsOn: 1,
                          });
                          const weekString = format(weekStart, "yyyy-MM-dd");
                          return selectedWeeks.some((week) => {
                            const selectedWeekString = format(
                              startOfWeek(week, { weekStartsOn: 1 }),
                              "yyyy-MM-dd",
                            );
                            return selectedWeekString === weekString;
                          });
                        },
                      }}
                      modifiersStyles={{
                        weekSelected: {
                          backgroundColor: "hsl(var(--primary))",
                          color: "hsl(var(--primary-foreground))",
                          fontWeight: "bold",
                          borderRadius: "4px",
                        },
                      }}
                      className="rounded-md border"
                      initialFocus
                    />
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Room Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Select Rooms</Label>
                {availableRooms.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAllRooms}
                  >
                    {selectedRooms.length === availableRooms.length
                      ? "Deselect All"
                      : "Select All"}
                  </Button>
                )}
              </div>

              {availableRooms.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No other rooms available at this location
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
                  {availableRooms.map((room) => (
                    <label
                      key={room.id}
                      className="flex items-center space-x-2 cursor-pointer hover:bg-accent p-2 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={selectedRooms.includes(room.id)}
                        onChange={() => handleRoomToggle(room.id)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm font-medium">{room.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {selectedRooms.length > 0 && selectedWeeks.length > 0 && (
              <Alert>
                <AlertDescription>
                  This will copy the lesson plan to {selectedRooms.length}{" "}
                  room(s) for {selectedWeeks.length} week(s). Total:{" "}
                  {selectedRooms.length * selectedWeeks.length} lesson plan(s)
                  will be created.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleCopy}
              disabled={
                !selectedRooms.length ||
                !selectedWeeks.length ||
                copyMutation.isPending
              }
            >
              {copyMutation.isPending ? "Copying..." : "Copy Lesson Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Overwrite Confirmation Dialog */}
      <AlertDialog
        open={showOverwriteDialog}
        onOpenChange={setShowOverwriteDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Overwrite Existing Lesson Plans?
            </AlertDialogTitle>
            <AlertDialogDescription>
              The following lesson plans already exist and will be permanently
              overwritten:
              <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                {existingPlans.map((plan, idx) => {
                  // Parse the date string as local date to avoid timezone issues
                  const [year, month, day] = plan.weekStart.split(/[-T]/);
                  const weekDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                  const weekStart = startOfWeek(weekDate, { weekStartsOn: 1 });
                  return (
                    <div key={idx} className="text-sm">
                      • {plan.roomName} - Week of{" "}
                      {format(weekStart, "MMM dd, yyyy")}
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 font-semibold">
                This action cannot be undone. Are you sure you want to continue?
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowOverwriteDialog(false);
                setPendingCopy(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleOverwriteConfirm}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Overwrite Existing Plans
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
