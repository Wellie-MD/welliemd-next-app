import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  ShieldCheck, 
  RefreshCcw,
  UserPlus,
  UserX, 
  MoreHorizontal, 
  Mail,
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Plus,
  MailPlus,
  Activity,
  Server,
  AlertTriangle
} from "lucide-react";

import {
  clientApi,
  CrossTenantAccessUser,
} from "@/api/clientApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuthStore } from "@/store/useAuthStore";

export default function CrossTenantAccessUsers() {
  const queryClient = useQueryClient();
  const authUser = useAuthStore((state) => state.user);
  const canViewAccessUsers = Boolean(
    authUser?.is_platform_owner || authUser?.can_access_cross_tenant_access_users
  );
  const canDeactivateAccessUsers = Boolean(
    authUser?.is_platform_owner || authUser?.can_deactivate_cross_tenant_access_users
  );
  const [form, setForm] = useState({
    email: "",
  });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["cross-tenant-access-users"],
    queryFn: clientApi.listAccessUsers,
    enabled: canViewAccessUsers,
  });
  const { data: retryMetrics, isLoading: isRetryMetricsLoading } = useQuery({
    queryKey: ["cross-tenant-access-retry-metrics"],
    queryFn: clientApi.getAccessUserRetryMetrics,
    enabled: canViewAccessUsers,
  });

  const refetchUsers = () => {
    queryClient.invalidateQueries({ queryKey: ["cross-tenant-access-users"] });
    queryClient.invalidateQueries({ queryKey: ["cross-tenant-access-retry-metrics"] });
  };

  const createMutation = useMutation({
    mutationFn: (payload: Partial<CrossTenantAccessUser>) => clientApi.createAccessUser(payload),
    onSuccess: () => {
      toast({ title: "Access user created", description: "The admin account was provisioned successfully." });
      setForm({ email: "" });
      refetchUsers();
    },
    onError: () => {
      toast({ title: "Create failed", description: "Unable to create access user.", variant: "destructive" });
    },
  });

  const inviteMutation = useMutation({
    mutationFn: (accessUserId: string) => clientApi.inviteAccessUser(accessUserId),
    onSuccess: () => {
      toast({ title: "Invitation sent", description: "The invitation email has been resent." });
    },
    onError: () => {
      toast({ title: "Invite failed", description: "Unable to resend invitation.", variant: "destructive" });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (accessUserId: string) => clientApi.deactivateAccessUser(accessUserId),
    onSuccess: () => {
      toast({ title: "User deactivated", description: "Admin access has been updated." });
      refetchUsers();
    },
    onError: (error: any) => {
      toast({
        title: "Deactivate failed",
        description: error?.response?.data?.detail || error?.response?.data?.error || "Unable to deactivate user.",
        variant: "destructive",
      });
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: async (user: CrossTenantAccessUser) => {
      await clientApi.updateAccessUser(user.id, { is_active: true });
      return user;
    },
    onSuccess: () => {
      toast({ title: "User reactivated", description: "Admin access has been restored." });
      refetchUsers();
    },
    onError: (error: any) => {
      toast({
        title: "Reactivate failed",
        description: error?.response?.data?.detail || error?.response?.data?.error || "Unable to reactivate user.",
        variant: "destructive",
      });
    },
  });

  const aggregateMetrics = useMemo(() => {
    const clientWorstStatus = new Map<string, "failed" | "pending" | "success" | "skipped">();
    const recentFailuresByClient = new Map<
      string,
      { users: Set<string>; client: string; error: string; clientId: string; updatedAt: string }
    >();

    users.forEach((user) => {
      if (!user.sync_statuses) return;
      user.sync_statuses
        .forEach((s) => {
          const current = s.status as "failed" | "pending" | "success" | "skipped";
          const prev = clientWorstStatus.get(s.client);
          const rank = { failed: 3, pending: 2, success: 1, skipped: 0 } as const;
          if (!prev || rank[current] > rank[prev]) {
            clientWorstStatus.set(s.client, current);
          }
        });

      user.sync_statuses
        .filter((s) => s.status === "failed")
        .forEach((s) => {
          const key = s.client;
          const nextUpdatedAt = s.updated_at || "";
          const existing = recentFailuresByClient.get(key);

          if (!existing) {
            recentFailuresByClient.set(key, {
              users: new Set([user.email]),
              client: s.client_name || s.client,
              clientId: s.client,
              error: s.last_error,
              updatedAt: nextUpdatedAt,
            });
            return;
          }

          existing.users.add(user.email);
          // Keep the newest failure detail so the alert reflects latest disruption.
          if (nextUpdatedAt && (!existing.updatedAt || nextUpdatedAt > existing.updatedAt)) {
            existing.error = s.last_error;
            existing.updatedAt = nextUpdatedAt;
          }
        });
    });

    const totalNodes = clientWorstStatus.size;
    let successfulSyncs = 0;
    let pendingSyncs = 0;
    let failedSyncs = 0;
    clientWorstStatus.forEach((status) => {
      if (status === "failed") failedSyncs += 1;
      else if (status === "pending") pendingSyncs += 1;
      else successfulSyncs += 1;
    });

    const healthRate = totalNodes > 0 ? (successfulSyncs / totalNodes) * 100 : 100;

    const recentFailures = Array.from(recentFailuresByClient.values())
      .sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""))
      .slice(0, 5)
      .map((entry) => {
        const users = Array.from(entry.users);
        return {
          client: entry.client,
          clientId: entry.clientId,
          error: entry.error,
          user: users.length > 1 ? `${users[0]} +${users.length - 1} more` : users[0] || "",
        };
      });

    return {
      kpis: [
        { title: "Total Client Connections", value: totalNodes.toString(), change: "-", trend: "neutral" as const },
        { title: "Connection Success Rate", value: `${healthRate.toFixed(1)}%`, change: "-", trend: healthRate > 95 ? "up" as const : "neutral" as const },
        { title: "Waiting to Sync", value: pendingSyncs.toString(), change: "-", trend: pendingSyncs > 0 ? "down" as const : "neutral" as const },
        { title: "Needs Attention", value: failedSyncs.toString(), change: "-", trend: failedSyncs > 0 ? "down" as const : "neutral" as const },
        { title: "Retry Job Runs", value: String(retryMetrics?.scheduler_runs ?? 0), change: "-", trend: "neutral" as const },
        { title: "Auto-Retry Actions", value: String(retryMetrics?.auto_retry_runs ?? 0), change: "-", trend: "neutral" as const },
      ],
      recentFailures,
    };
  }, [users, retryMetrics?.auto_retry_runs, retryMetrics?.scheduler_runs]);

  const sortedUsers = useMemo(
    () => [...users].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [users]
  );

  if (!canViewAccessUsers) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTitle>Access Restricted</AlertTitle>
          <AlertDescription>
            Platform owner has not granted you access to Cross-Tenant Access Users.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="p-4 space-y-6 w-full max-w-[1600px] mx-auto min-w-0 overflow-x-hidden animate-in fade-in duration-500">
        {/* Page Header */}
        <div className="flex items-center justify-between min-w-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Cross-Tenant Access Users</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage shared admin access across all client environments.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
            <Activity className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Ecosystem Monitor Active</span>
          </div>
        </div>

        {/* Sync Intelligence Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading || isRetryMetricsLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-2xl w-full" />
            ))
          ) : (
            aggregateMetrics.kpis.map((kpi, idx) => (
              <MetricCard key={idx} metric={kpi} className="w-full max-w-none" />
            ))
          )}
        </div>
        {!isLoading && !isRetryMetricsLoading && (
          <>
            <p className="text-xs text-muted-foreground px-1">
              Last Retry Job Run:{" "}
              {retryMetrics?.last_scheduler_run_at
                ? new Date(retryMetrics.last_scheduler_run_at).toLocaleString()
                : "Never"}
            </p>
            <p className="text-xs text-muted-foreground px-1">
              Last Auto-Retry Time:{" "}
              {retryMetrics?.last_auto_retry_at
                ? new Date(retryMetrics.last_auto_retry_at).toLocaleString()
                : "Never"}
            </p>
          </>
        )}

        {/* Provisioning Section */}
        <Card className="rounded-2xl border-gray-200 shadow-sm overflow-hidden border-none bg-blue-50/30">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Plus className="w-4 h-4 text-blue-600" />
              </div>
              <CardTitle className="text-gray-800 text-base">Provision New Access Node</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <form
              className="flex flex-col md:flex-row gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (form.email) createMutation.mutate({ email: form.email, sync_scope: "all_clients", is_active: true });
              }}
            >
              <div className="flex-1 relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Administrator Email Address"
                  className="pl-10 bg-white border-gray-200 rounded-xl focus-visible:ring-blue-500 h-11"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              <Button
                type="submit"
                className="rounded-xl h-11 px-6 shadow-md shadow-primary/20 transition-all active:scale-95"
                disabled={!form.email || createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <RefreshCcw className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Provision Access
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Global Diagnostic Summary */}
        {!isLoading && aggregateMetrics.recentFailures.length > 0 && (
          <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-900 rounded-2xl shadow-sm">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertTitle className="font-bold">Connection Issues Detected</AlertTitle>
            <AlertDescription className="mt-2 text-sm opacity-90">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
                {aggregateMetrics.recentFailures.map((failure, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="font-semibold">{failure.client}:</span>
                    <span className="truncate max-w-[200px] text-xs underline decoration-dotted capitalize" title={failure.error}>
                      {failure.error || "Unknown deployment error"}
                    </span>
                    <span className="text-[10px] opacity-60">({failure.user})</span>
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Access Nodes List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-gray-500" />
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-tighter">Active Access Terminals</h2>
            </div>
          </div>

          <div className="grid gap-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-2xl w-full" />
              ))
            ) : sortedUsers.length === 0 ? (
              <div className="py-12 text-center border-2 border-dashed border-gray-100 rounded-3xl bg-gray-50/50">
                <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-3">
                  <UserX className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-gray-500 font-medium">No access users currently provisioned.</p>
              </div>
            ) : (
              sortedUsers.map((user) => {
                const summary = user.sync_status_summary || { pending: 0, success: 0, failed: 0 };
                const total = summary.pending + summary.success + summary.failed;
                return (
                  <Card 
                    key={user.id} 
                    className={`group transition-all border-gray-100 rounded-2xl overflow-hidden shadow-none hover:shadow-md hover:border-blue-100 ${!user.is_active ? 'bg-gray-50/50 grayscale' : 'bg-white'}`}
                  >
                    <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-4">
                      {/* Avatar/State */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${user.is_active ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                        {user.is_active ? <ShieldCheck className="w-5 h-5" /> : <UserX className="w-5 h-5" />}
                      </div>

                      {/* Info Bloc */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-gray-900 truncate max-w-[200px]">{user.email}</span>
                          <Badge variant="outline" className="text-[10px] font-bold text-blue-700 bg-blue-50/50 border-blue-100 px-1.5 h-5">
                            {user.tenant_role || "ADMIN"}
                          </Badge>
                          {!user.is_active && (
                            <Badge variant="destructive" className="text-[10px] font-bold px-1.5 h-5">DEACTIVATED</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground font-medium">
                          <span>{user.first_name} {user.last_name}</span>
                        </div>
                      </div>

                      {/* Sync Progress Bar */}
                      <div className="flex flex-col gap-1.5 md:w-64">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-tight">
                          <span className="text-gray-500">Fleet Coverage</span>
                          <span className={summary.failed > 0 ? "text-red-600" : "text-gray-900"}>
                            {summary.success}/{total}
                          </span>
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden flex shadow-inner">
                              <div className="h-full transition-all bg-green-500" style={{ width: `${(summary.success / (total || 1)) * 100}%` }} />
                              <div className="h-full transition-all bg-yellow-400" style={{ width: `${(summary.pending / (total || 1)) * 100}%` }} />
                              <div className="h-full transition-all bg-red-500" style={{ width: `${(summary.failed / (total || 1)) * 100}%` }} />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="bg-white border-gray-200 text-gray-900 shadow-xl p-3 space-y-2 rounded-xl">
                            <div className="flex items-center justify-between gap-4 text-xs font-medium">
                              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-green-500" /> Synced</span>
                              <span>{summary.success}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4 text-xs font-medium">
                              <span className="flex items-center gap-1.5"><Clock className="w-3 h-3 text-yellow-500" /> Pending</span>
                              <span>{summary.pending}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4 text-xs font-medium">
                              <span className="flex items-center gap-1.5"><AlertCircle className="w-3 h-3 text-red-500" /> Failed</span>
                              <span>{summary.failed}</span>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 ml-auto">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 rounded-lg text-gray-500 hover:bg-gray-100">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-xl p-1 shadow-lg border-gray-100">
                            <DropdownMenuLabel className="text-[10px] font-bold text-gray-400 px-2 py-1.5 uppercase">Actions</DropdownMenuLabel>
                            <DropdownMenuItem 
                              className="rounded-lg text-xs font-medium cursor-pointer"
                              onClick={() => inviteMutation.mutate(user.id)}
                              disabled={inviteMutation.isPending}
                            >
                              <MailPlus className="h-3.5 w-3.5 mr-2" />
                              Resend Invite
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {user.is_active ? (
                              canDeactivateAccessUsers ? (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <div className="flex items-center px-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg cursor-pointer">
                                      <UserX className="h-3.5 w-3.5 mr-2" />
                                      Deactivate User
                                    </div>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle className="text-xl font-bold text-gray-900">Confirm Deactivation</AlertDialogTitle>
                                      <AlertDialogDescription className="text-gray-600">
                                        This will immediately revoke admin portal access for <span className="font-bold">{user.email}</span>.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel className="rounded-xl border-gray-200">Cancel</AlertDialogCancel>
                                      <AlertDialogAction 
                                        className="rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-100"
                                        onClick={() => deactivateMutation.mutate(user.id)}
                                      >
                                        Deactivate Access
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              ) : (
                                <DropdownMenuItem disabled className="rounded-lg text-xs">
                                  <UserX className="h-3.5 w-3.5 mr-2" />
                                  Deactivate User (No permission)
                                </DropdownMenuItem>
                              )
                            ) : (
                              <DropdownMenuItem
                                className="rounded-lg text-xs font-medium cursor-pointer text-green-600"
                                onClick={() => reactivateMutation.mutate(user)}
                                disabled={reactivateMutation.isPending}
                              >
                                <ShieldCheck className="h-3.5 w-3.5 mr-2" />
                                Reactivate User
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
