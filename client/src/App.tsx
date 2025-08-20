import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { initializeIframeAuth } from "./lib/auth";
import { setPermissionOverrides } from "./lib/permission-utils";
import LessonPlanner from "@/pages/lesson-planner";
import TabletPlanner from "@/pages/tablet-planner";
import { Settings } from "@/pages/Settings";
import ParentView from "@/components/mobile/parent-view";
import NotFound from "@/pages/not-found";
import { TokenSwitcher } from "@/components/token-switcher";
import { RoleBasedRouteGuard } from "@/components/role-based-route-guard";
import { GuidedWalkthrough } from "@/components/guided-walkthrough";
import { useEffect } from "react";

function Router() {
  const [, setLocation] = useLocation();
  
  // Component to handle review redirect
  const ReviewRedirect = () => {
    useEffect(() => {
      // Redirect to main page with review tab
      setLocation("/?tab=review");
    }, []);
    return null;
  };
  
  return (
    <RoleBasedRouteGuard>
      <Switch>
        <Route path="/" component={LessonPlanner} />
        <Route path="/tablet" component={TabletPlanner} />
        <Route path="/parent" component={ParentView} />
        <Route path="/settings" component={Settings} />
        <Route path="/review" component={ReviewRedirect} />
        <Route component={NotFound} />
      </Switch>
    </RoleBasedRouteGuard>
  );
}

function App() {
  useEffect(() => {
    // Initialize iframe authentication on app start
    initializeIframeAuth();
    
    // Fetch and cache permission overrides
    const authToken = localStorage.getItem('authToken');
    if (authToken) {
      // Fetch all locations and cache their names (especially for SuperAdmin)
      fetch('/api/locations', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })
        .then(res => res.json())
        .then(locations => {
          if (Array.isArray(locations)) {
            // Cache all location names for SuperAdmin access
            const locationNames = locations.map(loc => loc.name);
            localStorage.setItem('allLocationNames', JSON.stringify(locationNames));
            console.log('Cached all location names:', locationNames);
          }
        })
        .catch(err => console.warn('Could not load locations:', err));
      
      // Fetch permission overrides
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
        <GuidedWalkthrough />
        <TokenSwitcher />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
