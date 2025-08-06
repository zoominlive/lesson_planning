import { useUser } from "@/hooks/useUser";
import { Badge } from "@/components/ui/badge";

export function UserInfo() {
  const { data: user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        Loading user info...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const fullName = user.userFirstName && user.userLastName 
    ? `${user.userFirstName} ${user.userLastName}`
    : user.username;

  return (
    <div className="flex items-center space-x-3 text-sm" data-testid="user-info">
      <div className="flex flex-col">
        <span className="font-medium text-foreground" data-testid="text-fullname">
          {fullName}
        </span>
        {user.username && fullName !== user.username && (
          <span className="text-xs text-muted-foreground" data-testid="text-username">
            @{user.username}
          </span>
        )}
      </div>
      {user.role && (
        <Badge variant="secondary" className="text-xs capitalize" data-testid="badge-role">
          {user.role}
        </Badge>
      )}
    </div>
  );
}