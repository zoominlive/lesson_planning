import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface FloatingActionButtonProps {
  onClick: () => void;
}

export function FloatingActionButton({ onClick }: FloatingActionButtonProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        onClick={onClick}
        size="icon"
        className="w-16 h-16 rounded-full bg-gradient-to-r from-coral-red to-turquoise text-white material-shadow material-shadow-hover"
        data-testid="button-quick-add"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
}