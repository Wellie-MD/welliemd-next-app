/**
 * LabEditDialog — Edit modal for an assigned lab panel.
 * Extracted from Labs.tsx to keep the page under 600 lines.
 */
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { clientLabsApi, type ClientLabPanel } from "@/features/labs/api";
import { Box, FlaskConical, DollarSign, Power, MapPin, Image as ImageIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS",
  "KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY",
  "NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV",
  "WI","WY","DC","PR",
];

function getCollectionDetailLabel(method: string) {
  switch (method) {
    case "walk_in_test": return "Walk-in test";
    case "at_home_phlebotomy": return "At-home kit";
    case "on_site_collection": return "On-site collection";
    case "testkit": return "Testkit";
    default: return method.replace(/_/g, " ");
  }
}

function getDisplaySpecimen(lab: ClientLabPanel) {
  if (lab.collection_method === "at_home_phlebotomy" || lab.collection_method === "walk_in_test") {
    return "blood draw";
  }
  return lab.sample_type || "serum";
}

interface Props {
  editingLab: ClientLabPanel | null;
  onClose: () => void;
  onSaved?: (lab: ClientLabPanel) => void;
}

export default function LabEditDialog({ editingLab, onClose, onSaved }: Props) {
  const { toast } = useToast();
  const [patientPrice, setPatientPrice] = useState("");
  const [discountedPatientPrice, setDiscountedPatientPrice] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [serviceStates, setServiceStates] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editingLab) return;
    setPatientPrice(editingLab.patient_price.toFixed(2));
    setDiscountedPatientPrice(editingLab.discounted_patient_price?.toFixed(2) || "");
    setIsActive(editingLab.is_active);
    setServiceStates(editingLab.service_states);
  }, [editingLab]);

  const effectivePatientPrice = Number.parseFloat(patientPrice) || 0;
  const profit = effectivePatientPrice - (editingLab?.cost_to_client || 0);

  const toggleState = (state: string) => {
    setServiceStates((current) =>
      current.includes(state)
        ? current.filter((value) => value !== state)
        : [...current, state]
    );
  };

  const handleSave = async () => {
    if (!editingLab) return;
    try {
      setSaving(true);
      const updated = await clientLabsApi.updateLabPanel(editingLab.assignment_id, {
        patient_price: effectivePatientPrice,
        discounted_patient_price: discountedPatientPrice.trim()
          ? Number.parseFloat(discountedPatientPrice)
          : null,
        is_active: isActive,
        service_states: serviceStates,
      });
      onSaved?.(updated);
      toast({ title: "Lab test updated" });
      onClose();
    } catch (error) {
      console.error("Failed to update lab test:", error);
      toast({
        title: "Failed to update lab test",
        description: "Please check the values and try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!editingLab} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[calc(100vw-24px)] max-w-[880px] max-h-[92vh] overflow-y-auto p-0 gap-0 border-none rounded-2xl shadow-2xl bg-white text-gray-900">
        {editingLab && (
          <>
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-[#e8ebee] p-6 bg-white sticky top-0 z-10">
              <div className="flex gap-3">
                <span className="w-10 h-10 rounded-[11px] bg-[#e3f3fb] text-[#2b7da6] flex items-center justify-center shrink-0">
                  <Box className="w-5 h-5" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <DialogTitle className="text-[17px] font-bold text-gray-900 leading-tight">Edit Product</DialogTitle>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${editingLab.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-700 border-red-100"}`}>
                      {editingLab.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="text-[13.5px] font-semibold text-gray-900 mt-1 leading-tight">{editingLab.name}</div>
                  <DialogDescription className="text-[11.5px] text-gray-500 mt-1">
                    Fields marked read-only are managed by the admin and cannot be edited.
                  </DialogDescription>
                </div>
              </div>
              <button type="button" onClick={onClose} className="border border-[#e8ebee] bg-white rounded-lg w-[30px] h-[30px] flex items-center justify-center cursor-pointer text-gray-550 shrink-0 hover:bg-gray-55">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 bg-[#f7f9fb]">

              {/* Product Information */}
              <div className="border border-[#e8ebee] rounded-[14px] p-[16px_18px] bg-[#fbfcfd] space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-[26px] h-[26px] rounded-[7px] bg-[#e3f3fb] text-[#2b7da6] flex items-center justify-center shrink-0"><Box className="w-[15px] h-[15px]" /></span>
                  <h3 className="text-[13.5px] font-bold text-gray-900">Product Information</h3>
                  <span className="text-[10.5px] font-semibold bg-[#eef1f4] text-[#6b7280] rounded-full px-2 py-0.5">🔒 Admin-managed</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_2fr] gap-x-7 gap-y-2 text-xs">
                  <div>
                    <div className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-400">Product Name</div>
                    <div className="text-[15px] font-semibold text-gray-900 mt-0.5">{editingLab.name}</div>
                  </div>
                  <div>
                    <div className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-400">Product Description</div>
                    <div className="text-[13.5px] font-medium text-gray-900 mt-0.5 leading-relaxed">
                      {editingLab.description || `${editingLab.name} — lab panel collected by blood draw, processed by ${editingLab.lab_provider}.`}
                    </div>
                  </div>
                </div>
                <div className="border-t border-[#e8ebee] my-3.5" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-7 gap-y-4 text-xs">
                  <div><div className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-400">Test Type</div><div className="text-[13.5px] font-semibold text-gray-900 mt-0.5">Lab</div></div>
                  <div><div className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-400">Purchase Type</div><div className="text-[13.5px] font-semibold text-gray-900 mt-0.5">One Time</div></div>
                  <div><div className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-400">Collection</div><div className="text-[13.5px] font-semibold text-gray-900 mt-0.5">{getCollectionDetailLabel(editingLab.collection_method)}</div></div>
                  <div><div className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-400">Lab</div><div className="text-[13.5px] font-semibold text-gray-900 mt-0.5">{editingLab.lab_provider}</div></div>
                  <div><div className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-400">Sample Type</div><div className="text-[13.5px] font-semibold text-gray-900 mt-0.5 capitalize">{editingLab.sample_type || "Serum"}</div></div>
                  <div><div className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-400">Specimen</div><div className="text-[13.5px] font-semibold text-gray-900 mt-0.5">{getDisplaySpecimen(editingLab)}</div></div>
                  <div><div className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-400">Fasting Required</div><div className="text-[13.5px] font-semibold text-gray-900 mt-0.5">{editingLab.fasting_required === "yes" ? "Yes" : "No"}</div></div>
                  <div><div className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-400">Turnaround</div><div className="text-[13.5px] font-semibold text-gray-900 mt-0.5">{editingLab.turnaround_days || "1-2 days (up to 4 days)"}</div></div>
                  <div><div className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-400">Biomarkers</div><div className="text-[13.5px] font-semibold text-gray-900 mt-0.5">{editingLab.biomarkers.length}</div></div>
                </div>
                <div className="border-t border-[#e8ebee] mt-3.5 pt-3.5 text-xs">
                  <div className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-400">Collection Instructions</div>
                  <p className="text-[13.5px] font-medium text-gray-900 mt-0.5 leading-relaxed">
                    A phlebotomy kit ships to the patient. Collect the sample per the enclosed guide and return it in the prepaid mailer the same day. Fasting 8–12 hours beforehand is required.
                  </p>
                </div>
                {/* Junction approval status */}
                <div className="border-t border-[#e8ebee] mt-3.5 pt-3.5">
                  <div className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Junction Approval Status</div>
                  <div className="flex flex-wrap gap-2 items-center">
                    {editingLab.is_orderable ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">✓ Active — Checkout Link available</span>
                    ) : editingLab.junction_status === "pending_submission" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-50 text-gray-500 border border-gray-200">Pending Submission — submit from Admin portal</span>
                    ) : editingLab.junction_status === "pending_approval" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">Pending Junction Approval</span>
                    ) : editingLab.junction_status === "failed" || editingLab.operational_status === "failed" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-100">Submission Failed — contact admin</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-50 text-gray-500 border border-gray-200">{editingLab.junction_status || "Not submitted"}</span>
                    )}
                    {editingLab.junction_lab_test_id && (
                      <span className="font-mono text-[10px] text-gray-400 truncate max-w-[200px]" title={editingLab.junction_lab_test_id}>ID: {editingLab.junction_lab_test_id}</span>
                    )}
                  </div>
                  {editingLab.junction_rejection_reason && (
                    <p className="mt-1.5 text-[11px] text-rose-600">{editingLab.junction_rejection_reason}</p>
                  )}
                </div>
              </div>

              {/* Panel Composition */}
              <div className="border border-[#e8ebee] rounded-[14px] p-[16px_18px] bg-white space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-[26px] h-[26px] rounded-[7px] bg-[#e3f3fb] text-[#2b7da6] flex items-center justify-center shrink-0"><FlaskConical className="w-[15px] h-[15px]" /></span>
                    <h3 className="text-[13.5px] font-bold text-gray-900">Panel Composition</h3>
                  </div>
                  <span className="text-[10.5px] font-semibold bg-[#e3f3fb] text-[#2b7da6] rounded-full px-2 py-0.5">{editingLab.biomarkers.length} biomarkers</span>
                </div>
                <p className="text-xs text-gray-550">Biomarkers measured by this panel and their reference ranges. Collected with an {getCollectionDetailLabel(editingLab.collection_method).toLowerCase()} ({getDisplaySpecimen(editingLab)}); results in {editingLab.turnaround_days || "1-2 days"}.</p>
                <div className="border border-[#e8ebee] rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#f7f9fb] text-[10px] uppercase font-bold text-gray-500 border-b border-[#e8ebee]">
                      <tr><th className="px-3 py-2">Biomarker</th><th className="px-3 py-2">Units</th><th className="px-3 py-2">Reference Range</th></tr>
                    </thead>
                    <tbody className="divide-y divide-[#e8ebee]">
                      {editingLab.biomarkers.map((bm) => (
                        <tr key={bm.id}>
                          <td className="px-3 py-2 font-semibold text-gray-900">{bm.name}</td>
                          <td className="px-3 py-2 text-gray-550">{bm.units || "-"}</td>
                          <td className="px-3 py-2 text-gray-550">{bm.reference_range || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pricing & Profit */}
              <div className="border border-[#e8ebee] rounded-[14px] p-[16px_18px] bg-white space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-[26px] h-[26px] rounded-[7px] bg-[#e3f3fb] text-[#2b7da6] flex items-center justify-center shrink-0"><DollarSign className="w-[15px] h-[15px]" /></span>
                  <h3 className="text-[13.5px] font-bold text-gray-900">Pricing & Profit</h3>
                  <span className="text-[10.5px] font-semibold bg-[#e3f6ec] text-[#1d8a52] rounded-full px-2 py-0.5">Editable</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-400">Base Price (Patient)</Label>
                    <div className="flex items-center h-[38px] rounded-lg border border-[#e8ebee] bg-white px-3 text-xs focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500">
                      <span className="text-gray-400 mr-1.5">$</span>
                      <input
                        className="w-full bg-transparent outline-none text-[13px] text-gray-900 font-semibold"
                        value={patientPrice}
                        onChange={(event) => setPatientPrice(event.target.value)}
                      />
                    </div>
                    <p className="text-[10.5px] text-[#94a3b8] mt-1">Retail price shown to patients</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-400">Discounted Price (Patient)</Label>
                    <div className="flex items-center h-[38px] rounded-lg border border-[#e8ebee] bg-white px-3 text-xs focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500">
                      <span className="text-gray-400 mr-1.5">$</span>
                      <input
                        className="w-full bg-transparent outline-none text-[13px] text-gray-900 font-semibold"
                        placeholder="0.00"
                        value={discountedPatientPrice}
                        onChange={(event) => setDiscountedPatientPrice(event.target.value)}
                      />
                    </div>
                    <p className="text-[10.5px] text-[#94a3b8] mt-1">Optional promotional price</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-400">Shipping Fee (Patient)</Label>
                    <div className="flex items-center h-[38px] rounded-lg border border-[#e8ebee] bg-white px-3 text-xs focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500">
                      <span className="text-gray-400 mr-1.5">$</span>
                      <input className="w-full bg-transparent outline-none text-[13px] text-gray-900 font-semibold" placeholder="0.00" />
                    </div>
                    <p className="text-[10.5px] text-[#94a3b8] mt-1">Per-patient fee</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div className="border border-[#e8ebee] rounded-[12px] p-3.5 bg-[#f7f9fb] text-xs">
                    <div className="flex items-center gap-2 mb-2">
                      <b className="text-[13px] text-gray-800">Your cost</b>
                      <span className="text-[10.5px] font-semibold bg-[#eef1f4] text-[#6b7280] rounded-full px-2 py-0.5">🔒 Admin-managed</span>
                    </div>
                    <div className="flex justify-between py-1 text-[12.5px]"><span className="text-gray-550">Cost to client (lab)</span><span className="font-semibold text-gray-900">${editingLab.cost_to_client.toFixed(2)}</span></div>
                    <div className="flex justify-between py-1 text-[12.5px]"><span className="text-gray-555">Draw / handling</span><span className="font-semibold text-gray-900">$0.00</span></div>
                    <div className="border-t border-[#e8ebee] my-1.5" />
                    <div className="flex justify-between py-1 text-[12.5px]"><b className="text-gray-900">Total cost</b><b className="text-gray-900">${editingLab.cost_to_client.toFixed(2)}</b></div>
                  </div>
                  <div className="border border-[#cdebd9] rounded-[12px] p-3.5 bg-[#f1faf4] text-xs">
                    <b className="text-[13px] text-gray-800 block mb-1.5">Profit breakdown</b>
                    <div className="flex justify-between py-1 text-[12.5px]"><span className="text-gray-555">Patient pays</span><span className="font-semibold text-gray-900">${effectivePatientPrice.toFixed(2)}</span></div>
                    <div className="flex justify-between py-1 text-[12.5px]"><span className="text-gray-555">Shipping fee</span><span className="font-semibold text-gray-900">+$0.00</span></div>
                    <div className="flex justify-between py-1 text-[12.5px]"><span className="text-gray-555">Your cost</span><span className="font-semibold text-gray-900">-${editingLab.cost_to_client.toFixed(2)}</span></div>
                    <div className="border-t border-[#cdebd9] my-1.5" />
                    <div className="flex items-end justify-between">
                      <b className="text-[13px] text-gray-900">Profit per order</b>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-[#1d8a52]">${profit.toFixed(2)}</span>
                        <span className="text-[10.5px] font-semibold bg-[#dcf3e5] text-[#1d8a52] rounded-full px-2 py-0.5">{effectivePatientPrice > 0 ? `${Math.round((profit / effectivePatientPrice) * 100)}%` : "0%"}</span>
                      </div>
                    </div>
                    <div className="text-[10.5px] text-gray-400 mt-1.5">Excludes visit cost</div>
                  </div>
                </div>
              </div>

              {/* Availability */}
              <div className="border border-[#e8ebee] rounded-[14px] p-[16px_18px] bg-white space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-[26px] h-[26px] rounded-[7px] bg-[#e3f3fb] text-[#2b7da6] flex items-center justify-center shrink-0"><Power className="w-[15px] h-[15px]" /></span>
                  <h3 className="text-[13.5px] font-bold text-gray-900">Availability</h3>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-gray-555 max-w-[60%]">Inactive products are hidden from product selection in intake.</p>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs font-semibold text-gray-900">{isActive ? "Active" : "Inactive"}</div>
                      <div className="text-[10px] text-gray-505">{isActive ? "Shown in product selection" : "Hidden from product selection"}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsActive((current) => !current)}
                      className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 ${isActive ? "bg-[#46b6e6]" : "bg-[#cbd5e1]"}`}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-200 ${isActive ? "left-[22px]" : "left-[2px]"}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Service States */}
              <div className="border border-[#e8ebee] rounded-[14px] p-[16px_18px] bg-white space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-[26px] h-[26px] rounded-[7px] bg-[#e3f3fb] text-[#2b7da6] flex items-center justify-center shrink-0"><MapPin className="w-[15px] h-[15px]" /></span>
                  <h3 className="text-[13.5px] font-bold text-gray-900">Service States</h3>
                  <span className="ml-auto text-[10.5px] font-semibold bg-[#e3f3fb] text-[#2b7da6] rounded-full px-2 py-0.5">{serviceStates.length} of {US_STATES.length} active</span>
                </div>
                <p className="text-xs text-gray-555">Select the states where this assigned product should remain available. You can only choose states configured by admin.</p>
                <div className="flex items-center gap-3">
                  <Button type="button" variant="outline" size="sm" onClick={() => setServiceStates(US_STATES)} className="h-7 text-xs border border-[#e8ebee] bg-white text-gray-900 rounded-full px-3 font-semibold hover:bg-gray-50">Select all states</Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setServiceStates([])} className="h-7 text-xs text-gray-500 hover:bg-transparent hover:text-gray-700">Clear</Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {US_STATES.map((state) => {
                    const selected = serviceStates.includes(state);
                    return (
                      <button key={state} type="button" onClick={() => toggleState(state)} className={`border rounded-full px-3 py-1 text-[11.5px] font-semibold transition-colors duration-150 ${selected ? "bg-[#46b6e6] border-[#46b6e6] text-white" : "bg-white border-[#e8ebee] text-gray-800 hover:bg-gray-50"}`}>
                        {state}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Product Image */}
              <div className="border border-[#e8ebee] rounded-[14px] p-[16px_18px] bg-white space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-[26px] h-[26px] rounded-[7px] bg-[#e3f3fb] text-[#2b7da6] flex items-center justify-center shrink-0"><ImageIcon className="w-[15px] h-[15px]" /></span>
                  <h3 className="text-[13.5px] font-bold text-gray-900">Product Image</h3>
                  <span className="text-[10.5px] font-semibold bg-[#e3f6ec] text-[#1d8a52] rounded-full px-2 py-0.5">Editable</span>
                </div>
                <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-[12px] border-2 border-dashed border-[#e8ebee] bg-white p-6 text-center hover:bg-gray-50">
                  <span className="w-11 h-11 rounded-full bg-[#e3f3fb] text-[#2b7da6] flex items-center justify-center"><ImageIcon className="w-5 h-5" /></span>
                  <span className="mt-2 text-[13.5px] font-semibold text-gray-900">Click to upload</span>
                  <span className="text-[13px] text-gray-500">or drag and drop an image here</span>
                  <span className="mt-2 text-[10.5px] font-semibold bg-[#eef1f4] text-[#6b7280] rounded-full px-2 py-0.5">PNG or JPG · up to 5MB</span>
                  <input type="file" accept="image/png,image/jpeg" className="hidden" />
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 border-t border-[#e8ebee] px-6 py-3.5 sticky bottom-0 bg-white z-10">
              <Button variant="outline" onClick={onClose} className="border border-[#e8ebee] bg-white text-gray-700 hover:bg-gray-55 rounded-lg px-4 h-9 text-xs font-semibold">Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-[#46b6e6] border border-[#46b6e6] text-white hover:bg-[#3ca4cf] rounded-lg px-4 h-9 text-xs font-semibold">
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
