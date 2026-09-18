import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateAdminOrder, OrderUpdatePayload } from "@/api/dashboardApi";
import { toast } from "@/components/ui/use-toast";
import { Hexagon, User, Mail, Phone, FileText, Download } from "lucide-react";
import { labsApi } from "@/api/labs";
import { labOrderToneStyles } from "@/features/labs/constants/tones";
import { extractLabResultRows } from "@/features/labs/utils/resultRows";

interface OrderDetailDrawerProps {
  order: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderUpdated: (updatedOrder: any) => void;
}

interface LabLifecycleEvent {
  id?: string;
  event_type?: string;
  occurred_at?: string;
  title?: string;
  status?: string;
  description?: string;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function OrderPill({ status }: { status: string }) {
  if (!status || status === "—") return <span className="text-muted-foreground">—</span>;
  const [bg, fg, bd] = labOrderToneStyles(status);
  return (
    <span
      className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap"
      style={{ backgroundColor: bg, color: fg, borderColor: bd }}
    >
      {status}
    </span>
  );
}

export function OrderDetailDrawer({ order, open, onOpenChange, onOrderUpdated }: OrderDetailDrawerProps) {
  const [newStatus, setNewStatus] = useState<string>("");
  const [trackingNumber, setTrackingNumber] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [loadingResults, setLoadingResults] = useState(false);
  const [labResults, setLabResults] = useState<any>(null);

  useEffect(() => {
    const fetchResults = async () => {
      if (!order?.is_lab) return;
      try {
        setLoadingResults(true);
        const res = await labsApi.getAdminLabOrderResults(order.id, order.client_id);
        setLabResults(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingResults(false);
      }
    };

    if (open && order?.is_lab) {
      fetchResults();
    }
  }, [open, order]);

  const handleOpen = (isOpen: boolean) => {
    if (isOpen && order) {
      setNewStatus(order.status_display || order.status || "");
      setTrackingNumber(order.tracking_number || "");
    }
    onOpenChange(isOpen);
  };

  const handleSave = async () => {
    if (!order) return;

    const normalizedStatus = newStatus === "Completed" ? "Completed" : newStatus;

    if (order.is_lab) {
      setSaving(true);
      try {
        const updatedOrder = await labsApi.updateAdminLabOrder(order.id, {
          status: normalizedStatus,
          tracking_number: trackingNumber,
        });
        toast({
          title: "Success",
          description: "Lab order status updated."
        });
        onOrderUpdated(updatedOrder);
        onOpenChange(false);
      } catch (e) {
        console.error(e);
        toast({
          title: "Error",
          description: "Failed to update order.",
          variant: "destructive"
        });
      } finally {
        setSaving(false);
      }
      return;
    }

    const hasStatusChange = newStatus && newStatus !== (order.status_display || order.status);
    const hasTrackingChange = trackingNumber !== (order.tracking_number || "");

    if (!hasStatusChange && !hasTrackingChange) {
      toast({ title: "No changes", description: "No changes were made." });
      return;
    }

    setSaving(true);
    try {
      let backendStatus = newStatus.toLowerCase().replace(/ /g, "_");
      if (backendStatus === "completed") backendStatus = "shipped"; // completed/shipped

      const payload: OrderUpdatePayload = { client_id: order.client_id };
      if (hasStatusChange) payload.status = backendStatus;
      if (hasTrackingChange) payload.tracking_number = trackingNumber;

      const response = await updateAdminOrder(order.id, payload);

      if (response.success && response.order) {
        onOrderUpdated(response.order);
        toast({ title: "Success", description: "Order has been updated successfully." });
        onOpenChange(false);
      } else {
        toast({ title: "Update queued", description: "Order update is being processed." });
        onOpenChange(false);
      }
    } catch (err: any) {
      toast({
        title: "Update failed",
        description: err.message || "Failed to update order.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!order) return null;

  const orderAmount = typeof order.price === "number" 
    ? order.price 
    : typeof order.amount === "number"
      ? order.amount
      : parseFloat(String(order.amount).replace(/[^0-9.]/g, "")) || 0;

  const orderProduct = order.product_name || order.product || "—";
  const orderLabProvider = order.lab_provider || order.pharmacy_name || "—";
  const labResultsAvailable = order.resultsReady === true || [
    "partial_results",
    "results_ready",
    "critical",
    "partial",
    "final",
  ].includes(order.results_status);
  const hasStructuredResults = extractLabResultRows(labResults).length > 0;

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpen}>
        <SheetContent className="w-full sm:max-w-[500px] overflow-y-auto p-4 sm:p-6 flex flex-col justify-between">
          <div className="space-y-5">
            <SheetHeader className="pb-4 border-b">
              <SheetTitle className="flex items-center gap-2 text-lg font-bold">
                <Hexagon className="h-5 w-5 text-foreground" />
                Order Details
              </SheetTitle>
              <div className="text-[12px] text-muted-foreground font-mono mt-1">
                {labResults?.order?.display_id || order.display_id || order.id}
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <OrderPill status={order.status_display || order.status} />
                <OrderPill status={order.payment_status || order.payment} />
                <span
                  className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border"
                  style={{
                    backgroundColor: order.is_lab ? "#ccfbf1" : "#f1f5f9",
                    color: order.is_lab ? "#0f766e" : "#475569",
                    borderColor: order.is_lab ? "#99f6e4" : "#e2e8f0"
                  }}
                >
                  {order.is_lab ? "Lab" : "Rx"}
                </span>
              </div>
            </SheetHeader>

            <div className="space-y-2.5">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Patient</div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-foreground font-semibold">
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{order.patient_name || order.patient}</span>
                </div>
                <div className="flex items-center gap-2 text-foreground font-semibold">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{order.patient_email || order.email}</span>
                </div>
                <div className="flex items-center gap-2 text-foreground font-semibold">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{order.patient_phone || order.phone || "—"}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2.5 pt-4 border-t">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Order Info</div>
              <div className="grid grid-cols-2 gap-y-2 text-xs">
                <div className="text-muted-foreground">Client</div>
                <div className="font-semibold text-foreground text-right truncate pl-2">{order.client_name || order.client}</div>

                <div className="text-muted-foreground">Product</div>
                <div className="font-semibold text-foreground text-right truncate pl-2">{orderProduct}</div>

                <div className="text-muted-foreground">{order.is_lab ? "Ordered panel" : "Ordered (final)"}</div>
                <div className="text-right pl-2">
                  <span
                    className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border truncate max-w-full"
                    style={{ backgroundColor: "#dcfce7", color: "#166534", borderColor: "#bbf7d0" }}
                  >
                    {orderProduct}
                  </span>
                </div>

                <div className="text-muted-foreground">{order.is_lab ? "Ordering provider" : "Doctor"}</div>
                <div className="font-semibold text-foreground text-right truncate pl-2">{order.doctor_name || "—"}</div>

                <div className="text-muted-foreground">Lab</div>
                <div className="font-semibold text-foreground text-right truncate pl-2">{orderLabProvider}</div>

                <div className="text-muted-foreground">Amount</div>
                <div className="font-semibold text-foreground text-right pl-2">
                  ${orderAmount.toFixed(2)}
                </div>

                {!order.is_lab && (
                  <>
                    <div className="text-muted-foreground">Amount source</div>
                    <div className="text-right pl-2">
                      <span
                        className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap"
                        style={{ backgroundColor: "#f1f5f9", color: "#475569", borderColor: "#e2e8f0" }}
                      >
                        {order.visit === "Declined" || order.visit_status === "Declined" 
                          ? "Declined" 
                          : (order.visit === "Prescribed" || order.visit_status === "Prescribed" || order.status === "Completed")
                            ? "Prescribed (final)"
                            : "Requested"}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-2.5 pt-4 border-t">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Timeline</div>
              <div className="space-y-3 text-xs">
                {order.is_lab ? (
                  (labResults?.lifecycle_events || order.lifecycle_events || []).length ? (
                    ((labResults?.lifecycle_events || order.lifecycle_events || []) as LabLifecycleEvent[]).map((event) => (
                      <div key={event.id || `${event.event_type}-${event.occurred_at}`} className="flex items-start justify-between gap-4">
                        <div><div className="font-semibold text-foreground">{event.title || event.status || "Lab update"}</div><div className="text-muted-foreground">{event.description || ""}</div></div>
                        <div className="shrink-0 text-right text-muted-foreground">{event.occurred_at ? new Date(event.occurred_at).toLocaleString() : "—"}</div>
                      </div>
                    ))
                  ) : <div className="text-muted-foreground">No provider lifecycle events received yet.</div>
                ) : (
                  <>
                    <div className="grid grid-cols-2"><div className="text-muted-foreground">Ordered</div>
                    <div className="font-semibold text-foreground text-right">{order.timeline?.ordered || order.date || "—"}</div>

                    <div className="text-muted-foreground">Sample collected</div>
                    <div className="font-semibold text-foreground text-right">{order.timeline?.sample_collected || "—"}</div>

                    <div className="text-muted-foreground">Results</div>
                    <div className="font-semibold text-foreground text-right">{order.timeline?.results || "—"}</div></div>
                  </>
                )}
              </div>
            </div>

            {order.is_lab && (
              <div className="pt-2 flex flex-col gap-2">
                {labResultsAvailable && (
                  <>
                    {hasStructuredResults && <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-center text-xs h-9 font-semibold border border-input bg-background hover:bg-muted text-foreground flex items-center gap-1.5"
                      onClick={() => setResultsOpen(true)}
                    >
                      <FileText className="h-4 w-4" />
                      View lab results
                    </Button>}
                    {labResults?.artifacts?.result_pdf_available && <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-center text-xs h-9 font-semibold border border-input bg-background hover:bg-muted text-foreground flex items-center gap-1.5"
                      onClick={async () => {
                        try {
                          const blob = await labsApi.downloadAdminLabResultPdf(order.id, order.client_id);
                          downloadBlob(blob, `results_${order.display_id || order.id}.pdf`);
                        } catch (e) {
                          console.error(e);
                        }
                      }}
                    >
                      <Download className="h-4 w-4" />
                      Download report (PDF)
                    </Button>}
                  </>
                )}
                {labResults?.artifacts?.requisition_available && <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-center text-xs h-9 font-semibold border border-input bg-background hover:bg-muted text-foreground flex items-center gap-1.5"
                  onClick={async () => {
                    try {
                      const blob = await labsApi.downloadAdminLabRequisitionPdf(order.id, order.client_id);
                      downloadBlob(blob, `requisition_${order.display_id || order.id}.pdf`);
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                >
                  <Download className="h-4 w-4" />
                  Download requisition form
                </Button>}
              </div>
            )}

            <div className="space-y-3 pt-4 border-t">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Update Order</div>
              <div className="space-y-1.5">
                <label htmlFor="drawer-order-status" className="text-xs font-semibold text-foreground block">
                  Status
                </label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger id="drawer-order-status" className="h-9 text-xs">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="In Process">In Process</SelectItem>
                    <SelectItem value="Canceled">Canceled</SelectItem>
                    <SelectItem value="Pending Payment">Pending Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 pt-1">
                <label htmlFor="drawer-tracking-number" className="text-xs font-semibold text-foreground block">
                  Tracking Number
                </label>
                <Input
                  id="drawer-tracking-number"
                  placeholder="Enter tracking number"
                  value={trackingNumber}
                  onChange={e => setTrackingNumber(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>
          </div>

          <SheetFooter className="border-t pt-4 flex flex-col-reverse sm:flex-row gap-2 justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="text-xs h-9 bg-slate-50 hover:bg-slate-100 text-slate-700 border-none w-full sm:w-auto"
            >
              Close
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-9 px-4 font-semibold w-full sm:w-auto"
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={resultsOpen} onOpenChange={setResultsOpen}>
        <DialogContent className="w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-lg sm:text-xl font-bold">
              <span>Lab Results</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      const base64 = await labsApi.getJunctionLabOrderResultsPdf(order.id);
                      const linkSource = `data:application/pdf;base64,${base64}`;
                      const downloadLink = document.createElement("a");
                      downloadLink.href = linkSource;
                      downloadLink.download = `results_${order.display_id || order.id}.pdf`;
                      downloadLink.click();
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  className="h-8 text-xs font-semibold"
                >
                  <FileText className="h-3 w-3 mr-1" /> Get Results PDF
                </Button>
              </div>
            </DialogTitle>
            <DialogDescription className="text-xs font-mono text-muted-foreground mt-1">
              From Junction API &bull; Order reference: {labResults?.order?.display_id || order.display_id || order.id}
            </DialogDescription>
          </DialogHeader>

          {loadingResults ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Loading biomarker results from Junction...
            </div>
          ) : labResults ? (
            <div className="space-y-6 pt-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-muted/40 p-4 rounded-lg text-xs sm:text-sm border">
                <div>
                  <span className="text-[10px] sm:text-xs text-muted-foreground block">Patient Name</span>
                  <span className="font-semibold text-foreground truncate block">{order.patient_name || order.patient}</span>
                </div>
                <div>
                  <span className="text-[10px] sm:text-xs text-muted-foreground block">Lab Provider</span>
                  <span className="font-semibold text-foreground truncate block">{orderLabProvider}</span>
                </div>
                <div>
                  <span className="text-[10px] sm:text-xs text-muted-foreground block">Collection Date</span>
                  <span className="font-semibold text-foreground block">{order.timeline?.sample_collected || "—"}</span>
                </div>
                <div>
                  <span className="text-[10px] sm:text-xs text-muted-foreground block">Panel Name</span>
                  <span className="font-semibold text-foreground truncate block">{orderProduct}</span>
                </div>
                <div>
                  <span className="text-[10px] sm:text-xs text-muted-foreground block">Order reference</span>
                  <span className="font-semibold text-foreground font-mono truncate block">{labResults?.order?.display_id || order.display_id || order.id}</span>
                </div>
                <div>
                  <span className="text-[10px] sm:text-xs text-muted-foreground block">Reporting Date</span>
                  <span className="font-semibold text-foreground block">{order.timeline?.results || "—"}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-md">
                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none font-semibold w-fit">
                  Results Ready
                </Badge>
                <span className="text-xs font-medium">All {extractLabResultRows(labResults).length} biomarkers successfully reported by lab.</span>
              </div>

              <div className="border rounded-md overflow-hidden bg-card">
                <div className="overflow-x-auto w-full">
                  <Table className="min-w-[500px]">
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="font-bold text-foreground">BIOMARKER</TableHead>
                        <TableHead className="font-bold text-foreground">RESULT</TableHead>
                        <TableHead className="font-bold text-foreground">UNITS</TableHead>
                        <TableHead className="font-bold text-foreground">REFERENCE RANGE</TableHead>
                        <TableHead className="font-bold text-foreground text-right">FLAG</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {extractLabResultRows(labResults).map((bm: any) => {
                        const flagLower = (bm.flag || "").toLowerCase();
                        const isHigh = flagLower.includes("high");
                        const isLow = flagLower.includes("low");
                        const isCritical = flagLower.includes("critical");
                        const isAbnormal = flagLower.includes("abnormal");
                        
                        let badgeColor = "bg-slate-100 text-slate-700 hover:bg-slate-100";
                        if (isCritical) badgeColor = "bg-red-100 text-red-800 hover:bg-red-100 border border-red-300 font-bold";
                        else if (isHigh || isAbnormal) badgeColor = "bg-rose-100 text-rose-800 hover:bg-rose-100";
                        else if (isLow) badgeColor = "bg-sky-100 text-sky-800 hover:bg-sky-100";

                        return (
                          <TableRow key={bm.id}>
                            <TableCell className="font-medium text-foreground">{bm.name}</TableCell>
                            <TableCell className="font-semibold">{bm.result}</TableCell>
                            <TableCell className="text-muted-foreground text-xs">{bm.units}</TableCell>
                            <TableCell className="text-muted-foreground text-xs">{bm.reference_range}</TableCell>
                            <TableCell className="text-right">
                              <Badge className={`border-none font-semibold ${badgeColor}`}>
                                {bm.flag}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <DialogFooter className="border-t pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-[10px] sm:text-xs text-muted-foreground text-center sm:text-left">
                  Electronic Signature: Mitchell Stotland MD (Quest Reviewing Physician)
                </div>
                <div className="flex gap-2 w-full sm:w-auto justify-end">
                  <Button variant="outline" onClick={() => setResultsOpen(false)} className="text-xs h-8">
                    Close
                  </Button>
                  {labResults?.artifacts?.result_pdf_available && <Button
                    onClick={async () => {
                      try {
                        const blob = await labsApi.downloadAdminLabResultPdf(order.id, order.client_id);
                        downloadBlob(blob, `results_${order.display_id || order.id}.pdf`);
                      } catch (e) {
                        console.error(e);
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs h-8"
                  >
                    <Download className="h-4 w-4 mr-2" /> Download report (PDF)
                  </Button>}
                </div>
              </DialogFooter>
            </div>
          ) : (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Failed to load lab results.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
