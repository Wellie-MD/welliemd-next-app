declare module 'jest-axe' {
  interface AxeResults {
    violations: unknown[];
  }

  export function axe(container: Element | DocumentFragment): Promise<AxeResults>;

  export const toHaveNoViolations: Record<string, (...args: unknown[]) => unknown>;
}
