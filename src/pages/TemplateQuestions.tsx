import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { templateApi, questionApi, QuestionnaireTemplate, Question } from '@/api/questionnaires';
import { AddQuestionnairesForm } from '@/components/questionnaires/AddQuestionnairesForm';
import { ReadOnlyIndicator } from '@/components/questionnaires/ReadOnlyIndicator';
import { useToast } from '@/hooks/use-toast';

const questionTypeFilters = [
  'All Types',
  'text',
  'textarea',
  'single_choice',
  'multiple_choice',
  'number',
  'date',
  'height_weight',
  'consent',
  'file_upload',
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
    key: 'question_text', 
    label: 'Question Text',
    className: 'max-w-md'
  },
  { 
    key: 'question_type', 
    label: 'Type',
    render: (value: string) => formatQuestionType(value)
  },
  { 
    key: 'is_required', 
    label: 'Required',
    render: (value: boolean) => (
      <Badge variant={value ? 'default' : 'secondary'} className="whitespace-nowrap">
        {value ? 'Yes' : 'No'}
      </Badge>
    )
  },
  { 
    key: 'is_read_only', 
    label: 'Status',
    render: (value: boolean) => (
      value ? <ReadOnlyIndicator /> : <Badge variant="outline" className="whitespace-nowrap">Editable</Badge>
    )
  },
  { key: 'order_index', label: 'Order' },
];

export default function TemplateQuestions() {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [template, setTemplate] = useState<QuestionnaireTemplate | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTypeFilter, setActiveTypeFilter] = useState('All Types');

  const fetchData = async () => {
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
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load template',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData, templateId]);

  const handleAddQuestion = () => {
    setSelectedQuestion(null);
    setModalOpen(true);
  };

  const handleEditQuestion = (question: Question) => {
    // Check if question is read-only
    if (question.is_read_only) {
      toast({
        title: 'Cannot Edit Question',
        description: 'This question is from the admin template and cannot be modified',
        variant: 'destructive',
      });
      return;
    }
    setSelectedQuestion(question);
    setModalOpen(true);
  };

  const handleDeleteQuestion = (question: Question) => {
    // Check if question is read-only
    if (question.is_read_only) {
      toast({
        title: 'Cannot Delete Question',
        description: 'This question is from the admin template and cannot be deleted',
        variant: 'destructive',
      });
      return;
    }

    setQuestionToDelete(question);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteQuestion = async () => {
    if (!questionToDelete) return;

    try {
      await questionApi.deleteQuestion(questionToDelete.id);
      toast({
        title: 'Success',
        description: 'Question deleted successfully',
      });
      fetchData();
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to delete question',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setQuestionToDelete(null);
    }
  };

  const handleFlowBuilder = () => {
    navigate(`/dashboard/templates/${templateId}/flow-builder`);
  };

  // Filter questions based on search and type filter
  const filteredQuestions = useMemo(() => {
    return questions.filter((question) => {
      // Search filter
      const matchesSearch =
        !searchTerm ||
        question.question_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        question.question_type.toLowerCase().includes(searchTerm.toLowerCase());

      // Type filter
      const matchesType =
        activeTypeFilter === 'All Types' ||
        question.question_type === activeTypeFilter;

      return matchesSearch && matchesType;
    });
  }, [questions, searchTerm, activeTypeFilter]);

  // Create filter configuration for DataTable
  const filters = questionTypeFilters.map((type) => ({
    key: `type-${type}`,
    label: type === 'All Types' ? type : type.replace('_', ' '),
    type: 'button' as const,
    value: activeTypeFilter === type ? type : undefined,
    onClick: () => setActiveTypeFilter(type),
  }));

  const handleResetFilters = useCallback(() => {
    setActiveTypeFilter('All Types');
    setSearchTerm('');
  }, []);

  const questionsWithActions = filteredQuestions.map((question) => ({
    ...question,
    actions: (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleEditQuestion(question)}
          title={question.is_read_only ? "This question is locked" : "Edit Question"}
          disabled={question.is_read_only}
          className={question.is_read_only ? "opacity-50 cursor-not-allowed" : ""}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleDeleteQuestion(question)}
          title={question.is_read_only ? "This question is locked" : "Delete Question"}
          disabled={question.is_read_only}
          className={question.is_read_only ? "opacity-50 cursor-not-allowed" : ""}
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
            onClick={() => navigate('/dashboard/templates')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{template?.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage questions for this template
            </p>
          </div>
          {template && (
            <Badge variant={template.is_published ? 'default' : 'secondary'}>
              {template.is_published ? 'Published' : 'Draft'}
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
          columns={[...questionColumns, { key: 'actions', label: 'Actions' }]}
          searchPlaceholder="Search questions by text or type"
          emptyMessage="No questions found"
          showDatePicker={false}
          showExport={false}
          showResetFilters={true}
          filters={filters}
          onSearch={setSearchTerm}
          onResetFilters={handleResetFilters}
          getRowClassName={(row) => row.is_read_only ? 'bg-gray-50' : ''}
        />
      )}

      <AddQuestionnairesForm
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
