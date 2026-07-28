import { useQueries } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Check } from "lucide-react";
import type { CommonSection, CustomProgramBuilderAddItem } from "@/features/treatments/types";
import { treatmentConfigurationApi as treatmentsApi } from "@/features/treatments/api/configurationApi";
import { treatmentQueryKeys } from "@/features/treatments/libraries/hooks/useTreatmentLibraries";

interface FieldLibraryTabProps {
  sections: CommonSection[];
  onAddItem: (item: CustomProgramBuilderAddItem) => void;
  flowItems?: Array<{ kind: string; title: string; sourceId?: string; mappedField?: string }>;
}

export function FieldLibraryTab({ sections, onAddItem, flowItems = [] }: FieldLibraryTabProps) {
  const fieldQueries = useQueries({
    queries: sections.map((section) => ({
      queryKey: treatmentQueryKeys.sectionFields(section.id),
      queryFn: () => treatmentsApi.listSectionFields(section.id),
      staleTime: 60_000,
    })),
  });

  const isSectionAdded = (sectionId: string) => {
    return flowItems.some((fi) => fi.kind === "section" && fi.sourceId === sectionId);
  };

  const isFieldAdded = (sectionId: string, fieldId: string) => {
    return flowItems.some(
      (fi) => fi.kind === "section_field" && fi.sourceId === sectionId && fi.mappedField === fieldId,
    );
  };

  return (
    <div className="space-y-6 mt-4">
      {sections.map((section, sectionIndex) => {
        const fields = fieldQueries[sectionIndex]?.data || [];
        const added = isSectionAdded(section.id);

        return (
          <div key={section.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="font-semibold text-sm text-slate-800 flex items-center gap-2">
                <span className="text-slate-400">⁝⁝</span>
                {section.name}
              </div>
              {added ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md">
                  <Check className="h-3 w-3" /> Block added
                </span>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                  onClick={() =>
                    onAddItem({
                      kind: "section",
                      title: section.name,
                      subtitle: "Common section fields.",
                      sourceId: section.id,
                    })
                  }
                >
                  + Add whole section
                </Button>
              )}
            </div>

            {fieldQueries[sectionIndex]?.isLoading ? (
              <div className="mt-4 text-xs text-slate-400 italic text-center py-2">
                Loading section fields…
              </div>
            ) : fields.length > 0 ? (
              <div className="mt-3 pl-3 border-l border-slate-200 space-y-3">
                {fields.map((field) => {
                  const fieldAdded = isFieldAdded(section.id, field.id);
                  return (
                    <div key={field.id} className="flex justify-between items-start gap-4">
                      <div>
                        <div className="text-xs font-semibold text-slate-700 leading-tight">
                          {field.label}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {field.kind}
                        </div>
                      </div>
                      {fieldAdded ? (
                        <span className="shrink-0 h-7 w-7 inline-flex items-center justify-center text-slate-400 rounded-md border border-slate-200 bg-slate-50">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                      ) : (
                        <Button
                          variant="outline"
                          size="icon"
                          className="shrink-0 h-7 w-7 text-blue-600 border-blue-200 hover:bg-blue-50"
                          onClick={() =>
                            onAddItem({
                              kind: "section_field",
                              title: field.label,
                              subtitle: `Section field (${field.kind})`,
                              sourceId: section.id,
                              questionKind: field.kind,
                              required: field.required,
                              mappedField: field.id,
                              answerOptions: Array.isArray(field.configuration?.choices)
                                ? field.configuration.choices as string[]
                                : [],
                            })
                          }
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mt-4 text-xs text-slate-400 italic text-center py-2">
                No individual fields defined for this section. Add as a block above.
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
