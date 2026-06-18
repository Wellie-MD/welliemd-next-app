import { useState, useMemo } from "react";
import { Search, AlignLeft, CheckSquare, List, Hash, Calendar, Mail, Phone, MapPin, Upload, Scale, HeartPulse, Stethoscope, FileText, Lock, LayoutGrid, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuestionKind } from "@/features/treatments/types";

export interface PaletteItem {
  kind: QuestionKind | "auth" | "section" | "consent" | "checkout" | "question";
  text: string;
  category: "basic" | "medical" | "element";
  icon: React.ElementType;
}

interface QuestionTypePaletteProps {
  entityType: "program" | "section";
  onAddItem: (kind: string, text: string) => void;
}

const SECTION_PALETTE_ITEMS: PaletteItem[] = [
  { kind: "text", text: "Short Answer", category: "basic", icon: AlignLeft },
  { kind: "textarea", text: "Long Answer", category: "basic", icon: AlignLeft },
  { kind: "single_choice", text: "Single Choice", category: "basic", icon: List },
  { kind: "multiple_choice", text: "Multiple Choice", category: "basic", icon: CheckSquare },
  { kind: "yes_no", text: "Yes / No", category: "basic", icon: CheckSquare },
  { kind: "number", text: "Number", category: "basic", icon: Hash },
  { kind: "date", text: "Date", category: "basic", icon: Calendar },
  { kind: "email", text: "Email", category: "basic", icon: Mail },
  { kind: "phone", text: "Phone", category: "basic", icon: Phone },
  { kind: "zip", text: "Zip Code", category: "basic", icon: MapPin },
  { kind: "file_upload", text: "File Upload", category: "basic", icon: Upload },
  { kind: "medical_conditions", text: "Medical Conditions", category: "medical", icon: HeartPulse },
  { kind: "allergies", text: "Allergies", category: "medical", icon: Stethoscope },
  { kind: "self_reported_meds", text: "Current Medications", category: "medical", icon: Stethoscope },
  { kind: "height_weight", text: "Height & Weight", category: "medical", icon: Scale },
];

const PROGRAM_PALETTE_ITEMS: PaletteItem[] = [
  { kind: "question", text: "Question", category: "element", icon: AlignLeft },
  { kind: "auth", text: "Patient Authentication", category: "element", icon: Lock },
  { kind: "section", text: "Common Section", category: "element", icon: LayoutGrid },
  { kind: "consent", text: "Consent Form", category: "element", icon: FileText },
  { kind: "checkout", text: "Checkout", category: "element", icon: CheckCircle2 },
];

export function QuestionTypePalette({ entityType, onAddItem }: QuestionTypePaletteProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const activeItems = entityType === "program" ? PROGRAM_PALETTE_ITEMS : SECTION_PALETTE_ITEMS;

  const filteredItems = useMemo(() => {
    return activeItems.filter((item) => {
      const matchesSearch = item.text.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === "all" || item.category === filter;
      return matchesSearch && matchesFilter;
    });
  }, [search, filter, activeItems]);

  const handleDragStart = (event: React.DragEvent, item: PaletteItem) => {
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData("application/json", JSON.stringify({ kind: item.kind, text: item.text }));
  };

  return (
    <div className="flex flex-col h-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-4 shrink-0">
        <h2 className="text-sm font-bold text-slate-900">Question Types</h2>
        <div className="relative mt-3">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search questions..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-xs outline-none transition-colors focus:border-[#12517A] focus:bg-white"
            data-testid="question-palette-search"
          />
        </div>

        {entityType === "section" && (
          <div className="mt-3 flex gap-1.5 flex-wrap">
            {["all", "basic", "medical"].map((val) => (
              <button
                key={val}
                onClick={() => setFilter(val)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors capitalize",
                  filter === val
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"
                )}
              >
                {val}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto bg-slate-50/50 p-2.5 min-h-0">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.kind}
              type="button"
              onClick={() => onAddItem(item.kind, item.text)}
              draggable
              onDragStart={(e) => handleDragStart(e, item)}
              className="flex w-full cursor-grab items-center justify-between rounded-lg border border-slate-100 bg-white p-2 text-left transition-all duration-150 hover:border-slate-200 hover:bg-slate-50/80 hover:shadow-sm active:cursor-grabbing"
              data-testid={`palette-item-${item.kind}`}
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <span className="truncate text-[11.5px] font-semibold text-slate-700">{item.text}</span>
              </span>
              
              <span className="rounded bg-slate-100 border border-slate-200 px-1.5 py-0.5 text-[8.5px] font-bold text-slate-500">
                {item.category.toUpperCase()}
              </span>
            </button>
          );
        })}
        {filteredItems.length === 0 && (
          <div className="py-8 text-center text-xs italic text-slate-400">No items matched search.</div>
        )}
      </div>
      
      <div className="flex shrink-0 items-center justify-between border-t border-slate-100 bg-white p-3">
        <span className="text-[11px] font-semibold text-slate-500">{filteredItems.length} items</span>
      </div>
    </div>
  );
}
