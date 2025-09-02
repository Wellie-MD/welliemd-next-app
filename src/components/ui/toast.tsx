import * as React from 'react';
import { X } from 'lucide-react';
import { Toaster as Sonner, toast as sonnerToast } from 'sonner';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/shared/store/ui.store';

// Toast component using Sonner
const Toaster = ({ ...props }) => {
  const theme = useUIStore((state) => state.theme);
  
  return (
    <Sonner
      theme={theme as any}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton:
            'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
        },
      }}
      {...props}
    />
  );
};

// Toast utilities using Sonner
const toast = {
  success: (message: string, options?: any) => {
    return sonnerToast.success(message, {
      ...options,
      duration: options?.duration || 4000,
    });
  },
  
  error: (message: string, options?: any) => {
    return sonnerToast.error(message, {
      ...options,
      duration: options?.duration || 6000,
    });
  },
  
  info: (message: string, options?: any) => {
    return sonnerToast.info(message, {
      ...options,
      duration: options?.duration || 4000,
    });
  },
  
  warning: (message: string, options?: any) => {
    return sonnerToast.warning(message, {
      ...options,
      duration: options?.duration || 5000,
    });
  },
  
  loading: (message: string, options?: any) => {
    return sonnerToast.loading(message, options);
  },
  
  promise: <T,>(
    promise: Promise<T>,
    options: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) => {
    return sonnerToast.promise(promise, options);
  },
  
  custom: (jsx: React.ReactNode, options?: any) => {
    return sonnerToast.custom(jsx, options);
  },
  
  dismiss: (id?: string | number) => {
    return sonnerToast.dismiss(id);
  },
};

// Custom toast components for specific use cases
interface ActionToastProps {
  title: string;
  description?: string;
  actionLabel: string;
  onAction: () => void;
  variant?: 'default' | 'destructive';
}

function ActionToast({ 
  title, 
  description, 
  actionLabel, 
  onAction, 
  variant = 'default' 
}: ActionToastProps) {
  return (
    <div className="flex w-full items-center justify-between space-x-4">
      <div className="flex-1">
        <div className="font-semibold">{title}</div>
        {description && (
          <div className="text-sm text-muted-foreground">{description}</div>
        )}
      </div>
      <Button
        size="sm"
        variant={variant === 'destructive' ? 'destructive' : 'default'}
        onClick={onAction}
        className="flex-shrink-0"
      >
        {actionLabel}
      </Button>
    </div>
  );
}

// Toast notification helpers
export const toastUtils = {
  // Success notifications
  success: (message: string, options?: any) => toast.success(message, options),
  
  // Error notifications
  error: (message: string, options?: any) => toast.error(message, options),
  
  // Info notifications
  info: (message: string, options?: any) => toast.info(message, options),
  
  // Warning notifications
  warning: (message: string, options?: any) => toast.warning(message, options),
  
  // Loading states
  loading: (message: string, options?: any) => toast.loading(message, options),
  
  // Promise-based toasts
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) => toast.promise(promise, messages),
  
  // Action toasts
  action: (props: ActionToastProps) => {
    return toast.custom(<ActionToast {...props} />);
  },
  
  // Undo action toast
  undo: (
    message: string,
    onUndo: () => void,
    options?: { duration?: number }
  ) => {
    return toast.custom(
      <ActionToast
        title={message}
        actionLabel="Undo"
        onAction={() => {
          onUndo();
          toast.dismiss();
        }}
      />,
      {
        duration: options?.duration || 5000,
      }
    );
  },
  
  // Confirmation toast
  confirm: (
    title: string,
    description: string,
    onConfirm: () => void,
    options?: { confirmLabel?: string; duration?: number }
  ) => {
    return toast.custom(
      <ActionToast
        title={title}
        description={description}
        actionLabel={options?.confirmLabel || 'Confirm'}
        onAction={() => {
          onConfirm();
          toast.dismiss();
        }}
        variant="destructive"
      />,
      {
        duration: options?.duration || 10000,
      }
    );
  },
  
  // Dismiss toast
  dismiss: (id?: string | number) => toast.dismiss(id),
  
  // Dismiss all toasts
  dismissAll: () => toast.dismiss(),
};

// Hook for toast notifications
export function useToast() {
  const { showSuccessToast, showErrorToast, showWarningToast, showInfoToast } = useUIStore();
  
  return {
    toast: toastUtils,
    success: showSuccessToast,
    error: showErrorToast,
    warning: showWarningToast,
    info: showInfoToast,
  };
}

// Export components and utilities
export { Toaster, toast, toastUtils };

// Integration with UI store for consistency
export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster position="top-right" richColors closeButton />
    </>
  );
}
