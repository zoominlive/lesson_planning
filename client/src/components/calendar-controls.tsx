import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronLeft, ChevronRight, Send, MapPin, Calendar } from "lucide-react";
import { getUserAuthorizedLocations } from "@/lib/auth";
import { DayPicker } from "react-day-picker";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from "date-fns";
import { cn } from "@/lib/utils";

interface CalendarControlsProps {
  currentWeekDate: Date;
  selectedRoom: string;
  onWeekChange: (date: Date) => void;
  onRoomChange: (room: string) => void;
  onSubmitToSupervisor: () => void;
  onLocationChange?: (locationId: string) => void;
  selectedLocation?: string;
}

export function CalendarControls({
  currentWeekDate,
  selectedRoom,
  onWeekChange,
  onRoomChange,
  onSubmitToSupervisor,
  onLocationChange,
  selectedLocation,
}: CalendarControlsProps) {
  const [currentLocation, setCurrentLocation] = useState(
    selectedLocation || "",
  );
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Fetch authorized locations - API already filters based on JWT
  const { data: locations = [] } = useQuery({
    queryKey: ["/api/locations"],
  });
  
  // Fetch all rooms
  const { data: allRooms = [] } = useQuery<any[]>({
    queryKey: ["/api/rooms"],
  });
  
  // Filter rooms for the selected location
  const rooms = allRooms.filter((room: any) => room.locationId === currentLocation);

  // Auto-select first location if none selected
  useEffect(() => {
    if (!currentLocation && Array.isArray(locations) && locations.length > 0) {
      const firstLocation = locations[0];
      setCurrentLocation(firstLocation.id);
      onLocationChange?.(firstLocation.id);
    }
  }, [locations, currentLocation, onLocationChange]);
  
  // Auto-select first room when location changes or rooms load
  useEffect(() => {
    if (rooms.length > 0 && (!selectedRoom || selectedRoom === "all")) {
      onRoomChange(rooms[0].id);
    }
  }, [rooms, selectedRoom, onRoomChange]);

  const handleLocationChange = (locationId: string) => {
    setCurrentLocation(locationId);
    onLocationChange?.(locationId);
  };

  const handlePreviousWeek = () => {
    const newDate = subWeeks(currentWeekDate, 1);
    onWeekChange(newDate);
  };

  const handleNextWeek = () => {
    const newDate = addWeeks(currentWeekDate, 1);
    onWeekChange(newDate);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Start on Monday
      onWeekChange(weekStart);
      setIsDatePickerOpen(false);
    }
  };

  const formatWeekRange = (date: Date) => {
    const start = startOfWeek(date, { weekStartsOn: 1 });
    const end = endOfWeek(date, { weekStartsOn: 1 });
    return `Week of ${format(start, 'MMM d')}-${format(end, 'd, yyyy')}`;
  };

  return (
    <Card className="material-shadow">
      <CardContent className="p-6">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePreviousWeek}
              data-testid="button-previous-week"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "min-w-[240px] justify-start text-left font-normal",
                    !currentWeekDate && "text-muted-foreground"
                  )}
                  data-testid="button-week-picker"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  <div className="text-center flex-1">
                    <h2
                      className="text-base font-bold text-charcoal"
                      data-testid="current-week"
                    >
                      {formatWeekRange(currentWeekDate)}
                    </h2>
                    <p className="text-xs text-gray-500">Click to select week</p>
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <DayPicker
                  mode="single"
                  selected={currentWeekDate}
                  onSelect={handleDateSelect}
                  showOutsideDays={true}
                  className="p-3"
                  modifiers={{
                    currentWeek: {
                      from: startOfWeek(currentWeekDate, { weekStartsOn: 1 }),
                      to: endOfWeek(currentWeekDate, { weekStartsOn: 1 })
                    }
                  }}
                  modifiersStyles={{
                    currentWeek: {
                      backgroundColor: 'rgba(79, 201, 176, 0.2)',
                      borderRadius: '0.375rem'
                    }
                  }}
                />
              </PopoverContent>
            </Popover>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextWeek}
              data-testid="button-next-week"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center space-x-3">
            {/* Location Filter - Only shows authorized locations */}
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <Select
                value={currentLocation}
                onValueChange={handleLocationChange}
              >
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
                    <SelectItem value="none" disabled>
                      No authorized locations
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <Select value={selectedRoom} onValueChange={onRoomChange} disabled={!currentLocation}>
              <SelectTrigger className="w-48" data-testid="select-room">
                <SelectValue placeholder="Select room" />
              </SelectTrigger>
              <SelectContent>
                {rooms.length > 0 ? (
                  rooms.map((room: any) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    {currentLocation ? "No rooms in this location" : "Select a location first"}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>

            <Button
              onClick={onSubmitToSupervisor}
              className="bg-gradient-to-r from-mint-green to-sky-blue text-white hover:shadow-lg transition-all duration-300"
              data-testid="button-submit-supervisor"
            >
              <Send className="mr-2 h-4 w-4" />
              Submit for Review
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
