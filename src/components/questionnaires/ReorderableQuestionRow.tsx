/**
 * Reorderable Question Row Component
 * 
 * Displays a question row with drag-and-drop functionality
 * Supports conditional question locking
 */

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Question } from '@/api/questionnaires';
import { cn } from '@/lib/utils';

interface ReorderableQuestionRowProps {
  question: Question;
  isConditional: boolean;
  isReorderMode: boolean;
  children?: React.ReactNode;
}

// Helper function to format question type
const formatQuestionType = (type: string): string => {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export function ReorderableQuestionRow({
  question,
  isConditional,
  isReorderMode,
  children,
}: ReorderableQuestionRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: question.id,
    disabled: !isReorderMode || isConditional,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={cn(
        'border-b transition-colors hover:bg-muted/50',
        isDragging && 'opacity-50 bg-muted',
        isConditional && 'bg-gray-50',
        question.is_read_only && !isConditional && 'bg-gray-50/50'
      )}
    >
      {/* Drag Handle Column */}
      {isReorderMode && (
        <td className="px-4 py-3 w-12">
          {isConditional ? (
            <div
              className="flex items-center justify-center text-muted-foreground cursor-not-allowed"
              title="Conditional questions cannot be reordered"
            >
              <Lock className="h-4 w-4" />
            </div>
          ) : (
            <div
              {...attributes}
              {...listeners}
              className="flex items-center justify-center cursor-grab active:cursor-grabbing hover:text-primary"
              title="Drag to reorder"
            >
              <GripVertical className="h-5 w-5" />
            </div>
          )}
        </td>
      )}

      {/* Order Index */}
      <td className="px-4 py-3 w-20 text-sm text-muted-foreground">
        {question.order_index}
      </td>

      {/* Question Text */}
      <td className="px-4 py-3 max-w-md">
        <div className="flex items-start gap-2">
          <span className="text-sm">{question.question_text}</span>
          {isConditional && (
            <Badge variant="outline" className="text-xs shrink-0">
              Conditional
            </Badge>
          )}
        </div>
      </td>

      {/* Question Type */}
      <td className="px-4 py-3 text-sm">
        {formatQuestionType(question.question_type)}
      </td>

      {/* Required */}
      <td className="px-4 py-3">
        <Badge
          variant={question.is_required ? 'default' : 'secondary'}
          className="whitespace-nowrap"
        >
          {question.is_required ? 'Yes' : 'No'}
        </Badge>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <Badge
          variant={question.is_read_only ? 'default' : 'outline'}
          className="whitespace-nowrap"
        >
          {question.is_read_only ? 'Read-only' : 'Editable'}
        </Badge>
      </td>

      {/* Actions */}
      {!isReorderMode && <td className="px-4 py-3">{children}</td>}
    </tr>
  );
}
