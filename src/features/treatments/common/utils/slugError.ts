import { toast } from "@/components/ui/use-toast";
export { isDuplicateSlugError } from "./duplicateSlugError";

export const showDuplicateSlugToast = () => {
  toast({
    title: "Please enter a unique slug",
    variant: "destructive",
  });
};
