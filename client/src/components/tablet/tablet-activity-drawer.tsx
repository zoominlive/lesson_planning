import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X, Clock, Users, Tag, ChevronDown } from "lucide-react";
import type { Activity, Category, AgeGroup } from "@shared/schema";

interface TabletActivityDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onActivitySelect: (activity: Activity) => void;
  selectedSlot: { day: number; slot: number } | null;
}

export function TabletActivityDrawer({
  isOpen,
  onClose,
  onActivitySelect,
  selectedSlot
}: TabletActivityDrawerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>("all");
  const drawerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);
  const currentTranslateY = useRef<number>(0);

  // Fetch activities
  const { data: activities = [], isLoading } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
  });

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Fetch age groups
  const { data: ageGroups = [] } = useQuery<AgeGroup[]>({
    queryKey: ["/api/age-groups"],
  });

  // Filter activities
  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || activity.category === selectedCategory;
    const matchesAgeGroup = selectedAgeGroup === "all" || 
      (activity.ageGroupIds && activity.ageGroupIds.includes(selectedAgeGroup));
    return matchesSearch && matchesCategory && matchesAgeGroup;
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Social Development":
        return "bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200";
      case "Art & Creativity":
        return "bg-gradient-to-r from-pink-100 to-rose-100 text-pink-700 border-pink-200";
      case "Physical Development":
        return "bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border-blue-200";
      case "Cognitive Development":
        return "bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 border-indigo-200";
      default:
        return "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border-gray-200";
    }
  };

  // Get age group names from IDs
  const getAgeGroupNames = (ageGroupIds: string[] | null | undefined) => {
    if (!ageGroupIds || ageGroupIds.length === 0) return [];
    return ageGroupIds
      .map(id => ageGroups.find(ag => ag.id === id)?.name)
      .filter(Boolean) as string[];
  };

  // Handle swipe down to close
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    currentTranslateY.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null || !drawerRef.current) return;
    
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartY.current;
    
    // Only allow dragging down
    if (deltaY > 0) {
      currentTranslateY.current = deltaY;
      drawerRef.current.style.transform = `translateY(${deltaY}px)`;
    }
  };

  const handleTouchEnd = () => {
    if (!drawerRef.current) return;
    
    // If dragged more than 100px, close the drawer
    if (currentTranslateY.current > 100) {
      onClose();
    } else {
      // Snap back to position
      drawerRef.current.style.transform = 'translateY(0)';
    }
    
    touchStartY.current = null;
    currentTranslateY.current = 0;
  };

  // Reset transform when drawer opens/closes
  useEffect(() => {
    if (drawerRef.current) {
      drawerRef.current.style.transform = 'translateY(0)';
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end animate-fade-in">
      <div 
        ref={drawerRef}
        className="bg-gradient-to-b from-white to-gray-50 w-full h-[85%] rounded-t-3xl shadow-2xl animate-slide-up transition-transform"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-b from-white to-white/95 backdrop-blur-sm rounded-t-3xl border-b border-gray-200/50 p-4">
          {/* Swipe indicator */}
          <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-3" />
          
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold bg-gradient-to-r from-turquoise to-sky-blue bg-clip-text text-transparent">Activity Library</h2>
            <Button
              size="icon"
              variant="ghost"
              onClick={onClose}
              className="rounded-full hover:bg-gray-100"
              data-testid="close-drawer-tablet"
            >
              <ChevronDown className="h-5 w-5" />
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 border-gray-200 bg-white/80 backdrop-blur-sm focus:bg-white"
                  data-testid="search-activities-tablet"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="flex-1 h-12 border-gray-200 bg-white/80 backdrop-blur-sm">
                  <Tag className="h-4 w-4 mr-2 text-turquoise" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedAgeGroup} onValueChange={setSelectedAgeGroup}>
                <SelectTrigger className="flex-1 h-12 border-gray-200 bg-white/80 backdrop-blur-sm">
                  <Users className="h-4 w-4 mr-2 text-sky-blue" />
                  <SelectValue placeholder="Age Group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ages</SelectItem>
                  {ageGroups.map((ageGroup) => (
                    <SelectItem key={ageGroup.id} value={ageGroup.id}>
                      {ageGroup.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Activities List */}
        <div className="overflow-y-auto h-full pb-20 px-4 pt-4">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="p-4 animate-pulse bg-white/60">
                  <div className="h-5 bg-gradient-to-r from-gray-200 to-gray-100 rounded mb-2 w-3/4"></div>
                  <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-100 rounded mb-2"></div>
                  <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-100 rounded w-1/2"></div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredActivities.map((activity) => (
                <Card
                  key={activity.id}
                  className="p-4 cursor-pointer bg-white/80 hover:bg-white hover:shadow-xl transition-all border-2 border-gray-100 hover:border-turquoise/30 hover:scale-[1.02] active:scale-[0.98] h-32"
                  onClick={() => onActivitySelect(activity)}
                  data-testid={`activity-card-${activity.id}`}
                >
                  <div className="flex gap-4 h-full">
                    {/* Text content on the left */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-semibold text-charcoal line-clamp-2 mb-2">
                          {activity.title}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {activity.description}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs flex-wrap">
                        <span className={`px-3 py-1 rounded-full border ${getCategoryColor(activity.category)}`}>
                          {activity.category}
                        </span>
                        <div className="flex items-center gap-1 text-gray-500">
                          <Clock className="h-3 w-3" />
                          <span>{activity.duration} min</span>
                        </div>
                        {activity.groupSize && (
                          <div className="flex items-center gap-1 text-gray-500">
                            <Users className="h-3 w-3" />
                            <span>{activity.groupSize}</span>
                          </div>
                        )}
                        {getAgeGroupNames(activity.ageGroupIds).length > 0 && (
                          <div className="flex items-center gap-1 text-gray-500">
                            <Tag className="h-3 w-3" />
                            <span>{getAgeGroupNames(activity.ageGroupIds).join(", ")}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Square image on the right */}
                    {activity.imageUrl && (
                      <div className="w-24 h-24 flex-shrink-0">
                        <img 
                          src={activity.imageUrl} 
                          alt={activity.title}
                          className="w-full h-full rounded-lg object-cover shadow-sm"
                        />
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}