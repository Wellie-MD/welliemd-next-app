import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Info, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { belugaSettingsApi, type BelugaSettings as BelugaSettingsType } from "@/api/belugaSettingsApi";

// Helper component for field info tooltips
const FieldInfo = ({ content }: { content: string }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Info className="h-4 w-4 text-muted-foreground cursor-help inline-block ml-1" />
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p className="text-sm">{content}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export default function BelugaSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showProductionConfirmDialog, setShowProductionConfirmDialog] = useState(false);
  const [pendingEnvironment, setPendingEnvironment] = useState<'staging' | 'production'>('staging');

  // Fetch current Beluga settings
  const { data: settings, isLoading, error } = useQuery<BelugaSettingsType>({
    queryKey: ["beluga-settings"],
    queryFn: () => belugaSettingsApi.getCurrent(),
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (environment: 'staging' | 'production') =>
      belugaSettingsApi.updateEnvironment({ beluga_environment: environment }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["beluga-settings"] });
      toast({
        title: "Settings Updated",
        description: `Beluga environment changed to ${data.beluga_environment}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description:
          error.response?.data?.detail ||
          error.response?.data?.message ||
          "Failed to update Beluga settings",
        variant: "destructive",
      });
    },
  });

  const handleToggle = (checked: boolean) => {
    const newEnvironment = checked ? 'production' : 'staging';
    
    if (newEnvironment === 'production') {
      // Show confirmation dialog for production
      setPendingEnvironment('production');
      setShowProductionConfirmDialog(true);
    } else {
      // Directly switch to staging (no confirmation needed)
      updateMutation.mutate('staging');
    }
  };

  const confirmProductionSwitch = () => {
    updateMutation.mutate('production');
    setShowProductionConfirmDialog(false);
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
          Unable to load Beluga settings. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Beluga Settings</h1>
          <p className="text-muted-foreground">
            Manage your Beluga integration configuration
          </p>
        </div>
      </div>

      {/* Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Configuration</CardTitle>
          <CardDescription>
            Configure your Beluga Health integration settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Beluga Company Name (Read-only) */}
          <div className="space-y-2">
            <Label htmlFor="beluga_company">
              Beluga Company Name
              <FieldInfo content="Your company identifier in Beluga's system. This is configured by your administrator." />
            </Label>
            <Input
              id="beluga_company"
              value={settings?.beluga_company || "Not configured"}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              This value is set by your administrator and cannot be changed here.
            </p>
          </div>

          {/* Environment Toggle */}
          <div className="flex items-center justify-between py-4 border-t">
            <div className="space-y-1">
              <Label htmlFor="beluga_environment" className="text-base">
                Beluga Environment
                <FieldInfo content="Controls which Beluga environment receives visit data. Production sends real data, Staging is for testing." />
              </Label>
              <p className="text-sm text-muted-foreground">
                Current: <span className={`font-medium ${settings?.beluga_environment === 'production' ? 'text-green-600' : 'text-orange-500'}`}>
                  {settings?.beluga_environment === 'production' ? 'Production' : 'Staging'}
                </span>
              </p>
              {settings?.beluga_environment === 'production' && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Live visits are being sent to Beluga Production
                </p>
              )}
            </div>
            <Switch
              id="beluga_environment"
              checked={settings?.beluga_environment === 'production'}
              onCheckedChange={handleToggle}
              disabled={updateMutation.isPending}
            />
          </div>

          {/* Warning for Production */}
          {settings?.beluga_environment === 'staging' && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-orange-800">Staging Mode</h4>
                  <p className="text-sm text-orange-700 mt-1">
                    Visits are currently being sent to Beluga's staging environment for testing.
                    Switch to Production when you're ready to process real patient visits.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Production Confirmation Dialog */}
      <AlertDialog open={showProductionConfirmDialog} onOpenChange={setShowProductionConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Switch to Production?</AlertDialogTitle>
            <AlertDialogDescription>
              All future visits will be sent to Beluga Production. This means real patient data 
              will be processed. Only proceed if you're ready for live operations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmProductionSwitch}>
              Confirm Production
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
