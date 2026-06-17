import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, LayoutGrid, ArrowUpDown, Plus, Search, GripVertical, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Program, ProgramQuestion } from "../../../types";
import { createMockId } from "../../data/factories";

interface ProgramQuestionsListProps {
  program: Program;
  initialQuestions: ProgramQuestion[];
}

export function ProgramQuestionsList({ program, initialQuestions }: ProgramQuestionsListProps) {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<ProgramQuestion[]>(initialQuestions);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const handleAddElement = () => {
    // Functional mock for adding a new question
    const newQuestion: ProgramQuestion = {
      id: createMockId("q-new"),
      order: questions.length + 1,
      text: "New Question",
      kind: "text",
      section: "General",
      required: true,
    };
    setQuestions([...questions, newQuestion]);
  };

  const processedQuestions = useMemo(() => {
    let result = [...questions];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (question) =>
          question.text.toLowerCase().includes(q) ||
          question.kind.toLowerCase().includes(q)
      );
    }

    if (typeFilter !== "all") {
      result = result.filter((q) => q.kind === typeFilter);
    }

    return result;
  }, [questions, searchQuery, typeFilter]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: questions.length,
      single_choice: 0,
      multiple_choice: 0,
      checkout: 0, // Mock type just for the UI filter button
      consent: 0,
      number: 0,
      date: 0,
    };
    questions.forEach((q) => {
      if (counts[q.kind] !== undefined) {
        counts[q.kind]++;
      } else {
        counts[q.kind] = 1;
      }
    });
    return counts;
  }, [questions]);

  const formatKindLabel = (kind: string) => {
    if (kind === "single_choice") return "Single Choice";
    if (kind === "multiple_choice") return "Multiple Choice";
    if (kind === "yes_no") return "Yes/No";
    return kind.charAt(0).toUpperCase() + kind.slice(1);
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
            className="h-8 w-8 text-slate-500 border-slate-200 hover:bg-slate-50"
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
            className="h-9 px-4 text-[13px] font-semibold text-slate-600 border-slate-200 hover:bg-slate-50 shadow-sm"
          >
            <LayoutGrid className="h-4 w-4 mr-2 text-slate-400" />
            Flow Builder
          </Button>
          <Button
            variant="outline"
            className="h-9 px-4 text-[13px] font-semibold text-slate-600 border-slate-200 hover:bg-slate-50 shadow-sm"
          >
            <ArrowUpDown className="h-4 w-4 mr-2 text-slate-400" />
            Reorder
          </Button>
          <Button
            onClick={handleAddElement}
            className="h-9 px-4 text-[13px] font-bold bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Element
          </Button>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-[1400px] mx-auto w-full">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          
          {/* Filters Bar */}
          <div className="p-4 border-b border-slate-200 flex flex-wrap items-center gap-4 justify-between bg-white">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mr-2">TYPE</span>
              
              <button 
                onClick={() => setTypeFilter("all")}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] font-bold transition-colors ${typeFilter === "all" ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}
              >
                All <span className={`inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[9px] ${typeFilter === "all" ? "bg-slate-700 text-slate-200" : "bg-slate-100 text-slate-500"}`}>{typeCounts.all}</span>
              </button>

              <button 
                onClick={() => setTypeFilter("single_choice")}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] font-bold transition-colors ${typeFilter === "single_choice" ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}
              >
                single <span className="inline-flex items-center justify-center rounded bg-slate-100 px-1.5 py-0.5 text-[9px] text-slate-500">{typeCounts.single_choice || 7}</span>
              </button>

              <button 
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] font-bold transition-colors bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              >
                Checkout <span className="inline-flex items-center justify-center rounded bg-slate-100 px-1.5 py-0.5 text-[9px] text-slate-500">3</span>
              </button>

              <button 
                onClick={() => setTypeFilter("multiple_choice")}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] font-bold transition-colors ${typeFilter === "multiple_choice" ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}
              >
                multiple <span className="inline-flex items-center justify-center rounded bg-slate-100 px-1.5 py-0.5 text-[9px] text-slate-500">{typeCounts.multiple_choice || 3}</span>
              </button>

              <button 
                onClick={() => setTypeFilter("consent")}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] font-bold transition-colors ${typeFilter === "consent" ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}
              >
                consent <span className="inline-flex items-center justify-center rounded bg-slate-100 px-1.5 py-0.5 text-[9px] text-slate-500">{typeCounts.consent || 2}</span>
              </button>

              <button 
                onClick={() => setTypeFilter("number")}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] font-bold transition-colors ${typeFilter === "number" ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}
              >
                number <span className="inline-flex items-center justify-center rounded bg-slate-100 px-1.5 py-0.5 text-[9px] text-slate-500">{typeCounts.number || 1}</span>
              </button>

              <button 
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] font-bold transition-colors bg-white text-slate-400 border border-dashed border-slate-300 hover:bg-slate-50"
              >
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
          <div className="grid grid-cols-[auto_1fr_120px_140px_100px] gap-6 px-6 py-3 bg-slate-50/50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <div className="w-16">#</div>
            <div>QUESTION OR ELEMENT</div>
            <div>REQUIRED</div>
            <div>TYPE</div>
            <div className="text-right">ACTIONS</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-slate-100">
            {processedQuestions.length === 0 ? (
              <div className="p-12 text-center text-[13px] text-slate-500 italic">
                No questions match your criteria.
              </div>
            ) : (
              processedQuestions.map((q, index) => (
                <div 
                  key={q.id} 
                  className="grid grid-cols-[auto_1fr_120px_140px_100px] gap-6 px-6 py-4 items-center bg-white hover:bg-slate-50 transition-colors group cursor-pointer"
                >
                  <div className="w-16 flex items-center gap-3">
                    <GripVertical className="h-4 w-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing" />
                    <div className="h-6 w-6 rounded-full border border-slate-200 flex items-center justify-center text-[11px] font-bold text-slate-500 bg-white">
                      {index + 1}
                    </div>
                  </div>
                  
                  <div className="text-[13px] font-medium text-slate-800 leading-snug">
                    {q.text}
                  </div>

                  <div className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-700">
                    {q.required && (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        Required
                      </>
                    )}
                  </div>

                  <div>
                    <div className="inline-flex items-center px-2.5 py-1 rounded border border-slate-200 text-[11px] font-bold text-slate-600 bg-white">
                      {formatKindLabel(q.kind)}
                    </div>
                  </div>

                  <div className="text-right flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
