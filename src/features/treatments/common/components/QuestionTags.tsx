import { cn } from "@/lib/utils";
import type { QuestionTag, QuestionTagType } from "@/features/treatments/utils/questionTags";

const TAG_STYLES: Record<QuestionTagType, string> = {
  visibility: "bg-amber-100 text-amber-700",
  disqualifying: "bg-red-100 text-red-700",
  consent: "bg-purple-100 text-purple-700",
  auth: "bg-orange-100 text-orange-700",
  checkout: "bg-emerald-100 text-emerald-700",
};

interface QuestionTagsProps {
  tags: QuestionTag[];
  className?: string;
}

export function QuestionTags({ tags, className }: QuestionTagsProps) {
  if (!tags || tags.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {tags.map((tag) => (
        <span
          key={tag.type}
          className={cn(
            "inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase",
            TAG_STYLES[tag.type]
          )}
        >
          {tag.label}
        </span>
      ))}
    </div>
  );
}
