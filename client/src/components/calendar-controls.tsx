import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Send, MapPin } from "lucide-react";
import { getUserAuthorizedLocations } from "@/lib/auth";

interface CalendarControlsProps {
  currentWeek: string;
  selectedRoom: string;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onRoomChange: (room: string) => void;
  onSubmitToSupervisor: () => void;
  onLocationChange?: (locationId: string) => void;
  selectedLocation?: string;
}

export function CalendarControls({ 
  currentWeek, 
  selectedRoom, 
  onPreviousWeek, 
  onNextWeek, 
  onRoomChange, 
  onSubmitToSupervisor,
  onLocationChange,
  selectedLocation 
}: CalendarControlsProps) {
  const [currentLocation, setCurrentLocation] = useState(selectedLocation || "");
  
  // Fetch authorized locations - API already filters based on JWT
  const { data: locations = [] } = useQuery({
    queryKey: ["/api/locations"],
  });

  // Auto-select first location if none selected
  useEffect(() => {
    if (!currentLocation && Array.isArray(locations) && locations.length > 0) {
      const firstLocation = locations[0];
      setCurrentLocation(firstLocation.id);
      onLocationChange?.(firstLocation.id);
    }
  }, [locations, currentLocation, onLocationChange]);

  const handleLocationChange = (locationId: string) => {
    setCurrentLocation(locationId);
    onLocationChange?.(locationId);
  };

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
            {/* Location Filter - Only shows authorized locations */}
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <Select value={currentLocation} onValueChange={handleLocationChange}>
                <SelectTrigger className="w-48" data-testid="select-location">
                  <SelectValue placeholder="Select Location" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(locations) && locations.length > 0 ? (
                    locations.map((location: any) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>No authorized locations</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            
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