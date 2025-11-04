import { useState } from "react";
import { Copy, Download, Check, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";

interface PasswordDisplayModalProps {
  open: boolean;
  onClose: () => void;
  password: string;
  clientName: string;
}

export function PasswordDisplayModal({
  open,
  onClose,
  password,
  clientName,
}: PasswordDisplayModalProps) {
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Password copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy password",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    const content = `Client: ${clientName}\nDeployment Password: ${password}\n\nGenerated: ${new Date().toLocaleString()}\n\nIMPORTANT: Store this password securely. It will not be shown again.`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${clientName.replace(/\s+/g, "_")}_deployment_password.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Downloaded",
      description: "Password saved to file",
    });
  };

  const handleClose = () => {
    if (!confirmed) {
      toast({
        title: "Confirmation Required",
        description: "Please confirm that you have saved the password",
        variant: "destructive",
      });
      return;
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Check className="h-6 w-6 text-green-600" />
            Client Created Successfully!
          </DialogTitle>
          <DialogDescription>
            Save the deployment password securely. It will not be shown again.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Client Name */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Client Name</Label>
            <div className="p-3 bg-muted rounded-md">
              <p className="font-semibold">{clientName}</p>
            </div>
          </div>

          {/* Password Display */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Deployment Password</Label>
            <div className="relative">
              <div className="p-4 bg-slate-900 text-white rounded-md font-mono text-lg tracking-wider break-all">
                {password}
              </div>
              <div className="absolute top-2 right-2 flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleCopy}
                  className="h-8"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleDownload}
                  className="h-8"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-md">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-amber-900">
                Important Security Notice
              </p>
              <p className="text-sm text-amber-800">
                This password is shown only once and cannot be retrieved later. 
                The admin user can login to the client portal using their email and this password.
                Make sure to save it securely before closing this dialog.
              </p>
            </div>
          </div>

          {/* Confirmation Checkbox */}
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="confirm"
              checked={confirmed}
              onCheckedChange={(checked) => setConfirmed(checked as boolean)}
            />
            <Label
              htmlFor="confirm"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              I have saved the deployment password securely
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleClose}
            disabled={!confirmed}
            className="w-full sm:w-auto"
          >
            Close and Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
