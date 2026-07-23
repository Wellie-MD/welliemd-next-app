import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Eye, Loader2, RefreshCw } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  EmailAudience,
  EmailLogDetail,
  EmailLogRow,
  MailgunDomainStats,
  MailgunStatsRange,
  smtpApi,
} from "@/api/smtpApi";
import { cn } from "@/lib/utils";

const ranges: Array<{ value: MailgunStatsRange; label: string; sublabel: string }> = [
  { value: "today", label: "Today", sublabel: "today" },
  { value: "week", label: "Last 7 Days", sublabel: "last 7 days" },
  { value: "month", label: "Last 30 Days", sublabel: "last 30 days" },
  { value: "year", label: "Last Year", sublabel: "last year" },
];

const statusOptions = [
  "Delivered",
  "Opened",
  "Clicked",
  "Accepted",
  "Deferred",
  "Bounced",
  "Failed",
  "Skipped",
  "Unsubscribed",
];

const undeliveredStatuses = new Set(["Bounced", "Failed", "Deferred", "Skipped"]);

function normalizeConfigResponse(configs: unknown) {
  if (Array.isArray(configs)) return configs[0] || null;
  if (configs && typeof configs === "object" && "results" in configs) {
    const results = (configs as { results?: unknown }).results;
    if (Array.isArray(results)) return results[0] || null;
  }
  return null;
}

function formatPercent(value?: number | null) {
  const numeric = Number(value || 0);
  return `${Number.isInteger(numeric) ? numeric : numeric.toFixed(1)}%`;
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function statusBadgeClass(status: string) {
  switch (status) {
    case "Delivered":
      return "border-emerald-200 bg-emerald-100 text-emerald-700";
    case "Opened":
    case "Clicked":
      return "border-blue-200 bg-blue-100 text-blue-700";
    case "Accepted":
    case "Deferred":
      return "border-amber-200 bg-amber-100 text-amber-700";
    case "Bounced":
    case "Failed":
      return "border-red-200 bg-red-100 text-red-700";
    case "Skipped":
      return "border-slate-200 bg-slate-100 text-slate-700";
    case "Unsubscribed":
      return "border-violet-200 bg-violet-100 text-violet-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={cn("rounded-full px-3 py-1 text-xs font-semibold", statusBadgeClass(status))}>
      {status}
    </Badge>
  );
}

function StatCard({
  label,
  value,
  detail,
  valueClassName,
}: {
  label: string;
  value: string | number;
  detail: string;
  valueClassName?: string;
}) {
  return (
    <Card className="border-border/70 bg-white shadow-sm">
      <CardContent className="p-4">
        <div className="text-xs font-medium text-slate-400">{label}</div>
        <div className={cn("mt-2 text-2xl font-bold tracking-tight text-slate-950", valueClassName)}>
          {value}
        </div>
        <div className="mt-1 text-xs text-slate-400">{detail}</div>
      </CardContent>
    </Card>
  );
}

function permanentFailureDetail(stats?: MailgunDomainStats) {
  const permanentFailed = Number(stats?.permanent_failed ?? stats?.failed ?? 0);
  const bounced = Number(stats?.bounced || 0);
  const other = Math.max(permanentFailed - bounced, 0);
  return `${bounced} bounced · ${other} other`;
}

export default function EmailAnalytics() {
  const [range, setRange] = useState<MailgunStatsRange>("month");
  const [audience, setAudience] = useState<EmailAudience>("all");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  const [selectedLog, setSelectedLog] = useState<EmailLogDetail | null>(null);

  const configQuery = useQuery({
    queryKey: ["email-configurations"],
    queryFn: smtpApi.fetchEmailConfigurations,
    staleTime: 60000,
  });

  const domain = normalizeConfigResponse(configQuery.data)?.smtp_domain_name || "";

  const analyticsParams = useMemo(
    () => ({
      range,
      audience,
      status: status === "all" ? "" : status,
      search: search.trim(),
      page: 1,
      page_size: 100,
    }),
    [audience, range, search, status],
  );

  const analyticsQuery = useQuery({
    queryKey: ["email-analytics", domain, analyticsParams],
    queryFn: () => smtpApi.getMailgunEmailAnalytics(domain, analyticsParams),
    enabled: Boolean(domain),
    staleTime: 30000,
  });

  const detailMutation = useMutation({
    mutationFn: (logId: string) => smtpApi.getMailgunEmailLogDetail(domain, logId),
    onSuccess: setSelectedLog,
  });

  const retryMutation = useMutation({
    mutationFn: (logId: string) => smtpApi.retryMailgunEmailLog(domain, logId),
    onSuccess: () => analyticsQuery.refetch(),
  });

  useEffect(() => {
    setSelectedLog(null);
  }, [domain]);

  const stats = analyticsQuery.data?.stats;
  const rows = analyticsQuery.data?.results || [];
  const selectedRange = ranges.find((item) => item.value === range) || ranges[2];
  const delivered = Number(stats?.sent_successfully || 0);
  const permanentFailed = Number(stats?.permanent_failed ?? stats?.failed ?? 0);
  const temporaryFailed = Number(stats?.temporary_failed || 0);
  const deliveredAfterRetry = Number(stats?.delivered_after_retry || 0);

  const resetFilters = () => {
    setRange("month");
    setAudience("all");
    setStatus("all");
    setSearch("");
  };

  if (configQuery.isLoading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!domain) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Configure an email sending domain before viewing email analytics.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5 bg-slate-50 p-6">
      <Card className="border-border/70 bg-white shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-base font-bold text-slate-950">Email Performance</h1>
              <p className="mt-1 text-sm text-slate-600">
                Delivery and engagement across patient and admin notification templates. Use the audience filter to segment.
              </p>
            </div>
            <Button variant="link" className="h-auto px-0 text-blue-600" onClick={() => setShowFilters(!showFilters)}>
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>
          </div>

          {showFilters && (
            <div className="mt-4 flex flex-wrap gap-2">
              {ranges.map((item) => (
                <Button
                  key={item.value}
                  type="button"
                  size="sm"
                  variant={range === item.value ? "default" : "outline"}
                  className={range === item.value ? "bg-blue-50 text-blue-700 hover:bg-blue-100" : ""}
                  onClick={() => setRange(item.value)}
                >
                  {item.label}
                </Button>
              ))}
              <Button type="button" size="sm" variant="outline" className="border-dashed text-slate-400" onClick={resetFilters}>
                Default View
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {analyticsQuery.error && (
        <Alert variant="destructive">
          <AlertDescription>Failed to load email analytics.</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Emails Accepted" value={stats?.total_emails ?? 0} detail={selectedRange.sublabel} />
        <StatCard label="Delivered" value={delivered} detail={formatPercent(stats?.success_rate)} valueClassName="text-slate-950" />
        <StatCard label="Permanent Failures" value={permanentFailed} detail={permanentFailureDetail(stats)} valueClassName="text-red-600" />
        <StatCard label="Temporary Failure Events" value={temporaryFailed} detail="Retry attempts, not unique emails" valueClassName="text-amber-600" />
        <StatCard label="Delivered After Retry" value={deliveredAfterRetry} detail="Delivered on attempt 2+" valueClassName="text-emerald-600" />
        <StatCard label="Opened" value={stats?.opened ?? 0} detail={`${formatPercent(stats?.open_rate)} of delivered`} />
        <StatCard label="Clicked" value={stats?.clicked ?? 0} detail={`${formatPercent(stats?.click_rate)} of delivered`} />
        <StatCard label="Unsubscribed" value={stats?.unsubscribed ?? 0} detail={`${formatPercent(stats?.unsubscribe_rate)} of delivered`} />
      </div>

      <Alert>
        <AlertDescription>
          Temporary failures count Mailgun delivery attempts that may later succeed. Status filters show each message&apos;s latest detailed event available within Mailgun&apos;s retention window.
        </AlertDescription>
      </Alert>

      <div>
        <h2 className="text-lg font-bold text-slate-950">Email Log</h2>
      </div>

      <Card className="border-border/70 bg-white shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <Select value={audience} onValueChange={(value) => setAudience(value as EmailAudience)}>
              <SelectTrigger className="h-9 lg:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All notifications</SelectItem>
                <SelectItem value="patient">Patient notifications</SelectItem>
                <SelectItem value="admin">Admin notifications</SelectItem>
              </SelectContent>
            </Select>
            <Input
              className="h-9 flex-1"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by recipient, template, or subject..."
            />
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-9 lg:w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {statusOptions.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-border/70 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-white">
                <TableHead className="text-[11px] uppercase tracking-wide text-slate-400">Sent At</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wide text-slate-400">Recipient</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wide text-slate-400">Template</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wide text-slate-400">Subject</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wide text-slate-400">Status</TableHead>
                <TableHead className="text-right text-[11px] uppercase tracking-wide text-slate-400">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analyticsQuery.isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                    Loading email log...
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    No emails match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row: EmailLogRow) => (
                  <TableRow key={row.id}>
                    <TableCell className="whitespace-nowrap text-sm text-slate-950">{formatDateTime(row.sent_at)}</TableCell>
                    <TableCell>
                      <div className="font-semibold text-slate-950">{row.recipient_name}</div>
                      <div className="text-xs text-slate-400">{row.recipient_email}</div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-slate-950">{row.template_label}</TableCell>
                    <TableCell className="min-w-[260px] text-sm text-slate-700">
                      <div>{row.subject}</div>
                      {row.reason && undeliveredStatuses.has(row.status) && (
                        <div className="mt-1 text-xs text-slate-400">{row.reason}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={row.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-blue-600"
                          onClick={() => detailMutation.mutate(row.id)}
                          title="Preview email"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {row.can_retry && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-amber-600"
                            onClick={() => retryMutation.mutate(row.id)}
                            disabled={retryMutation.isPending}
                            title="Retry send"
                          >
                            <RefreshCw className={cn("h-4 w-4", retryMutation.isPending && "animate-spin")} />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={Boolean(selectedLog)} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent showCloseButton={false} className="max-w-2xl gap-0 overflow-hidden p-0">
          <div className="flex items-start justify-between gap-4 border-b bg-white px-5 py-4">
            <div className="min-w-0">
              <DialogTitle>{selectedLog?.template_label}</DialogTitle>
              <div className="mt-1 truncate text-xs text-slate-400">
                To {selectedLog?.recipient_name} &lt;{selectedLog?.recipient_email}&gt; · {formatDateTime(selectedLog?.sent_at)}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              {selectedLog?.status && <StatusBadge status={selectedLog.status} />}
              <DialogClose asChild>
                <Button type="button" variant="outline" size="sm">
                  Close
                </Button>
              </DialogClose>
            </div>
          </div>
          <div className="max-h-[70vh] overflow-y-auto bg-slate-50 p-5">
            {selectedLog?.preview_html ? (
              <div
                className="overflow-hidden rounded-lg border bg-white"
                dangerouslySetInnerHTML={{ __html: selectedLog.preview_html }}
              />
            ) : (
              <div className="rounded-lg border bg-white p-6">
                <h3 className="text-base font-semibold text-slate-950">{selectedLog?.subject}</h3>
                <p className="mt-3 text-sm text-slate-600">
                  Preview content is not available for this historical email.
                </p>
                {selectedLog?.reason && (
                  <p className="mt-3 text-xs text-slate-400">Provider reason: {selectedLog.reason}</p>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
