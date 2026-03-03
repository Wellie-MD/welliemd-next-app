import { useState, useEffect, useMemo, useCallback } from "react";
import { FileText, Link2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { useNavigate } from "react-router-dom";
import { templateApi, QuestionnaireTemplate } from "@/api/questionnaires";
import { useClients } from "@/hooks/useClients";
import { useToast } from "@/hooks/use-toast";
import { DateRange } from "react-day-picker";
import { isWithinInterval, parseISO, format } from "date-fns";
import { exportToCSV } from "@/utils/exportUtils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const getTemplateColumns = (
  navigate: ReturnType<typeof useNavigate>,
  handlePublishToggle: (template: QuestionnaireTemplate) => Promise<void>,
  publishingIds: Set<string>,
  onEditSlug: (template: QuestionnaireTemplate) => void
) => [
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
  {
    key: "questionnaire_type",
    label: "Questionnaire Type",
    render: (value: string) => {
      const typeMap: Record<string, string> = {
        onboarding: "Onboarding",
        follow_up: "Follow-up",
      };
      return typeMap[value] || value;
    },
  },
  {
    key: "treatment_type",
    label: "Treatment Type",
    render: (value: string) => {
      if (!value) return "-";
      return value;
    },
  },
  {
    key: "beluga_visit_type",
    label: "Visit Type",
    render: (value: string) => {
      if (!value) return "-";
      return value
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    },
  },
  {
    key: "slug",
    label: "Slug",
    render: (value: string | undefined, row: QuestionnaireTemplate) => (
      <div className="flex items-center gap-2">
        <span className="text-sm">{value || "-"}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onEditSlug(row);
          }}
          title="Edit slug"
          className="h-7 w-7 p-0 hover:bg-gray-100 hover:text-blue-600"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </div>
    ),
  },
  {
    key: "question_count",
    label: "Questions",
    render: (value: number | undefined, row: QuestionnaireTemplate) => {
      // Try question_count first, then questions array length, then 0
      if (value !== undefined && value !== null) return value;
      if (row.questions && Array.isArray(row.questions))
        return row.questions.length;
      return 0;
    },
  },
  {
    key: "review",
    label: "Review",
    render: (_value: unknown, row: QuestionnaireTemplate) => {
      const isPublishing = publishingIds.has(row.id);
      const isArchivedByAdmin = row.archived_by_admin || false;
      const isArchived = row.is_archived || false;
      const isDisabled = isPublishing || isArchivedByAdmin || isArchived;

      return (
        <div className="flex items-center gap-2">
          <Button
            variant={row.is_published ? "outline" : "default"}
            size="sm"
            onClick={() => handlePublishToggle(row)}
            disabled={isDisabled}
            className={
              row.is_published
                ? "text-red-600 border-red-600 hover:bg-red-50"
                : ""
            }
            title={
              isArchivedByAdmin
                ? "This template was archived by admin and cannot be published"
                : isArchived
                ? "This template is archived"
                : ""
            }
          >
            {isPublishing
              ? "Processing..."
              : isArchivedByAdmin
              ? "Archived by Admin"
              : row.is_published
              ? "Unpublish"
              : "Publish"}
          </Button>
        </div>
      );
    },
  },
  {
    key: "is_published",
    label: "Status",
    render: (value: boolean, row: QuestionnaireTemplate) => {
      if (row.is_archived || row.archived_by_admin) {
        return (
          <Badge variant="secondary" className="bg-gray-200 text-gray-700">
            Archived
          </Badge>
        );
      }
      return (
        <Badge
          variant={value ? "default" : "secondary"}
          className={value ? "bg-green-100 text-green-800" : ""}
        >
          {value ? "Approved" : "Draft"}
        </Badge>
      );
    },
  },
  {
    key: "updated_at",
    label: "Last Updated",
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
  const [publishingIds, setPublishingIds] = useState<Set<string>>(new Set());
  const [editingSlugTemplate, setEditingSlugTemplate] = useState<QuestionnaireTemplate | null>(null);
  const [slugInputValue, setSlugInputValue] = useState("");
  const [slugSaving, setSlugSaving] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentClient, clients, loading: clientsLoading } = useClients();

  // Use matched client or fallback to single client if available
  const effectiveClient = useMemo(() => {
    if (currentClient) {
      return currentClient;
    }
    if (clients.length === 1) {
      return clients[0];
    }
    return null;
  }, [currentClient, clients]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const data = await templateApi.listTemplates();

      // Handle both array response and paginated response
      if (Array.isArray(data)) {
        setTemplates(data);
      } else if (data && typeof data === "object" && "results" in data) {
        // Paginated response
        setTemplates((data as unknown).results || []);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleManageQuestions = (template: QuestionnaireTemplate) => {
    navigate(`/dashboard/templates/${template.id}/flow-builder`);
  };

  const handleEditSlug = useCallback((template: QuestionnaireTemplate) => {
    setEditingSlugTemplate(template);
    setSlugInputValue(template.slug || "");
  }, []);

  const handleSaveSlug = useCallback(async () => {
    if (!editingSlugTemplate) return;
    const value = slugInputValue.trim().toLowerCase();
    if (value && (value.length < 2 || value.length > 100)) {
      toast({
        title: "Invalid slug",
        description: "Slug must be 2-100 characters",
        variant: "destructive",
      });
      return;
    }
    if (value && !SLUG_PATTERN.test(value)) {
      toast({
        title: "Invalid slug",
        description: "Slug must contain only lowercase letters, numbers, and hyphens (e.g., glutathione, nad-plus)",
        variant: "destructive",
      });
      return;
    }
    setSlugSaving(true);
    try {
      await templateApi.updateTemplate(editingSlugTemplate.id, {
        slug: value || null,
      });
      toast({
        title: "Success",
        description: "Slug updated successfully",
      });
      setEditingSlugTemplate(null);
      setSlugInputValue("");
      fetchTemplates();
    } catch (error: unknown) {
      toast({
        title: "Error",
        description:
          (error as { response?: { data?: { slug?: string[] } } })?.response?.data?.slug?.[0] ||
          (error as Error)?.message ||
          "Failed to update slug",
        variant: "destructive",
      });
    } finally {
      setSlugSaving(false);
    }
  }, [editingSlugTemplate, slugInputValue, toast]);

  const handleCopyQuestionnaireLink = async (
    template: QuestionnaireTemplate
  ) => {
    if (!effectiveClient?.questionnaire_url) {
      toast({
        title: "Error",
        description: "Questionnaire URL is not configured for this client",
        variant: "destructive",
      });
      return;
    }

    const routeKey = template.slug || template.beluga_visit_type;
    if (!routeKey) {
      toast({
        title: "Error",
        description: "Slug or visit type is not set for this template",
        variant: "destructive",
      });
      return;
    }

    // Build the questionnaire link: questionnaire_url + /visit/ + slug or visit_type
    const baseUrl = effectiveClient.questionnaire_url.replace(/\/$/, ""); // Remove trailing slash
    const visitType = routeKey;
    const questionnaireLink = `${baseUrl}/visit/${visitType}`;

    // Copy to clipboard with fallback for older browsers
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(questionnaireLink);
        toast({
          title: "Success",
          description: "Questionnaire link copied to clipboard",
        });
      } else {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = questionnaireLink;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        toast({
          title: "Success",
          description: "Questionnaire link copied to clipboard",
        });
      }
    } catch (error) {
      console.error("Failed to copy:", error);
      toast({
        title: "Error",
        description: "Failed to copy link to clipboard",
        variant: "destructive",
      });
    }
  };

  const handlePublishToggle = async (template: QuestionnaireTemplate) => {
    // Check if template is archived by admin
    if (template.archived_by_admin || template.is_archived) {
      toast({
        title: "Cannot Publish",
        description: template.archived_by_admin
          ? "This template was archived by admin and cannot be published. Please contact your administrator."
          : "This template is archived and cannot be published.",
        variant: "destructive",
      });
      return;
    }

    // Add to publishing set
    setPublishingIds((prev) => new Set(prev).add(template.id));

    try {
      if (template.is_published) {
        // Unpublish
        await templateApi.unpublishTemplate(template.id);
        toast({
          title: "Success",
          description: `Template "${template.name}" has been unpublished`,
        });
      } else {
        // Publish
        await templateApi.publishTemplate(template.id);
        toast({
          title: "Success",
          description: `Template "${template.name}" has been published`,
        });
      }
      // Refresh templates to get updated status
      fetchTemplates();
    } catch (error: unknown) {
      toast({
        title: "Error",
        description:
          error.response?.data?.error ||
          error.message ||
          `Failed to ${
            template.is_published ? "unpublish" : "publish"
          } template`,
        variant: "destructive",
      });
    } finally {
      // Remove from publishing set
      setPublishingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(template.id);
        return newSet;
      });
    }
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
          .includes(searchTerm.toLowerCase()) ||
        template.slug?.toLowerCase().includes(searchTerm.toLowerCase());

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
  }, [templates, searchTerm, activeStatusFilter, activeTypeFilter, date]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleExport = useCallback(() => {
    const exportData = filteredTemplates.map((template) => {
      // Compute question count properly
      const questionCount =
        template.question_count !== undefined && template.question_count !== null
          ? template.question_count
          : template.questions && Array.isArray(template.questions)
          ? template.questions.length
          : 0;

      // Determine review status
      const isArchivedByAdmin = template.archived_by_admin || false;
      const isArchived = template.is_archived || false;
      let reviewStatus = "";
      if (isArchivedByAdmin) {
        reviewStatus = "Archived by Admin";
      } else if (isArchived) {
        reviewStatus = "Archived";
      } else if (template.is_published) {
        reviewStatus = "Unpublish";
      } else {
        reviewStatus = "Publish";
      }

      // Determine display status
      let displayStatus = "";
      if (isArchived || isArchivedByAdmin) {
        displayStatus = "Archived";
      } else {
        displayStatus = template.is_published ? "Approved" : "Draft";
      }

      // Format questionnaire type for display
      const questionnaireTypeMap: Record<string, string> = {
        onboarding: "Onboarding",
        follow_up: "Follow-up",
      };
      const questionnaireTypeDisplay =
        questionnaireTypeMap[template.questionnaire_type] || template.questionnaire_type;

      return {
        name: template.name,
        questionnaire_type: questionnaireTypeDisplay,
        treatment_type: template.treatment_type || "-",
        beluga_visit_type: template.beluga_visit_type || "-",
        slug: template.slug || "-",
        question_count: questionCount,
        review: reviewStatus,
        status: displayStatus,
        updated_at: format(
          parseISO(template.updated_at || template.created_at),
          "MM/dd/yyyy"
        ),
      };
    });
    // Create export columns matching the table display
    const exportColumns = [
      { key: "name", label: "Name" },
      { key: "questionnaire_type", label: "Questionnaire Type" },
      { key: "treatment_type", label: "Treatment Type" },
      { key: "beluga_visit_type", label: "Visit Type" },
      { key: "slug", label: "Slug" },
      { key: "question_count", label: "Questions" },
      { key: "review", label: "Review" },
      { key: "status", label: "Status" },
      { key: "updated_at", label: "Last Updated" },
    ];
    exportToCSV(exportData, exportColumns, "templates_export");
  }, [filteredTemplates]);

  // Only map if templates is an array
  const templatesWithActions = Array.isArray(filteredTemplates)
    ? filteredTemplates.map((template) => {
        const hasRouteKey = !!(template.slug || template.beluga_visit_type);
        const hasQuestionnaireUrl = !!effectiveClient?.questionnaire_url;
        const isFollowUp = template.questionnaire_type === 'follow_up';
        // Follow-up questionnaires should NOT have public links - they require secure tokens
        const isLinkDisabled = !hasRouteKey || !hasQuestionnaireUrl || isFollowUp;

        return {
          ...template,
          actions: (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCopyQuestionnaireLink(template);
                }}
                title={
                  isLinkDisabled
                    ? isFollowUp
                      ? "Follow-ups must be sent from Patient details"
                      : !hasRouteKey
                      ? "Slug or visit type not set"
                      : "Questionnaire URL not configured"
                    : "Copy Questionnaire Link"
                }
                disabled={isLinkDisabled}
                className={`${
                  isLinkDisabled
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer hover:bg-gray-100 hover:text-blue-600"
                }`}
              >
                <Link2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleManageQuestions(template);
                }}
                title="View Flow Builder"
                className="cursor-pointer hover:bg-gray-100 hover:text-blue-600"
              >
                <FileText className="h-4 w-4" />
              </Button>
            </div>
          ),
        };
      })
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
          <p className="text-muted-foreground mb-4">
            No templates assigned yet
          </p>
          <p className="text-sm text-muted-foreground">
            Templates will appear here once assigned by your administrator
          </p>
        </div>
      ) : (
        <DataTable
          data={templatesWithActions}
          columns={[
            ...getTemplateColumns(navigate, handlePublishToggle, publishingIds, handleEditSlug),
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

      <Dialog open={!!editingSlugTemplate} onOpenChange={(open) => !open && setEditingSlugTemplate(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Slug</DialogTitle>
            <DialogDescription>
              Set a unique URL slug for this questionnaire. When set, it overrides the visit type for routing.
              Use lowercase letters, numbers, and hyphens (e.g., glutathione, nad-plus). Leave empty to use visit type only.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="slug-input">Slug</Label>
              <Input
                id="slug-input"
                value={slugInputValue}
                onChange={(e) => setSlugInputValue(e.target.value)}
                placeholder="e.g., glutathione"
                className="lowercase"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSlugTemplate(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSlug} disabled={slugSaving}>
              {slugSaving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
