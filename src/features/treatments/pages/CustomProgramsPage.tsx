import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Plus, Users, LayoutGrid, List, Search, Pill, ShoppingCart, TestTube, Package, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CustomProgramCard } from "../components/custom-programs/CustomProgramCard";
import { CustomProgramTable } from "../components/custom-programs/CustomProgramTable";
import { CustomProgramModal, type CustomProgramFormData } from "../components/custom-programs/CustomProgramModal";
import { DeleteConfirmDialog, EmptyStateCard, TreatmentPageHeader } from "../components/common";
import { PatientFlowTestModal } from "../components/builder/PatientFlowTestModal";
import { useCustomPrograms, useSaveCustomProgram, useDeleteCustomProgram } from "../hooks/useTreatmentLibraries";
import { toast } from "@/components/ui/use-toast";
import type { CustomProgram } from "../types";
import type { QuestionnairePreviewContext } from "../utils/previewUrl";
import { createMockId, currentDateStamp } from "../data/factories";

export default function CustomProgramsPage() {
  const { data: customPrograms = [] } = useCustomPrograms();
  const { mutate: saveCustomProgram } = useSaveCustomProgram();
  const { mutate: deleteCustomProgram } = useDeleteCustomProgram();

  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<CustomProgram | null>(null);

  // Preview flow state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewContext, setPreviewContext] = useState<QuestionnairePreviewContext | null>(null);
  const [deleteCustomProgramId, setDeleteCustomProgramId] = useState<string | null>(null);

  // Catalog connection flow state
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [catalogProgram, setCatalogProgram] = useState<CustomProgram | null>(null);
  const [catalogTab, setCatalogTab] = useState<"medicine" | "checkout" | "labs" | "supplies" | "hub">("medicine");

  const [filter, setFilter] = useState<"all" | "multi" | "single">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const handlePreview = (program: CustomProgram) => {
    setPreviewContext({
      mode: "custom_program",
      id: program.id,
      slug: program.slug,
      title: program.name,
    });
    setIsPreviewOpen(true);
  };

  const handleViewCatalog = (
    program: CustomProgram,
    tab: "medicine" | "checkout" | "labs" | "supplies" | "hub"
  ) => {
    setCatalogProgram(program);
    setCatalogTab(tab);
    setIsCatalogOpen(true);
  };

  const isProgramMulti = (p: CustomProgram) => {
    return p.isMulti === true || p.includedProgramIds.length > 1 || (p.tags && p.tags.includes("Multi-treatment"));
  };

  const multiCount = useMemo(() => {
    return customPrograms.filter(isProgramMulti).length;
  }, [customPrograms]);

  const singleCount = useMemo(() => {
    return customPrograms.filter((p) => !isProgramMulti(p)).length;
  }, [customPrograms]);

  const filteredPrograms = useMemo(() => {
    let result = customPrograms;

    // Filter by tab
    if (filter === "multi") {
      result = result.filter(isProgramMulti);
    } else if (filter === "single") {
      result = result.filter((p) => !isProgramMulti(p));
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.onboardingName?.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    return result;
  }, [customPrograms, filter, searchQuery]);

  // Group visible programs
  const groupedPrograms = useMemo(() => {
    const multi: CustomProgram[] = [];
    const single: CustomProgram[] = [];
    filteredPrograms.forEach((p) => {
      if (isProgramMulti(p)) {
        multi.push(p);
      } else {
        single.push(p);
      }
    });
    return { multi, single };
  }, [filteredPrograms]);

  const handleCreateOrEditSubmit = (data: CustomProgramFormData) => {
    if (selectedProgram) {
      // Editing
      saveCustomProgram(
        {
          ...selectedProgram,
          ...data,
        },
        {
          onSuccess: () => {
            toast({
              title: "Program Updated",
              description: `Successfully updated ${data.name}.`,
            });
            setIsModalOpen(false);
            setSelectedProgram(null);
          },
        }
      );
    } else {
      // Creating
      const newProgram: CustomProgram = {
        id: createMockId("custom"),
        name: data.name,
        slug: data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        description: data.description,
        status: "draft",
        audience: data.audience,
        minAge: data.minAge,
        maxAge: data.maxAge,
        includedProgramIds: [],
        sectionIds: [],
        consentIds: [],
        checkoutOptions: [],
        visitType: null,
        onboardingName: data.name,
        questionCount: 0,
        icon: "sparkles",
        iconBg: "#fdf2f8",
        iconColor: "#be185d",
        tags: ["Multi-treatment"],
        isMulti: true,
        flowItems: [
          {
            id: "auth-1",
            kind: "authentication",
            title: "Authentication",
            subtitle: "Verify identity, phone number, and account details.",
            locked: true,
          },
          {
            id: "checkout-1",
            kind: "checkout",
            title: "Checkout",
            subtitle: "Review products, choose subscription terms, complete checkout.",
            locked: true,
          },
        ],
        updatedAt: currentDateStamp(),
      };

      saveCustomProgram(newProgram, {
        onSuccess: () => {
          toast({
            title: "Program Created",
            description: `Successfully created ${data.name}.`,
          });
          setIsModalOpen(false);
        },
      });
    }
  };

  const handleEdit = (program: CustomProgram) => {
    setSelectedProgram(program);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteCustomProgramId(id);
  };

  const confirmDeleteCustomProgram = () => {
    if (!deleteCustomProgramId) return;
    deleteCustomProgram(deleteCustomProgramId, {
      onSuccess: () => {
        toast({
          title: "Program Deleted",
          description: "Custom program was successfully deleted.",
        });
        setDeleteCustomProgramId(null);
      },
    });
  };

  const handleClearFilters = () => {
    setFilter("all");
    setSearchQuery("");
  };

  return (
    <div className="p-6">
      <TreatmentPageHeader
        title="Custom Programs"
        subtitle={
          <>
            Customized intake programs for clients — compose programs, sections, consents, and checkout into a tailored patient experience.
          </>
        }
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
              <button
                onClick={() => setViewMode("card")}
                className={`flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === "card"
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <LayoutGrid className="mr-2 h-4 w-4" />
                Cards
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === "list"
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <List className="mr-2 h-4 w-4" />
                List
              </button>
            </div>
            <Button variant="outline">
              <Users className="mr-2 h-4 w-4" />
              Assign to Client
            </Button>
            <Button
              onClick={() => {
                setSelectedProgram(null);
                setIsModalOpen(true);
              }}
              className="bg-[#12517A] text-white hover:bg-[#12517A]/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Custom Program
            </Button>
          </div>
        }
      />

      {/* Custom Filter Toolbar matching the prototype */}
      <div className="mb-6 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold border transition-all ${
              filter === "all"
                ? "bg-blue-50 border-blue-200 text-blue-700"
                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900"
            }`}
          >
            All{" "}
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-mono ${
                filter === "all" ? "bg-white text-blue-700" : "bg-slate-100 text-slate-600"
              }`}
            >
              {customPrograms.length}
            </span>
          </button>
          <button
            onClick={() => setFilter("multi")}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold border transition-all ${
              filter === "multi"
                ? "bg-blue-50 border-blue-200 text-blue-700"
                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900"
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#be185d]" />
            Multi-treatment routing{" "}
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-mono ${
                filter === "multi" ? "bg-white text-blue-700" : "bg-slate-100 text-slate-600"
              }`}
            >
              {multiCount}
            </span>
          </button>
          <button
            onClick={() => setFilter("single")}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold border transition-all ${
              filter === "single"
                ? "bg-blue-50 border-blue-200 text-blue-700"
                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900"
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#15803d]" />
            Single-treatment customization{" "}
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-mono ${
                filter === "single" ? "bg-white text-blue-700" : "bg-slate-100 text-slate-600"
              }`}
            >
              {singleCount}
            </span>
          </button>
        </div>
        <div className="relative w-full lg:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            className="pl-9 text-xs rounded-lg"
            placeholder="Search custom forms…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {customPrograms.length > 0 ? (
        filteredPrograms.length > 0 ? (
          viewMode === "card" ? (
            <div className="space-y-8">
              {groupedPrograms.multi.length > 0 && (
                <div>
                  <div className="mb-4">
                    <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                      Multi-treatment forms
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 font-mono">
                        {groupedPrograms.multi.length}
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Route patients to one or more treatments based on their answers
                    </p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {groupedPrograms.multi.map((customProgram) => (
                      <CustomProgramCard
                        key={customProgram.id}
                        customProgram={customProgram}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onPreview={handlePreview}
                        onViewCatalog={handleViewCatalog}
                      />
                    ))}
                  </div>
                </div>
              )}

              {groupedPrograms.single.length > 0 && (
                <div>
                  <div className="mb-4">
                    <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                      Single-treatment forms
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 font-mono">
                        {groupedPrograms.single.length}
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Each form customizes one treatment with its own eligibility screening
                    </p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {groupedPrograms.single.map((customProgram) => (
                      <CustomProgramCard
                        key={customProgram.id}
                        customProgram={customProgram}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onPreview={handlePreview}
                        onViewCatalog={handleViewCatalog}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <CustomProgramTable
              customPrograms={filteredPrograms}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onPreview={handlePreview}
            />
          )
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-16 text-center shadow-sm">
            <Search className="mx-auto h-8 w-8 text-slate-400 opacity-60" />
            <h3 className="mt-4 text-sm font-semibold text-slate-900">No custom forms match.</h3>
            <p className="mt-1 text-xs text-slate-500">Refine your search queries or filter selections.</p>
            <Button onClick={handleClearFilters} variant="outline" className="mt-4 text-xs">
              Clear filters
            </Button>
          </div>
        )
      ) : (
        <EmptyStateCard
          title="No custom programs yet"
          description="Create one to compose programs, sections, consents, and checkout."
        />
      )}

      <CustomProgramModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleCreateOrEditSubmit}
        program={selectedProgram}
      />

      {/* Real Questionnaire Test Preview Modal */}
      {previewContext && (
        <PatientFlowTestModal
          open={isPreviewOpen}
          onOpenChange={setIsPreviewOpen}
          previewContext={previewContext}
        />
      )}

      {/* Catalog Connections Dialog */}
      <Dialog open={isCatalogOpen} onOpenChange={setIsCatalogOpen}>
        <DialogContent className="max-w-xl p-6 bg-white border border-slate-200 rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-bold text-slate-900 flex items-center gap-2">
              Catalog Connections: {catalogProgram?.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Manage product, checkout, labs, and supply assignments for the {catalogProgram?.visitType || "universal"} flow.
            </DialogDescription>
          </DialogHeader>

          {catalogProgram && (
            <div className="space-y-4 mt-2">
              {/* Tab Header */}
              <div className="flex border-b border-slate-100 pb-px">
                {(["medicine", "checkout", "labs", "supplies", "hub"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setCatalogTab(tab)}
                    className={`pb-2 px-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors -mb-px ${
                      catalogTab === tab
                        ? "border-blue-600 text-blue-600 font-bold"
                        : "border-transparent text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="py-2 min-h-[180px]">
                {catalogTab === "medicine" && (
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Connected Products</span>
                    {catalogProgram.checkoutOptions.length > 0 ? (
                      <div className="space-y-2">
                        {catalogProgram.checkoutOptions.map((opt) => (
                          <div key={opt.id} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                            <div>
                              <div className="text-xs font-semibold text-slate-800">{opt.productName}</div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">{opt.dose} · {opt.regimen}</div>
                            </div>
                            <div className="text-xs font-bold text-blue-600">${opt.price}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">No direct medicine products connected to this program stage yet.</p>
                    )}
                  </div>
                )}

                {catalogTab === "checkout" && (
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Checkout Questionnaire Mapping</span>
                    <div className="space-y-2 text-xs text-slate-600">
                      <p>This flow is linked to <strong className="text-slate-900">{catalogProgram.checkoutOptions.length} products</strong> in checkout.</p>
                      <p>Users completing eligibility screening are routed to these products automatically upon matching recommendation criteria.</p>
                      <Link
                        to={`/dashboard/treatments/custom-programs/${catalogProgram.id}/builder`}
                        onClick={() => setIsCatalogOpen(false)}
                        className="inline-flex items-center text-blue-600 hover:underline mt-1 font-semibold"
                      >
                        Manage checkout mappings in builder &rarr;
                      </Link>
                    </div>
                  </div>
                )}

                {catalogTab === "labs" && (
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Clinical Labs</span>
                    <div className="space-y-2">
                      {catalogProgram.visitType === "mensWellness" || catalogProgram.slug.includes("trt") ? (
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="font-semibold text-slate-800">Complete Blood Count (CBC)</span>
                            <span className="text-slate-500 font-mono font-semibold">LabCorp / Quest</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="font-semibold text-slate-800">Total Testosterone (LC-MS/MS)</span>
                            <span className="text-slate-500 font-mono font-semibold">LabCorp / Quest</span>
                          </div>
                        </div>
                      ) : catalogProgram.slug.includes("glp") ? (
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="font-semibold text-slate-800">Basic Metabolic Panel (BMP)</span>
                            <span className="text-slate-500 font-mono font-semibold">LabCorp</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="font-semibold text-slate-800">HbA1c test</span>
                            <span className="text-slate-500 font-mono font-semibold">LabCorp</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 italic">No mandatory clinical lab testing connected to this program.</p>
                      )}
                    </div>
                  </div>
                )}

                {catalogTab === "supplies" && (
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Fulfillment Supplies</span>
                    <div className="space-y-2">
                      {catalogProgram.slug.includes("glp") || catalogProgram.slug.includes("trt") ? (
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center text-xs">
                          <div>
                            <div className="font-semibold text-slate-800">Syringe & Alcohol swab kit</div>
                            <div className="text-[10px] text-slate-400 mt-0.5 font-mono">10x insulin syringes, 20x alcohol pads</div>
                          </div>
                          <span className="font-bold text-slate-600">Included</span>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 italic">No physical supply kits connected to this program.</p>
                      )}
                    </div>
                  </div>
                )}

                {catalogTab === "hub" && (
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Patient Hub Settings</span>
                    <div className="space-y-2 text-xs text-slate-600">
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span>Onboarding Display Name:</span>
                        <strong className="text-slate-800">{catalogProgram.onboardingName || catalogProgram.name}</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span>Target Audience:</span>
                        <strong className="text-slate-800 uppercase font-mono">{catalogProgram.audience}</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span>Age Gate Restrictions:</span>
                        <strong className="text-slate-800">{catalogProgram.minAge}+</strong>
                      </div>
                      <div className="flex justify-between py-1">
                        <span>Routing Key:</span>
                        <strong className="text-slate-800 font-mono">/{catalogProgram.slug}</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={Boolean(deleteCustomProgramId)}
        onOpenChange={(open) => {
          if (!open) setDeleteCustomProgramId(null);
        }}
        title="Delete custom program?"
        description="This removes the custom program wrapper and its flow configuration from the library."
        onConfirm={confirmDeleteCustomProgram}
      />
    </div>
  );
}
