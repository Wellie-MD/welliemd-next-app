import { useEffect, useCallback, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { MoreVertical, UserPlus, Loader2 } from "lucide-react";
import { userManagementService, PortalUser, Role } from '@/services/userManagementService';
import { InviteUserModal } from '@/components/users/InviteUserModal';
import { DeactivateUserModal } from '@/components/users/DeactivateUserModal';
import { UserProfileModal } from '@/components/users/UserProfileModal';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export default function UsersPermissions() {
  const [users, setUsers] = useState<PortalUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [deactivateModal, setDeactivateModal] = useState<{ open: boolean; userId: string; userName: string }>({
    open: false,
    userId: '',
    userName: '',
  });
  const [profileModal, setProfileModal] = useState<{ open: boolean; user: PortalUser | null }>({
    open: false,
    user: null,
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [usersData, rolesData] = await Promise.all([
        userManagementService.listUsers(),
        userManagementService.getAvailableRoles(),
      ]);

      // Add hardcoded Master Key user
      const hardcodedUser: PortalUser = {
        id: 'hardcoded-master-key',
        email: 'admin-welliemd@gmail.com',
        first_name: 'Admin',
        last_name: 'WellieMD',
        is_active: true,
        created_at: new Date().toISOString(),
        roles: ['Master Key'],
        primary_role: 'Master Key',
        invitation_status: 'active'
      };

      setUsers([hardcodedUser, ...usersData]);
      setRoles(rolesData);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleInviteUser = async (email: string, roleId: string, firstName?: string, lastName?: string) => {
    try {
      const response = await userManagementService.inviteUser({
        email,
        role_id: roleId,
        first_name: firstName,
        last_name: lastName,
      });

      // Show success message
      toast({
        title: 'Success',
        description: `Invitation created for ${email}`,
        duration: 5000,
      });

      // Reload data in background to show new user
      loadData().catch(err => {
        console.error('Failed to reload users:', err);
      });

      // Return response so modal can show invitation link
      return response;

    } catch (error: any) {
      console.error('Failed to create invitation:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to create invitation',
        variant: 'destructive',
      });
      throw error; // Re-throw to keep modal open on error
    }
  };

  const handleAssignRole = async (userId: string, roleId: string) => {
    try {
      await userManagementService.assignRole(userId, { role_id: roleId });
      toast({
        title: 'Success',
        description: 'Role assigned successfully',
      });
      loadData(); // Reload to show updated roles
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to assign role',
        variant: 'destructive',
      });
    }
  };

  const handleDeactivateUser = (userId: string, userName: string) => {
    setDeactivateModal({ open: true, userId, userName });
  };

  const confirmDeactivateUser = async () => {
    try {
      await userManagementService.deactivateUser(deactivateModal.userId);
      toast({
        title: 'Success',
        description: `User ${deactivateModal.userName} deactivated successfully`,
      });
      setDeactivateModal({ open: false, userId: '', userName: '' }); // Close modal
      loadData(); // Reload to update list
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to deactivate user',
        variant: 'destructive',
      });
    }
  };

  const handleUserClick = (user: PortalUser) => {
    // Show profile modal for all users in Admin Portal
    setProfileModal({ open: true, user });
  };

  // Group users by role
  const usersByRole = users.reduce((acc, user) => {
    const role = user.primary_role || 'No Role';
    if (!acc[role]) acc[role] = [];
    acc[role].push(user);
    return acc;
  }, {} as Record<string, PortalUser[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Use roles from hierarchy if possible
  const roleDisplayOrder = ['Master Key', 'Admin'];

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users & Permissions</h1>
          <p className="text-muted-foreground mt-1">
            Manage administrative users and their access levels for the platform.
          </p>
        </div>
        <Button onClick={() => setInviteModalOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Invite User
        </Button>
      </div>

      {/* Render sections for each role */}
      {roleDisplayOrder.map((roleName) => {
        const roleUsers = usersByRole[roleName] || [];
        if (roleUsers.length === 0) return null;

        return (
          <Card key={roleName} className="border-none shadow-sm bg-muted/30">
            <CardHeader className="pb-3 border-b bg-card/50">
              <CardTitle className="text-lg font-semibold flex items-center justify-between">
                <span>{roleName}</span>
                <Badge variant="secondary" className="font-normal">
                  {roleUsers.length} {roleUsers.length === 1 ? 'user' : 'users'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {roleUsers.map((user) => (
                  <UserCard
                    key={user.id}
                    user={user}
                    roles={roles}
                    onAssignRole={handleAssignRole}
                    onDeactivate={handleDeactivateUser}
                    onClick={() => handleUserClick(user)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Show users with other roles (e.g. Primary Owner if they exist in this list) */}
      {Object.entries(usersByRole).map(([roleName, roleUsers]) => {
        if (roleDisplayOrder.includes(roleName)) return null;

        return (
          <Card key={roleName} className="border-none shadow-sm bg-muted/30">
            <CardHeader className="pb-3 border-b bg-card/50">
              <CardTitle className="text-lg font-semibold flex items-center justify-between">
                <span>{roleName}</span>
                <Badge variant="secondary" className="font-normal">
                  {roleUsers.length} {roleUsers.length === 1 ? 'user' : 'users'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {roleUsers.map((user) => (
                  <UserCard
                    key={user.id}
                    user={user}
                    roles={roles}
                    onAssignRole={handleAssignRole}
                    onDeactivate={handleDeactivateUser}
                    onClick={() => handleUserClick(user)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      <InviteUserModal
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        onInvite={handleInviteUser}
        roles={roles}
      />

      <DeactivateUserModal
        open={deactivateModal.open}
        onClose={() => setDeactivateModal({ open: false, userId: '', userName: '' })}
        onConfirm={confirmDeactivateUser}
        userName={deactivateModal.userName}
      />

      <UserProfileModal
        open={profileModal.open}
        onClose={() => setProfileModal({ open: false, user: null })}
        user={profileModal.user}
      />
    </div>
  );
}

// User card component
function UserCard({ user, roles, onAssignRole, onDeactivate, onClick }: {
  user: PortalUser;
  roles: Role[];
  onAssignRole: (userId: string, roleId: string) => void;
  onDeactivate: (userId: string, userName: string) => void;
  onClick: () => void;
}) {
  const initials = `${user.first_name?.[0] || 'U'}${user.last_name?.[0] || ''}`.toUpperCase();
  const fullName = `${user.first_name} ${user.last_name}`.trim() || user.email;

  const copyToClipboard = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
  };

  // Get status badge based on invitation status
  const getStatusBadge = () => {
    if (user.invitation_status === 'pending') {
      return <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 text-xs">Pending</Badge>;
    }
    if (user.invitation_status === 'expired') {
      return <Badge variant="outline" className="text-red-600 border-red-300 bg-red-50 text-xs">Expired</Badge>;
    }
    return null; // Active users don't need a status badge
  };

  return (
    <div
      className="flex items-center justify-between p-5 hover:bg-accent/50 transition-colors cursor-pointer bg-card"
      onClick={onClick}
    >
      <div className="flex items-center gap-4 flex-1">
        <Avatar className="h-10 w-10 border shadow-sm">
          <AvatarFallback className="bg-primary text-primary-foreground font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm truncate">{fullName}</p>
            {getStatusBadge()}
          </div>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>

          {/* Show invitation link for pending users */}
          {user.invitation_status === 'pending' && user.invitation_link && (
            <div className="flex items-center gap-2 mt-1.5 bg-muted/50 p-1 px-2 rounded w-fit">
              <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                {user.invitation_link}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 px-1 text-[10px]"
                onClick={(e) => copyToClipboard(user.invitation_link!, e)}
              >
                Copy Link
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 ml-4">
        <Badge variant="outline" className="text-[10px] uppercase tracking-wider h-6">{user.primary_role}</Badge>

        {user.primary_role !== 'Master Key' && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px]">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onClick();
                }}
              >
                View Profile
              </DropdownMenuItem>

              {roles.map((role) => (
                <DropdownMenuItem
                  key={role.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAssignRole(user.id, role.id);
                  }}
                  disabled={user.primary_role === role.name}
                >
                  Assign {role.name}
                </DropdownMenuItem>
              ))}

              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeactivate(user.id, fullName);
                }}
                disabled={user.primary_role === 'Platform Owner'} // Example protection
              >
                Deactivate User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

      </div>
    </div>
  );
}
