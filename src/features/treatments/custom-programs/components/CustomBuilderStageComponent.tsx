import type { CustomProgramBuilderStage } from "@/features/treatments/types";
import { cn } from "@/lib/utils";
import { CustomBuilderStageRow } from "./CustomBuilderStageRow";

const stageToneClass: Record<CustomProgramBuilderStage["tone"], string> = {
  question: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-400/30 dark:bg-violet-400/10 dark:text-violet-200",
  program: "border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-400/30 dark:bg-teal-400/10 dark:text-teal-200",
  consent: "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-400/30 dark:bg-purple-400/10 dark:text-purple-200",
};

interface CustomBuilderStageComponentProps {
  stage: CustomProgramBuilderStage;
  startIndex: number;
  onEditClientQuestion?: (question: CustomProgramBuilderStage["items"][number]) => void;
  onDeleteClientQuestion?: (questionId: string) => void;
  onPreviewQuestion?: (question: CustomProgramBuilderStage["items"][number], questionNumber: number) => void;
}

export function CustomBuilderStageComponent({
  stage,
  startIndex,
  onEditClientQuestion,
  onDeleteClientQuestion,
  onPreviewQuestion,
}: CustomBuilderStageComponentProps) {
  return (
    <section className="space-y-2">
      <div className="flex items-center gap-3 px-2">
        <span className={cn("rounded-md border px-2 py-1 text-[11px] font-bold uppercase", stageToneClass[stage.tone])}>
          Stage {stage.stageNumber}
        </span>
        <h2 className="text-sm font-bold text-slate-950 dark:text-slate-100">{stage.title}</h2>
        <span className="ml-auto inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-slate-100 px-2 text-xs font-bold text-slate-400 dark:bg-slate-900 dark:text-slate-500">
          {stage.items.length}
        </span>
      </div>

      <div className="space-y-2">
        {stage.items.map((item, index) => {
          const itemNumber = startIndex + index;
          const previewQuestionNumber = stage.tone === "question" ? index + 1 : itemNumber;

          return (
            <CustomBuilderStageRow
              key={item.id}
              item={item}
              itemNumber={itemNumber}
              previewQuestionNumber={previewQuestionNumber}
              onEditClientQuestion={onEditClientQuestion}
              onDeleteClientQuestion={onDeleteClientQuestion}
              onPreviewQuestion={onPreviewQuestion}
            />
          );
        })}
      </div>
    </section>
  );
}
