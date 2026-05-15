import { useCallback, useEffect, useState } from "react";
import type { AxiosError } from "axios";
import { CheckCircle2, Copy, Globe, Lock, Plus, RefreshCw, Trash2 } from "lucide-react";

import {
  CustomDomain,
  CustomDomainPortalType,
  customDomainsApi,
} from "@/api/customDomainsApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useClients } from "@/hooks/useClients";
import { usePermissions } from "@/hooks/usePermissions";
import { Permissions } from "@/constants/permissions";

const portalLabels: Record<CustomDomainPortalType, string> = {
  client: "Client/Staff Portal",
  patient: "Patient Portal",
  intake: "Intake App",
};

function statusBadge(status: CustomDomain["status"]) {
  switch (status) {
    case "verified":
      return "bg-green-100 text-green-800 hover:bg-green-100";
    case "validating":
    case "pending_validation":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
    case "failed":
      return "bg-red-100 text-red-800 hover:bg-red-100";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-100";
  }
}

function statusLabel(status: CustomDomain["status"]) {
  return status.replace(/_/g, " ");
}

type ApiErrorBody = {
  error?: string;
  detail?: string;
  message?: string;
  [key: string]: unknown;
};

function stringifyApiMessage(value: unknown): string | undefined {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value.map(stringifyApiMessage).filter(Boolean).join(" ");
  }
  if (typeof value === "object") {
    return Object.values(value)
      .map(stringifyApiMessage)
      .filter(Boolean)
      .join(" ");
  }
  return undefined;
}

function errorMessage(error: unknown, fallback: string) {
  const axiosError = error as AxiosError<ApiErrorBody>;
  return (
    stringifyApiMessage(axiosError.response?.data?.error) ||
    stringifyApiMessage(axiosError.response?.data?.detail) ||
    stringifyApiMessage(axiosError.response?.data?.message) ||
    stringifyApiMessage(axiosError.response?.data) ||
    (error instanceof Error ? error.message : fallback)
  );
}

const TWO_PART_TLDS = new Set(["co.uk", "com.br", "com.au", "co.nz", "co.jp", "or.jp"]);

function normalizeHostname(value: string) {
  const raw = value.trim().toLowerCase();
  if (!raw) return "";

  const withoutProtocol = raw.includes("://") ? raw.split("://")[1] : raw;
  return withoutProtocol.split("/")[0].split(":")[0].replace(/\.+$/, "");
}

function splitAmplifyDomain(hostname: string): { rootDomain: string; prefix: string } | null {
  const labels = hostname.split(".").filter(Boolean);
  if (labels.length < 2) return null;

  const suffix = labels.slice(-2).join(".");
  if (labels.length >= 3 && TWO_PART_TLDS.has(suffix)) {
    return {
      rootDomain: labels.slice(-3).join("."),
      prefix: labels.slice(0, -3).join("."),
    };
  }

  return {
    rootDomain: labels.slice(-2).join("."),
    prefix: labels.slice(0, -2).join("."),
  };
}

function buildPortalPreview(value: string) {
  const hostname = normalizeHostname(value);
  if (!hostname) return null;

  const parsed = splitAmplifyDomain(hostname);
  if (!parsed) return null;

  const rootDomain = parsed.prefix ? parsed.rootDomain : hostname;
  return {
    rootDomain,
    adminDomain: `admin.${rootDomain}`,
    patientDomain: `patient.${rootDomain}`,
    isBareRootInput: !parsed.prefix,
  };
}

function mergeDomains(current: CustomDomain[], incoming: CustomDomain[]) {
  const byId = new Map(current.map((item) => [item.id, item]));
  for (const item of incoming) {
    byId.set(item.id, item);
  }
  return Array.from(byId.values()).sort(
    (left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
  );
}

export default function Domains() {
  const { toast } = useToast();
  const { currentClient } = useClients();
  const { hasPermission } = usePermissions();
  const canManageDomains = hasPermission(Permissions.CLIENT_DOMAIN_MANAGE);

  const [domains, setDomains] = useState<CustomDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [domain, setDomain] = useState("");
  const [portalType, setPortalType] = useState<CustomDomainPortalType>("client");
  const preview = buildPortalPreview(domain);
  const singleAddBlockedForRoot = Boolean(
    preview?.isBareRootInput && portalType !== "intake"
  );

  const loadDomains = useCallback(async (showToast = false) => {
    try {
      setLoading(true);
      const data = await customDomainsApi.list();
      setDomains(data);
      if (showToast) {
        toast({ title: "Domains refreshed" });
      }
    } catch (error: unknown) {
      toast({
        title: "Could not load domains",
        description: errorMessage(error, "Failed to load domains"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!canManageDomains) return;
    loadDomains();
  }, [canManageDomains, loadDomains]);

  useEffect(() => {
    if (!canManageDomains) return;
    const hasPending = domains.some((item) =>
      ["pending_validation", "validating"].includes(item.status)
    );
    if (!hasPending) return;
    const interval = window.setInterval(() => loadDomains(), 30000);
    return () => window.clearInterval(interval);
  }, [canManageDomains, domains, loadDomains]);

  async function addDomain() {
    if (!domain.trim()) {
      toast({ title: "Domain is required", variant: "destructive" });
      return;
    }
    if (singleAddBlockedForRoot) {
      toast({
        title: "Use setup both portals",
        description: "Root domains must be provisioned as admin and patient portal subdomains together.",
        variant: "destructive",
      });
      return;
    }
    try {
      setSubmitting(true);
      const created = await customDomainsApi.create({
        domain: domain.trim(),
        portal_type: portalType,
      });
      setDomains((current) => mergeDomains(current, [created]));
      setDomain("");
      setPortalType("client");
      setDialogOpen(false);
      toast({
        title: "Domain added",
        description: "Add the DNS records shown below, then verify the domain.",
      });
    } catch (error: unknown) {
      toast({
        title: "Could not add domain",
        description: errorMessage(error, "Failed to add domain"),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function setupBothPortals() {
    if (!domain.trim()) {
      toast({ title: "Domain is required", variant: "destructive" });
      return;
    }

    if (!preview) {
      toast({ title: "Enter a valid root domain", variant: "destructive" });
      return;
    }

    try {
      setSubmitting(true);
      const created = await customDomainsApi.setupPortals({
        domain: preview.rootDomain,
      });
      setDomains((current) => mergeDomains(current, created));
      setDomain("");
      setPortalType("client");
      setDialogOpen(false);
      toast({
        title: "Both portal domains added",
        description: "Add the DNS records shown below for admin and patient, then verify them after propagation.",
      });
    } catch (error: unknown) {
      toast({
        title: "Could not set up both portals",
        description: errorMessage(error, "Failed to add portal domains"),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function verifyDomain(id: string) {
    try {
      const updated = await customDomainsApi.verify(id);
      setDomains((current) => current.map((item) => (item.id === id ? updated : item)));
      toast({
        title: updated.status === "verified" ? "Domain verified" : "Still validating",
        description:
          updated.status === "verified"
            ? "This custom domain is now active."
            : "DNS has not propagated yet. Try again in a few minutes.",
      });
    } catch (error: unknown) {
      toast({
        title: "Verification failed",
        description: errorMessage(error, "Failed to verify domain"),
        variant: "destructive",
      });
    }
  }

  async function deleteDomain(item: CustomDomain) {
    if (item.is_locked) return;
    if (!window.confirm(`Delete ${item.domain}?`)) return;
    try {
      await customDomainsApi.delete(item.id);
      setDomains((current) => current.filter((domainItem) => domainItem.id !== item.id));
      toast({ title: "Domain deleted" });
    } catch (error: unknown) {
      toast({
        title: "Could not delete domain",
        description: errorMessage(error, "Failed to delete domain"),
        variant: "destructive",
      });
    }
  }

  async function copyRecord(value?: string) {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    toast({ title: "Copied" });
  }

  if (!canManageDomains) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Domains</CardTitle>
            <CardDescription>
              Only Primary Owner and Admin users can manage custom domains.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const defaultUrls = [
    ["Client/Staff Portal", currentClient?.admin_panel_domain],
    ["Patient Portal", currentClient?.patient_portal_domain],
    ["Intake App", currentClient?.questionnaire_url],
    ["API", currentClient?.api_endpoint],
  ].filter(([, value]) => Boolean(value));

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Domains</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Connect custom domains while keeping your WellieMD-managed URLs active.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={() => loadDomains(true)} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add domain
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">WellieMD Managed URLs</CardTitle>
          <CardDescription>These default URLs remain active and cannot be removed.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {defaultUrls.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <div className="text-sm font-medium">{label}</div>
                <div className="text-sm text-muted-foreground">{value}</div>
              </div>
              <Badge variant="outline">Default</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Custom Domains</CardTitle>
          <CardDescription>Add DNS records, then verify each domain when propagation completes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading && domains.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">Loading domains...</div>
          ) : domains.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">No custom domains configured.</div>
          ) : (
            domains.map((item) => (
              <div key={item.id} className="rounded-lg border p-4 space-y-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{item.domain}</span>
                      {item.is_locked && <Lock className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {portalLabels[item.portal_type] || item.portal_type}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={statusBadge(item.status)}>{statusLabel(item.status)}</Badge>
                    {item.status !== "verified" && (
                      <Button variant="outline" size="sm" onClick={() => verifyDomain(item.id)}>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Verify
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={item.is_locked}
                      onClick={() => deleteDomain(item)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>

                {item.last_error?.error && (
                  <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                    {item.last_error.error}
                  </div>
                )}

                {item.validation_records?.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">DNS records</div>
                    {item.validation_records.map((record, index) => (
                      <div key={`${item.id}-${index}`} className="grid gap-2 rounded-md bg-muted p-3 text-sm md:grid-cols-[90px_1fr_1fr_auto]">
                        <div className="font-medium">{record.type || "CNAME"}</div>
                        <div className="break-all">{record.name || "-"}</div>
                        <div className="break-all text-muted-foreground">{record.value || "-"}</div>
                        <Button variant="ghost" size="sm" onClick={() => copyRecord(record.value)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add custom domain</DialogTitle>
            <DialogDescription>
              Enter the full hostname you want to connect. Do not include http:// or https://.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="custom-domain">Domain</Label>
              <Input
                id="custom-domain"
                value={domain}
                onChange={(event) => setDomain(event.target.value)}
                placeholder="joinmyclinic.com or portal.myclinic.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Destination</Label>
              <Select value={portalType} onValueChange={(value) => setPortalType(value as CustomDomainPortalType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Client/Staff Portal</SelectItem>
                  <SelectItem value="patient">Patient Portal</SelectItem>
                  <SelectItem value="intake">Intake App</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {preview && (
              <div className="rounded-lg border bg-muted/40 p-3 text-sm space-y-2">
                <div className="font-medium">Portal mapping preview</div>
                <div className="text-muted-foreground">
                  Client/Staff Portal: {preview.adminDomain}
                </div>
                <div className="text-muted-foreground">
                  Patient Portal: {preview.patientDomain}
                </div>
                {preview.isBareRootInput && (
                  <div className="text-xs text-muted-foreground">
                    Root domains are automatically mapped to fixed portal subdomains to avoid Amplify certificate conflicts.
                  </div>
                )}
                {singleAddBlockedForRoot && (
                  <div className="text-xs font-medium text-amber-700">
                    Use Setup both portals for this root domain.
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={setupBothPortals}
              disabled={submitting || !preview}
            >
              {submitting ? "Setting up..." : "Setup both portals"}
            </Button>
            <Button
              variant="outline"
              onClick={addDomain}
              disabled={submitting || singleAddBlockedForRoot}
            >
              {submitting ? "Adding..." : singleAddBlockedForRoot ? "Use setup both" : "Add domain"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
