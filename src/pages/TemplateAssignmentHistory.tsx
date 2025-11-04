import { useState, useEffect, useMemo, useCallback } from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { useNavigate } from "react-router-dom";
import {
  assignmentApi,
  TemplateAssignmentLog,
  AssignmentHistoryParams,
} from "@/api/questionnaires";
import { toast } from "@/components/ui/use-toast";
import { DateRange } from "react-day-picker";
import { isWithinInterval, parseISO, format } from "date-fns";

const statusFilters = ["All", "Success", "Failed", "Pending", "Retrying"];

const getColumns = (handleRetry: (log: TemplateAssignmentLog) => void) => [
  {
    key: "template_name",
    label: "Template",
    render: (value: string) => (
      <span className="font-medium">{value}</span>
    ),
  },
  {
    key: "client_name",
    label: "Client",
  },
  {
    key: "status",
    label: "Status",
    render: (value: string) => {
      const variants: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
        success: "default",
        failed: "destructive",
        pending: "secondary",
        retrying: "outline",
      };
      const colors: Record<string, string> = {
        success: "bg-green-100 text-green-800",
        failed: "bg-red-100 text-red-800",
        pending: "bg-yellow-100 text-yellow-800",
        retrying: "bg-blue-100 text-blue-800",
      };
      return (
        <Badge variant={variants[value] || "secondary"} className={colors[value]}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </Badge>
      );
    },
  },
  {
    key: "assigned_by_email",
    label: "Assigned By",
  },
  {
    key: "assigned_at",
    label: "Assigned At",
    render: (value: string) => {
      try {
        const date = parseISO(value);
        return format(date, "MM/dd/yyyy HH:mm");
      } catch {
        return value;
      }
    },
  },
  {
    key: "duration_seconds",
    label: "Duration",
    render: (value: number | undefined) => {
      if (!value) return "-";
      if (value < 60) return `${value}s`;
      const minutes = Math.floor(value / 60);
      const seconds = value % 60;
      return `${minutes}m ${seconds}s`;
    },
  },
  {
    key: "retry_count",
    label: "Retries",
    render: (value: number) => (value > 0 ? value : "-"),
  },
  {
    key: "error_message",
    label: "Error",
    render: (value: string | undefined, row: TemplateAssignmentLog) => {
      if (!value || row.status === "success") return "-";
      return (
        <span className="text-xs text-red-600 truncate max-w-xs" title={value}>
          {value}
        </span>
      );
    },
  },
];

export default function TemplateAssignmentHistory() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<TemplateAssignmentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeStatusFilter, setActiveStatusFilter] = useState("All");
  const [date, setDate] = useState<DateRange | undefined>();
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 25,
    total: 0,
  });

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const params: AssignmentHistoryParams = {
        page: pagination.page,
        page_size: pagination.pageSize,
      };

      // Add status filter
      if (activeStatusFilter !== "All") {
        params.status = activeStatusFilter.toLowerCase() as any;
      }

      // Add date range filter
      if (date?.from) {
        params.start_date = format(date.from, "yyyy-MM-dd");
      }
      if (date?.to) {
        params.end_date = format(date.to, "yyyy-MM-dd");
      }

      const response = await assignmentApi.getAssignmentHistory(params);
      setLogs(response.results);
      setPagination((prev) => ({ ...prev, total: response.count }));
    } catch (error: any) {
      console.error("Failed to fetch assignment history:", error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to fetch assignment history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, activeStatusFilter, date]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleRetry = async (log: TemplateAssignmentLog) => {
    try {
      await assignmentApi.retryAssignment(log.id);
      toast({
        title: "Success",
        description: "Assignment retry initiated",
      });
      fetchHistory();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to retry assignment",
        variant: "destructive",
      });
    }
  };

  // Filter logs based on search
  const filteredLogs = useMemo(() => {
    if (!searchTerm.trim()) return logs;

    const search = searchTerm.toLowerCase();
    return logs.filter(
      (log) =>
        log.template_name.toLowerCase().includes(search) ||
        log.client_name.toLowerCase().includes(search) ||
        log.assigned_by_email.toLowerCase().includes(search)
    );
  }, [logs, searchTerm]);

  // Create filter configuration
  const filters = statusFilters.map((status) => ({
    key: `status-${status}`,
    label: status,
    type: "button" as const,
    value: activeStatusFilter === status ? status : undefined,
    onClick: () => setActiveStatusFilter(status),
  }));

  const handleResetFilters = useCallback(() => {
    setActiveStatusFilter("All");
    setDate(undefined);
    setSearchTerm("");
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const logsWithActions = filteredLogs.map((log) => ({
    ...log,
    actions: log.status === "failed" ? (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleRetry(log)}
        title="Retry Assignment"
      >
        <RefreshCw className="h-4 w-4" />
      </Button>
    ) : null,
  }));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard/questionnaires/assign")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Template Assignment History</h1>
            <p className="text-sm text-muted-foreground mt-1">
              View all template assignment records and their status
            </p>
          </div>
        </div>
        <Button onClick={fetchHistory} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 border rounded-lg bg-white">
          <p className="text-sm text-muted-foreground">Total Assignments</p>
          <p className="text-2xl font-bold">{pagination.total}</p>
        </div>
        <div className="p-4 border rounded-lg bg-green-50">
          <p className="text-sm text-green-700">Successful</p>
          <p className="text-2xl font-bold text-green-800">
            {logs.filter((l) => l.status === "success").length}
          </p>
        </div>
        <div className="p-4 border rounded-lg bg-red-50">
          <p className="text-sm text-red-700">Failed</p>
          <p className="text-2xl font-bold text-red-800">
            {logs.filter((l) => l.status === "failed").length}
          </p>
        </div>
        <div className="p-4 border rounded-lg bg-yellow-50">
          <p className="text-sm text-yellow-700">Pending</p>
          <p className="text-2xl font-bold text-yellow-800">
            {logs.filter((l) => l.status === "pending" || l.status === "retrying").length}
          </p>
        </div>
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <p className="text-muted-foreground">Loading assignment history...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground mb-4">No assignment history found</p>
          <Button onClick={() => navigate("/dashboard/questionnaires/assign")}>
            Go to Template Assignment
          </Button>
        </div>
      ) : (
        <DataTable
          data={logsWithActions}
          columns={[
            ...getColumns(handleRetry),
            { key: "actions", label: "Actions" },
          ]}
          searchPlaceholder="Search by template, client, or assigned by"
          showDatePicker={true}
          showResetFilters={true}
          filters={filters}
          dateRange={date}
          onDateRangeChange={setDate}
          onSearch={setSearchTerm}
          onResetFilters={handleResetFilters}
          onRefresh={fetchHistory}
        />
      )}
    </div>
  );
}
