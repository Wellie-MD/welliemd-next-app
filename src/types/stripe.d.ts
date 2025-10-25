declare module '@stripe/stripe-js' {
  export function loadStripe(key?: string): Promise<any>;
  export type Stripe = any;
}

declare module '@stripe/react-stripe-js' {
  import type { ComponentType } from 'react';
  export const Elements: ComponentType<any>;
  export const PaymentElement: ComponentType<any>;
  export function useStripe(): any;
  export function useElements(): any;
  export const ElementsConsumer: ComponentType<any>;
  const _default: any;
  export default _default;
}
