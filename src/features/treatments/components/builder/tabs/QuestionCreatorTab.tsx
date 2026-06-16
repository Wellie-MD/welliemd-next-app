import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";

interface QuestionCreatorTabProps {
  onAddItem: (item: {
    kind: "routing_question";
    title: string;
    subtitle: string;
  }) => void;
}

export function QuestionCreatorTab({ onAddItem }: QuestionCreatorTabProps) {
  const [questionText, setQuestionText] = useState("");
  const [questionKind, setQuestionKind] = useState("choice");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return;
    onAddItem({
      kind: "routing_question",
      title: questionText,
      subtitle: `Standalone ${questionKind} routing question.`,
    });
    setQuestionText("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
      <h3 className="font-bold text-slate-900 text-sm">Create Routing Question</h3>
      <div className="space-y-2">
        <Label htmlFor="qText">Question Text</Label>
        <Input
          id="qText"
          placeholder="Are you experiencing symptoms?"
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="qKind">Question Type</Label>
        <select
          id="qKind"
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm outline-none bg-white h-10"
          value={questionKind}
          onChange={(e) => setQuestionKind(e.target.value)}
        >
          <option value="choice">Multiple Choice</option>
          <option value="text">Text (Short Answer)</option>
          <option value="number">Number</option>
        </select>
      </div>
      <Button type="submit" className="w-full bg-[#12517A] text-white hover:bg-[#12517A]/90">
        <Plus className="mr-2 h-4 w-4" /> Add Question to Flow
      </Button>
    </form>
  );
}
