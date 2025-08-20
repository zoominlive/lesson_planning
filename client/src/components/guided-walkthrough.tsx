import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import { useLocation } from "wouter";

interface WalkthroughStep {
  target: string; // CSS selector for the element to highlight
  title: string;
  content: string;
  position: "top" | "bottom" | "left" | "right";
  action?: () => void; // Optional action to perform when reaching this step
  simulatedData?: any; // Optional data to simulate during this step
}

const walkthroughSteps: WalkthroughStep[] = [
  {
    target: "",
    title: "Welcome to Your Lesson Planning Assistant! 🎨",
    content: "Let's take a quick tour to help you get started. This app helps you create engaging lesson plans, manage activities, and track developmental milestones for your childcare center.",
    position: "bottom",
  },
  {
    target: "[data-testid='tab-calendar']",
    title: "Lesson Planner",
    content: "This is where you'll spend most of your time! Create weekly lesson plans by scheduling activities. Plans are automatically shared with your teaching team.",
    position: "bottom",
    simulatedData: {
      weekView: true,
      sampleActivities: [
        { time: "9:00 AM", activity: "Morning Circle Time" },
        { time: "10:00 AM", activity: "Art Project" },
        { time: "11:00 AM", activity: "Outdoor Play" },
      ]
    }
  },
  {
    target: "[data-testid='tab-activities']",
    title: "Activities Library",
    content: "This is your creative hub! Store all your activities here - from art projects to outdoor games. You can generate new activities with AI or create your own.",
    position: "bottom",
    simulatedData: {
      activities: [
        { title: "Rainbow Painting", category: "Art", ageRange: "3-5 years" },
        { title: "Nature Scavenger Hunt", category: "Outdoor", ageRange: "4-6 years" },
        { title: "Story Time Theater", category: "Language", ageRange: "2-4 years" },
      ]
    }
  },
  {
    target: "[data-testid='button-create-activity']",
    title: "AI Activity Generator",
    content: "Need inspiration? Click here to create new activities. You can generate AI-powered activities tailored to your needs or manually create your own.",
    position: "left",
  },
  {
    target: "[data-testid='tab-materials']",
    title: "Materials Library",
    content: "Keep track of all your classroom materials and supplies. Know exactly what you have and where it's stored. The AI can even suggest materials for activities!",
    position: "bottom",
    simulatedData: {
      materials: [
        { name: "Washable Paint Set", location: "Art Cabinet", quantity: "5 sets" },
        { name: "Building Blocks", location: "Play Area Shelf", quantity: "3 boxes" },
        { name: "Story Books Collection", location: "Reading Corner", quantity: "50+ books" },
      ]
    }
  },
  {
    target: "[data-testid='tab-milestones']",
    title: "Milestones Library",
    content: "Track developmental milestones for different age groups. Link activities to specific learning goals to ensure comprehensive child development.",
    position: "bottom",
    simulatedData: {
      milestones: [
        { title: "Counts to 10", category: "Cognitive", ageGroup: "3-4 years" },
        { title: "Uses scissors safely", category: "Fine Motor", ageGroup: "4-5 years" },
        { title: "Shares toys with peers", category: "Social", ageGroup: "2-3 years" },
      ]
    }
  },
  {
    target: "[data-testid='tab-review']",
    title: "Reviews & Analytics",
    content: "Track completed activities, analyze what works best, and get AI insights on teaching patterns. Export reports to share with parents and administrators.",
    position: "bottom",
    simulatedData: {
      stats: {
        completed: 45,
        avgRating: 4.5,
        topCategory: "Art & Creativity"
      }
    }
  },
  {
    target: "[data-testid='button-submit-supervisor']",
    title: "Submit for Review",
    content: "Once your lesson plan is ready, submit it for approval. Directors can review, provide feedback, and approve plans. Some roles have auto-approval privileges.",
    position: "left",
  },
  {
    target: "",
    title: "You're All Set! 🌟",
    content: "That's the basics! Start by adding some activities to your library, then create your first lesson plan. Remember, the AI assistant is always here to help generate ideas!",
    position: "bottom",
  },
];

export function GuidedWalkthrough() {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [location, setLocation] = useLocation();
  const [highlightBox, setHighlightBox] = useState<DOMRect | null>(null);

  // Check if this is the user's first visit
  useEffect(() => {
    const hasSeenWalkthrough = localStorage.getItem("hasSeenWalkthrough");
    const selectedLocation = localStorage.getItem("selectedLocation");
    
    console.log("GuidedWalkthrough mounted - hasSeenWalkthrough:", hasSeenWalkthrough, "selectedLocation:", selectedLocation);
    console.log("isActive state:", isActive);
    
    // Auto-start for first-time users in Third Location
    // Third Location is used because it has no data, simulating a fresh start
    if (!hasSeenWalkthrough && selectedLocation === "Third Location") {
      setTimeout(() => setIsActive(true), 1500);
    }
  }, [isActive]);

  // Update highlight box when step changes
  useEffect(() => {
    if (!isActive) return;

    const step = walkthroughSteps[currentStep];
    
    // Navigate to appropriate tab if needed
    if (step.target?.includes("tab-")) {
      const tabName = step.target.match(/tab-([^'"\]]+)/)?.[1];
      if (tabName) {
        // Click the tab to navigate
        setTimeout(() => {
          const tabElement = document.querySelector(step.target!) as HTMLElement;
          if (tabElement) {
            tabElement.click();
          }
        }, 100);
      }
    }

    // Update highlight box after navigation
    setTimeout(() => {
      if (step.target) {
        const element = document.querySelector(step.target);
        if (element) {
          const rect = element.getBoundingClientRect();
          setHighlightBox(rect);
        } else {
          setHighlightBox(null);
        }
      } else {
        setHighlightBox(null);
      }
    }, 200);

    // Execute any step-specific actions
    if (step.action) {
      step.action();
    }
  }, [currentStep, isActive]);

  const handleNext = () => {
    if (currentStep < walkthroughSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem("hasSeenWalkthrough", "true");
    setIsActive(false);
    setCurrentStep(0);
  };

  const handleSkip = () => {
    localStorage.setItem("hasSeenWalkthrough", "true");
    setIsActive(false);
    setCurrentStep(0);
  };

  const startWalkthrough = () => {
    // Just start the walkthrough without location switching
    console.log("Starting walkthrough!");
    setIsActive(true);
    setCurrentStep(0);
  };

  if (!isActive) {
    // Show start button in the corner
    console.log("Rendering Take a Tour button");
    return (
      <div 
        className="fixed bottom-6 right-6"
        style={{ 
          zIndex: 99999,
          position: 'fixed',
          bottom: '24px',
          right: '24px'
        }}
      >
        <Button
          onClick={startWalkthrough}
          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg hover:shadow-xl transition-all text-lg px-6 py-3 font-semibold animate-pulse"
          data-testid="button-start-walkthrough"
        >
          <Sparkles className="mr-2 h-5 w-5" />
          Take a Tour
        </Button>
      </div>
    );
  }

  const step = walkthroughSteps[currentStep];
  const progress = ((currentStep + 1) / walkthroughSteps.length) * 100;

  // Calculate tooltip position
  const getTooltipPosition = () => {
    if (!highlightBox) {
      return {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)"
      };
    }

    const tooltipWidth = 400;
    const tooltipHeight = 200;
    const padding = 20;

    let style: any = {};

    switch (step.position) {
      case "top":
        style.bottom = window.innerHeight - highlightBox.top + padding;
        style.left = highlightBox.left + highlightBox.width / 2 - tooltipWidth / 2;
        break;
      case "bottom":
        style.top = highlightBox.bottom + padding;
        style.left = highlightBox.left + highlightBox.width / 2 - tooltipWidth / 2;
        break;
      case "left":
        style.top = highlightBox.top + highlightBox.height / 2 - tooltipHeight / 2;
        style.right = window.innerWidth - highlightBox.left + padding;
        break;
      case "right":
        style.top = highlightBox.top + highlightBox.height / 2 - tooltipHeight / 2;
        style.left = highlightBox.right + padding;
        break;
    }

    // Keep tooltip on screen
    if (style.left !== undefined) {
      style.left = Math.max(padding, Math.min(style.left, window.innerWidth - tooltipWidth - padding));
    }
    if (style.top !== undefined) {
      style.top = Math.max(padding, Math.min(style.top, window.innerHeight - tooltipHeight - padding));
    }

    return style;
  };

  return (
    <>
      {/* Dark overlay */}
      <div className="fixed inset-0 bg-black/60 z-[9998]" onClick={handleSkip} />

      {/* Highlight box */}
      {highlightBox && (
        <div
          className="fixed border-4 border-white rounded-lg shadow-2xl z-[9999] pointer-events-none"
          style={{
            top: highlightBox.top - 4,
            left: highlightBox.left - 4,
            width: highlightBox.width + 8,
            height: highlightBox.height + 8,
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.6)"
          }}
        />
      )}

      {/* Walkthrough tooltip */}
      <Card
        className="fixed z-[10000] p-6 max-w-md shadow-2xl animate-in fade-in slide-in-from-bottom-4"
        style={getTooltipPosition()}
      >
        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 rounded-t-lg overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-coral-red to-turquoise transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2"
          onClick={handleSkip}
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Content */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
            <p className="text-sm text-gray-600">{step.content}</p>
          </div>

          {/* Simulated data preview */}
          {step.simulatedData && (
            <div className="bg-gray-50 rounded-lg p-3 text-xs">
              <p className="font-medium mb-1">Example:</p>
              {step.simulatedData.activities && (
                <ul className="space-y-1">
                  {step.simulatedData.activities.slice(0, 2).map((activity: any, idx: number) => (
                    <li key={idx} className="text-gray-600">
                      • {activity.title} ({activity.category})
                    </li>
                  ))}
                </ul>
              )}
              {step.simulatedData.materials && (
                <ul className="space-y-1">
                  {step.simulatedData.materials.slice(0, 2).map((material: any, idx: number) => (
                    <li key={idx} className="text-gray-600">
                      • {material.name} - {material.location}
                    </li>
                  ))}
                </ul>
              )}
              {step.simulatedData.milestones && (
                <ul className="space-y-1">
                  {step.simulatedData.milestones.slice(0, 2).map((milestone: any, idx: number) => (
                    <li key={idx} className="text-gray-600">
                      • {milestone.title} ({milestone.category})
                    </li>
                  ))}
                </ul>
              )}
              {step.simulatedData.stats && (
                <div className="text-gray-600">
                  <p>• {step.simulatedData.stats.completed} activities completed</p>
                  <p>• {step.simulatedData.stats.avgRating} average rating</p>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-sm text-gray-500">
              Step {currentStep + 1} of {walkthroughSteps.length}
            </div>
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleNext}
                className="bg-gradient-to-r from-coral-red to-turquoise text-white"
              >
                {currentStep === walkthroughSteps.length - 1 ? (
                  "Get Started"
                ) : (
                  <>
                    Next
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </>
  );
}