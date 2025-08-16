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
import { setAuthToken, getUserInfo, clearAuthToken } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

// Test tokens for different user roles (signed with 'dev-secret-key')
// All tokens now include locations as string names ["Main Campus", "Third Location"]
const TEST_TOKENS = {
  admin: {
    label: "Admin User",
    token:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZW5hbnRJZCI6IjdjYjZjMjhkLTE2NGMtNDlmYS1iNDYxLWRmYzQ3YThhM2ZlZCIsInVzZXJJZCI6ImU1YjdmMGRlLWM4NjgtNGU0MC1hMGJkLWUxNTkzN2NiMzA5NyIsInVzZXJGaXJzdE5hbWUiOiJBZG1pbiIsInVzZXJMYXN0TmFtZSI6IlVzZXIiLCJ1c2VybmFtZSI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6IkFkbWluIiwibG9jYXRpb25zIjpbIk1haW4gQ2FtcHVzIiwiVGhpcmQgTG9jYXRpb24iXSwiaWF0IjoxNzU0ODAzMDM0fQ.atm0PWAUeYKXddW1eT-wodxP5H3eYdW0B7e98NtU1yk",
    role: "Admin",
    username: "admin@example.com",
  },
  teacher: {
    label: "Teacher User",
    token:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZW5hbnRJZCI6IjdjYjZjMjhkLTE2NGMtNDlmYS1iNDYxLWRmYzQ3YThhM2ZlZCIsInVzZXJJZCI6InRlYWNoZXIxMjMiLCJ1c2VyRmlyc3ROYW1lIjoiU2FyYWgiLCJ1c2VyTGFzdE5hbWUiOiJKb2huc29uIiwidXNlcm5hbWUiOiJ0ZWFjaGVyQGV4YW1wbGUuY29tIiwicm9sZSI6IlRlYWNoZXIiLCJsb2NhdGlvbnMiOlsiTWFpbiBDYW1wdXMiLCJUaGlyZCBMb2NhdGlvbiJdLCJpYXQiOjE3NTQ4MDMwMzR9.4FXmkDHk_ow0fwnex-598l-JRN4fF69iAIeNJ_gs5U4",
    role: "Teacher",
    username: "teacher@example.com",
  },
  teacher2: {
    label: "Teacher 2",
    token:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZW5hbnRJZCI6IjdjYjZjMjhkLTE2NGMtNDlmYS1iNDYxLWRmYzQ3YThhM2ZlZCIsInVzZXJJZCI6InRlYWNoZXIyXzEyMyIsInVzZXJGaXJzdE5hbWUiOiJKZW5uaWZlciIsInVzZXJMYXN0TmFtZSI6IldpbHNvbiIsInVzZXJuYW1lIjoidGVhY2hlcjJAZXhhbXBsZS5jb20iLCJyb2xlIjoiVGVhY2hlciIsImxvY2F0aW9ucyI6WyJNYWluIENhbXB1cyJdLCJpYXQiOjE3NTQ4MDMwMzR9.hjee-gbNbMhSHSTg7e42qawo5m9HaHIUBzCVkT1ZjS4",
    role: "Teacher",
    username: "teacher2@example.com",
  },
  teacherWithRoom: {
    label: "Teacher (Toddler 2)",
    token:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZW5hbnRJZCI6IjdjYjZjMjhkLTE2NGMtNDlmYS1iNDYxLWRmYzQ3YThhM2ZlZCIsInVzZXJJZCI6InRlYWNoZXJfcGFyZW50XzEyMyIsInVzZXJGaXJzdE5hbWUiOiJNYXJ5IiwidXNlckxhc3ROYW1lIjoiVGhvbXBzb24iLCJ1c2VybmFtZSI6Im1hcnkudGhvbXBzb25AZXhhbXBsZS5jb20iLCJyb2xlIjoidGVhY2hlciIsImxvY2F0aW9ucyI6WyJiZmQxZGMxNC02YzZiLTRmYTMtODkwYi1lNWIwOTZjZDI5ZjQiXSwibG9jYXRpb25OYW1lcyI6WyJNYWluIENhbXB1cyJdLCJyb29tSWQiOiJiZTNlNmE3Ni0xN2NiLTQ0MjEtODI0YS0yNzJlMjRjZjMwMmYiLCJyb29tTmFtZSI6IlRvZGRsZXIgMiIsImlhdCI6MTc1NTI0MjI4MH0.FjvFW1X8oQbe1bP_n4Nr46vO3sf7c0uHUtTcflfNNuE",
    role: "Teacher",
    username: "mary.thompson@example.com",
  },
  director: {
    label: "Director User",
    token:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZW5hbnRJZCI6IjdjYjZjMjhkLTE2NGMtNDlmYS1iNDYxLWRmYzQ3YThhM2ZlZCIsInVzZXJJZCI6ImRpcmVjdG9yMTIzIiwidXNlckZpcnN0TmFtZSI6Ik1pY2hhZWwiLCJ1c2VyTGFzdE5hbWUiOiJCcm93biIsInVzZXJuYW1lIjoiZGlyZWN0b3JAZXhhbXBsZS5jb20iLCJyb2xlIjoiRGlyZWN0b3IiLCJsb2NhdGlvbnMiOlsiTWFpbiBDYW1wdXMiLCJUaGlyZCBMb2NhdGlvbiJdLCJpYXQiOjE3NTQ4MDMwMzR9.5lPRnjVNB_r52opefcfqDMmX0Tg08kfiHfTlBCdLMBk",
    role: "Director",
    username: "director@example.com",
  },
  assistant_director: {
    label: "Assistant Director",
    token:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZW5hbnRJZCI6IjdjYjZjMjhkLTE2NGMtNDlmYS1iNDYxLWRmYzQ3YThhM2ZlZCIsInVzZXJJZCI6ImFzc2lzdGFudF9kaXJlY3RvcjEyMyIsInVzZXJGaXJzdE5hbWUiOiJFbWlseSIsInVzZXJMYXN0TmFtZSI6IkRhdmlzIiwidXNlcm5hbWUiOiJhc3Npc3RhbnRfZGlyZWN0b3JAZXhhbXBsZS5jb20iLCJyb2xlIjoiYXNzaXN0YW50X2RpcmVjdG9yIiwibG9jYXRpb25zIjpbIk1haW4gQ2FtcHVzIiwiVGhpcmQgTG9jYXRpb24iXSwiaWF0IjoxNzU0ODAzMDM0fQ.wXH-fetlXp4HFxwhLK8uvWpF1NFavoPhN7vWoczrFVU",
    role: "assistant_director", // Fixed: use underscore to match JWT token
    username: "assistant_director@example.com",
  },
  superadmin: {
    label: "Super Admin User",
    token:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZW5hbnRJZCI6IjdjYjZjMjhkLTE2NGMtNDlmYS1iNDYxLWRmYzQ3YThhM2ZlZCIsInVzZXJJZCI6InN1cGVyYWRtaW4xMjMiLCJ1c2VyRmlyc3ROYW1lIjoiU3VwZXIiLCJ1c2VyTGFzdE5hbWUiOiJBZG1pbiIsInVzZXJuYW1lIjoic3VwZXJhZG1pbkBleGFtcGxlLmNvbSIsInJvbGUiOiJTdXBlckFkbWluIiwibG9jYXRpb25zIjpbIk1haW4gQ2FtcHVzIiwiVGhpcmQgTG9jYXRpb24iXSwiaWF0IjoxNzU0ODAzMDM0fQ.sL6vGq831g17WnO_-TKWahkB2f-MtxTa9BqXnZtSPlI",
    role: "SuperAdmin",
    username: "superadmin@example.com",
  },
  parent: {
    label: "Parent (Toddler 2)",
    token:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZW5hbnRJZCI6IjdjYjZjMjhkLTE2NGMtNDlmYS1iNDYxLWRmYzQ3YThhM2ZlZCIsInVzZXJJZCI6InBhcmVudF90b2RkbGVyMl8xMjMiLCJ1c2VyRmlyc3ROYW1lIjoiTGlzYSIsInVzZXJMYXN0TmFtZSI6IkpvaG5zb24iLCJ1c2VybmFtZSI6Imxpc2Euam9obnNvbkBwYXJlbnQuY29tIiwicm9sZSI6InBhcmVudCIsImxvY2F0aW9ucyI6WyJiZmQxZGMxNC02YzZiLTRmYTMtODkwYi1lNWIwOTZjZDI5ZjQiXSwibG9jYXRpb25OYW1lcyI6WyJNYWluIENhbXB1cyJdLCJyb29tSWQiOiJiZTNlNmE3Ni0xN2NiLTQ0MjEtODI0YS0yNzJlMjRjZjMwMmYiLCJyb29tTmFtZSI6IlRvZGRsZXIgMiIsImNoaWxkUm9vbSI6ImJlM2U2YTc2LTE3Y2ItNDQyMS04MjRhLTI3MmUyNGNmMzAyZiIsImlhdCI6MTc1NTMxMjYxMn0.d5bIcAJRc5L66gRsQLw5XP54EEW-yXcFGq2NFdq8xgY",
    role: "parent",
    username: "lisa.johnson@parent.com",
  },
};

export function TokenSwitcher() {
  // Get current user from token
  const userInfo = getUserInfo();
  const getCurrentUserType = (): keyof typeof TEST_TOKENS => {
    if (!userInfo) return "admin";

    // Match by userId to determine which test token is active
    switch (userInfo.userId) {
      case "teacher123":
        return "teacher";
      case "teacher2_123":
        return "teacher2";
      case "teacher_parent_123":
        return "teacherWithRoom";
      case "director123":
        return "director";
      case "assistant_director123":
        return "assistant_director";
      case "superadmin123":
        return "superadmin";
      case "parent_toddler2_123":
        return "parent";
      case "e5b7f0de-c868-4e40-a0bd-e15937cb3097":
      default:
        return "admin";
    }
  };

  const [currentUser, setCurrentUser] =
    useState<keyof typeof TEST_TOKENS>(getCurrentUserType());
  const { toast } = useToast();

  const switchUser = (userType: keyof typeof TEST_TOKENS) => {
    const user = TEST_TOKENS[userType];

    // Clear ALL cached data first
    localStorage.clear();
    sessionStorage.clear();

    // Clear the in-memory auth token
    clearAuthToken();

    // Set the new token
    setAuthToken(user.token);
    setCurrentUser(userType);

    // Mark that the token was manually set
    localStorage.setItem("tokenManuallySet", "true");

    // If switching to SuperAdmin, ensure all locations are fetched and cached
    if (user.role === "SuperAdmin") {
      fetch("/api/locations", {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      })
        .then((res) => res.json())
        .then((locations) => {
          if (Array.isArray(locations)) {
            const locationNames = locations.map((loc) => loc.name);
            localStorage.setItem(
              "allLocationNames",
              JSON.stringify(locationNames),
            );
            console.log(
              "SuperAdmin: Cached all location names:",
              locationNames,
            );
          }
        })
        .catch((err) =>
          console.warn("Could not fetch locations for SuperAdmin:", err),
        );
    }

    // Pre-cache location names for Teacher 2 specifically
    if (userType === "teacher2") {
      console.log("Caching locations for Teacher 2: Main Campus");
      localStorage.setItem("cachedLocations", JSON.stringify(["Main Campus"]));
    }

    toast({
      title: "User Switched",
      description: `Now logged in as ${user.label} (${user.role})`,
    });

    // Force a hard reload to clear all caches
    setTimeout(() => {
      window.location.href = window.location.href;
    }, 100);
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
                <div className="text-xs text-muted-foreground">
                  {user.username}
                </div>
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
