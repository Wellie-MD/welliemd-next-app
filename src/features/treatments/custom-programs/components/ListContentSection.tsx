import type { CustomProgram, CustomProgramBuilderStageItem } from "@/features/treatments/types";
import { useCustomProgramBuilderList } from "@/features/treatments/custom-programs/hooks/useCustomProgramBuilderList";
import { useConsents, usePrograms } from "@/features/treatments/libraries/hooks/useTreatmentLibraries";
import { CustomBuilderLockedComponent } from "./CustomBuilderLockedComponent";
import { CustomBuilderStageComponent } from "./CustomBuilderStageComponent";

interface ListContentSectionProps {
  customProgram: CustomProgram;
  onEditClientQuestion?: (question: CustomProgramBuilderStageItem) => void;
  onDeleteClientQuestion?: (questionId: string) => void;
  onPreviewQuestion?: (question: CustomProgramBuilderStageItem, questionNumber: number) => void;
}

export function ListContentSection({
  customProgram,
  onEditClientQuestion,
  onDeleteClientQuestion,
  onPreviewQuestion,
}: ListContentSectionProps) {
  const { data: programs = [] } = usePrograms();
  const { data: consents = [] } = useConsents();
  const builderList = useCustomProgramBuilderList(customProgram, { programs, consents });
  let nextItemNumber = 2;

  return (
    <div className="max-w-[880px] space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Patient flow</div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">{builderList.totalItemCount} items</div>
        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-[#151924] dark:shadow-none">
        <CustomBuilderLockedComponent item={builderList.authenticationItem} itemNumber={1} />

        <div className="mt-6 space-y-6">
          {builderList.stages.map((stage) => {
            const startIndex = nextItemNumber;
            nextItemNumber += stage.items.length;
            return (
              <CustomBuilderStageComponent
                key={stage.id}
                stage={stage}
                startIndex={startIndex}
                onEditClientQuestion={onEditClientQuestion}
                onDeleteClientQuestion={onDeleteClientQuestion}
                onPreviewQuestion={onPreviewQuestion}
              />
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">End of flow</div>
        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
      </div>

      <CustomBuilderLockedComponent item={builderList.checkoutItem} itemNumber={builderList.totalItemCount} />
    </div>
  );
}
