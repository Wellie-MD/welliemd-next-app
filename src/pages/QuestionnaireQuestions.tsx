import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Edit, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import {
  templateApi,
  questionApi,
  QuestionnaireTemplate,
  Question,
} from "@/api/questionnaires";
import { QuestionForm } from "@/components/questionnaires/QuestionForm";
import { toast } from "@/components/ui/use-toast";

const questionTypeFilters = [
  "All Types",
  "text",
  "textarea",
  "single_choice",
  "multiple_choice",
  "number",
  "date",
  "height_weight",
  "consent",
  "file_upload",
];

// Helper function to format question type
const formatQuestionType = (type: string): string => {
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const questionColumns = [
  { 
    key: "question_text", 
    label: "Question Text",
    className: "max-w-md"
  },
  { 
    key: "question_type", 
    label: "Type",
    render: (value: string) => formatQuestionType(value)
  },
  {
    key: "is_required",
    label: "Required",
    render: (value: boolean) => (
      <Badge variant={value ? "default" : "secondary"} className="whitespace-nowrap">
        {value ? "Yes" : "No"}
      </Badge>
    ),
  },
  {
    key: "is_read_only",
    label: "Status",
    render: (value: boolean) => (
      <Badge variant={value ? "default" : "outline"} className="whitespace-nowrap">
        {value ? "Read-only" : "Editable"}
      </Badge>
    ),
  },
  { key: "order_index", label: "Order" },
  { key: "created_at", label: "Created At" },
];

export default function QuestionnaireQuestions() {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();

  const [template, setTemplate] = useState<QuestionnaireTemplate | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTypeFilter, setActiveTypeFilter] = useState("All Types");

  const fetchData = useCallback(async () => {
    if (!templateId) return;

    try {
      setLoading(true);
      const templateData = await templateApi.getTemplate(templateId);
      setTemplate(templateData);

      // Use questions from template response if available
      if (templateData.questions && templateData.questions.length > 0) {
        setQuestions(templateData.questions);
      } else {
        // Fallback to separate API call
        const questionsData = await questionApi.listQuestions(templateId);
        setQuestions(Array.isArray(questionsData) ? questionsData : []);
      }
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to load template",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [templateId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddQuestion = () => {
    setSelectedQuestion(null);
    setModalOpen(true);
  };

  const handleEditQuestion = (question: Question) => {
    setSelectedQuestion(question);
    setModalOpen(true);
  };

  const handleDeleteQuestion = async (question: Question) => {
    if (!confirm(`Are you sure you want to delete this question?`)) return;

    try {
      await questionApi.deleteQuestion(question.id);
      toast({
        title: "Success",
        description: "Question deleted successfully",
      });
      fetchData();
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to delete question",
        variant: "destructive",
      });
    }
  };

  const handleFlowBuilder = () => {
    navigate(`/dashboard/questionnaires/${templateId}/flow-builder`);
  };

  // Filter questions based on search and type filter
  const filteredQuestions = useMemo(() => {
    return questions.filter((question) => {
      // Search filter
      const matchesSearch =
        !searchTerm ||
        question.question_text
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        question.question_type.toLowerCase().includes(searchTerm.toLowerCase());

      // Type filter
      const matchesType =
        activeTypeFilter === "All Types" ||
        question.question_type === activeTypeFilter;

      return matchesSearch && matchesType;
    });
  }, [questions, searchTerm, activeTypeFilter]);

  // Create filter configuration for DataTable
  const filters = questionTypeFilters.map((type) => ({
    key: `type-${type}`,
    label: type === "All Types" ? type : type.replace("_", " "),
    type: "button" as const,
    value: activeTypeFilter === type ? type : undefined,
    onClick: () => setActiveTypeFilter(type),
  }));

  const handleResetFilters = useCallback(() => {
    setActiveTypeFilter("All Types");
    setSearchTerm("");
  }, []);

  const questionsWithActions = filteredQuestions.map((question) => ({
    ...question,
    actions: (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleEditQuestion(question)}
          title="Edit Question"
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleDeleteQuestion(question)}
          title="Delete Question"
        >
          <Trash2 className="h-4 w-4 text-red-600" />
        </Button>
      </div>
    ),
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard/questionnaires")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{template?.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage questions for this template
            </p>
          </div>
          {template && (
            <Badge variant={template.is_published ? "default" : "secondary"}>
              {template.is_published ? "Published" : "Draft"}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleFlowBuilder}>
            <FileText className="h-4 w-4 mr-2" />
            Flow Builder
          </Button>
          <Button onClick={handleAddQuestion}>
            <Plus className="h-4 w-4 mr-2" />
            Add Question
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <p className="text-muted-foreground">Loading questions...</p>
        </div>
      ) : questions.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground mb-4">No questions yet</p>
          <div className="flex gap-2">
            <Button onClick={handleAddQuestion}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Question
            </Button>
            <Button variant="outline" onClick={handleFlowBuilder}>
              <FileText className="h-4 w-4 mr-2" />
              Use Flow Builder
            </Button>
          </div>
        </div>
      ) : (
        <DataTable
          data={questionsWithActions}
          columns={[...questionColumns, { key: "actions", label: "Actions" }]}
          searchPlaceholder="Search questions by text or type"
          emptyMessage="No questions found"
          showDatePicker={false}
          showExport={false}
          showResetFilters={true}
          filters={filters}
          onSearch={setSearchTerm}
          onResetFilters={handleResetFilters}
          getRowClassName={(row) => (row.is_read_only ? "bg-gray-50" : "")}
        />
      )}

      <QuestionForm
        open={modalOpen}
        onOpenChange={setModalOpen}
        templateId={templateId!}
        question={selectedQuestion}
        onSuccess={() => {
          fetchData();
          setModalOpen(false);
        }}
      />
    </div>
  );
}
