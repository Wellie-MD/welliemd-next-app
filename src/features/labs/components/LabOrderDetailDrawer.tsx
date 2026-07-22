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
  const [expandedTimeline, setExpandedTimeline] = useState(false);

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
        <SheetContent className="w-full sm:max-w-[500px] p-0 flex flex-col h-screen">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            <SheetHeader className="pb-2 border-b">
              <SheetTitle className="flex items-center gap-2 text-base font-bold">
                <Hexagon className="h-4 w-4 text-foreground" />
                {labResults?.order?.display_id || order.display_id || order.id}
              </SheetTitle>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <OrderPill status={order.status_display || order.status} />
                <OrderPill status={order.payment_status || order.payment} />
                <span
                  className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border"
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

            <div className="space-y-1.5">
              <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Patient</div>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2 text-foreground font-semibold">
                  <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate">{order.patient_name || order.patient}</span>
                </div>
                <div className="flex items-center gap-2 text-foreground font-semibold">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate text-[11px]">{order.patient_email || order.email}</span>
                </div>
                <div className="flex items-center gap-2 text-foreground font-semibold">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate">{order.patient_phone || order.phone || "—"}</span>
                </div>
              </div>
            </div>

            <div className="space-y-1 pt-2 border-t">
              <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Details</div>
              <div className="grid grid-cols-2 gap-y-1 text-[11px]">
                <div className="text-muted-foreground">Client</div>
                <div className="font-semibold text-foreground text-right truncate pl-2 text-xs">{order.client_name || order.client}</div>

                <div className="text-muted-foreground">Product</div>
                <div className="font-semibold text-foreground text-right truncate pl-2 text-xs">{orderProduct}</div>

                <div className="text-muted-foreground">Lab / Provider</div>
                <div className="font-semibold text-foreground text-right truncate pl-2 text-xs">{orderLabProvider}</div>

                <div className="text-muted-foreground">Amount</div>
                <div className="font-semibold text-foreground text-right pl-2 text-xs">
                  ${orderAmount.toFixed(2)}
                </div>
              </div>
            </div>

            {expandedTimeline && (
              <div className="space-y-2 pt-2 border-t">
                <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Timeline</div>
                <div className="space-y-2 text-xs max-h-32 overflow-y-auto">
                  {order.is_lab ? (
                    (labResults?.lifecycle_events || order.lifecycle_events || []).length ? (
                      ((labResults?.lifecycle_events || order.lifecycle_events || []) as LabLifecycleEvent[]).slice(0, 5).map((event) => (
                        <div key={event.id || `${event.event_type}-${event.occurred_at}`} className="flex items-start justify-between gap-2 text-[11px]">
                          <div><div className="font-semibold text-foreground">{event.title || event.status || "Lab update"}</div></div>
                          <div className="shrink-0 text-right text-muted-foreground whitespace-nowrap">{event.occurred_at ? new Date(event.occurred_at).toLocaleDateString() : "—"}</div>
                        </div>
                      ))
                    ) : <div className="text-muted-foreground text-[11px]">No events yet.</div>
                  ) : (
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]"><div className="text-muted-foreground">Ordered</div>
                    <div className="font-semibold text-foreground text-right">{order.timeline?.ordered || order.date || "—"}</div>
                    <div className="text-muted-foreground">Collected</div>
                    <div className="font-semibold text-foreground text-right">{order.timeline?.sample_collected || "—"}</div>
                    <div className="text-muted-foreground">Results</div>
                    <div className="font-semibold text-foreground text-right">{order.timeline?.results || "—"}</div></div>
                  )}
                </div>
              </div>
            )}
            {!expandedTimeline && (
              <button
                onClick={() => setExpandedTimeline(true)}
                className="text-xs text-blue-600 hover:underline py-1"
              >
                + View timeline
              </button>
            )}

            {order.is_lab && (
              <div className="pt-1 flex flex-col gap-1.5">
                {labResultsAvailable && (
                  <>
                    {hasStructuredResults && <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-center text-xs h-8 font-semibold border border-input bg-background hover:bg-muted text-foreground flex items-center gap-1"
                      onClick={() => setResultsOpen(true)}
                    >
                      <FileText className="h-3.5 w-3.5" />
                      View results
                    </Button>}
                    {labResults?.artifacts?.result_pdf_available && <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-center text-xs h-8 font-semibold border border-input bg-background hover:bg-muted text-foreground flex items-center gap-1"
                      onClick={async () => {
                        try {
                          const blob = await labsApi.downloadAdminLabResultPdf(order.id, order.client_id);
                          downloadBlob(blob, `results_${order.display_id || order.id}.pdf`);
                        } catch (e) {
                          console.error(e);
                        }
                      }}
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download report
                    </Button>}
                  </>
                )}
                {labResults?.artifacts?.requisition_available && <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-center text-xs h-8 font-semibold border border-input bg-background hover:bg-muted text-foreground flex items-center gap-1"
                  onClick={async () => {
                    try {
                      const blob = await labsApi.downloadAdminLabRequisitionPdf(order.id, order.client_id);
                      downloadBlob(blob, `requisition_${order.display_id || order.id}.pdf`);
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                >
                  <Download className="h-3.5 w-3.5" />
                  Download requisition
                </Button>}
              </div>
            )}

            <div className="space-y-2 pt-2 border-t">
              <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Update</div>
              <div className="space-y-1">
                <label htmlFor="drawer-order-status" className="text-[11px] font-semibold text-foreground block">
                  Status
                </label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger id="drawer-order-status" className="h-8 text-xs">
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

              <div className="space-y-1">
                <label htmlFor="drawer-tracking-number" className="text-[11px] font-semibold text-foreground block">
                  Tracking
                </label>
                <Input
                  id="drawer-tracking-number"
                  placeholder="Tracking #"
                  value={trackingNumber}
                  onChange={e => setTrackingNumber(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>

          <SheetFooter className="border-t p-3 sm:p-4 flex flex-col-reverse sm:flex-row gap-2 justify-end shrink-0">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="text-xs h-8 bg-slate-50 hover:bg-slate-100 text-slate-700 border-none w-full sm:w-auto"
            >
              Close
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 px-3 font-semibold w-full sm:w-auto"
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={resultsOpen} onOpenChange={setResultsOpen}>
        <DialogContent className="w-[95vw] sm:max-w-4xl h-[90vh] p-0 flex flex-col">
          <DialogHeader className="border-b p-4 sm:p-6 pb-3 sm:pb-4 shrink-0">
            <DialogTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-lg sm:text-xl font-bold">
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
                  <FileText className="h-3 w-3 mr-1" /> PDF
                </Button>
              </div>
            </DialogTitle>
            <DialogDescription className="text-xs font-mono text-muted-foreground mt-1">
              {labResults?.order?.display_id || order.display_id || order.id}
            </DialogDescription>
          </DialogHeader>

          {loadingResults ? (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
              Loading results...
            </div>
          ) : labResults ? (
            <>
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-muted/40 p-3 rounded-lg text-xs border">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Patient</span>
                    <span className="font-semibold text-foreground truncate block text-sm">{order.patient_name || order.patient}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Lab</span>
                    <span className="font-semibold text-foreground truncate block text-sm">{orderLabProvider}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Collected</span>
                    <span className="font-semibold text-foreground block text-sm">{order.timeline?.sample_collected || "—"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Panel</span>
                    <span className="font-semibold text-foreground truncate block text-sm">{orderProduct}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Reference</span>
                    <span className="font-semibold text-foreground font-mono truncate block text-sm">{labResults?.order?.display_id || order.display_id || order.id}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Reported</span>
                    <span className="font-semibold text-foreground block text-sm">{order.timeline?.results || "—"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 p-2.5 rounded-md text-xs">
                  <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none font-semibold shrink-0">
                    Ready
                  </Badge>
                  <span className="font-medium">{extractLabResultRows(labResults).length} biomarkers reported</span>
                </div>

                <div className="border rounded-md overflow-hidden bg-card">
                  <div className="overflow-x-auto">
                    <Table className="min-w-[450px] text-xs">
                      <TableHeader className="bg-muted/50 h-8">
                        <TableRow>
                          <TableHead className="font-bold text-foreground text-xs">Biomarker</TableHead>
                          <TableHead className="font-bold text-foreground text-xs">Result</TableHead>
                          <TableHead className="font-bold text-foreground text-xs">Units</TableHead>
                          <TableHead className="font-bold text-foreground text-xs">Range</TableHead>
                          <TableHead className="font-bold text-foreground text-xs text-right">Flag</TableHead>
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
                            <TableRow key={bm.id} className="h-7">
                              <TableCell className="font-medium text-foreground text-xs">{bm.name}</TableCell>
                              <TableCell className="font-semibold text-xs">{bm.result}</TableCell>
                              <TableCell className="text-muted-foreground text-xs">{bm.units}</TableCell>
                              <TableCell className="text-muted-foreground text-xs">{bm.reference_range}</TableCell>
                              <TableCell className="text-right">
                                <Badge className={`border-none font-semibold text-xs ${badgeColor}`}>
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
              </div>

              <DialogFooter className="border-t p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 bg-background">
                <div className="text-[10px] sm:text-xs text-muted-foreground text-center sm:text-left">
                  Signature: Mitchell Stotland MD
                </div>
                <div className="flex gap-2">
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
                    <Download className="h-3.5 w-3.5 mr-1" /> Download
                  </Button>}
                </div>
              </DialogFooter>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
              Failed to load results
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
