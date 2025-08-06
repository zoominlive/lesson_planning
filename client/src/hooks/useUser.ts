import { useQuery } from "@tanstack/react-query";

export interface UserInfo {
  tenantId?: string;
  userId?: string;
  userFirstName?: string;
  userLastName?: string;
  username?: string;
  role?: string;
}

export function useUser() {
  return useQuery<UserInfo>({
    queryKey: ["/api/user"],
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}