import { useState, useMemo } from "react";
import { Plus, Search, ArrowDownAZ, Clock, List as ListIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { TreatmentPageHeader } from "../components/common";
import { TreatmentProgramCard } from "../components/programs/TreatmentProgramCard";
import { usePrograms, useTreatmentTypes, useSaveProgram } from "../hooks/useTreatmentLibraries";
import { createMockId, currentDateStamp } from "../data/factories";
import type { Program, ProgramStage } from "../../types";

export default function ProgramsPage() {
  const { data: programs = [] } = usePrograms();
  const { data: treatmentTypes = [] } = useTreatmentTypes();
  const saveProgramMutation = useSaveProgram();

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"alpha" | "recent">("recent");

  // Create Program Form State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newProgramName, setNewProgramName] = useState("");
  const [newProgramStage, setNewProgramStage] = useState<"intake" | "follow_up">("intake");
  const [newProgramTreatmentKey, setNewProgramTreatmentKey] = useState("");
  const [newProgramVisitType, setNewProgramVisitType] = useState("");
  const [newProgramSlug, setNewProgramSlug] = useState("");

  // Metrics calculation
  const totalTreatments = treatmentTypes.length;
  const missingFollowUp = useMemo(() => {
    return treatmentTypes.filter(t => !programs.some(p => p.treatmentTypeKey === t.key && p.stage === "follow_up")).length;
  }, [treatmentTypes, programs]);

  // Handlers for mocked functional rules
  const handleAddFollowUp = (treatmentKey: string) => {
    const treatment = treatmentTypes.find((t) => t.key === treatmentKey);
    if (!treatment) return;

    const newProgram: Program = {
      id: `program-${treatmentKey}-followup-new`,
      name: `${treatment.name} Follow-up`,
      stage: "follow_up",
      treatmentTypeKey: treatment.key,
      visitType: treatment.followupVisitType || `${treatmentKey}Followup`,
      questionCount: 0,
      checkoutQuestionCount: 0,
      status: "draft",
      updatedAt: new Date().toISOString().split("T")[0],
      slug: `${treatmentKey}-followup-new`,
      authConfig: {
        email: true,
        phone: false,
        identity: false,
        account: true,
      },
      checkoutQuestions: [],
      consentIds: [],
    };
    saveProgramMutation.mutate(newProgram);
    toast({
      title: "Follow-up Created",
      description: `Draft follow-up created for ${treatment.name}`,
    });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProgramName.trim() || !newProgramTreatmentKey || !newProgramVisitType || !newProgramSlug) {
      toast({
        title: "Missing required fields",
        description: "Program name, treatment type, visit type, and slug are required.",
        variant: "destructive",
      });
      return;
    }

    const newProg: Program = {
      id: createMockId("program"),
      name: newProgramName,
      stage: newProgramStage,
      treatmentTypeKey: newProgramTreatmentKey,
      visitType: newProgramVisitType,
      questionCount: 0,
      checkoutQuestionCount: 0,
      status: "draft",
      updatedAt: currentDateStamp(),
      slug: newProgramSlug.toLowerCase().replace(/[^a-z0-9-_]/g, ""),
      authConfig: {
        email: true,
        phone: false,
        identity: false,
        account: true,
      },
      checkoutQuestions: [],
      consentIds: [],
    };

    saveProgramMutation.mutate(newProg);
    setIsCreateOpen(false);

    // Clear inputs
    setNewProgramName("");
    setNewProgramStage("intake");
    setNewProgramTreatmentKey("");
    setNewProgramVisitType("");
    setNewProgramSlug("");

    toast({
      title: "Program Created",
      description: `Successfully created program: ${newProgramName}`,
    });
  };

  // Derived filtered & sorted data
  const processedTreatments = useMemo(() => {
    let result = [...treatmentTypes];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q)) ||
          t.key.toLowerCase().includes(q)
      );
    }

    if (sortBy === "alpha") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      result.sort((a, b) => {
        const aProgs = programs.filter(p => p.treatmentTypeKey === a.key);
        const bProgs = programs.filter(p => p.treatmentTypeKey === b.key);
        const aMax = aProgs.reduce((max, p) => p.updatedAt > max ? p.updatedAt : max, "");
        const bMax = bProgs.reduce((max, p) => p.updatedAt > max ? p.updatedAt : max, "");
        return bMax.localeCompare(aMax);
      });
    }

    return result;
  }, [treatmentTypes, programs, searchQuery, sortBy]);

  return (
    <div className="p-6 max-w-[1600px] mx-auto min-h-screen">
      <TreatmentPageHeader
        title="Programs"
        subtitle="Clinical questionnaires linked to specific treatments. Each treatment has an intake module and (optionally) a follow-up module."
        actions={
          <Button onClick={() => setIsCreateOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-9 px-4 text-xs rounded-lg shadow-sm">
            <Plus className="mr-1.5 h-4 w-4 stroke-[2.5]" />
            Create Program
          </Button>
        }
      />

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col justify-center">
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            TOTAL TREATMENTS
          </span>
          <span className="text-2xl font-bold text-blue-600">
            {totalTreatments}
          </span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col justify-center relative">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="h-2 w-2 rounded-full bg-slate-300"></span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              MISSING FOLLOW-UP
            </span>
          </div>
          <span className="text-2xl font-bold text-slate-900">
            {missingFollowUp}
          </span>
        </div>
      </div>

      {/* Filter Toolbar Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search treatments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-[260px] h-9 text-xs bg-white border-slate-200 rounded-lg shadow-sm"
            />
          </div>
          
          <Button
            variant="outline"
            onClick={() => setSortBy("alpha")}
            className={`h-9 px-3 text-xs font-semibold rounded-lg shadow-sm ${
              sortBy === "alpha" 
                ? "bg-blue-50 text-blue-700 border-blue-200" 
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <ArrowDownAZ className="mr-1.5 h-4 w-4" />
            Sort A&rarr;Z
          </Button>

          <Button
            variant="outline"
            onClick={() => setSortBy("recent")}
            className={`h-9 px-3 text-xs font-semibold rounded-lg shadow-sm ${
              sortBy === "recent" 
                ? "bg-blue-50 text-blue-600 border-blue-200" 
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Clock className="mr-1.5 h-4 w-4" />
            Recently updated
          </Button>
        </div>

        <Button
          variant="outline"
          className="h-9 px-3 text-xs font-semibold bg-white text-slate-600 border-slate-200 hover:bg-slate-50 rounded-lg shadow-sm"
        >
          <ListIcon className="mr-1.5 h-4 w-4" />
          List view
        </Button>
      </div>

      {/* Grid of Treatment Cards */}
      {processedTreatments.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
          <p className="text-sm text-slate-500">No treatments found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
          {processedTreatments.map((t) => {
            const tPrograms = programs.filter(p => p.treatmentTypeKey === t.key);
            const intake = tPrograms.find(p => p.stage === "intake");
            const followUp = tPrograms.find(p => p.stage === "follow_up");

            return (
              <TreatmentProgramCard
                key={t.id}
                treatment={t}
                intakeProgram={intake}
                followUpProgram={followUp}
                onAddFollowUp={handleAddFollowUp}
              />
            );
          })}
        </div>
      )}

      {/* CREATE PROGRAM DIALOG */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md p-6 bg-white border border-slate-200 rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-bold text-slate-900">Create New Program</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4 mt-2">
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">Program Name</label>
              <Input
                value={newProgramName}
                onChange={(e) => {
                  setNewProgramName(e.target.value);
                  setNewProgramSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-"));
                }}
                placeholder="e.g. Erectile Dysfunction Intake"
                required
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Program Stage</label>
                <select
                  value={newProgramStage}
                  onChange={(e) => setNewProgramStage(e.target.value as ProgramStage)}
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none"
                >
                  <option value="intake">Intake</option>
                  <option value="follow_up">Follow Up</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Treatment Type</label>
                <select
                  value={newProgramTreatmentKey}
                  onChange={(e) => setNewProgramTreatmentKey(e.target.value)}
                  required
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none"
                >
                  <option value="">Select treatment...</option>
                  {treatmentTypes.map(t => (
                    <option key={t.id} value={t.key}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Visit Type Key</label>
                <Input
                  value={newProgramVisitType}
                  onChange={(e) => setNewProgramVisitType(e.target.value)}
                  placeholder="e.g. weightloss"
                  required
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Program Slug</label>
                <Input
                  value={newProgramSlug}
                  onChange={(e) => setNewProgramSlug(e.target.value)}
                  placeholder="e.g. ed-intake"
                  required
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="h-9 px-4 text-xs font-semibold rounded-lg">
                Cancel
              </Button>
              <Button type="submit" className="h-9 px-4 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm">
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
