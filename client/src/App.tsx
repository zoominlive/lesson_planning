import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { initializeIframeAuth } from "./lib/auth";
import { setPermissionOverrides } from "./lib/permission-utils";
import LessonPlanner from "@/pages/lesson-planner";
import TabletPlanner from "@/pages/tablet-planner";
import { Settings } from "@/pages/Settings";
import { LessonReview } from "@/pages/lesson-review";
import NotFound from "@/pages/not-found";
import { TokenSwitcher } from "@/components/token-switcher";
import { useEffect } from "react";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LessonPlanner} />
      <Route path="/tablet" component={TabletPlanner} />
      <Route path="/settings" component={Settings} />
      <Route path="/review" component={LessonReview} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    // Initialize iframe authentication on app start
    initializeIframeAuth();
    
    // Fetch and cache permission overrides
    const authToken = localStorage.getItem('authToken');
    if (authToken) {
      fetch('/api/permissions/overrides', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })
        .then(res => res.json())
        .then(overrides => {
          if (Array.isArray(overrides)) {
            setPermissionOverrides(overrides);
          }
        })
        .catch(err => console.warn('Could not load permission overrides:', err));
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
        <TokenSwitcher />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
