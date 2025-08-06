import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Send } from "lucide-react";

interface CalendarControlsProps {
  currentWeek: string;
  selectedRoom: string;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onRoomChange: (room: string) => void;
  onSubmitToSupervisor: () => void;
}

export function CalendarControls({ 
  currentWeek, 
  selectedRoom, 
  onPreviousWeek, 
  onNextWeek, 
  onRoomChange, 
  onSubmitToSupervisor 
}: CalendarControlsProps) {
  return (
    <Card className="material-shadow">
      <CardContent className="p-6">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="icon"
              onClick={onPreviousWeek}
              data-testid="button-previous-week"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-center">
              <h2 className="text-xl font-bold text-charcoal" data-testid="current-week">
                {currentWeek}
              </h2>
              <p className="text-sm text-gray-500">Spring Semester</p>
            </div>
            <Button 
              variant="outline" 
              size="icon"
              onClick={onNextWeek}
              data-testid="button-next-week"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center space-x-3">
            <Select value={selectedRoom} onValueChange={onRoomChange}>
              <SelectTrigger className="w-48" data-testid="select-room">
                <SelectValue placeholder="Select room" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Rooms</SelectItem>
                <SelectItem value="rainbow">Rainbow Room</SelectItem>
                <SelectItem value="sunshine">Sunshine Room</SelectItem>
                <SelectItem value="garden">Garden Room</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              onClick={onSubmitToSupervisor}
              className="bg-gradient-to-r from-mint-green to-sky-blue text-white hover:shadow-lg transition-all duration-300"
              data-testid="button-submit-supervisor"
            >
              <Send className="mr-2 h-4 w-4" />
              Submit to Supervisor
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}