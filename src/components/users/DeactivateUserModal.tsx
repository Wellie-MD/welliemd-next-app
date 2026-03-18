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
import { AlertTriangle, Loader2 } from "lucide-react";

interface DeactivateUserModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userName: string;
}

export function DeactivateUserModal({ open, onClose, onConfirm, userName }: DeactivateUserModalProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirm();
    } catch (error) {
      // Error handled by parent
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <DialogTitle>Deactivate User</DialogTitle>
          </div>
          <DialogDescription>
            Are you sure you want to deactivate <strong>{userName}</strong>?
            <br />
            <br />
            They will no longer be able to access the portal. You can reactivate them later if needed.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            type="button" 
            variant="destructive" 
            onClick={handleConfirm} 
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Deactivate User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
