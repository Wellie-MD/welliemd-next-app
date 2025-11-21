import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { SubQuestion } from "@/api/questionnaires";

interface GroupedQuestionBuilderProps {
  groupType: "personal_details" | "shipping_address";
  subQuestions: Omit<SubQuestion, "id">[];
  onChange: (subQuestions: Omit<SubQuestion, "id">[]) => void;
}

const PERSONAL_DETAILS_TEMPLATES = [
  { text: "First Name", type: "text" as const, required: true },
  { text: "Last Name", type: "text" as const, required: true },
  { text: "Email Address", type: "email" as const, required: true },
  { text: "Phone Number", type: "phone" as const, required: true },
];

const SHIPPING_ADDRESS_TEMPLATES = [
  { text: "Street Address", type: "text" as const, required: true },
  { text: "Apartment/Suite/Unit", type: "text" as const, required: false },
  { text: "City", type: "text" as const, required: true },
  { text: "State", type: "state" as const, required: true },
  { text: "Zip Code", type: "zip" as const, required: true },
  { text: "Country", type: "text" as const, required: true },
];

export function GroupedQuestionBuilder({
  groupType,
  subQuestions,
  onChange,
}: GroupedQuestionBuilderProps) {
  const [newSubQuestion, setNewSubQuestion] = useState<Omit<SubQuestion, "id">>({
    question_text: "",
    question_type: "text",
    is_required: true,
    order_index: subQuestions.length,
    validation_rules: {},
    answer_choices: [],
  });

  const templates =
    groupType === "personal_details"
      ? PERSONAL_DETAILS_TEMPLATES
      : SHIPPING_ADDRESS_TEMPLATES;

  const handleAddTemplate = () => {
    const newSubQuestions = templates.map((template, index) => ({
      question_text: template.text,
      question_type: template.type,
      is_required: template.required,
      order_index: index,
      validation_rules: {},
      answer_choices: [],
    }));
    onChange(newSubQuestions);
  };

  const handleAddSubQuestion = () => {
    if (!newSubQuestion.question_text.trim()) return;

    onChange([
      ...subQuestions,
      { ...newSubQuestion, order_index: subQuestions.length },
    ]);

    setNewSubQuestion({
      question_text: "",
      question_type: "text",
      is_required: true,
      order_index: subQuestions.length + 1,
      validation_rules: {},
      answer_choices: [],
    });
  };

  const handleUpdateSubQuestion = (
    index: number,
    field: keyof Omit<SubQuestion, "id">,
    value: any
  ) => {
    const updated = [...subQuestions];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handleRemoveSubQuestion = (index: number) => {
    const updated = subQuestions.filter((_, i) => i !== index);
    // Reindex
    updated.forEach((sq, i) => {
      sq.order_index = i;
    });
    onChange(updated);
  };

  const handleMoveSubQuestion = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === subQuestions.length - 1)
    ) {
      return;
    }

    const updated = [...subQuestions];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];

    // Reindex
    updated.forEach((sq, i) => {
      sq.order_index = i;
    });

    onChange(updated);
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">
          {groupType === "personal_details"
            ? "Personal Details Fields"
            : "Shipping Address Fields"}
        </h3>
        {subQuestions.length === 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddTemplate}
          >
            <Plus className="h-4 w-4 mr-2" />
            Use Template
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Add fields that will be grouped together and displayed as a single question.
      </p>

      {/* Existing Sub-Questions */}
      <div className="space-y-3">
        {subQuestions.map((sq, index) => (
          <div
            key={index}
            className="flex items-start gap-2 p-3 border rounded-lg bg-background"
          >
            <div className="flex flex-col gap-1 mt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => handleMoveSubQuestion(index, "up")}
                disabled={index === 0}
              >
                ↑
              </Button>
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => handleMoveSubQuestion(index, "down")}
                disabled={index === subQuestions.length - 1}
              >
                ↓
              </Button>
            </div>

            <div className="flex-1 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Field Label</Label>
                  <Input
                    value={sq.question_text}
                    onChange={(e) =>
                      handleUpdateSubQuestion(index, "question_text", e.target.value)
                    }
                    placeholder="e.g., First Name"
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">Field Type</Label>
                  <Select
                    value={sq.question_type}
                    onValueChange={(value) =>
                      handleUpdateSubQuestion(index, "question_type", value)
                    }
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="state">State (2 letters)</SelectItem>
                      <SelectItem value="zip">ZIP Code</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`required-${index}`}
                  checked={sq.is_required}
                  onChange={(e) =>
                    handleUpdateSubQuestion(index, "is_required", e.target.checked)
                  }
                  className="rounded"
                />
                <label htmlFor={`required-${index}`} className="text-xs">
                  Required field
                </label>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveSubQuestion(index)}
              className="mt-6"
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        ))}
      </div>

      {/* Add New Sub-Question */}
      <div className="space-y-2 p-3 border-2 border-dashed rounded-lg">
        <Label className="text-xs font-semibold">Add New Field</Label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            value={newSubQuestion.question_text}
            onChange={(e) =>
              setNewSubQuestion({
                ...newSubQuestion,
                question_text: e.target.value,
              })
            }
            placeholder="Field label (e.g., Middle Name)"
            className="h-8"
          />
          <Select
            value={newSubQuestion.question_type}
            onValueChange={(value: any) =>
              setNewSubQuestion({ ...newSubQuestion, question_type: value })
            }
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Text</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="phone">Phone</SelectItem>
              <SelectItem value="state">State (2 letters)</SelectItem>
              <SelectItem value="zip">ZIP Code</SelectItem>
              <SelectItem value="number">Number</SelectItem>
              <SelectItem value="date">Date</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="new-required"
              checked={newSubQuestion.is_required}
              onChange={(e) =>
                setNewSubQuestion({
                  ...newSubQuestion,
                  is_required: e.target.checked,
                })
              }
              className="rounded"
            />
            <label htmlFor="new-required" className="text-xs">
              Required field
            </label>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddSubQuestion}
            disabled={!newSubQuestion.question_text.trim()}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Field
          </Button>
        </div>
      </div>

      {subQuestions.length === 0 && (
        <p className="text-xs text-center text-muted-foreground py-4">
          No fields added yet. Click "Use Template" to add default fields or add
          custom fields above.
        </p>
      )}
    </div>
  );
}
