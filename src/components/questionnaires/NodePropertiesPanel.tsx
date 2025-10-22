import { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Plus, Trash2 } from 'lucide-react';
import { Question } from '@/api/questionnaires';

interface NodePropertiesPanelProps {
  node: Node<{ question: Question }>;
  onUpdate: (nodeId: string, data: any) => void;
  onDelete: (nodeId: string) => void;
  onClose: () => void;
}

const FIELD_MAPPINGS = [
  { value: 'none', label: 'None' },
  { value: 'firstName', label: 'First Name' },
  { value: 'lastName', label: 'Last Name' },
  { value: 'dateOfBirth', label: 'Date of Birth' },
  { value: 'sex', label: 'Sex' },
  { value: 'medicalConditions', label: 'Medical Conditions' },
  { value: 'medications', label: 'Current Medications' },
  { value: 'allergies', label: 'Allergies' },
  { value: 'custom_qa', label: 'Custom Q&A' },
];

export function NodePropertiesPanel({ node, onUpdate, onDelete, onClose }: NodePropertiesPanelProps) {
  const [question, setQuestion] = useState<Question>(node.data.question);

  useEffect(() => {
    setQuestion(node.data.question);
  }, [node]);

  const handleUpdate = (field: keyof Question, value: any) => {
    const updated = { ...question, [field]: value };
    setQuestion(updated);
    onUpdate(node.id, { question: updated });
  };

  const handleAddChoice = () => {
    const newChoices = [...(question.answer_choices || []), ''];
    handleUpdate('answer_choices', newChoices);
  };

  const handleChoiceChange = (index: number, value: string) => {
    const newChoices = [...(question.answer_choices || [])];
    newChoices[index] = value;
    handleUpdate('answer_choices', newChoices);
  };

  const handleRemoveChoice = (index: number) => {
    const newChoices = question.answer_choices?.filter((_, i) => i !== index);
    handleUpdate('answer_choices', newChoices);
  };

  const showAnswerChoices = ['single_choice', 'multiple_choice'].includes(question.question_type);

  return (
    <Card className="w-80 rounded-none border-l border-t-0 border-r-0 border-b-0">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm">Question Properties</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-4">
        <ScrollArea className="h-[calc(100vh-140px)]">
          <div className="space-y-4">
            {/* Question Text */}
            <div className="space-y-2">
              <Label htmlFor="question_text">Question Text</Label>
              <Textarea
                id="question_text"
                value={question.question_text}
                onChange={(e) => handleUpdate('question_text', e.target.value)}
                placeholder="Enter your question..."
                rows={3}
              />
            </div>

            {/* Answer Choices */}
            {showAnswerChoices && (
              <div className="space-y-2">
                <Label>Answer Choices</Label>
                <div className="space-y-2">
                  {question.answer_choices?.map((choice, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={choice}
                        onChange={(e) => handleChoiceChange(index, e.target.value)}
                        placeholder={`Choice ${index + 1}`}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveChoice(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddChoice}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Choice
                  </Button>
                </div>
              </div>
            )}

            {/* Beluga Field Mapping */}
            <div className="space-y-2">
              <Label>Beluga Field Mapping</Label>
              <Select
                value={question.beluga_field_mapping}
                onValueChange={(value) => handleUpdate('beluga_field_mapping', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_MAPPINGS.map((mapping) => (
                    <SelectItem key={mapping.value} value={mapping.value}>
                      {mapping.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Toggles */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Required</Label>
                <Switch
                  checked={question.is_required}
                  onCheckedChange={(checked) => handleUpdate('is_required', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Include in Q&A</Label>
                <Switch
                  checked={question.include_in_qa_section}
                  onCheckedChange={(checked) => handleUpdate('include_in_qa_section', checked)}
                />
              </div>
            </div>

            {/* Delete Button */}
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => {
                if (confirm('Delete this question?')) {
                  onDelete(node.id);
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Question
            </Button>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
