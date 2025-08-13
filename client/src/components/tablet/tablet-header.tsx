import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { ChevronLeft, ChevronRight, Menu, MapPin, Home, Calendar, CheckSquare } from "lucide-react";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, addDays } from "date-fns";

interface TabletHeaderProps {
  userInfo: any;
  currentWeekDate: Date;
  selectedLocation: string;
  selectedRoom: string;
  locations: any[];
  rooms: any[];
  onWeekChange: (date: Date) => void;
  onLocationChange: (locationId: string) => void;
  onRoomChange: (roomId: string) => void;
  onActivityButtonClick: () => void;
  viewMode?: 'planning' | 'recording';
  onViewModeChange?: (mode: 'planning' | 'recording') => void;
}

export function TabletHeader({
  userInfo,
  currentWeekDate,
  selectedLocation,
  selectedRoom,
  locations,
  rooms,
  onWeekChange,
  onLocationChange,
  onRoomChange,
  onActivityButtonClick,
  viewMode = 'planning',
  onViewModeChange,
}: TabletHeaderProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);

  const handlePreviousWeek = () => {
    onWeekChange(subWeeks(currentWeekDate, 1));
  };

  const handleNextWeek = () => {
    onWeekChange(addWeeks(currentWeekDate, 1));
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const weekStart = startOfWeek(date, { weekStartsOn: 1 });
      onWeekChange(weekStart);
      setCalendarOpen(false);
    }
  };

  const formatWeekRange = (date: Date) => {
    const start = startOfWeek(date, { weekStartsOn: 1 }); // Monday
    const end = addDays(start, 4); // Friday (Monday + 4 days)
    return `${format(start, 'MMM d')} - ${format(end, 'd, yyyy')}`;
  };

  return (
    <div className="bg-white shadow-lg border-b border-sky-blue/20">
      {/* Main Header Row with Date Navigation and Mode Toggle */}
      <div className="px-4 py-4 bg-gradient-to-r from-mint-green/5 to-sky-blue/5">
        <div className="flex items-center justify-between">
          {/* Week Navigation */}
          <div className="flex items-center gap-3">
            <Button
              size="icon"
              variant="ghost"
              onClick={handlePreviousWeek}
              className="bg-white shadow-md hover:shadow-lg border border-gray-200 text-turquoise hover:bg-turquoise/5"
              data-testid="button-prev-week-tablet"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="bg-white px-6 py-3 rounded-xl shadow-md border border-gray-200 hover:shadow-lg hover:border-turquoise/30 transition-all h-auto"
                  data-testid="week-range-tablet-button"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-turquoise" />
                    <div>
                      <h2 className="text-lg font-bold text-charcoal">
                        {formatWeekRange(currentWeekDate)}
                      </h2>
                      <p className="text-xs text-gray-500">Tap to change</p>
                    </div>
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-white shadow-xl border-2 border-turquoise/20" align="center">
                <CalendarComponent
                  mode="single"
                  selected={currentWeekDate}
                  onSelect={handleDateSelect}
                  className="rounded-md"
                  classNames={{
                    months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                    month: "space-y-4",
                    caption: "flex justify-center pt-1 relative items-center text-lg font-semibold",
                    caption_label: "text-lg font-medium",
                    nav: "space-x-1 flex items-center",
                    nav_button: "h-8 w-8 bg-turquoise/10 hover:bg-turquoise/20 rounded-md p-0 opacity-50 hover:opacity-100 transition-all",
                    nav_button_previous: "absolute left-1",
                    nav_button_next: "absolute right-1",
                    table: "w-full border-collapse space-y-1",
                    head_row: "flex",
                    head_cell: "text-muted-foreground rounded-md w-10 font-normal text-[0.8rem]",
                    row: "flex w-full mt-2",
                    cell: "h-10 w-10 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                    day: "h-10 w-10 p-0 font-normal aria-selected:opacity-100 rounded-md hover:bg-turquoise/10 transition-colors",
                    day_range_end: "day-range-end",
                    day_selected: "bg-turquoise text-white hover:bg-turquoise hover:text-white focus:bg-turquoise focus:text-white font-semibold",
                    day_today: "bg-accent text-accent-foreground font-semibold border-2 border-turquoise/30",
                    day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                    day_disabled: "text-muted-foreground opacity-50",
                    day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                    day_hidden: "invisible",
                  }}
                />
              </PopoverContent>
            </Popover>

            <Button
              size="icon"
              variant="ghost"
              onClick={handleNextWeek}
              className="bg-white shadow-md hover:shadow-lg border border-gray-200 text-turquoise hover:bg-turquoise/5"
              data-testid="button-next-week-tablet"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Mode Toggle */}
          <div className="bg-white rounded-xl p-1 shadow-md border border-gray-200 flex gap-1">
            <Button
              size="sm"
              variant={viewMode === 'planning' ? 'default' : 'ghost'}
              onClick={() => onViewModeChange?.('planning')}
              className={`rounded-lg px-4 py-2 transition-all ${
                viewMode === 'planning' 
                  ? 'bg-gradient-to-r from-turquoise to-sky-blue text-white shadow-md' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              data-testid="mode-planning-button"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Planning
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'recording' ? 'default' : 'ghost'}
              onClick={() => onViewModeChange?.('recording')}
              className={`rounded-lg px-4 py-2 transition-all ${
                viewMode === 'recording' 
                  ? 'bg-gradient-to-r from-coral-red to-soft-yellow text-white shadow-md' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              data-testid="mode-recording-button"
            >
              <CheckSquare className="h-4 w-4 mr-2" />
              Recording
            </Button>
          </div>


        </div>
      </div>

      {/* Location and Room Selectors */}
      <div className="px-4 py-3 flex gap-2">
        <div className="flex-1">
          <Select value={selectedLocation} onValueChange={onLocationChange}>
            <SelectTrigger className="w-full h-12 text-sm" data-testid="select-location-tablet">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <SelectValue placeholder="Location" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {locations.map((location: any) => (
                <SelectItem key={location.id} value={location.id}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1">
          <Select value={selectedRoom} onValueChange={onRoomChange} disabled={!selectedLocation}>
            <SelectTrigger className="w-full h-12 text-sm" data-testid="select-room-tablet">
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-gray-500" />
                <SelectValue placeholder="Room" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {rooms.map((room: any) => (
                <SelectItem key={room.id} value={room.id}>
                  {room.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}