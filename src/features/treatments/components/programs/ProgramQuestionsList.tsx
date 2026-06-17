import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, LayoutGrid, ArrowUpDown, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import type { Program, ProgramQuestion } from "../../../types";
import { createMockId } from "../../data/factories";
import {
  useSaveProgramQuestion,
  useDeleteProgramQuestion,
  useReorderProgramQuestions,
} from "../../hooks/useTreatmentLibraries";
import { toast } from "@/components/ui/use-toast";

// Sub-modals & components
import { AuthSetupModal } from "./AuthSetupModal";
import { SectionSelectorModal } from "./SectionSelectorModal";
import { ConsentSelectorModal } from "./ConsentSelectorModal";
import { CheckoutQuestionModal } from "./CheckoutQuestionModal";
import { QuestionEditorDialog } from "../question-editor/QuestionEditorDialog";
import { ProgramQuestionsListRow } from "./ProgramQuestionsListRow";

interface ProgramQuestionsListProps {
  program: Program;
  initialQuestions: ProgramQuestion[];
}

export function ProgramQuestionsList({ program, initialQuestions }: ProgramQuestionsListProps) {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<ProgramQuestion[]>(initialQuestions);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isReorderActive, setIsReorderActive] = useState(false);

  // Modal open states
  const [isQuestionOpen, setIsQuestionOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSectionOpen, setIsSectionOpen] = useState(false);
  const [isConsentOpen, setIsConsentOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Active question editing/deleting state
  const [activeEditingQuestion, setActiveEditingQuestion] = useState<ProgramQuestion | null>(null);
  const [questionToDeleteId, setQuestionToDeleteId] = useState<string | null>(null);

  // Sync state if initialQuestions change
  useEffect(() => {
    setQuestions(initialQuestions);
  }, [initialQuestions]);

  // Mutations
  const saveQuestionMutation = useSaveProgramQuestion(program.id);
  const deleteQuestionMutation = useDeleteProgramQuestion(program.id);
  const reorderQuestionsMutation = useReorderProgramQuestions(program.id);

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = questions.findIndex((q) => q.id === active.id);
      const newIndex = questions.findIndex((q) => q.id === over.id);
      const updated = arrayMove(questions, oldIndex, newIndex).map((q, idx) => ({
        ...q,
        order: idx + 1,
      }));

      setQuestions(updated);
      reorderQuestionsMutation.mutate(updated.map((q) => q.id), {
        onSuccess: () => {
          toast({ title: "Order Saved", description: "The list order has been successfully saved." });
        },
        onError: () => {
          setQuestions(questions); // Rollback
          toast({ title: "Error", description: "Failed to save the new order.", variant: "destructive" });
        },
      });
    }
  };

  // Processed list for search and type filter
  const processedQuestions = useMemo(() => {
    let result = [...questions].sort((a, b) => a.order - b.order);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (question) =>
          question.text.toLowerCase().includes(q) ||
          question.kind.toLowerCase().includes(q)
      );
    }

    if (typeFilter !== "all") {
      result = result.filter((q) => {
        if (typeFilter === "single") {
          return q.kind === "single_choice" || q.kind === "yes_no";
        }
        return q.kind === typeFilter;
      });
    }

    return result;
  }, [questions, searchQuery, typeFilter]);

  // Dynamic counts for pill buttons
  const typeCounts = useMemo(() => {
    const counts = {
      all: questions.length,
      single: 0,
      checkout: 0,
      multiple: 0,
      consent: 0,
      number: 0,
      date: 0,
    };
    questions.forEach((q) => {
      if (q.kind === "single_choice" || q.kind === "yes_no") {
        counts.single++;
      } else if (q.kind === "multiple_choice") {
        counts.multiple++;
      } else if (q.kind === "checkout") {
        counts.checkout++;
      } else if (q.kind === "consent") {
        counts.consent++;
      } else if (q.kind === "number") {
        counts.number++;
      } else if (q.kind === "date") {
        counts.date++;
      }
    });
    return counts;
  }, [questions]);

  // Editing dispatch
  const handleEditClick = (q: ProgramQuestion) => {
    setActiveEditingQuestion(q);
    if (q.kind === "checkout") {
      setIsCheckoutOpen(true);
    } else if (q.kind === "personal_details") {
      setIsAuthOpen(true);
    } else {
      setIsQuestionOpen(true);
    }
  };

  // Deleting confirmation
  const handleDeleteClick = (id: string) => {
    setQuestionToDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (questionToDeleteId) {
      deleteQuestionMutation.mutate(questionToDeleteId, {
        onSuccess: () => {
          setQuestions((prev) => prev.filter((q) => q.id !== questionToDeleteId));
          toast({ title: "Element Removed", description: "The element has been removed from this program." });
        },
      });
    }
    setIsDeleteDialogOpen(false);
  };

  // Add handlers
  const handleAddQuestionSave = (updatedQuestion: ProgramQuestion) => {
    const isEditing = questions.some(q => q.id === updatedQuestion.id);

    saveQuestionMutation.mutate(updatedQuestion, {
      onSuccess: () => {
        setQuestions((prev) => {
          if (isEditing) {
            return prev.map((q) => (q.id === updatedQuestion.id ? updatedQuestion : q));
          }
          return [...prev, updatedQuestion];
        });
        toast({ title: isEditing ? "Question Updated" : "Question Added" });
      },
    });
    setActiveEditingQuestion(null);
  };

  const handleAddCheckoutSave = (data: any) => {
    const isEditing = !!activeEditingQuestion;
    const newQuestion: ProgramQuestion = {
      id: isEditing ? activeEditingQuestion!.id : createMockId("q-checkout"),
      order: isEditing ? activeEditingQuestion!.order : questions.length + 1,
      text: data.text,
      kind: "checkout",
      section: "Checkout",
      required: true,
    };

    saveQuestionMutation.mutate(newQuestion, {
      onSuccess: () => {
        setQuestions((prev) => {
          if (isEditing) {
            return prev.map((q) => (q.id === newQuestion.id ? newQuestion : q));
          }
          return [...prev, newQuestion];
        });
        toast({ title: isEditing ? "Checkout Options Saved" : "Checkout Options Added" });
      },
    });
    setActiveEditingQuestion(null);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 w-full">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(`/dashboard/treatments/programs/${program.slug}`)}
            className="h-8 w-8 text-slate-500 border-slate-200 hover:bg-slate-50 rounded-lg"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 leading-tight">
              {program.name}
            </h1>
            <p className="text-[13px] text-slate-500 mt-0.5">
              Manage questions for this template
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => navigate(`/dashboard/treatments/programs/${program.slug}?view=flow`)}
            className="h-9 px-4 text-[13px] font-semibold text-slate-600 border-slate-200 hover:bg-slate-50 shadow-sm rounded-lg"
          >
            <LayoutGrid className="h-4 w-4 mr-2 text-slate-400" />
            Flow Builder
          </Button>
          <Button
            variant={isReorderActive ? "secondary" : "outline"}
            onClick={() => setIsReorderActive(!isReorderActive)}
            className={`h-9 px-4 text-[13px] font-semibold shadow-sm rounded-lg ${
              isReorderActive
                ? "bg-slate-100 text-slate-900 border-slate-300"
                : "text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <ArrowUpDown className="h-4 w-4 mr-2 text-slate-400" />
            {isReorderActive ? "Done Reordering" : "Reorder"}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="h-9 px-4 text-[13px] font-bold bg-[#1d4ed8] hover:bg-blue-700 text-white shadow-sm rounded-lg">
                <Plus className="h-4 w-4 mr-2" />
                Add Element
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[320px] p-2 bg-white border border-slate-200 rounded-xl shadow-xl">
              <DropdownMenuItem
                onClick={() => {
                  setActiveEditingQuestion(null);
                  setIsQuestionOpen(true);
                }}
                className="flex flex-col items-start gap-1 p-3 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                <div className="flex items-center gap-2 text-purple-700 font-bold text-xs">
                  <span className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center">?</span>
                  Question
                </div>
                <div className="text-[10px] text-slate-400 leading-normal">
                  Ask the patient something — text, choice, file, etc.
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setActiveEditingQuestion(null);
                  setIsAuthOpen(true);
                }}
                className="flex flex-col items-start gap-1 p-3 rounded-lg hover:bg-slate-50 cursor-pointer border-t border-slate-100"
              >
                <div className="flex items-center gap-2 text-amber-700 font-bold text-xs">
                  <span className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center">🔒</span>
                  Patient Authentication
                </div>
                <div className="text-[10px] text-slate-400 leading-normal">
                  Email, SMS code, photo ID, or account creation requirements.
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setActiveEditingQuestion(null);
                  setIsSectionOpen(true);
                }}
                className="flex flex-col items-start gap-1 p-3 rounded-lg hover:bg-slate-50 cursor-pointer border-t border-slate-100"
              >
                <div className="flex items-center gap-2 text-blue-700 font-bold text-xs">
                  <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">📋</span>
                  Section
                </div>
                <div className="text-[10px] text-slate-400 leading-normal">
                  Insert a reusable Common Section (Demographics, Medical Baseline...).
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setActiveEditingQuestion(null);
                  setIsConsentOpen(true);
                }}
                className="flex flex-col items-start gap-1 p-3 rounded-lg hover:bg-slate-50 cursor-pointer border-t border-slate-100"
              >
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">✍️</span>
                  Consent
                </div>
                <div className="text-[10px] text-slate-400 leading-normal">
                  Attach a legal consent the patient must acknowledge.
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setActiveEditingQuestion(null);
                  setIsCheckoutOpen(true);
                }}
                className="flex flex-col items-start gap-1 p-3 rounded-lg hover:bg-slate-50 cursor-pointer border-t border-slate-100"
              >
                <div className="flex items-center gap-2 text-rose-700 font-bold text-xs">
                  <span className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center">🛒</span>
                  Checkout
                </div>
                <div className="text-[10px] text-slate-400 leading-normal">
                  Show the patient available products and let them pick a regimen.
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-[1400px] mx-auto w-full">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          {/* Filters Bar */}
          <div className="p-4 border-b border-slate-200 flex flex-wrap items-center gap-4 justify-between bg-white">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mr-2">TYPE</span>

              <button
                onClick={() => setTypeFilter("all")}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shadow-sm ${
                  typeFilter === "all"
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                All {typeCounts.all}
              </button>

              <button
                onClick={() => setTypeFilter("single")}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shadow-sm ${
                  typeFilter === "single"
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                single {typeCounts.single}
              </button>

              <button
                onClick={() => setTypeFilter("checkout")}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shadow-sm ${
                  typeFilter === "checkout"
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                Checkout {typeCounts.checkout}
              </button>

              <button
                onClick={() => setTypeFilter("multiple_choice")}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shadow-sm ${
                  typeFilter === "multiple_choice"
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                multiple {typeCounts.multiple}
              </button>

              <button
                onClick={() => setTypeFilter("consent")}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shadow-sm ${
                  typeFilter === "consent"
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                consent {typeCounts.consent}
              </button>

              <button
                onClick={() => setTypeFilter("number")}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shadow-sm ${
                  typeFilter === "number"
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                number {typeCounts.number}
              </button>

              <button
                onClick={() => setTypeFilter("date")}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shadow-sm ${
                  typeFilter === "date"
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                date {typeCounts.date}
              </button>

              <button className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all bg-white text-slate-400 border border-dashed border-slate-250 hover:bg-slate-50/50">
                + 23 more types
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search questions, answers, or mapped field"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-[320px] h-9 text-[13px] bg-white border-slate-200 rounded-lg shadow-sm"
              />
            </div>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-[80px_1fr_120px_160px_100px] gap-6 px-6 py-3 bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            <div>{isReorderActive ? "DRAG / #" : "#"}</div>
            <div>QUESTION OR ELEMENT</div>
            <div>REQUIRED</div>
            <div>TYPE</div>
            <div className="text-right">ACTIONS</div>
          </div>

          {/* Table Body (DndContext enabled if isReorderActive) */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={processedQuestions.map((q) => q.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="divide-y divide-slate-100 min-h-[160px] bg-white">
                {processedQuestions.length === 0 ? (
                  <div className="p-12 text-center text-[13px] text-slate-400 italic">
                    No questions match your criteria.
                  </div>
                ) : (
                  processedQuestions.map((q, index) => (
                    <ProgramQuestionsListRow
                      key={q.id}
                      question={q}
                      index={index}
                      isReorderActive={isReorderActive}
                      onEdit={handleEditClick}
                      onDelete={handleDeleteClick}
                    />
                  ))
                )}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </main>

      {/* Modals & Dialogs */}
      <QuestionEditorDialog
        open={isQuestionOpen}
        onOpenChange={setIsQuestionOpen}
        onSave={handleAddQuestionSave}
        initialQuestionId={activeEditingQuestion?.id || null}
        questions={questions}
        programId={program.id}
      />

      <CheckoutQuestionModal
        open={isCheckoutOpen}
        onOpenChange={setIsCheckoutOpen}
        onSave={handleAddCheckoutSave}
        initialQuestion={
          activeEditingQuestion
            ? {
                id: activeEditingQuestion.id,
                text: activeEditingQuestion.text,
                products: [],
                visibilityRules: { mode: "simple", rules: [] },
              }
            : null
        }
        programName={program.name}
        screeningQuestions={questions.map((q) => ({ id: q.id, text: q.text }))}
      />

      <AuthSetupModal
        open={isAuthOpen}
        onOpenChange={setIsAuthOpen}
        initialConfig={program.authConfig}
        onSave={(config) => {
          // Save Auth config by updating program's details or adding personal details row
          const authQuestion: ProgramQuestion = {
            id: activeEditingQuestion?.id || createMockId("q-auth"),
            order: activeEditingQuestion?.order || questions.length + 1,
            text: `Patient Authentication (Email, Phone, Identity, Account)`,
            kind: "personal_details",
            section: "Authentication",
            required: true,
          };
          saveQuestionMutation.mutate(authQuestion, {
            onSuccess: () => {
              setQuestions((prev) => {
                if (activeEditingQuestion) {
                  return prev.map((q) => (q.id === authQuestion.id ? authQuestion : q));
                }
                return [...prev, authQuestion];
              });
              toast({ title: "Authentication Settings Saved" });
            },
          });
        }}
      />

      <SectionSelectorModal
        open={isSectionOpen}
        onOpenChange={setIsSectionOpen}
        onSelect={(section) => {
          const sectionQuestion: ProgramQuestion = {
            id: createMockId("q-section"),
            order: questions.length + 1,
            text: `${section.name} Section`,
            kind: "multiple_choice",
            section: section.name,
            required: true,
          };
          saveQuestionMutation.mutate(sectionQuestion, {
            onSuccess: () => {
              setQuestions((prev) => [...prev, sectionQuestion]);
              toast({ title: "Common Section Attached" });
            },
          });
        }}
      />

      <ConsentSelectorModal
        open={isConsentOpen}
        onOpenChange={setIsConsentOpen}
        onSelect={(consent) => {
          const consentQuestion: ProgramQuestion = {
            id: createMockId("q-consent"),
            order: questions.length + 1,
            text: consent.name,
            kind: "consent",
            section: "Consents",
            required: true,
            consentText: `Patient must accept: ${consent.name}`,
          };
          saveQuestionMutation.mutate(consentQuestion, {
            onSuccess: () => {
              setQuestions((prev) => [...prev, consentQuestion]);
              toast({ title: "Consent Form Attached" });
            },
          });
        }}
      />

      {/* Delete Confirmation AlertDialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-white border border-slate-200 rounded-2xl shadow-xl p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-slate-900">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-500 mt-2">
              This action cannot be undone. This element will be permanently removed from this intake program templates.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 flex gap-2 justify-end">
            <AlertDialogCancel className="h-8 text-xs font-semibold border-slate-200">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="h-8 text-xs font-bold bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
