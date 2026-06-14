import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Loader2,
  Save,
  AlertTriangle,
  Copy,
  Check,
  ShieldCheck,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { junctionSettingsApi, type JunctionTenantConfig } from "@/api/junctionSettingsApi";

export default function JunctionSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  // Form State
  const [enabled, setEnabled] = useState(false);
  const [environment, setEnvironment] = useState<'sandbox' | 'production'>('sandbox');
  const [region, setRegion] = useState<'us' | 'eu'>('us');
  const [baseUrl, setBaseUrl] = useState("");
  const [teamId, setTeamId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");

  // Fetch current Junction configuration
  const { data: config, isLoading, error } = useQuery<JunctionTenantConfig>({
    queryKey: ["junction-settings"],
    queryFn: () => junctionSettingsApi.getConfig(),
  });

  // Sync state when config is fetched
  useEffect(() => {
    if (config) {
      setEnabled(config.enabled);
      setEnvironment(config.environment);
      setRegion(config.region);
      setBaseUrl(config.base_url || "");
      setTeamId(config.team_id || "");
      // Keep secret fields blank in UI state so we don't overwrite with masked placeholders
      setApiKey("");
      setWebhookSecret("");
    }
  }, [config]);

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: (payload: {
      enabled: boolean;
      environment: 'sandbox' | 'production';
      region: 'us' | 'eu';
      base_url?: string;
      team_id: string;
      api_key?: string;
      webhook_secret?: string;
    }) => junctionSettingsApi.updateConfig(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["junction-settings"] });
      toast({
        title: "Configuration Saved",
        description: "Junction Labs settings updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Save",
        description:
          error.response?.data?.detail ||
          error.response?.data?.message ||
          Object.values(error.response?.data || {}).flat().join(", ") ||
          "Failed to update Junction settings",
        variant: "destructive",
      });
    },
  });

  // Validate Mutation
  const validateMutation = useMutation({
    mutationFn: () => junctionSettingsApi.validateConnection(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["junction-settings"] });
      if (data.valid) {
        toast({
          title: "Connection Succeeded",
          description: data.message || `Credentials verified successfully. Found ${data.catalog_count || 0} catalog tests.`,
        });
      } else {
        toast({
          title: "Connection Failed",
          description: data.error || "Credentials could not be verified.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Validation Error",
        description:
          error.response?.data?.detail ||
          error.response?.data?.error ||
          "Failed to connect to Junction API",
        variant: "destructive",
      });
    },
  });

  const handleCopyWebhook = () => {
    if (config?.webhook_url) {
      navigator.clipboard.writeText(config.webhook_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied",
        description: "Webhook URL copied to clipboard.",
      });
    }
  };

  const handleSave = () => {
    // If enabling, perform quick client-side checks
    if (enabled) {
      if (config?.validation_status !== "valid") {
        toast({
          title: "Validation Required",
          description: "Save the credentials, validate the Junction connection, then enable the integration.",
          variant: "destructive",
        });
        return;
      }
      if (!teamId.trim()) {
        toast({
          title: "Required Field",
          description: "Junction Team ID is required when enabled.",
          variant: "destructive",
        });
        return;
      }
      if (!config?.has_api_key && !apiKey.trim()) {
        toast({
          title: "Required Field",
          description: "Junction API Key is required when enabled.",
          variant: "destructive",
        });
        return;
      }
      if (!config?.has_webhook_secret && !webhookSecret.trim()) {
        toast({
          title: "Required Field",
          description: "Junction Webhook Secret is required when enabled.",
          variant: "destructive",
        });
        return;
      }
    }

    const payload: any = {
      enabled,
      environment,
      region,
      base_url: baseUrl.trim(),
      team_id: teamId,
    };

    if (apiKey.trim()) {
      payload.api_key = apiKey;
    }
    if (webhookSecret.trim()) {
      payload.webhook_secret = webhookSecret;
    }

    updateMutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Failed to Load Settings</h2>
        <p className="text-muted-foreground">
          Unable to load Junction configuration. Please try again later.
        </p>
      </div>
    );
  }

  const isConfigured = config?.has_api_key && config?.has_webhook_secret && config?.team_id;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Junction Labs Settings</h1>
          <p className="text-muted-foreground text-sm">
            Manage your tenant-level lab integration, credentials, and webhook endpoints.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Main Configuration Card */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="space-y-1">
              <CardTitle className="text-lg">Junction Credentials</CardTitle>
              <CardDescription>
                Configure Team tokens and region settings to enable direct communication.
              </CardDescription>
            </div>
            <div>
              {config?.validation_status === "valid" ? (
                <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20">
                  Connected
                </Badge>
              ) : config?.validation_status === "invalid" ? (
                <Badge variant="destructive">
                  Connection Failed
                </Badge>
              ) : (
                <Badge variant="secondary">
                  Not Validated
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="junction_env">Junction Environment</Label>
                <Select
                  value={environment}
                  onValueChange={(val) => setEnvironment(val as any)}
                >
                  <SelectTrigger id="junction_env" className="w-full">
                    <SelectValue placeholder="Select environment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
                    <SelectItem value="production">Production (Live)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="junction_region">Junction Region</Label>
                <Select
                  value={region}
                  onValueChange={(val) => setRegion(val as any)}
                >
                  <SelectTrigger id="junction_region" className="w-full">
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="us">United States (US)</SelectItem>
                    <SelectItem value="eu">Europe (EU)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Base URL */}
            <div className="space-y-2">
              <Label htmlFor="base_url">Junction API Base URL</Label>
              <Input
                id="base_url"
                placeholder="https://api.sandbox.us.junction.com"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave blank only when the tenant should use the backend default Junction base URL.
              </p>
            </div>

            {/* Team ID */}
            <div className="space-y-2">
              <Label htmlFor="team_id">Junction Team ID</Label>
              <Input
                id="team_id"
                placeholder="e.g. team_abc123"
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
              />
            </div>

            {/* API Key */}
            <div className="space-y-2">
              <Label htmlFor="api_key">Junction Team API Key</Label>
              <Input
                id="api_key"
                type="password"
                placeholder={config?.has_api_key ? `${config.api_key_display} (Saved)` : "Enter raw API key"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>

            {/* Webhook Secret */}
            <div className="space-y-2">
              <Label htmlFor="webhook_secret">Junction Webhook Secret</Label>
              <Input
                id="webhook_secret"
                type="password"
                placeholder={config?.has_webhook_secret ? `${config.webhook_secret_display} (Saved)` : "Enter webhook secret (starts with whsec_)"}
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
              />
            </div>

            {/* Integration Status Toggle */}
            <div className="flex items-center justify-between pt-6 border-t">
              <div className="space-y-1">
                <Label htmlFor="enabled" className="text-base font-semibold">
                  Enable Junction Labs Integration
                </Label>
                <p className="text-sm text-muted-foreground">
                  Enable to automate user/order submissions upon doctor prescription concluded.
                </p>
              </div>
              <Switch
                id="enabled"
                checked={enabled}
                onCheckedChange={setEnabled}
              />
            </div>

            {/* Action Buttons */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex gap-4">
                <Button
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                  className="flex-1 md:flex-initial"
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Configuration
                </Button>

                <Button
                  variant="outline"
                  onClick={() => validateMutation.mutate()}
                  disabled={validateMutation.isPending || !isConfigured}
                  className="flex-1 md:flex-initial"
                >
                  {validateMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="mr-2 h-4 w-4" />
                  )}
                  Validate Connection
                </Button>
              </div>

              {config?.validation_status === "invalid" && config?.validation_error && (
                <p className="text-xs text-destructive font-mono bg-destructive/5 border border-destructive/10 p-3 rounded-md break-all">
                  Error: {config.validation_error}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Webhook URLs Display Card */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Webhook Configuration</CardTitle>
            <CardDescription>
              Junction delivers real-time lab order and result updates directly to this URL.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 border">
              <div className="font-mono text-sm break-all select-all select-none">
                {config?.webhook_url || "https://your-domain.com/api/v1/webhooks/junction/"}
              </div>
              <Button
                size="sm"
                variant="secondary"
                className="shrink-0"
                onClick={handleCopyWebhook}
                disabled={!config?.webhook_url}
              >
                {copied ? (
                  <Check className="h-4 w-4 mr-2 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                {copied ? "Copied" : "Copy URL"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
