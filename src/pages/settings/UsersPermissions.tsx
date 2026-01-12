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
      setUsers(usersData);
      setRoles(rolesData);
    } catch (error) {
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
      
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to deactivate user',
        variant: 'destructive',
      });
    }
  };

  const handleUserClick = (user: PortalUser) => {
    // If clicking on Primary Owner's own card, redirect to manage account
    const isPrimaryOwner = user.primary_role === 'Primary Owner';
    const isCurrentUser = users.find(u => u.primary_role === 'Primary Owner')?.id === user.id;
    
    if (isPrimaryOwner && isCurrentUser) {
      navigate('/dashboard/manage-account');
    } else {
      // Show profile modal for other users
      setProfileModal({ open: true, user });
    }
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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Your team</h1>
          <p className="text-muted-foreground mt-1">
            Manage what users can see or do in your portal.
          </p>
        </div>
        <Button onClick={() => setInviteModalOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Invite User
        </Button>
      </div>

      {/* Render sections for each role */}
      {['Primary Owner', 'Admin', 'Customer Service'].map((roleName) => {
        const roleUsers = usersByRole[roleName] || [];
        if (roleUsers.length === 0) return null;

        return (
          <Card key={roleName}>
            <CardHeader>
              <CardTitle className="text-lg font-medium">
                {roleName} ({roleUsers.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
  const initials = `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
  const fullName = `${user.first_name} ${user.last_name}`;
  const isPrimaryOwner = user.primary_role === 'Primary Owner';

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
      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center gap-3 flex-1">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-primary text-primary-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-medium">{fullName}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          
          {/* Show invitation link for pending users */}
          {user.invitation_status === 'pending' && user.invitation_link && (
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                Invite: {user.invitation_link}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 px-2 text-xs"
                onClick={(e) => copyToClipboard(user.invitation_link!, e)}
              >
                Copy Link
              </Button>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {getStatusBadge()}
        <Badge variant="secondary">{user.primary_role}</Badge>
        
        {!isPrimaryOwner && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {roles.map((role) => (
                <DropdownMenuItem
                  key={role.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAssignRole(user.id, role.id);
                  }}
                >
                  Change to {role.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDeactivate(user.id, fullName);
                }}
                className="text-destructive"
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