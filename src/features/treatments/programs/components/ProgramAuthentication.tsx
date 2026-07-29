import { LockKeyhole } from "lucide-react";

/**
 * Compatibility component for callers outside the current Program detail
 * page. The first intake boundary is fixed and is not configurable.
 */
export function ProgramAuthentication() {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
      <div className="border-b border-slate-100 p-6">
        <div className="flex items-center gap-2">
          <LockKeyhole className="h-4 w-4 text-blue-600" />
          <h3 className="text-[15px] font-extrabold text-slate-900">Patient Authentication</h3>
        </div>
        <p className="mt-1 max-w-2xl text-[11px] font-medium leading-relaxed text-slate-400">
          Required first step for every intake. Patients enter their email,
          then existing patients sign in and new patients create an account.
        </p>
      </div>
    </section>
  );
}
