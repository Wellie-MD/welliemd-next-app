import type { ReactNode } from "react";
import { toast } from "@/components/ui/use-toast";

interface FloatingToastOptions {
  title: ReactNode;
}

const floatingToastClassName =
  "floating-toast-transition fixed bottom-6 left-1/2 z-[110] w-auto min-w-[154px] max-w-[calc(100vw-32px)] -translate-x-1/2 justify-center space-x-0 rounded-lg border-0 bg-slate-950 px-5 py-3 pr-5 text-white opacity-0 shadow-2xl transition-[opacity,transform] [transition-duration:2000ms] ease-out data-[state=open]:translate-y-0 data-[state=open]:opacity-100 data-[state=closed]:translate-y-2 data-[state=closed]:opacity-0 dark:bg-white dark:text-slate-950 [&_[toast-close]]:hidden";

export function showFloatingToast({ title }: FloatingToastOptions) {
  return toast({
    title: <span className="block w-full text-center text-sm font-semibold">{title}</span>,
    className: floatingToastClassName,
  });
}
