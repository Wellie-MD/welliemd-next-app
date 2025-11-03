import { useState, useEffect, useMemo, useCallback } from "react";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { useNavigate } from "react-router-dom";
import { templateApi, QuestionnaireTemplate } from "@/api/questionnaires";

import { useToast } from "@/hooks/use-toast";
import { DateRange } from "react-day-picker";
import { isWithinInterval, parseISO, format } from "date-fns";
import { exportToCSV } from "@/utils/exportUtils";

const getTemplateColumns = (navigate: ReturnType<typeof useNavigate>) => [
  {
    key: "name",
    label: "Name",
    render: (value: string, row: QuestionnaireTemplate) => (
      <button
        onClick={() => navigate(`/dashboard/templates/${row.id}`)}
        className="text-blue-600 hover:text-blue-800 hover:underline font-medium text-left"
      >
        {value}
      </button>
    ),
  },
  { key: "questionnaire_type", label: "Type" },
  { key: "beluga_visit_type", label: "Visit Type" },
  {
    key: "is_published",
    label: "Status",
    render: (value: boolean) => (
      <Badge variant={value ? "default" : "secondary"}>
        {value ? "Published" : "Draft"}
      </Badge>
    ),
  },
  {
    key: "created_at",
    label: "Created At",
    render: (value: string) => {
      try {
        const date = parseISO(value);
        return format(date, "MM/dd/yyyy");
      } catch {
        return value;
      }
    },
  },
];

const statusFilters = ["All", "Published", "Draft"];
const typeFilters = ["All Types", "Initial", "Follow-up", "Annual"];

export default function TemplateManagement() {
  const [templates, setTemplates] = useState<QuestionnaireTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeStatusFilter, setActiveStatusFilter] = useState("All");
  const [activeTypeFilter, setActiveTypeFilter] = useState("All Types");
  const [date, setDate] = useState<DateRange | undefined>();
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const data = await templateApi.listTemplates();

      // Handle both array response and paginated response
      if (Array.isArray(data)) {
        setTemplates(data);
      } else if (data && typeof data === "object" && "results" in data) {
        // Paginated response
        setTemplates((data as any).results || []);
      } else {
        setTemplates([]);
      }
    } catch (error: unknown) {
      console.error("Failed to fetch templates:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          error.message ||
          "Failed to fetch templates",
        variant: "destructive",
      });
      setTemplates([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);





  const handleManageQuestions = (template: QuestionnaireTemplate) => {
    navigate(`/dashboard/templates/${template.id}/flow-builder`);
  };

  // Comprehensive filtering logic
  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      // Search filter
      const matchesSearch =
        !searchTerm ||
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.questionnaire_type
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        template.beluga_visit_type
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase());

      // Status filter
      const matchesStatus =
        activeStatusFilter === "All" ||
        (activeStatusFilter === "Published" && template.is_published) ||
        (activeStatusFilter === "Draft" && !template.is_published);

      // Type filter
      const matchesType =
        activeTypeFilter === "All Types" ||
        template.questionnaire_type === activeTypeFilter;

      // Date range filter
      let matchesDateRange = true;
      if (date?.from || date?.to) {
        try {
          const templateDate = parseISO(template.created_at);

          if (date.from && date.to) {
            matchesDateRange = isWithinInterval(templateDate, {
              start: date.from,
              end: date.to,
            });
          } else if (date.from) {
            matchesDateRange = templateDate >= date.from;
          } else if (date.to) {
            matchesDateRange = templateDate <= date.to;
          }
        } catch {
          matchesDateRange = false;
        }
      }

      return matchesSearch && matchesStatus && matchesType && matchesDateRange;
    });
  }, [
    templates,
    searchTerm,
    activeStatusFilter,
    activeTypeFilter,
    date,
    refreshKey,
  ]);

  // Create filter configuration for DataTable
  const filters = [
    // Status filters
    ...statusFilters.map((status) => ({
      key: `status-${status}`,
      label: status,
      type: "button" as const,
      value: activeStatusFilter === status ? status : undefined,
      onClick: () => setActiveStatusFilter(status),
    })),
    // Type filters
    ...typeFilters.map((type) => ({
      key: `type-${type}`,
      label: type,
      type: "button" as const,
      value: activeTypeFilter === type ? type : undefined,
      onClick: () => setActiveTypeFilter(type),
    })),
  ];

  const handleResetFilters = useCallback(() => {
    setActiveStatusFilter("All");
    setActiveTypeFilter("All Types");
    setDate(undefined);
    setSearchTerm("");
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
    fetchTemplates();
  }, []);

  const handleExport = useCallback(() => {
    const exportData = filteredTemplates.map((template) => ({
      ...template,
      is_published: template.is_published ? "Published" : "Draft",
      created_at: format(parseISO(template.created_at), "MM/dd/yyyy"),
    }));
    exportToCSV(exportData, getTemplateColumns(navigate), "templates_export");
  }, [filteredTemplates, navigate]);

  // Only map if templates is an array
  const templatesWithActions = Array.isArray(filteredTemplates)
    ? filteredTemplates.map((template) => ({
        ...template,
        actions: (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleManageQuestions(template)}
              title="View Flow Builder"
            >
              <FileText className="h-4 w-4" />
            </Button>
          </div>
        ),
      }))
    : [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Questionnaires</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage questionnaire templates assigned by admin
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <p className="text-muted-foreground">Loading templates...</p>
        </div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground mb-4">No templates assigned yet</p>
          <p className="text-sm text-muted-foreground">
            Templates will appear here once assigned by your administrator
          </p>
        </div>
      ) : (
        <DataTable
          data={templatesWithActions}
          columns={[
            ...getTemplateColumns(navigate),
            { key: "actions", label: "Actions" },
          ]}
          searchPlaceholder="Search templates by name, type, or visit type"
          showDatePicker={true}
          showExport={true}
          showResetFilters={true}
          filters={filters}
          dateRange={date}
          onDateRangeChange={setDate}
          onSearch={setSearchTerm}
          onResetFilters={handleResetFilters}
          onExport={handleExport}
          onRefresh={handleRefresh}
        />
      )}

    </div>
  );
}
