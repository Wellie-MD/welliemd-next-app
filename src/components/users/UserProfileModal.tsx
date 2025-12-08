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
import { User, Mail, Shield, Key, Loader2, Copy, Eye, EyeOff } from "lucide-react";
import { PortalUser } from '@/services/userManagementService';
import { useToast } from '@/hooks/use-toast';

interface UserProfileModalProps {
  open: boolean;
  onClose: () => void;
  user: PortalUser | null;
}

export function UserProfileModal({ open, onClose, user }: UserProfileModalProps) {
  const [showPassword, setShowPassword] = useState(false);
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

          {/* Password (if available) */}
          {user.password && (
            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                Password
              </Label>
              <div className="flex gap-2">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={user.password}
                  disabled
                  className="flex-1 font-mono"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(user.password!, 'Password')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                This password was automatically generated and sent to the user via email.
              </p>
            </div>
          )}

          {/* Account Status */}
          <div className="grid gap-2">
            <Label>Account Status</Label>
            <div>
              <Badge variant={user.is_active ? 'default' : 'secondary'}>
                {user.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
