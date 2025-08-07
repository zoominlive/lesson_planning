import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { PenTool, Wand2 } from "lucide-react";

interface ActivityCreationChoiceProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChooseManual: () => void;
  onChooseAI: () => void;
}

export default function ActivityCreationChoice({
  open,
  onOpenChange,
  onChooseManual,
  onChooseAI
}: ActivityCreationChoiceProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Activity</DialogTitle>
          <DialogDescription>
            Choose how you'd like to create your activity
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 mt-6">
          <Card
            className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105"
            onClick={onChooseManual}
          >
            <CardContent className="p-8 text-center">
              <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-sky-blue/20">
                <PenTool className="h-8 w-8 text-sky-blue" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Create Manually</h3>
              <p className="text-sm text-gray-600">
                Build your activity from scratch with full control over every detail
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 relative overflow-hidden"
            onClick={onChooseAI}
          >
            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-coral-red to-turquoise text-white text-xs px-3 py-1 rounded-bl-lg font-semibold">
              AI Powered
            </div>
            <CardContent className="p-8 text-center">
              <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-coral-red/20 to-turquoise/20">
                <Wand2 className="h-8 w-8 text-coral-red" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Use AI Agent</h3>
              <p className="text-sm text-gray-600">
                Let AI generate a complete activity based on your requirements
              </p>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}