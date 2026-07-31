import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Eye, Loader2, RefreshCw } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  getSmsAnalytics,
  getSmsDelivery,
  retrySmsDelivery,
  SmsAnalyticsRange,
  SmsAudience,
  SmsDeliveryRow,
} from "@/api/smsAnalyticsApi";
import { cn } from "@/lib/utils";

const ranges: Array<{ value: SmsAnalyticsRange; label: string; detail: string }> = [
  { value: "today", label: "Today", detail: "today" },
  { value: "week", label: "Last 7 Days", detail: "last 7 days" },
  { value: "month", label: "Last 30 Days", detail: "last 30 days" },
  { value: "year", label: "Last Year", detail: "last year" },
];

const statuses = ["queued", "sending", "sent", "delivered", "failed", "undelivered", "canceled"];

function formatPercent(value?: number) {
  const numeric = Number(value || 0);
  return `${Number.isInteger(numeric) ? numeric : numeric.toFixed(1)}%`;
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function titleCase(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusClass(status: string) {
  switch (status.toLowerCase()) {
    case "delivered":
      return "border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300";
    case "sent":
      return "border-blue-300 bg-blue-100 text-blue-800 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300";
    case "queued":
    case "sending":
      return "border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300";
    case "failed":
    case "undelivered":
      return "border-red-300 bg-red-100 text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300";
    case "canceled":
      return "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={cn("rounded-full px-3 py-1 text-xs font-semibold", statusClass(status))}>
      {status}
    </Badge>
  );
}

function StatCard({ label, value, detail, tone }: { label: string; value: string | number; detail: string; tone?: string }) {
  return (
    <Card className="border-border/70 bg-card shadow-sm">
      <CardContent className="p-4">
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
        <div className={cn("mt-2 text-2xl font-bold tracking-tight text-foreground", tone)}>{value}</div>
        <div className="mt-1 text-xs text-muted-foreground">{detail}</div>
      </CardContent>
    </Card>
  );
}

export default function SmsAnalytics() {
  const [range, setRange] = useState<SmsAnalyticsRange>("month");
  const [audience, setAudience] = useState<SmsAudience>("all");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  const [selectedDelivery, setSelectedDelivery] = useState<SmsDeliveryRow | null>(null);

  const params = useMemo(() => ({
    range,
    audience,
    status: status === "all" ? "" : status,
    search: search.trim(),
    page: 1,
    page_size: 100,
  }), [audience, range, search, status]);

  const analyticsQuery = useQuery({
    queryKey: ["sms-analytics", params],
    queryFn: () => getSmsAnalytics(params),
    staleTime: 30000,
  });

  const detailMutation = useMutation({
    mutationFn: getSmsDelivery,
    onSuccess: setSelectedDelivery,
  });

  const retryMutation = useMutation({
    mutationFn: retrySmsDelivery,
    onSuccess: () => analyticsQuery.refetch(),
  });

  useEffect(() => {
    setSelectedDelivery(null);
  }, [range, audience, status, search]);

  const stats = analyticsQuery.data?.stats;
  const rows = analyticsQuery.data?.results || [];
  const selectedRange = ranges.find((item) => item.value === range) || ranges[2];

  const resetFilters = () => {
    setRange("month");
    setAudience("all");
    setStatus("all");
    setSearch("");
  };

  return (
    <div className="min-h-full space-y-5 bg-background p-6 text-foreground">
      <Card className="border-border/70 bg-card shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-base font-bold text-foreground">SMS Performance</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Provider delivery performance for patient and admin notification SMS messages.
              </p>
            </div>
            <Button variant="link" className="h-auto px-0 text-primary" onClick={() => setShowFilters(!showFilters)}>
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
                  className={range === item.value ? "bg-primary/15 text-primary hover:bg-primary/25" : ""}
                  onClick={() => setRange(item.value)}
                >
                  {item.label}
                </Button>
              ))}
              <Button type="button" size="sm" variant="outline" className="border-dashed text-muted-foreground" onClick={resetFilters}>
                Default View
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {analyticsQuery.error && (
        <Alert variant="destructive"><AlertDescription>Failed to load SMS analytics.</AlertDescription></Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="SMS Attempts" value={stats?.total_sms ?? 0} detail={selectedRange.detail} />
        <StatCard label="Delivered" value={stats?.delivered ?? 0} detail={`${formatPercent(stats?.delivery_rate)} delivery rate`} tone="text-emerald-600 dark:text-emerald-400" />
        <StatCard label="Pending" value={stats?.pending ?? 0} detail={`${stats?.queued ?? 0} queued`} tone="text-amber-600 dark:text-amber-400" />
        <StatCard label="Failed or Undelivered" value={stats?.failed ?? 0} detail={`${formatPercent(stats?.failure_rate)} failure rate`} tone="text-red-600 dark:text-red-400" />
      </div>

      <Alert>
        <AlertDescription>
          Delivered means Twilio confirmed delivery to the carrier. Sent means Twilio accepted the message, but delivery has not yet been confirmed.
        </AlertDescription>
      </Alert>

      <h2 className="text-lg font-bold text-foreground">SMS Log</h2>

      <Card className="border-border/70 bg-card shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <Select value={audience} onValueChange={(value) => setAudience(value as SmsAudience)}>
              <SelectTrigger className="h-9 lg:w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All notifications</SelectItem>
                <SelectItem value="patient">Patient notifications</SelectItem>
                <SelectItem value="admin">Admin notifications</SelectItem>
              </SelectContent>
            </Select>
            <Input className="h-9 flex-1" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by recipient, template, message, or phone..." />
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-9 lg:w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {statuses.map((item) => <SelectItem key={item} value={item}>{titleCase(item)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-border/70 bg-card shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-[11px] uppercase tracking-wide">Sent At</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wide">Recipient</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wide">Template</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wide">Message</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wide">Status</TableHead>
                <TableHead className="text-right text-[11px] uppercase tracking-wide">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analyticsQuery.isLoading ? (
                <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground"><Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />Loading SMS log...</TableCell></TableRow>
              ) : rows.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">No SMS messages match your filters.</TableCell></TableRow>
              ) : rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="whitespace-nowrap text-sm text-foreground">{formatDate(row.sent_at || row.queued_at)}</TableCell>
                  <TableCell><div className="font-semibold text-foreground">{row.recipient_name}</div><div className="text-xs text-muted-foreground">{row.recipient_phone}</div></TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-foreground">{row.template_label}</TableCell>
                  <TableCell className="min-w-[280px] max-w-[420px] text-sm text-muted-foreground"><div className="truncate">{row.message_preview}</div>{row.reason && <div className="mt-1 truncate text-xs text-destructive">{row.reason}</div>}</TableCell>
                  <TableCell><StatusBadge status={row.status} /></TableCell>
                  <TableCell><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => detailMutation.mutate(row.id)} title="View SMS details"><Eye className="h-4 w-4" /></Button>{row.can_retry && <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-amber-500" onClick={() => retryMutation.mutate(row.id)} disabled={retryMutation.isPending} title="Retry SMS"><RefreshCw className={cn("h-4 w-4", retryMutation.isPending && "animate-spin")} /></Button>}</div></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={Boolean(selectedDelivery)} onOpenChange={(open) => !open && setSelectedDelivery(null)}>
        <DialogContent showCloseButton={false} className="max-w-2xl gap-0 overflow-hidden p-0">
          <div className="flex items-start justify-between gap-4 border-b bg-card px-5 py-4">
            <div className="min-w-0"><DialogTitle>{selectedDelivery?.template_label}</DialogTitle><div className="mt-1 truncate text-xs text-muted-foreground">To {selectedDelivery?.recipient_name} {selectedDelivery?.recipient_phone} · {formatDate(selectedDelivery?.queued_at)}</div></div>
            <div className="flex shrink-0 items-center gap-3">{selectedDelivery?.status && <StatusBadge status={selectedDelivery.status} />}<DialogClose asChild><Button type="button" variant="outline" size="sm">Close</Button></DialogClose></div>
          </div>
          <div className="max-h-[70vh] overflow-y-auto bg-muted/30 p-5">
            <div className="rounded-lg border border-border bg-card p-5"><div className="whitespace-pre-wrap text-sm text-foreground">{selectedDelivery?.message_body || selectedDelivery?.message_preview}</div>{selectedDelivery?.reason && <p className="mt-4 text-xs text-destructive">Provider reason: {selectedDelivery.reason}</p>}{selectedDelivery?.provider_message_sid && <p className="mt-3 break-all text-xs text-muted-foreground">Provider SID: {selectedDelivery.provider_message_sid}</p>}</div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
