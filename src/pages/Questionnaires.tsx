import { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, Edit, Trash2, Eye, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
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
import { useNavigate } from "react-router-dom";
import { templateApi, QuestionnaireTemplate } from "@/api/questionnaires";
import AddQuestionnairesForm from "@/components/questionnaires/AddQuestionnairesForm";
import { toast } from "@/components/ui/use-toast";
import { DateRange } from "react-day-picker";
import { isWithinInterval, parseISO, format } from "date-fns";

const getTemplateColumns = (navigate: ReturnType<typeof useNavigate>) => [
  {
    key: "name",
    label: "Name",
    render: (value: string, row: QuestionnaireTemplate) => (
      <button
        onClick={() => navigate(`/dashboard/questionnaires/${row.id}`)}
        className="text-blue-600 hover:text-blue-800 hover:underline font-medium text-left"
      >
        {value}
      </button>
    ),
  },
  { 
    key: "questionnaire_type", 
    label: "Type",
    render: (value: string) => {
      return value
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    },
  },
  {
    key: "question_count",
    label: "Questions",
    render: (value: number | undefined, row: QuestionnaireTemplate) => {
      // Try question_count first, then questions array length, then 0
      if (value !== undefined && value !== null) return value;
      if (row.questions && Array.isArray(row.questions)) return row.questions.length;
      return 0;
    },
  },
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
const typeFilters = ["All Types", "Standard Weight Loss", "Individualized GLP", "Follow-up", "ED", "Client Custom"];

export default function Questionnaires() {
  const [templates, setTemplates] = useState<QuestionnaireTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<QuestionnaireTemplate | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<QuestionnaireTemplate | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeStatusFilter, setActiveStatusFilter] = useState("All");
  const [activeTypeFilter, setActiveTypeFilter] = useState("All Types");
  const [date, setDate] = useState<DateRange | undefined>();
  const navigate = useNavigate();

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
  }, []);

  const handleCreateTemplate = () => {
    setSelectedTemplate(null);
    setCreateModalOpen(true);
  };

  const handleEditTemplate = (template: QuestionnaireTemplate) => {
    setSelectedTemplate(template);
    setCreateModalOpen(true);
  };

  const handleDeleteClick = (template: QuestionnaireTemplate) => {
    setTemplateToDelete(template);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!templateToDelete) return;

    try {
      await templateApi.deleteTemplate(templateToDelete.id);
      toast({
        title: "Success",
        description: "Template deleted successfully",
      });
      fetchTemplates();
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to delete template",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    }
  };

  const handleViewQuestions = (template: QuestionnaireTemplate) => {
    navigate(`/dashboard/questionnaires/${template.id}/questions`);
  };

  // Comprehensive filtering logic
  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      // Search filter
      const matchesSearch =
        !searchTerm ||
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.questionnaire_type?.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      const matchesStatus =
        activeStatusFilter === "All" ||
        (activeStatusFilter === "Published" && template.is_published) ||
        (activeStatusFilter === "Draft" && !template.is_published);

      // Type filter - map display names to actual values
      const typeMapping: Record<string, string> = {
        "Standard Weight Loss": "standard_weight_loss",
        "Individualized GLP": "individualized_glp",
        "Follow-up": "follow_up",
        "ED": "ed_questionnaire",
        "Client Custom": "client_custom",
      };
      
      const matchesType =
        activeTypeFilter === "All Types" ||
        template.questionnaire_type === typeMapping[activeTypeFilter];

      // Date range filter
      let matchesDateRange = true;
      if (date?.from || date?.to) {
        try {
          const templateDate = parseISO(template.updated_at);

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
    fetchTemplates();
  }, []);

  const templatesWithActions = Array.isArray(filteredTemplates)
    ? filteredTemplates.map((template) => ({
        ...template,
        actions: (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleViewQuestions(template)}
              title="View Questions"
            >
              <FileText className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEditTemplate(template)}
              title="Edit Template"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteClick(template)}
              title="Delete Template"
            >
              <Trash2 className="h-4 w-4 text-red-600" />
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
            Create and manage questionnaire templates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => navigate("/dashboard/questionnaires/assign")}
          >
            <FileText className="h-4 w-4" />
            Assign Template
          </Button>
          <Button className="gap-2" onClick={handleCreateTemplate}>
            <Plus className="h-4 w-4" />
            Create Template
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <p className="text-muted-foreground">Loading templates...</p>
        </div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground mb-4">No templates yet</p>
          <Button onClick={handleCreateTemplate}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Template
          </Button>
        </div>
      ) : (
        <DataTable
          data={templatesWithActions}
          columns={[
            ...getTemplateColumns(navigate),
            { key: "actions", label: "Actions" },
          ]}
          searchPlaceholder="Search templates by name or type"
          showDatePicker={true}
          showResetFilters={true}
          filters={filters}
          dateRange={date}
          onDateRangeChange={setDate}
          onSearch={setSearchTerm}
          onResetFilters={handleResetFilters}
          onRefresh={handleRefresh}
        />
      )}

      <AddQuestionnairesForm
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        template={selectedTemplate}
        onSuccess={() => {
          fetchTemplates();
          setCreateModalOpen(false);
        }}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the template "{templateToDelete?.name}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}