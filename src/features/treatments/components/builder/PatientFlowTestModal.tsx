import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PatientFlowTestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PatientFlowTestModal({ open, onOpenChange }: PatientFlowTestModalProps) {
  const [activeModules, setActiveModules] = useState<string[]>(["ED Intake", "PE Intake"]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1200px] w-[95vw] p-0 gap-0 overflow-hidden flex flex-col h-[85vh] max-h-[900px] bg-slate-50">
        <DialogHeader className="px-6 py-5 border-b border-slate-200 bg-white shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold text-slate-900">Patient Flow Test</DialogTitle>
              <p className="text-sm text-slate-500 mt-1">
                Answer questions as a patient — see which products appear at checkout.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">Reset Answers</Button>
              <Button onClick={() => onOpenChange(false)} className="bg-[#12517A] text-white hover:bg-[#12517A]/90">
                Close
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Eligibility Modules in this Flow
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {activeModules.map((module, idx) => (
              <div key={idx} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-md shadow-sm text-sm font-medium text-slate-700">
                {module}
                <button className="text-slate-400 hover:text-slate-600 ml-1">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <select className="flex-1 max-w-[280px] h-9 rounded-md border border-slate-200 px-3 text-sm bg-white shadow-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
              <option value="">Select a module...</option>
              <option value="glp">GLP-1 Intake</option>
              <option value="trt">TRT Intake</option>
            </select>
            <Button variant="outline" size="sm" className="bg-white">
              <Plus className="mr-2 h-4 w-4" />
              Add Eligibility
            </Button>
            <div className="text-xs text-slate-500 ml-auto">
              Add modules to simulate multi-treatment flow (e.g., ED + PE + GLP).
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 flex overflow-hidden">
          {/* Left: Questions to answer */}
          <div className="flex-1 overflow-y-auto bg-white p-6 md:p-8">
            <div className="max-w-2xl mx-auto space-y-8">
              {/* Fake question 1 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900">Have you previously been diagnosed with ED?</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-blue-200 bg-blue-50 cursor-pointer transition-colors">
                    <input type="radio" name="q1" className="h-4 w-4 text-blue-600 border-slate-300 focus:ring-blue-500" defaultChecked />
                    <span className="text-sm font-medium text-blue-900">Yes</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-white cursor-pointer hover:bg-slate-50 transition-colors">
                    <input type="radio" name="q1" className="h-4 w-4 text-blue-600 border-slate-300 focus:ring-blue-500" />
                    <span className="text-sm font-medium text-slate-700">No</span>
                  </label>
                </div>
              </div>

              {/* Fake question 2 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900">Are you taking any nitrates for chest pain?</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-white cursor-pointer hover:bg-slate-50 transition-colors">
                    <input type="radio" name="q2" className="h-4 w-4 text-blue-600 border-slate-300 focus:ring-blue-500" />
                    <span className="text-sm font-medium text-slate-700">Yes</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-blue-200 bg-blue-50 cursor-pointer transition-colors">
                    <input type="radio" name="q2" className="h-4 w-4 text-blue-600 border-slate-300 focus:ring-blue-500" defaultChecked />
                    <span className="text-sm font-medium text-blue-900">No</span>
                  </label>
                </div>
              </div>

              <div className="pt-4">
                <Button className="bg-[#12517A] text-white hover:bg-[#12517A]/90 w-full sm:w-auto px-8">
                  Continue
                </Button>
              </div>
            </div>
          </div>

          {/* Right: Checkout result */}
          <div className="w-[380px] shrink-0 border-l border-slate-200 bg-slate-950 text-white flex flex-col">
            <div className="p-6 overflow-y-auto flex-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-300">Patient Checkout</div>
                <div className="text-[10px] font-medium text-slate-500 ml-auto uppercase tracking-wide">Live</div>
              </div>

              <div className="bg-white text-slate-900 rounded-xl overflow-hidden shadow-lg">
                <div className="px-4 py-2 bg-slate-100 flex items-center gap-2 border-b border-slate-200">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-400"></div>
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-400"></div>
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-400"></div>
                  <div className="ml-2 bg-white border border-slate-200 rounded px-2 py-0.5 text-[10px] text-slate-500 font-mono">
                    welliemd.com/checkout
                  </div>
                </div>
                
                <div className="p-5">
                  <h4 className="text-sm font-bold text-slate-900 mb-3">Available Treatments</h4>
                  
                  <div className="space-y-3">
                    <div className="rounded-lg border border-emerald-500 bg-emerald-50 p-3 relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-bl">
                        Recommended
                      </div>
                      <div className="font-semibold text-emerald-900 text-sm pr-16">Sildenafil (Generic Viagra)</div>
                      <div className="text-emerald-700 text-xs mt-1">50mg tablets • Take as needed</div>
                    </div>
                    
                    <div className="rounded-lg border border-slate-200 bg-white p-3 hover:border-blue-300 transition-colors cursor-pointer">
                      <div className="font-semibold text-slate-900 text-sm">Tadalafil (Generic Cialis)</div>
                      <div className="text-slate-500 text-xs mt-1">10mg tablets • Take as needed</div>
                    </div>
                  </div>
                  
                  <div className="mt-6 space-y-2">
                    <div className="h-8 bg-slate-100 rounded-md w-full animate-pulse"></div>
                    <div className="h-8 bg-slate-100 rounded-md w-full animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
