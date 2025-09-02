import React from 'react';
import { Link } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Settings, 
  LogOut, 
  Shield, 
  Bell,
  HelpCircle,
  ChevronDown,
} from 'lucide-react';
import { useAuth, useProfile } from '@/features/auth';
import { UserRole } from '@/features/auth/types/auth.types';

interface UserProfileDropdownProps {
  className?: string;
}

export const UserProfileDropdown: React.FC<UserProfileDropdownProps> = ({ 
  className = '' 
}) => {
  const { logout, isLoading } = useAuth();
  const { user, getDisplayName, getInitials } = useProfile();

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
      // Logout will still happen via the auth store even if API call fails
    }
  };

  const getRoleBadgeVariant = (role?: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'destructive';
      case UserRole.PROVIDER:
        return 'default';
      case UserRole.PATIENT:
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getRoleDisplayName = (role?: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'Administrator';
      case UserRole.PROVIDER:
        return 'Provider';
      case UserRole.PATIENT:
        return 'Patient';
      default:
        return 'User';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={`flex items-center gap-2 h-auto p-2 hover:bg-accent ${className}`}
        >
          <Avatar className="h-8 w-8">
            <AvatarImage 
              src={user.avatar} 
              alt={getDisplayName()}
            />
            <AvatarFallback className="text-sm">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex flex-col items-start text-left">
            <span className="text-sm font-medium leading-none">
              {getDisplayName()}
            </span>
            <span className="text-xs text-muted-foreground">
              {user.email}
            </span>
          </div>
          
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="pb-2">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center gap-2">
              <Avatar className="h-10 w-10">
                <AvatarImage 
                  src={user.avatar} 
                  alt={getDisplayName()}
                />
                <AvatarFallback>
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <p className="text-sm font-medium leading-none">
                  {getDisplayName()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {user.email}
                </p>
              </div>
            </div>
            
            {user.role && (
              <div className="flex items-center gap-2">
                <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
                  {getRoleDisplayName(user.role)}
                </Badge>
                {user.status === 'pending_verification' && (
                  <Badge variant="outline" className="text-xs">
                    Unverified
                  </Badge>
                )}
              </div>
            )}
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link to="/profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link to="/settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link to="/notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
          </Link>
        </DropdownMenuItem>

        {user.role === UserRole.ADMIN && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/admin" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Admin Panel</span>
              </Link>
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link to="/help" className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            <span>Help & Support</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleLogout}
          disabled={isLoading}
          className="flex items-center gap-2 text-destructive focus:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          <span>{isLoading ? 'Signing out...' : 'Sign out'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

/**
 * Compact version for mobile or smaller spaces
 */
export const UserProfileDropdownCompact: React.FC<UserProfileDropdownProps> = ({ 
  className = '' 
}) => {
  const { logout, isLoading } = useAuth();
  const { user, getDisplayName, getInitials } = useProfile();

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`h-8 w-8 rounded-full ${className}`}
        >
          <Avatar className="h-8 w-8">
            <AvatarImage 
              src={user.avatar} 
              alt={getDisplayName()}
            />
            <AvatarFallback className="text-sm">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {getDisplayName()}
            </p>
            <p className="text-xs text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link to="/profile">
            <User className="h-4 w-4 mr-2" />
            Profile
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link to="/settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleLogout}
          disabled={isLoading}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="h-4 w-4 mr-2" />
          {isLoading ? 'Signing out...' : 'Sign out'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
