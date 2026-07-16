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
      <div className="grid grid-cols-[80px_1fr_120px_160px_100px] gap-6 px-6 py-3 bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
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
