import { toast } from "@/components/ui/use-toast";
export { isDuplicateSlugError } from "./duplicateSlugError";

export const showDuplicateSlugToast = () => {
  toast({
    title: "Program URL slug already in use",
    description: "Choose a different slug and try again.",
    variant: "destructive",
  });
};
