import type { DragEndEvent, SensorDescriptor, SensorOptions } from "@dnd-kit/core";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { ProgramQuestion } from "@/features/treatments/types";
import { ProgramQuestionsListRow } from "@/features/treatments/programs/components/ProgramQuestionsListRow";

interface QuestionListTableProps {
  questions: ProgramQuestion[];
  reorderActive: boolean;
  sensors: SensorDescriptor<SensorOptions>[];
  onDragEnd: (event: DragEndEvent) => void;
  onEdit: (question: ProgramQuestion) => void;
  onDelete: (id: string) => void;
}

export function QuestionListTable(props: QuestionListTableProps) {
  return (
    <>
      <div className="grid grid-cols-[44px_minmax(0,1fr)_100px_120px_72px] gap-4 border-b border-slate-200 bg-slate-50 px-7 py-2.5 text-[9px] font-extrabold uppercase tracking-[0.08em] text-slate-400">
        <div>{props.reorderActive ? "DRAG / #" : "#"}</div>
        <div>QUESTION OR ELEMENT</div>
        <div>REQUIRED</div>
        <div>TYPE</div>
        <div className="text-right">ACTIONS</div>
      </div>
      <DndContext sensors={props.sensors} collisionDetection={closestCenter} onDragEnd={props.onDragEnd}>
        <SortableContext items={props.questions.map((question) => question.id)} strategy={verticalListSortingStrategy}>
          <div className="divide-y divide-slate-100 min-h-[160px] bg-white">
            {props.questions.length === 0 ? (
              <div className="p-12 text-center text-[13px] text-slate-400 italic">No questions match your criteria.</div>
            ) : props.questions.map((question, index) => (
              <ProgramQuestionsListRow
                key={question.id}
                question={question}
                index={index}
                isReorderActive={props.reorderActive}
                onEdit={props.onEdit}
                onDelete={props.onDelete}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </>
  );
}
