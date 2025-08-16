import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { startOfWeek, format, addWeeks } from 'date-fns';
import { Copy, AlertCircle } from 'lucide-react';

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
  currentLocation 
}: CopyLessonPlanModalProps) {
  const { toast } = useToast();
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
  const [targetWeek, setTargetWeek] = useState<string>('');
  
  // Fetch rooms for the current location
  const { data: allRooms = [] } = useQuery<any[]>({
    queryKey: ['/api/rooms'],
    enabled: isOpen && !!currentLocation,
  });
  
  // Filter rooms for current location, excluding the current room
  const availableRooms = allRooms.filter(
    room => room.locationId === currentLocation && room.id !== currentRoom
  );
  
  // Generate available weeks (next 4 weeks)
  const availableWeeks = Array.from({ length: 4 }, (_, i) => {
    const weekDate = addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), i + 1);
    return {
      value: format(weekDate, 'yyyy-MM-dd'),
      label: format(weekDate, 'MMM dd, yyyy'),
    };
  });
  
  // Copy mutation
  const copyMutation = useMutation({
    mutationFn: async () => {
      if (!selectedRooms.length || !targetWeek) {
        throw new Error('Please select at least one room and a week');
      }
      
      return apiRequest('POST', '/api/lesson-plans/copy', {
        sourceLessonPlanId: lessonPlan.id,
        targetRoomIds: selectedRooms,
        targetWeekStart: targetWeek,
      });
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: `Lesson plan copied to ${selectedRooms.length} room(s)`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/lesson-plans'] });
      onClose();
      setSelectedRooms([]);
      setTargetWeek('');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to copy lesson plan',
        variant: 'destructive',
      });
    },
  });
  
  const handleRoomToggle = (roomId: string) => {
    setSelectedRooms(prev => 
      prev.includes(roomId) 
        ? prev.filter(id => id !== roomId)
        : [...prev, roomId]
    );
  };
  
  const handleSelectAllRooms = () => {
    if (selectedRooms.length === availableRooms.length) {
      setSelectedRooms([]);
    } else {
      setSelectedRooms(availableRooms.map(room => room.id));
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
            <Label>Select Week</Label>
            <Select value={targetWeek} onValueChange={setTargetWeek}>
              <SelectTrigger>
                <SelectValue placeholder="Choose target week" />
              </SelectTrigger>
              <SelectContent>
                {availableWeeks.map(week => (
                  <SelectItem key={week.value} value={week.value}>
                    Week of {week.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                  {selectedRooms.length === availableRooms.length ? 'Deselect All' : 'Select All'}
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
                {availableRooms.map(room => (
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
          
          {selectedRooms.length > 0 && targetWeek && (
            <Alert>
              <AlertDescription>
                This will copy the lesson plan to {selectedRooms.length} room(s) for the week of{' '}
                {availableWeeks.find(w => w.value === targetWeek)?.label}
              </AlertDescription>
            </Alert>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={() => copyMutation.mutate()}
            disabled={!selectedRooms.length || !targetWeek || copyMutation.isPending}
          >
            {copyMutation.isPending ? 'Copying...' : 'Copy Lesson Plan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}