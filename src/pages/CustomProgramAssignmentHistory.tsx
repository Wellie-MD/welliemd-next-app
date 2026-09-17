import { useState, useEffect, useMemo, useCallback } from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { useNavigate } from "react-router-dom";
import { customProgramAssignmentHistoryApi, CustomProgramAssignmentLog, AssignmentHistoryParams } from "@/api/treatments";
import { toast } from "@/components/ui/use-toast";
import { DateRange } from "react-day-picker";
import { parseISO, format } from "date-fns";
import { ASSIGNMENT_STATUS_FILTERS, STATUS_BADGE_CONFIG } from "@/constants/assignmentHistoryConstants";
import { exportToCSV } from "@/utils/exportUtils";

const getColumns = () => [
  {
    key: "custom_program_name",
    label: "Custom Program",
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
      return (
        <Badge variant={STATUS_BADGE_CONFIG.variants[value as keyof typeof STATUS_BADGE_CONFIG.variants] || "secondary"} className={STATUS_BADGE_CONFIG.colors[value as keyof typeof STATUS_BADGE_CONFIG.colors]}>
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
    render: (value: string | undefined, row: CustomProgramAssignmentLog) => {
      if (!value || row.status === "success") return "-";
      return (
        <span className="text-xs text-red-600 truncate max-w-xs" title={value}>
          {value}
        </span>
      );
    },
  },
];

export default function CustomProgramAssignmentHistory() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<CustomProgramAssignmentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeStatusFilter, setActiveStatusFilter] = useState("All");
  const [date, setDate] = useState<DateRange | undefined>();
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 25,
    total: 0,
  });
  const [statusCounts, setStatusCounts] = useState({ success: 0, failed: 0, pending: 0, retrying: 0 });

  const columns = useMemo(() => getColumns(), []);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const params: AssignmentHistoryParams = {
        page: pagination.page,
        page_size: pagination.pageSize,
      };

      if (activeStatusFilter !== "All") {
        params.status = activeStatusFilter.toLowerCase() as any;
      }

      if (date?.from) {
        params.start_date = format(date.from, "yyyy-MM-dd");
      }
      if (date?.to) {
        params.end_date = format(date.to, "yyyy-MM-dd");
      }

      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      const response = await customProgramAssignmentHistoryApi.getHistory(params);
      setLogs(response.results);
      setPagination((prev) => ({ ...prev, total: response.count }));
      // Compute status breakdown from paginated results
      const counts = {
        success: response.results.filter((l) => l.status === "success").length,
        failed: response.results.filter((l) => l.status === "failed").length,
        pending: response.results.filter((l) => l.status === "pending").length,
        retrying: response.results.filter((l) => l.status === "retrying").length,
      };
      setStatusCounts(counts);
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
  }, [pagination.page, pagination.pageSize, activeStatusFilter, date, searchTerm]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(pagination.total / pagination.pageSize)),
    [pagination.total, pagination.pageSize]
  );

  const handlePageChange = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  }, []);

  const handlePageSizeChange = useCallback((pageSize: number) => {
    setPagination((prev) => ({ ...prev, page: 1, pageSize }));
  }, []);

  const filters = ASSIGNMENT_STATUS_FILTERS.map((status) => ({
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

  const handleExport = useCallback(() => {
    if (logs.length === 0) {
      toast({
        title: "No Data",
        description: "No assignment records on this page to export. Try adjusting filters or navigate to other pages.",
        variant: "default",
      });
      return;
    }
    const exportColumns = [
      { key: "custom_program_name", label: "Custom Program" },
      { key: "client_name", label: "Client" },
      { key: "status", label: "Status" },
      { key: "assigned_by_email", label: "Assigned By" },
      { key: "assigned_at", label: "Assigned At" },
      { key: "duration_seconds", label: "Duration (seconds)" },
      { key: "retry_count", label: "Retries" },
      { key: "error_message", label: "Error" },
    ];
    exportToCSV(logs, exportColumns, "custom_program_assignment_history");
    toast({
      title: "Export Successful",
      description: `Exported ${logs.length} assignment records`,
      variant: "default",
    });
  }, [logs, toast]);

  // Reset to page 1 when any filter changes
  useEffect(() => {
    setPagination((prev) => (prev.page !== 1 ? { ...prev, page: 1 } : prev));
  }, [activeStatusFilter, date, searchTerm]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard/treatments/custom-programs")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Custom Program Assignment History</h1>
            <p className="text-sm text-muted-foreground mt-1">
              View all custom program assignment records and their status
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
            {statusCounts.success}
          </p>
        </div>
        <div className="p-4 border rounded-lg bg-red-50">
          <p className="text-sm text-red-700">Failed</p>
          <p className="text-2xl font-bold text-red-800">
            {statusCounts.failed}
          </p>
        </div>
        <div className="p-4 border rounded-lg bg-yellow-50">
          <p className="text-sm text-yellow-700">Pending</p>
          <p className="text-2xl font-bold text-yellow-800">
            {statusCounts.pending + statusCounts.retrying}
          </p>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={logs}
        columns={columns}
        searchPlaceholder="Search by custom program, client, or assigned by"
        showDatePicker={true}
        showResetFilters={true}
        showExport={true}
        filters={filters}
        dateRange={date}
        onDateRangeChange={setDate}
        onSearch={setSearchTerm}
        onResetFilters={handleResetFilters}
        onRefresh={fetchHistory}
        onExport={handleExport}
        loading={loading}
        loadingMessage="Loading assignment history..."
        emptyMessage="No assignment history found"
        pagination={{
          currentPage: pagination.page,
          totalPages,
          pageSize: pagination.pageSize,
          totalCount: pagination.total,
          onPageChange: handlePageChange,
          onPageSizeChange: handlePageSizeChange,
        }}
      />
    </div>
  );
}
