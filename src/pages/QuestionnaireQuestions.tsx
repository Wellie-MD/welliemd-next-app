import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Edit, Trash2, FileText, ArrowUpDown, Save, X, Copy } from "lucide-react";
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
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  templateApi,
  questionApi,
  QuestionnaireTemplate,
  Question,
} from "@/api/questionnaires";
import { QuestionForm } from "@/components/questionnaires/QuestionForm";
import { ReorderableQuestionRow } from "@/components/questionnaires/ReorderableQuestionRow";
import { useQuestionReorder } from "@/hooks/useQuestionReorder";
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTypeFilter, setActiveTypeFilter] = useState("All Types");
  const [duplicatingTemplate, setDuplicatingTemplate] = useState(false);

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

  // Drag-and-drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Question reorder hook
  const {
    items: reorderableQuestions,
    isReorderMode,
    isSaving,
    hasChanges,
    isConditional,
    enterReorderMode,
    cancelReorder,
    handleDragEnd,
    saveOrder,
  } = useQuestionReorder(questions, templateId!, {
    onSuccess: fetchData,
  });

  const handleAddQuestion = () => {
    setSelectedQuestion(null);
    setModalOpen(true);
  };

  const handleEditQuestion = (question: Question) => {
    setSelectedQuestion(question);
    setModalOpen(true);
  };

  const handleDeleteQuestion = (question: Question) => {
    setQuestionToDelete(question);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteQuestion = async () => {
    if (!questionToDelete) return;

    try {
      await questionApi.deleteQuestion(questionToDelete.id);
      toast({
        title: "Success",
        description: "Question deleted successfully",
      });
      fetchData();
    } catch (error: unknown) {
      // Extract error message from backend response
      let errorMessage = "Failed to delete question";
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: unknown } };
        const responseData = axiosError.response?.data;
        
        if (responseData && typeof responseData === 'object') {
          if ('error' in responseData && typeof responseData.error === 'string') {
            errorMessage = responseData.error;
          } else if ('message' in responseData && typeof responseData.message === 'string') {
            errorMessage = responseData.message;
          } else if ('detail' in responseData && typeof responseData.detail === 'string') {
            errorMessage = responseData.detail;
          }
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setQuestionToDelete(null);
    }
  };

  const handleFlowBuilder = () => {
    navigate(`/dashboard/questionnaires/${templateId}/flow-builder`);
  };

  const handleDuplicateTemplate = async () => {
    if (!template) return;
    setDuplicatingTemplate(true);

    try {
      const newTemplate = await templateApi.duplicateTemplate(template.id);
      toast({
        title: "Template duplicated",
        description: `Created "${newTemplate.name}"`,
      });
      // Navigate back to the templates list so the user can see the new copy
      navigate("/dashboard/questionnaires");
    } catch (error: unknown) {
      toast({
        title: "Error",
        description:
          (error as any)?.response?.data?.error ||
          (error as any)?.message ||
          "Failed to duplicate template",
        variant: "destructive",
      });
    } finally {
      setDuplicatingTemplate(false);
    }
  };

  // Use reorderable questions when in reorder mode, otherwise use original questions
  const displayQuestions = isReorderMode ? reorderableQuestions : questions;

  // Filter questions based on search and type filter
  const filteredQuestions = useMemo(() => {
    return displayQuestions.filter((question) => {
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
  }, [displayQuestions, searchTerm, activeTypeFilter]);

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
          {isReorderMode ? (
            <>
              <Button
                variant="outline"
                onClick={cancelReorder}
                disabled={isSaving}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={saveOrder}
                disabled={!hasChanges || isSaving}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Order'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleFlowBuilder}>
                <FileText className="h-4 w-4 mr-2" />
                Flow Builder
              </Button>
              <Button variant="outline" onClick={enterReorderMode}>
                <ArrowUpDown className="h-4 w-4 mr-2" />
                Reorder
              </Button>
              <Button
                variant="outline"
                onClick={handleDuplicateTemplate}
                disabled={duplicatingTemplate}
              >
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </Button>
              <Button onClick={handleAddQuestion}>
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </>
          )}
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
      ) : isReorderMode ? (
        // Reorder Mode: Drag-and-drop table
        <div className="rounded-md border">
          <div className="bg-muted/50 px-4 py-3 border-b">
            <p className="text-sm text-muted-foreground">
              <strong>Reorder Mode:</strong> Drag questions to reorder them. 
              Conditional questions (with dependencies) cannot be moved.
            </p>
          </div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredQuestions.map((q) => q.id)}
              strategy={verticalListSortingStrategy}
            >
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left text-sm font-medium w-12"></th>
                    <th className="px-4 py-3 text-left text-sm font-medium w-20">Order</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Question Text</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Required</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuestions.map((question) => (
                    <ReorderableQuestionRow
                      key={question.id}
                      question={question}
                      isConditional={isConditional(question)}
                      isReorderMode={isReorderMode}
                    />
                  ))}
                </tbody>
              </table>
            </SortableContext>
          </DndContext>
        </div>
      ) : (
        // Normal Mode: Standard DataTable
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this question? This action cannot be undone.
              {questionToDelete && (
                <div className="mt-2 p-2 bg-muted rounded text-sm">
                  <strong>Question:</strong> {questionToDelete.question_text}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteQuestion}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
