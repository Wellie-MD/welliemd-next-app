/**
 * Shared hook for question reordering with drag-and-drop
 * 
 * Features:
 * - Detects conditional vs sequential questions
 * - Prevents reordering of conditional questions
 * - Optimistic updates with rollback on error
 * - Works with dnd-kit library
 * 
 * Usage:
 * ```tsx
 * const { 
 *   items, 
 *   isReorderMode, 
 *   setIsReorderMode,
 *   handleDragEnd,
 *   saveOrder,
 *   isConditional 
 * } = useQuestionReorder(questions, templateId, onSuccess);
 * ```
 */

import { useState, useCallback, useMemo } from 'react';
import { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { questionApi, Question } from '@/api/questionnaires';
import { toast } from '@/components/ui/use-toast';

interface UseQuestionReorderOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useQuestionReorder(
  questions: Question[],
  templateId: string,
  options: UseQuestionReorderOptions = {}
) {
  const { onSuccess, onError } = options;
  
  const [items, setItems] = useState<Question[]>(questions);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [originalOrder, setOriginalOrder] = useState<Question[]>([]);

  // Update items when questions prop changes
  useMemo(() => {
    setItems(questions);
  }, [questions]);

  /**
   * Check if a question is conditional (has show_if logic)
   */
  const isConditional = useCallback((question: Question): boolean => {
    return !!(
      question.conditional_logic &&
      question.conditional_logic.show_if
    );
  }, []);

  /**
   * Get conditional questions map
   */
  const conditionalQuestions = useMemo(() => {
    const map = new Map<string, number>();
    questions.forEach((q) => {
      if (isConditional(q)) {
        map.set(q.id, q.order_index);
      }
    });
    return map;
  }, [questions, isConditional]);

  /**
   * Enable reorder mode
   */
  const enterReorderMode = useCallback(() => {
    setOriginalOrder([...items]);
    setIsReorderMode(true);
  }, [items]);

  /**
   * Cancel reorder mode and restore original order
   */
  const cancelReorder = useCallback(() => {
    setItems(originalOrder);
    setIsReorderMode(false);
    setOriginalOrder([]);
  }, [originalOrder]);

  /**
   * Handle drag end event from dnd-kit
   */
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over || active.id === over.id) {
        return;
      }

      // Find the questions being moved
      const activeQuestion = items.find((q) => q.id === active.id);
      const overQuestion = items.find((q) => q.id === over.id);

      // Prevent moving conditional questions
      if (activeQuestion && isConditional(activeQuestion)) {
        toast({
          title: 'Cannot Move',
          description: 'Conditional questions cannot be reordered. They depend on other questions.',
          variant: 'destructive',
        });
        return;
      }

      // Prevent dropping on conditional questions
      if (overQuestion && isConditional(overQuestion)) {
        toast({
          title: 'Invalid Position',
          description: 'Cannot place questions at conditional question positions.',
          variant: 'destructive',
        });
        return;
      }

      setItems((items) => {
        const oldIndex = items.findIndex((q) => q.id === active.id);
        const newIndex = items.findIndex((q) => q.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    },
    [items, isConditional]
  );

  /**
   * Save the new order to backend
   */
  const saveOrder = useCallback(async () => {
    setIsSaving(true);

    try {
      const questionOrder = items.map((q) => q.id);

      await questionApi.reorderQuestions(templateId, questionOrder);

      toast({
        title: 'Success',
        description: 'Question order updated successfully',
      });

      setIsReorderMode(false);
      setOriginalOrder([]);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Failed to reorder questions:', error);

      // Rollback to original order
      setItems(originalOrder);

      toast({
        title: 'Error',
        description:
          error.response?.data?.error ||
          'Failed to update question order. Changes have been reverted.',
        variant: 'destructive',
      });

      if (onError) {
        onError(error);
      }
    } finally {
      setIsSaving(false);
    }
  }, [items, templateId, originalOrder, onSuccess, onError]);

  /**
   * Check if order has changed
   */
  const hasChanges = useMemo(() => {
    if (!isReorderMode || originalOrder.length === 0) return false;
    return !items.every((item, index) => item.id === originalOrder[index].id);
  }, [items, originalOrder, isReorderMode]);

  return {
    items,
    isReorderMode,
    isSaving,
    hasChanges,
    conditionalQuestions,
    isConditional,
    enterReorderMode,
    cancelReorder,
    handleDragEnd,
    saveOrder,
    setIsReorderMode,
  };
}
