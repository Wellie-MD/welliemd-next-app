import { Lock } from "lucide-react";

export function AuthPatientPreview() {
  return (
    <aside className="bg-[#0f1117] flex flex-col h-full overflow-hidden w-[340px] shrink-0 border-l border-slate-200">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Patient Preview</span>
        </div>
        <span className="text-[10px] font-medium text-slate-500">Updates live</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex justify-center">
        <div className="w-[300px] bg-white rounded-xl shadow-xl overflow-hidden flex flex-col mt-4">
          <div className="bg-slate-50 border-b border-slate-100 px-3 py-2.5 flex items-center gap-2 shrink-0">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            </div>
            <div className="flex-1 mx-2 flex justify-center">
              <div className="bg-white rounded px-2.5 py-0.5 text-[10px] font-medium text-slate-400 border border-slate-200 shadow-sm">
                welliemd.com/intake
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="max-w-[380px] mx-auto py-2">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl flex items-center justify-center mx-auto mb-3.5 shadow-sm">
                  <Lock className="w-[22px] h-[22px] text-amber-700" strokeWidth={2} />
                </div>
                <div className="text-[19px] font-semibold text-[#0f1117] tracking-tight mb-1.5">
                  Welcome to WellieMD
                </div>
                <div className="text-[12.5px] text-slate-600 leading-snug">
                  Enter your email to continue. We'll check<br />if you have an account.
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Email address
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  disabled
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-[13.5px] bg-slate-50 text-slate-900"
                />
              </div>

              <button disabled className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-[13.5px] font-semibold opacity-95">
                Continue &rarr;
              </button>

              <div className="mt-5 p-3 bg-slate-50 rounded-lg text-[11px] text-slate-600 leading-relaxed border border-slate-100">
                <strong className="text-slate-900 font-bold block mb-1">What happens next?</strong>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-emerald-600 text-xs">&bull;</span> Returning patient &rarr; log in with your password
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-violet-600 text-xs">&bull;</span> New patient &rarr; create an account
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
