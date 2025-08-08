import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X, Clock, Users, Tag } from "lucide-react";
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
        return "bg-green-100 text-green-700";
      case "Art & Creativity":
        return "bg-pink-100 text-pink-700";
      case "Physical Development":
        return "bg-blue-100 text-blue-700";
      case "Cognitive Development":
        return "bg-indigo-100 text-indigo-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end">
      <div className="bg-white w-full h-[85%] rounded-t-3xl shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-3xl border-b border-gray-200 p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-charcoal">Activity Library</h2>
            <Button
              size="icon"
              variant="ghost"
              onClick={onClose}
              className="rounded-full"
              data-testid="close-drawer-tablet"
            >
              <X className="h-5 w-5" />
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
                  className="pl-10 h-12"
                  data-testid="search-activities-tablet"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="flex-1 h-12">
                  <Tag className="h-4 w-4 mr-2" />
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
                <SelectTrigger className="flex-1 h-12">
                  <Users className="h-4 w-4 mr-2" />
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
                <Card key={i} className="p-4 animate-pulse">
                  <div className="h-5 bg-gray-200 rounded mb-2 w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredActivities.map((activity) => (
                <Card
                  key={activity.id}
                  className="p-4 cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-turquoise/30"
                  onClick={() => onActivitySelect(activity)}
                  data-testid={`activity-card-${activity.id}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-charcoal line-clamp-2 flex-1">
                      {activity.title}
                    </h3>
                    {activity.imageUrl && (
                      <img 
                        src={activity.imageUrl} 
                        alt={activity.title}
                        className="w-16 h-16 rounded object-cover ml-3"
                      />
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                    {activity.description}
                  </p>
                  
                  <div className="flex items-center gap-3 text-xs">
                    <span className={`px-2 py-1 rounded-full ${getCategoryColor(activity.category)}`}>
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