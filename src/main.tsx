import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';

const perfMetrics: Record<string, number> = {};

if (performance?.getEntriesByType) {
  const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  if (nav) {
    perfMetrics['bundle_download_ms'] = nav.responseEnd - nav.requestStart;
    perfMetrics['dom_parse_ms'] = nav.domInteractive - nav.responseEnd;
    perfMetrics['js_parse_compile_ms'] = nav.domComplete - nav.domInteractive;
    perfMetrics['total_page_load_ms'] = nav.loadEventEnd - nav.startTime;
  }
}

const resourceEntries = performance?.getEntriesByType
  ? performance.getEntriesByType('resource') as PerformanceResourceTiming[]
  : [];
const jsResources = resourceEntries.filter(r => r.name.endsWith('.js'));
const cssResources = resourceEntries.filter(r => r.name.endsWith('.css'));
if (jsResources.length > 0) {
  perfMetrics['js_total_download_ms'] = Math.max(...jsResources.map(r => r.responseEnd - r.startTime));
  perfMetrics['js_total_size_bytes'] = jsResources.reduce((s, r) => s + (r.transferSize || 0), 0);
}
if (cssResources.length > 0) {
  perfMetrics['css_total_download_ms'] = Math.max(...cssResources.map(r => r.responseEnd - r.startTime));
  perfMetrics['css_total_size_bytes'] = cssResources.reduce((s, r) => s + (r.transferSize || 0), 0);
}

(window as any).__perfMetrics = perfMetrics;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <App />
      </TooltipProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
