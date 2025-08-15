import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Wand2, Loader2, Sparkles, ChevronRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface AiActivityGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerated: (activityData: any) => void;
  ageGroups: any[];
  categories: any[];
  locationId: string;
}

export default function AiActivityGenerator({
  open,
  onOpenChange,
  onGenerated,
  ageGroups,
  categories,
  locationId
}: AiActivityGeneratorProps) {
  const [step, setStep] = useState(1);
  const [selectedAgeGroup, setSelectedAgeGroup] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isQuiet, setIsQuiet] = useState<boolean | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationMessage, setGenerationMessage] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  const handleGenerate = async () => {
    if (!selectedAgeGroup || !selectedCategory || isQuiet === null) {
      toast({
        title: "Missing Information",
        description: "Please answer all questions before generating the activity.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setRetryCount(0);
    setGenerationMessage("Generating your activity...");
    const ageGroup = ageGroups.find(ag => ag.id === selectedAgeGroup);
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/activities/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          ageGroupId: selectedAgeGroup,
          ageGroupName: ageGroup?.name,
          ageRange: {
            start: ageGroup?.ageRangeStart || 2,
            end: ageGroup?.ageRangeEnd || 3
          },
          category: selectedCategory,
          isQuiet,
          locationId
        })
      });

      const result = await response.json();

      if (!response.ok) {
        // Check if the error is retryable or not
        if (response.status === 503) {
          // Service unavailable - AI failed after retries
          toast({
            title: "AI Service Temporarily Unavailable",
            description: result.error || "The AI is having trouble generating activities right now. Please try again later or create an activity manually.",
            variant: "destructive"
          });
        } else if (response.status === 500 && result.retryable) {
          // Server error but retryable
          toast({
            title: "Generation Failed",
            description: "There was an issue generating the activity. Please try again in a moment.",
            variant: "destructive"
          });
        } else {
          // Other errors
          toast({
            title: "Generation Failed",
            description: result.error || "Unable to generate activity. Please try again.",
            variant: "destructive"
          });
        }
        return;
      }

      // Check if the generation succeeded
      if (result.title === "Activity Generation Failed") {
        // This shouldn't happen anymore with backend retry, but just in case
        toast({
          title: "Generation Issue",
          description: "The AI couldn't generate a proper activity. Please try again or create one manually.",
          variant: "destructive"
        });
        return;
      }
      
      // Pass the generated activity data to the parent component
      // Include the selected category and age group from the wizard
      onGenerated({
        ...result,
        category: selectedCategory,
        selectedAgeGroupId: selectedAgeGroup
      });
      
      // Reset the dialog
      setStep(1);
      setSelectedAgeGroup("");
      setSelectedCategory("");
      setIsQuiet(null);
      setGenerationMessage("");
      onOpenChange(false);
      
      toast({
        title: "Activity Generated!",
        description: "The AI has created an activity for you. Please review and customize it before saving."
      });
    } catch (error) {
      console.error('Error generating activity:', error);
      toast({
        title: "Connection Error",
        description: "Unable to connect to the server. Please check your connection and try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
      setGenerationMessage("");
    }
  };

  const handleNext = () => {
    if (step === 1 && !selectedAgeGroup) {
      toast({
        title: "Please select an age group",
        variant: "destructive"
      });
      return;
    }
    if (step === 2 && !selectedCategory) {
      toast({
        title: "Please select a category",
        variant: "destructive"
      });
      return;
    }
    if (step === 3 && isQuiet === null) {
      toast({
        title: "Please select whether this should be a quiet activity",
        variant: "destructive"
      });
      return;
    }
    
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleGenerate();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            AI Activity Generator
          </DialogTitle>
          <DialogDescription>
            Answer a few quick questions and let AI create a comprehensive activity for you.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6">
          {/* Progress indicators */}
          <div className="flex justify-between mb-8">
            {[1, 2, 3].map((num) => (
              <div
                key={num}
                className={`flex items-center ${num < 3 ? 'flex-1' : ''}`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                    step >= num
                      ? 'bg-gradient-to-r from-coral-red to-turquoise text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {num}
                </div>
                {num < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 transition-all ${
                      step > num ? 'bg-gradient-to-r from-coral-red to-turquoise' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step content */}
          <div className="min-h-[200px]">
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Which age group is this activity for?</h3>
                <p className="text-sm text-gray-600">
                  Select the age group to ensure the activity is developmentally appropriate.
                </p>
                <Select value={selectedAgeGroup} onValueChange={setSelectedAgeGroup}>
                  <SelectTrigger className="w-full" data-testid="select-ai-age-group">
                    <SelectValue placeholder="Choose an age group" />
                  </SelectTrigger>
                  <SelectContent>
                    {ageGroups.map((ageGroup) => (
                      <SelectItem key={ageGroup.id} value={ageGroup.id}>
                        {ageGroup.name} ({ageGroup.ageRangeStart}-{ageGroup.ageRangeEnd} years)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">What category should this activity focus on?</h3>
                <p className="text-sm text-gray-600">
                  Choose the primary developmental area for this activity.
                </p>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full" data-testid="select-ai-category">
                    <SelectValue placeholder="Choose a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Should this be a quiet activity?</h3>
                <p className="text-sm text-gray-600">
                  Quiet activities are suitable for calm time, nap preparation, or low-energy periods.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <Card
                    className={`cursor-pointer transition-all ${
                      isQuiet === true
                        ? 'ring-2 ring-coral-red shadow-lg'
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => setIsQuiet(true)}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="text-3xl mb-2">🤫</div>
                      <h4 className="font-semibold">Quiet Activity</h4>
                      <p className="text-sm text-gray-600 mt-2">
                        Calm, peaceful activities for quiet time
                      </p>
                    </CardContent>
                  </Card>
                  <Card
                    className={`cursor-pointer transition-all ${
                      isQuiet === false
                        ? 'ring-2 ring-turquoise shadow-lg'
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => setIsQuiet(false)}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="text-3xl mb-2">🎉</div>
                      <h4 className="font-semibold">Active Activity</h4>
                      <p className="text-sm text-gray-600 mt-2">
                        Engaging, energetic activities for play time
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={step === 1 ? () => onOpenChange(false) : handleBack}
              disabled={isGenerating}
            >
              {step === 1 ? 'Cancel' : 'Back'}
            </Button>
            <Button
              onClick={handleNext}
              disabled={isGenerating}
              className="bg-gradient-to-r from-coral-red to-turquoise text-white"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {generationMessage || "Generating..."}
                </>
              ) : step === 3 ? (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generate Activity
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}