import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { normalizeTreatmentSlug, sanitizeTreatmentSlugDraft } from "@/features/treatments/common/utils/slug";
import { cn } from "@/lib/utils";

interface SlugEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  previewUrlPrefix: string;
  currentSlug: string;
  onSave: (slug: string) => Promise<void> | void;
  label?: string;
  allowEmpty?: boolean;
  saveLabel?: string;
  cancelLabel?: string;
}

export function SlugEditorModal({
  open,
  onOpenChange,
  title,
  description,
  previewUrlPrefix,
  currentSlug,
  onSave,
  label = "Slug",
  allowEmpty = true,
  saveLabel = "Save",
  cancelLabel = "Cancel",
}: SlugEditorModalProps) {
  const [slugDraft, setSlugDraft] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setSlugDraft(normalizeTreatmentSlug(currentSlug));
      return;
    }

    if (!saving) {
      setSlugDraft("");
    }
  }, [currentSlug, open, saving]);

  const normalizedDraft = useMemo(() => normalizeTreatmentSlug(slugDraft), [slugDraft]);

  const handleClose = () => {
    if (saving) return;
    onOpenChange(false);
  };

  const handleSave = async () => {
    if (!allowEmpty && !normalizedDraft) return;

    setSaving(true);
    try {
      await onSave(normalizedDraft);
      onOpenChange(false);
    } catch {
      // Keep the dialog open so the caller can surface any save failure.
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[528px] max-w-[calc(100vw-32px)] gap-0 rounded-2xl border-0 bg-white p-7 text-slate-950 shadow-2xl dark:bg-[#171b27] dark:text-slate-100 [&>button]:right-6 [&>button]:top-6 [&>button]:rounded-lg [&>button]:border [&>button]:border-slate-200 [&>button]:p-2 [&>button]:text-slate-400 [&>button]:opacity-100 dark:[&>button]:border-slate-700 dark:[&>button]:text-slate-500">
        <DialogHeader className="space-y-2 pr-10 text-left">
          <DialogTitle className="text-xl font-bold text-slate-950 dark:text-slate-100">{title}</DialogTitle>
          <DialogDescription className="pt-2 text-left text-base leading-6 text-slate-400 dark:text-slate-500">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-2">
          <Label htmlFor="treatment-slug-input" className="text-xs font-bold text-slate-600 dark:text-slate-300">
            {label}
          </Label>
          <Input
            id="treatment-slug-input"
            value={slugDraft}
            onChange={(event) => setSlugDraft(sanitizeTreatmentSlugDraft(event.target.value))}
            placeholder="e.g., glutathione"
            className="h-10 rounded-lg border-2 border-blue-600 bg-white px-3 font-medium lowercase text-slate-950 shadow-none ring-offset-0 focus-visible:ring-0 dark:border-slate-100 dark:bg-[#171b27] dark:text-slate-100"
            disabled={saving}
            onKeyDown={(event) => {
              if (event.key === "Enter") handleSave();
              if (event.key === "Escape") handleClose();
            }}
            autoFocus
          />
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-[#151924]">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Preview URL
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-sm font-medium">
            <LinkIcon className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span className="text-slate-400 dark:text-slate-500">{previewUrlPrefix}</span>
            <span
              className={cn(
                "font-mono",
                normalizedDraft ? "text-[#5b4dff] dark:text-[#7b83ff]" : "italic text-slate-400 dark:text-slate-500"
              )}
            >
              {normalizedDraft || "no-slug"}
            </span>
          </div>
        </div>

        <DialogFooter className="mt-11 flex-row justify-end gap-2 space-x-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={saving}
            className="h-9 border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-[#171b27] dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving || (!allowEmpty && !normalizedDraft)}
            className="h-9 bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-600"
          >
            {saving ? "Saving..." : saveLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
