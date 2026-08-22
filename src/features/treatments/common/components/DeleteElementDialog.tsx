import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteElementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  actionLabel?: string;
}

export function DeleteElementDialog({
  open,
  onOpenChange,
  onConfirm,
  title = "Are you absolutely sure?",
  description = "This action cannot be undone. This element will be permanently removed.",
  actionLabel = "Delete",
}: DeleteElementDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-white border border-slate-200 rounded-2xl shadow-xl p-6">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-base font-bold text-slate-900">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-xs text-slate-500 mt-2">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4 flex gap-2 justify-end">
          <AlertDialogCancel className="h-8 text-xs font-semibold border-slate-200">Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="h-8 text-xs font-bold bg-red-600 hover:bg-red-700 text-white">
            {actionLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
