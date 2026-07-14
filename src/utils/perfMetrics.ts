import axiosInstance from '../api/axiosInstance';

const PERF_REPORT_URL = `${axiosInstance.defaults.baseURL}/admin/dashboard/perf-metrics/`;

export function reportPerfMetrics(): void {
  if (document.visibilityState === 'hidden') {
    return;
  }

  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => sendMetrics(), { timeout: 3000 });
  } else {
    setTimeout(sendMetrics, 2000);
  }
}

function sendMetrics(): void {
  const metrics = (window as any).__perfMetrics;
  if (!metrics || Object.keys(metrics).length === 0) {
    return;
  }

  const payload = JSON.stringify({
    url: window.location.pathname,
    user_agent: navigator.userAgent,
    viewport_width: window.innerWidth,
    viewport_height: window.innerHeight,
    ...metrics,
  });

  if (navigator.sendBeacon) {
    navigator.sendBeacon(PERF_REPORT_URL, payload);
  }
}
