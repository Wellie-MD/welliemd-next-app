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

interface ClientDetails {
  clientId: string;
  adminEmail: string;
  adminPanelDomain: string;
  apiEndpoint: string;
  questionnaireUrl?: string;
  customDomain?: string;
  domain?: string;
  subdomain?: string;
}

interface PasswordDisplayModalProps {
  open: boolean;
  onClose: () => void;
  password: string;
  clientName: string;
  clientDetails: ClientDetails;
}

export function PasswordDisplayModal({
  open,
  onClose,
  password,
  clientName,
  clientDetails,
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
    const content = [
      `Client: ${clientName}`,
      `Client ID: ${clientDetails.clientId}`,
      `Admin Email: ${clientDetails.adminEmail}`,
      `Client Portal Domain: ${clientDetails.adminPanelDomain}`,
      `API Endpoint: ${clientDetails.apiEndpoint}`,
      clientDetails.questionnaireUrl ? `Questionnaire URL: ${clientDetails.questionnaireUrl}` : null,
      clientDetails.customDomain ? `Custom Domain: ${clientDetails.customDomain}` : null,
      clientDetails.domain ? `API Domain: ${clientDetails.domain}` : null,
      clientDetails.subdomain ? `Questionnaire Host: ${clientDetails.subdomain}` : null,
      "",
      `Deployment Password: ${password}`,
      "",
      `Generated: ${new Date().toLocaleString()}`,
      "",
      "IMPORTANT: Store these credentials securely. They will not be shown again.",
    ]
      .filter(Boolean)
      .join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${clientName.replace(/\s+/g, "_")}_primary_owner_credentials.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Downloaded",
      description: "Credentials saved to file",
    });
  };

  const handleClose = () => {
    if (!confirmed) {
      toast({
        title: "Confirmation Required",
        description: "Please confirm that you have saved the client details and deployment password",
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
            Save the client details and deployment password securely. They will not be shown again.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2 rounded-md border bg-muted/30 p-3">
              <Label className="text-sm font-medium">Client Name</Label>
              <p className="break-all font-semibold">{clientName}</p>
            </div>
            <div className="space-y-2 rounded-md border bg-muted/30 p-3">
              <Label className="text-sm font-medium">Client ID</Label>
              <p className="break-all font-mono text-sm">{clientDetails.clientId}</p>
            </div>
            <div className="space-y-2 rounded-md border bg-muted/30 p-3">
              <Label className="text-sm font-medium">Admin Email</Label>
              <p className="break-all font-mono text-sm">{clientDetails.adminEmail}</p>
            </div>
            <div className="space-y-2 rounded-md border bg-muted/30 p-3">
              <Label className="text-sm font-medium">Client Portal Domain</Label>
              <p className="break-all font-mono text-sm">{clientDetails.adminPanelDomain}</p>
            </div>
            <div className="space-y-2 rounded-md border bg-muted/30 p-3">
              <Label className="text-sm font-medium">API Endpoint</Label>
              <p className="break-all font-mono text-sm">{clientDetails.apiEndpoint}</p>
            </div>
            {clientDetails.questionnaireUrl ? (
              <div className="space-y-2 rounded-md border bg-muted/30 p-3">
                <Label className="text-sm font-medium">Questionnaire URL</Label>
                <p className="break-all font-mono text-sm">{clientDetails.questionnaireUrl}</p>
              </div>
            ) : null}
            {clientDetails.customDomain ? (
              <div className="space-y-2 rounded-md border bg-muted/30 p-3">
                <Label className="text-sm font-medium">Custom Domain</Label>
                <p className="break-all font-mono text-sm">{clientDetails.customDomain}</p>
              </div>
            ) : null}
            {clientDetails.domain ? (
              <div className="space-y-2 rounded-md border bg-muted/30 p-3">
                <Label className="text-sm font-medium">API Domain</Label>
                <p className="break-all font-mono text-sm">{clientDetails.domain}</p>
              </div>
            ) : null}
            {clientDetails.subdomain ? (
              <div className="space-y-2 rounded-md border bg-muted/30 p-3">
                <Label className="text-sm font-medium">Questionnaire Host</Label>
                <p className="break-all font-mono text-sm">{clientDetails.subdomain}</p>
              </div>
            ) : null}
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
                The client's Primary Owner account can log in to the client portal using the email above and this password.
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
              I have saved the client details and deployment password securely
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
