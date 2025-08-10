import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, ChevronDown } from "lucide-react";
import { setAuthToken, getUserInfo } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

// Test tokens for different user roles (signed with 'dev-secret-key')
const TEST_TOKENS = {
  admin: {
    label: "Admin User",
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZW5hbnRJZCI6IjdjYjZjMjhkLTE2NGMtNDlmYS1iNDYxLWRmYzQ3YThhM2ZlZCIsInVzZXJJZCI6ImU1YjdmMGRlLWM4NjgtNGU0MC1hMGJkLWUxNTkzN2NiMzA5NyIsInVzZXJGaXJzdE5hbWUiOiJBZG1pbiIsInVzZXJMYXN0TmFtZSI6IlVzZXIiLCJ1c2VybmFtZSI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6IkFkbWluIiwibG9jYXRpb25zIjpbImJmZDFkYzE0LTZjNmItNGZhMy04OTBiLWU1YjA5NmNkMjlmNCJdLCJpYXQiOjE3NTQ3MjkxMTh9.vyjtu7YwAsZDUR-1PDjkuKGlPINMsIpAkRW6eVLmtYs",
    role: "Admin",
    username: "admin@example.com"
  },
  teacher: {
    label: "Teacher User",
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZW5hbnRJZCI6IjdjYjZjMjhkLTE2NGMtNDlmYS1iNDYxLWRmYzQ3YThhM2ZlZCIsInVzZXJJZCI6InRlYWNoZXIxMjMiLCJ1c2VyRmlyc3ROYW1lIjoiU2FyYWgiLCJ1c2VyTGFzdE5hbWUiOiJKb2huc29uIiwidXNlcm5hbWUiOiJ0ZWFjaGVyQGV4YW1wbGUuY29tIiwicm9sZSI6IlRlYWNoZXIiLCJsb2NhdGlvbnMiOlsiYmZkMWRjMTQtNmM2Yi00ZmEzLTg5MGItZTViMDk2Y2QyOWY0Il0sImlhdCI6MTc1NDcyOTExOH0.3gpkB3y0UE2uF5za2jWfnOEBcffmhPPmyVdLY56hvIY",
    role: "Teacher",
    username: "teacher@example.com"
  },
  director: {
    label: "Director User",
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZW5hbnRJZCI6IjdjYjZjMjhkLTE2NGMtNDlmYS1iNDYxLWRmYzQ3YThhM2ZlZCIsInVzZXJJZCI6ImRpcmVjdG9yMTIzIiwidXNlckZpcnN0TmFtZSI6Ik1pY2hhZWwiLCJ1c2VyTGFzdE5hbWUiOiJCcm93biIsInVzZXJuYW1lIjoiZGlyZWN0b3JAZXhhbXBsZS5jb20iLCJyb2xlIjoiRGlyZWN0b3IiLCJsb2NhdGlvbnMiOlsiYmZkMWRjMTQtNmM2Yi00ZmEzLTg5MGItZTViMDk2Y2QyOWY0Il0sImlhdCI6MTc1NDcyOTExOH0.2GuqMzWlVLyTXiMPSonT-Aqg5oGDdNkPe6NmM4o0JRg",
    role: "Director",
    username: "director@example.com"
  },
  superadmin: {
    label: "Super Admin User",
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZW5hbnRJZCI6IjdjYjZjMjhkLTE2NGMtNDlmYS1iNDYxLWRmYzQ3YThhM2ZlZCIsInVzZXJJZCI6InN1cGVyYWRtaW4xMjMiLCJ1c2VyRmlyc3ROYW1lIjoiU3VwZXIiLCJ1c2VyTGFzdE5hbWUiOiJBZG1pbiIsInVzZXJuYW1lIjoic3VwZXJhZG1pbkBleGFtcGxlLmNvbSIsInJvbGUiOiJTdXBlckFkbWluIiwibG9jYXRpb25zIjpbImJmZDFkYzE0LTZjNmItNGZhMy04OTBiLWU1YjA5NmNkMjlmNCJdLCJpYXQiOjE3NTQ3OTU4ODV9.I-XQ_2jwyPfrzGrB5eZWubkt8Vrdw6fTAQ1qCKqR5OU",
    role: "SuperAdmin",
    username: "superadmin@example.com"
  }
};

export function TokenSwitcher() {
  // Get current user from token
  const userInfo = getUserInfo();
  const getCurrentUserType = (): keyof typeof TEST_TOKENS => {
    if (!userInfo) return "admin";
    
    // Match by userId to determine which test token is active
    switch(userInfo.userId) {
      case "teacher123":
        return "teacher";
      case "director123":
        return "director";
      case "superadmin123":
        return "superadmin";
      case "e5b7f0de-c868-4e40-a0bd-e15937cb3097":
      default:
        return "admin";
    }
  };
  
  const [currentUser, setCurrentUser] = useState<keyof typeof TEST_TOKENS>(getCurrentUserType());
  const { toast } = useToast();

  const switchUser = (userType: keyof typeof TEST_TOKENS) => {
    const user = TEST_TOKENS[userType];
    setAuthToken(user.token);
    setCurrentUser(userType);
    
    // Mark that the token was manually set
    localStorage.setItem('tokenManuallySet', 'true');
    
    toast({
      title: "User Switched",
      description: `Now logged in as ${user.label} (${user.role})`,
    });

    // Reload the page to apply the new token
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const current = TEST_TOKENS[currentUser];

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="bg-white/90 backdrop-blur-sm shadow-lg border-2"
            data-testid="button-token-switcher"
          >
            <User className="mr-2 h-4 w-4" />
            <span className="font-medium">{current.role}</span>
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Switch Test User</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {Object.entries(TEST_TOKENS).map(([key, user]) => (
            <DropdownMenuItem
              key={key}
              onClick={() => switchUser(key as keyof typeof TEST_TOKENS)}
              className={currentUser === key ? "bg-accent" : ""}
              data-testid={`select-user-${key}`}
            >
              <div className="flex flex-col">
                <div className="font-medium">{user.label}</div>
                <div className="text-xs text-muted-foreground">{user.username}</div>
                <div className="text-xs text-muted-foreground">{user.role}</div>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <div className="mt-2 text-xs text-muted-foreground bg-white/90 backdrop-blur-sm rounded px-2 py-1">
        Current: {current.username}
      </div>
    </div>
  );
}