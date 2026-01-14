import * as Toast from "@radix-ui/react-toast";
import { useState } from "react";

export function useToast() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");

  const showToast = (msg: string) => {
    setMessage(msg);
    setOpen(false); // reset
    requestAnimationFrame(() => setOpen(true));
  };

  const ToastComponent = (
    <Toast.Provider swipeDirection="right">
      <Toast.Root
        open={open}
        onOpenChange={setOpen}
        className="bg-red-600 text-white rounded-md px-4 py-3 shadow-lg"
      >
        <Toast.Title className="font-medium">
          Error
        </Toast.Title>
        <Toast.Description className="text-sm">
          {message}
        </Toast.Description>
      </Toast.Root>

      <Toast.Viewport className="fixed bottom-4 right-4 z-50 w-[360px]" />
    </Toast.Provider>
  );

  return { showToast, ToastComponent };
}
