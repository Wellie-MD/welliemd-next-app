import { ReactNode } from 'react';

interface PaymentFieldFrameProps {
  children?: ReactNode;
  id?: string;
  className?: string;
}

export function PaymentFieldFrame({ children, id, className }: PaymentFieldFrameProps) {
  return (
    <div
      id={id}
      className={`mt-1 min-h-[42px] rounded-md border border-input bg-background px-3 py-2 shadow-sm transition-colors focus-within:ring-2 focus-within:ring-ring/40 ${className || ''}`}
    >
      {children}
    </div>
  );
}
