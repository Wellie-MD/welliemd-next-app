interface ProgramMetricsProps {
  screeningCount: number;
  checkoutCount: number;
  planCount: number;
  visitType: string;
}

export function ProgramMetrics({
  screeningCount,
  checkoutCount,
  planCount,
  visitType,
}: ProgramMetricsProps) {
  return (
    <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
      <div className="flex-1 min-w-[200px] bg-white px-6 py-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
        <div className="text-3xl font-extrabold text-slate-900 mb-1">{screeningCount}</div>
        <div className="text-[11px] font-semibold text-slate-400">Screening questions</div>
      </div>
      <div className="flex-1 min-w-[200px] bg-white px-6 py-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
        <div className="text-3xl font-extrabold text-slate-900 mb-1">{checkoutCount}</div>
        <div className="text-[11px] font-semibold text-slate-400">Checkout questions</div>
      </div>
      <div className="flex-1 min-w-[200px] bg-white px-6 py-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
        <div className="text-3xl font-extrabold text-slate-900 mb-1">{planCount}</div>
        <div className="text-[11px] font-semibold text-slate-400">Plans using this module</div>
      </div>
      <div className="flex-1 min-w-[200px] bg-white px-6 py-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
        <div className="text-3xl font-extrabold text-slate-900 mb-1">{visitType || "-"}</div>
        <div className="text-[11px] font-semibold text-slate-400">Visit type</div>
      </div>
    </div>
  );
}
