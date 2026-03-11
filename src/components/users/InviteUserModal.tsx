import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Role } from "@/services/userManagementService";
import { Loader2, Copy, CheckCircle, Link } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InviteResponse {
  status: string;
  message: string;
  email: string;
  role: string;
  user_id: string;
  invitation_link: string;
  invitation_status: string;
  expires_at: string;
}

interface InviteUserModalProps {
  open: boolean;
  onClose: () => void;
  onInvite: (
    email: string,
    roleId: string,
    firstName?: string,
    lastName?: string
  ) => Promise<InviteResponse | void>;
  roles: Role[];
}

export function InviteUserModal({
  open,
  onClose,
  onInvite,
  roles,
}: InviteUserModalProps) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [roleId, setRoleId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inviteResult, setInviteResult] = useState<InviteResponse | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!email || !roleId) {
      setError("Please fill in email and role");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      setLoading(true);
      const result = await onInvite(email, roleId, firstName, lastName);
      if (result && (result as InviteResponse).invitation_link) {
        setInviteResult(result as InviteResponse);
      }
    } catch (err) {
      // Error handled by parent
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setFirstName("");
    setLastName("");
    setRoleId("");
    setError("");
    setInviteResult(null);
    onClose();
  };

  const copyInviteLink = async () => {
    if (inviteResult?.invitation_link) {
      try {
        await navigator.clipboard.writeText(inviteResult.invitation_link);
        toast({
          title: "Copied!",
          description: "Invitation link copied to clipboard",
          duration: 3000,
        });
      } catch (err) {
        console.error('Failed to copy link:', err);
        toast({
          title: "Error",
          description: "Failed to copy link to clipboard",
          variant: "destructive",
          duration: 3000,
        });
      }
    }
  };

  // Show success screen with invitation link
  if (inviteResult) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-500" />
              <DialogTitle>User Invited Successfully!</DialogTitle>
            </div>
            <DialogDescription>
              Share the invitation link below with {inviteResult.email}. They can use it to set up their account.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <Link className="h-4 w-4" />
                Invitation Link
              </Label>
              <div className="flex gap-2">
                <Input
                  value={inviteResult.invitation_link}
                  readOnly
                  className="flex-1 font-mono text-sm"
                />
                <Button variant="outline" size="sm" onClick={copyInviteLink}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                This link expires on {new Date(inviteResult.expires_at).toLocaleDateString()} at {new Date(inviteResult.expires_at).toLocaleTimeString()}
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> The user must complete registration using this link before it expires.
                Once registered, they can log in with their own password.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={copyInviteLink}>
              <Copy className="mr-2 h-4 w-4" />
              Copy Link
            </Button>
            <Button onClick={handleClose}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add User</DialogTitle>
          <DialogDescription>
            Add a new user to your portal. They will receive an invitation link
            to set up their account.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="role">Role *</Label>
              <Select
                value={roleId}
                onValueChange={setRoleId}
                disabled={loading}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error && (
              <p className="text-sm font-medium text-destructive">{error}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Invitation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
