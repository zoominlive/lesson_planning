import { Badge } from "@/components/ui/badge";
import { Play, Package } from "lucide-react";
import type { Activity } from "@shared/schema";

interface DraggableActivityProps {
  activity: Activity;
  onDragStart: (activity: Activity) => void;
}

export default function DraggableActivity({ activity, onDragStart }: DraggableActivityProps) {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Social Development":
        return "bg-mint-green text-white";
      case "Art & Creativity":
        return "bg-coral-red text-white";
      case "Physical Development":
        return "bg-turquoise text-white";
      case "Cognitive Development":
        return "bg-sky-blue text-white";
      case "Music & Movement":
        return "bg-soft-yellow text-charcoal";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "move";
    onDragStart(activity);
  };

  return (
    <div 
      className="border border-gray-200 rounded-lg p-4 material-shadow-hover cursor-move transition-all duration-200 hover:border-turquoise" 
      draggable={true}
      onDragStart={handleDragStart}
      data-testid={`draggable-activity-${activity.id}`}
    >
      <div className="flex justify-between items-start mb-3">
        <h4 className="font-semibold text-charcoal line-clamp-2" data-testid={`activity-title-${activity.id}`}>
          {activity.title}
        </h4>
        <Badge className={getCategoryColor(activity.category)}>
          {activity.category}
        </Badge>
      </div>
      
      <p className="text-sm text-gray-600 mb-3 line-clamp-2" data-testid={`activity-description-${activity.id}`}>
        {activity.description}
      </p>
      
      <div className="flex justify-between items-center text-sm">
        <div className="flex items-center space-x-3">
          <span className="text-gray-500">
            Duration: <span className="font-medium text-charcoal">{activity.duration} min</span>
          </span>
        </div>
        
        <div className="flex space-x-2">
          {activity.videoUrl && (
            <Play className="h-4 w-4 text-gray-400" title="Has video" />
          )}
          {activity.materialIds.length > 0 && (
            <Package className="h-4 w-4 text-gray-400" title="Materials required" />
          )}
        </div>
      </div>
      
      {/* Drag handle indicator */}
      <div className="flex justify-center mt-2 opacity-50">
        <div className="flex space-x-1">
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
