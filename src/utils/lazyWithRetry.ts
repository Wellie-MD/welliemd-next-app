import { lazy, type ComponentType, type LazyExoticComponent } from "react";

const MODULE_RETRY_DELAYS_MS = [250, 750] as const;

const wait = (delayMs: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, delayMs));

export function lazyWithRetry<T extends ComponentType<unknown>>(
  importer: () => Promise<{ default: T }>,
): LazyExoticComponent<T> {
  return lazy(async () => {
    let lastError: unknown;

    for (let attempt = 0; attempt <= MODULE_RETRY_DELAYS_MS.length; attempt += 1) {
      try {
        return await importer();
      } catch (error) {
        lastError = error;
        const delayMs = MODULE_RETRY_DELAYS_MS[attempt];
        if (delayMs === undefined) break;
        await wait(delayMs);
      }
    }

    throw lastError;
  });
}
