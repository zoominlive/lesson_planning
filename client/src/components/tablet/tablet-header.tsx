import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Menu, MapPin, Home, Calendar, CheckSquare } from "lucide-react";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from "date-fns";

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
  const handlePreviousWeek = () => {
    onWeekChange(subWeeks(currentWeekDate, 1));
  };

  const handleNextWeek = () => {
    onWeekChange(addWeeks(currentWeekDate, 1));
  };

  const formatWeekRange = (date: Date) => {
    const start = startOfWeek(date, { weekStartsOn: 1 });
    const end = endOfWeek(date, { weekStartsOn: 1 });
    return `${format(start, 'MMM d')} - ${format(end, 'd')}`;
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
            
            <div className="bg-white px-6 py-3 rounded-xl shadow-md border border-gray-200">
              <h2 className="text-lg font-bold text-charcoal text-center" data-testid="week-range-tablet">
                {formatWeekRange(currentWeekDate)}
              </h2>
            </div>

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

          {/* Menu Button */}
          <Button
            size="icon"
            variant="ghost"
            onClick={onActivityButtonClick}
            className="bg-white shadow-md hover:shadow-lg border border-gray-200 text-turquoise hover:bg-turquoise/5"
            data-testid="button-activities-drawer"
          >
            <Menu className="h-6 w-6" />
          </Button>
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