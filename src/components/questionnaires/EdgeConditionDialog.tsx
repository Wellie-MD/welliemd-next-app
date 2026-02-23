import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useFlowStore } from '@/store/useFlowStore';
import { normalizeChoiceDisplay } from '@/utils/choiceValue';

interface EdgeConditionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceNodeId: string;
  targetNodeId: string;
  onConfirm: (condition: { value: string; operator: string }) => void;
}

export function EdgeConditionDialog({
  open,
  onOpenChange,
  sourceNodeId,
  targetNodeId,
  onConfirm,
}: EdgeConditionDialogProps) {
  const { questions } = useFlowStore();
  const [selectedValue, setSelectedValue] = useState('');
  const [operator, setOperator] = useState('equals');

  const sourceQuestion = questions.find(q => q.id === sourceNodeId);
  const targetQuestion = questions.find(q => q.id === targetNodeId);

  const availableChoices = sourceQuestion?.answer_choices || [];

  useEffect(() => {
    if (open) {
      setSelectedValue('');
      setOperator('equals');
    }
  }, [open]);

  const handleConfirm = () => {
    if (!selectedValue) return;
    
    onConfirm({
      value: selectedValue,
      operator,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set Follow-up Condition</DialogTitle>
          <DialogDescription>
            Define when "{targetQuestion?.question_text || 'this question'}" should appear
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {availableChoices.length === 0 ? (
            <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded">
              The parent question "{sourceQuestion?.question_text}" has no answer choices.
              Only single_choice or multiple_choice questions can have follow-ups.
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Show this question when the answer is:</Label>
                <Select value={selectedValue} onValueChange={setSelectedValue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select trigger value" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableChoices.map((choice, idx) => {
                      const choiceValue = normalizeChoiceDisplay(choice);
                      return (
                        <SelectItem key={idx} value={choiceValue}>
                          {choiceValue}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Condition</Label>
                <Select value={operator} onValueChange={setOperator}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equals">Equals</SelectItem>
                    <SelectItem value="not_equals">Not Equals</SelectItem>
                    <SelectItem value="contains">Contains</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!selectedValue || availableChoices.length === 0}
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
