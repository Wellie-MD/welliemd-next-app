import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Mail, Shield, Copy, Link, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { PortalUser } from '@/services/userManagementService';
import { useToast } from '@/hooks/use-toast';

interface UserProfileModalProps {
  open: boolean;
  onClose: () => void;
  user: PortalUser | null;
}

export function UserProfileModal({ open, onClose, user }: UserProfileModalProps) {
  const { toast } = useToast();

  if (!user) return null;

  const initials = `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
  const fullName = `${user.first_name} ${user.last_name}`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: `${label} copied to clipboard`,
      duration: 2000,
    });
  };

  // Determine invitation status display
  const getStatusBadge = () => {
    if (user.invitation_status === 'pending') {
      return <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">Pending Invitation</Badge>;
    }
    if (user.invitation_status === 'expired') {
      return <Badge variant="outline" className="text-red-600 border-red-300 bg-red-50">Invitation Expired</Badge>;
    }
    if (user.is_active) {
      return <Badge variant="default" className="bg-green-600">Active</Badge>;
    }
    return <Badge variant="secondary">Inactive</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle>{fullName}</DialogTitle>
              <DialogDescription>{user.email}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Role */}
          <div className="grid gap-2">
            <Label className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Role
            </Label>
            <div>
              <Badge variant="secondary" className="text-sm">
                {user.primary_role}
              </Badge>
            </div>
          </div>

          {/* Name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4" />
                First Name
              </Label>
              <Input value={user.first_name} disabled />
            </div>
            <div className="grid gap-2">
              <Label>Last Name</Label>
              <Input value={user.last_name} disabled />
            </div>
          </div>

          {/* Email */}
          <div className="grid gap-2">
            <Label className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Address
            </Label>
            <div className="flex gap-2">
              <Input value={user.email} disabled className="flex-1" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(user.email, 'Email')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Invitation Link (for pending users) */}
          {user.invitation_status === 'pending' && user.invitation_link && (
            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <Link className="h-4 w-4" />
                Invitation Link
              </Label>
              <div className="flex gap-2">
                <Input
                  value={user.invitation_link}
                  readOnly
                  className="flex-1 font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(user.invitation_link!, 'Invitation link')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              {user.invitation_expires_at && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Expires: {new Date(user.invitation_expires_at).toLocaleDateString()} at {new Date(user.invitation_expires_at).toLocaleTimeString()}
                </p>
              )}
              <div className="bg-amber-50 border border-amber-200 rounded-md p-2 mt-1">
                <p className="text-xs text-amber-800">
                  User must complete registration using this link before it expires.
                </p>
              </div>
            </div>
          )}

          {/* Active user confirmation */}
          {user.invitation_status === 'active' && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 border border-green-200 rounded-md p-3">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm font-medium">Account is active and registered</span>
            </div>
          )}

          {/* Expired invitation warning */}
          {user.invitation_status === 'expired' && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm font-medium">Invitation expired - resend invitation to user</span>
            </div>
          )}

          {/* Account Status */}
          <div className="grid gap-2">
            <Label>Account Status</Label>
            <div>{getStatusBadge()}</div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
