import { useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { clientApi } from "@/api/clientApi";
import type { B2BInvoice, B2BInvoicePrescriptionEvent, B2BInvoicePrescriptionItem } from "@/types/b2bBilling";
import { GitBranch, Search, ChevronRight, X } from "lucide-react";
import { toast } from "sonner";
import { TreatmentPrescriptionInvoiceSets } from "@/features/treatments/orders/components/TreatmentPrescriptionInvoiceSets";

type DisplayInvoice = B2BInvoice & {
  supplementalInvoices?: B2BInvoice[];
};

export default function Billing() {
  const queryClient = useQueryClient();
  const [invoiceType, setInvoiceType] = useState<
    "all" | "reimbursement" | "credit_note" | "saas_fee"
  >("all");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selected, setSelected] = useState<B2BInvoice | null>(null);
  const [status, setStatus] = useState("");
  const [ordering, setOrdering] = useState("-issued_at");
  const [page, setPage] = useState(1);
  const [refundTargets, setRefundTargets] = useState<B2BInvoice[]>([]);

  const queryParams = useMemo(() => {
    const params: Record<string, unknown> = { ordering, page, page_size: 25 };
    if (invoiceType !== "all") params.invoice_type = invoiceType;
    if (search.trim()) params.search = search.trim();
    if (fromDate) params.issued_at_after = fromDate;
    if (toDate) params.issued_at_before = toDate;
    if (status) params.status = status;
    return params;
  }, [invoiceType, search, fromDate, toDate, status, ordering, page]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["b2bAllInvoices", queryParams],
    queryFn: () => clientApi.getAllB2BInvoices(queryParams),
  });

  const invoices: B2BInvoice[] = data?.results || [];
  const selectedClientId = (selected as any)?.client?.id || (selected as any)?.client_id || (selected as any)?.client;

  const markRefundMutation = useMutation({
    mutationFn: async (invoiceOrInvoices: B2BInvoice | B2BInvoice[]) => {
      const targets = Array.isArray(invoiceOrInvoices) ? invoiceOrInvoices : [invoiceOrInvoices];
      const results = [];
      for (const invoice of targets) {
        const clientId = (invoice as any)?.client?.id || (invoice as any)?.client_id || (invoice as any)?.client;
        results.push(await clientApi.markB2BRefundProcessed(clientId, invoice.id));
      }
      return results;
    },
    onSuccess: (results: any[]) => {
      const pending = results.find((result) => result?.pending);
      if (pending) {
        toast.info(pending?.message || "Stripe refund is pending");
        queryClient.invalidateQueries({ queryKey: ["b2bAllInvoices"] });
        setRefundTargets([]);
        return;
      }
      toast.success("Stripe refund completed");
      queryClient.invalidateQueries({ queryKey: ["b2bAllInvoices"] });
      if (selectedClientId) {
        queryClient.invalidateQueries({ queryKey: ["b2bInvoices", selectedClientId] });
      }
      setRefundTargets([]);
      setSelected(null);
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.error ||
        err?.response?.data?.detail ||
        err?.message ||
        "Failed to process Stripe refund"
      );
    },
  });

  const formatLabel = (value?: string | null) =>
    (value || "-")
      .toString()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (m) => m.toUpperCase());

  const statusPillClass = (value: string) => {
    const normalized = value.toLowerCase();
    if (normalized === "paid") {
      return "bg-green-100 text-green-700";
    }
    if (normalized === "failed" || normalized === "overdue") {
      return "bg-red-100 text-red-700";
    }
    if (normalized === "authorization_failed" || normalized === "pending" || normalized === "due") {
      return "bg-amber-100 text-amber-700";
    }
    return "bg-primary/10 text-primary";
  };

  const getClientOrderNumber = (inv?: B2BInvoice | null) =>
    (inv as any)?.client_order_number ||
    (inv as any)?.source_tenant_order_display_id ||
    "-";

  const lineItemTypeLabel = (li: any) => {
    if (li?.item_type === "consultation") {
      const mode = String(li?.metadata?.consult_mode || "").toLowerCase();
      if (mode === "sync") return "Sync Consult";
      if (mode === "async") return "Async Consult";
    }
    return formatLabel(li?.item_type);
  };

  const formatBreakdown = (inv: B2BInvoice) => {
    const items = (inv as any).line_items ?? [];
    const pharmacy = items
      .filter((li: any) => ["medication_reimbursement", "shipping_cost"].includes(li.item_type))
      .reduce(
        (sum: number, li: any) =>
          sum + parseFloat(li.total_amount || li.unit_price || 0),
        0
      );
    const consult = items
      .filter((li: any) => li.item_type === "consultation")
      .reduce(
        (sum: number, li: any) =>
          sum + parseFloat(li.total_amount || li.unit_price || 0),
        0
      );
    if (!pharmacy && !consult) return "-";
    return `Pharmacy: $${pharmacy.toFixed(2)} · Consult: $${consult.toFixed(2)}`;
  };
  const groupedInvoices = useMemo(() => {
    const displayRows: DisplayInvoice[] = [];
    const supplementalByParent = new Map<string, B2BInvoice[]>();

    invoices.forEach((inv) => {
      if (!inv.is_supplemental_split_capture || !inv.supplemental_parent_invoice_id) return;
      const bucket = supplementalByParent.get(inv.supplemental_parent_invoice_id) || [];
      bucket.push(inv);
      supplementalByParent.set(inv.supplemental_parent_invoice_id, bucket);
    });

    invoices.forEach((inv) => {
      if (inv.is_supplemental_split_capture) {
        return;
      }
      const linkedSupplementals =
        inv.invoice_type === "reimbursement" ? supplementalByParent.get(inv.id) || [] : [];
      displayRows.push({
        ...inv,
        supplementalInvoices: linkedSupplementals,
      });
    });

    if (ordering !== "-issued_at" && ordering !== "issued_at") return displayRows;

    const direction = ordering === "-issued_at" ? -1 : 1;
    const toTime = (value?: string) => (value ? new Date(value).getTime() : null);

    return [...displayRows].sort((a, b) => {
      const aIssued = toTime(a.issued_at);
      const bIssued = toTime(b.issued_at);

      // Keep null issued_at rows at the bottom for both newest and oldest sorts.
      if (aIssued === null && bIssued !== null) return 1;
      if (aIssued !== null && bIssued === null) return -1;

      if (aIssued !== null && bIssued !== null && aIssued !== bIssued) {
        return (aIssued - bIssued) * direction;
      }

      const aCreated = toTime(a.created_at) ?? 0;
      const bCreated = toTime(b.created_at) ?? 0;
      return (aCreated - bCreated) * direction;
    });
  }, [invoices, ordering]);

  const getDisplayDate = (inv: B2BInvoice) => inv.issued_at || inv.created_at;
  const money = (value: string | number | null | undefined) => {
    const amount = Number(value || 0);
    return `$${Number.isFinite(amount) ? amount.toFixed(2) : "0.00"}`;
  };
  const moneyNumber = (value: string | number | null | undefined) => {
    const amount = Number(value ?? 0);
    return Number.isFinite(amount) ? amount : 0;
  };
  const isReimbursementInvoice = (invoice: B2BInvoice | null) =>
    Boolean(invoice && invoice.invoice_type === "reimbursement");


  const sharedColgroup = (
    <colgroup>
      <col />
      <col className="w-12" />
      <col className="w-24" />
      <col className="w-24" />
    </colgroup>
  );

  const sharedThead = (
    <thead className="text-muted-foreground">
      <tr>
        <th className="pb-2 text-left text-[10px] font-medium uppercase tracking-wider">Type / Item</th>
        <th className="pb-2 text-center text-[10px] font-medium uppercase tracking-wider">Qty</th>
        <th className="pb-2 text-right text-[10px] font-medium uppercase tracking-wider">Unit</th>
        <th className="pb-2 text-right text-[10px] font-medium uppercase tracking-wider">Total</th>
      </tr>
    </thead>
  );

  const renderCostTable = (
    medication?: string,
    shipping?: string,
    total?: string,
    showHeaders: boolean = false
  ) => (
    <table className="mt-2 w-full table-fixed text-xs">
      {sharedColgroup}
      {showHeaders && sharedThead}
      <tbody>
        {[
          ["Medication", medication],
          ["Shipping", shipping],
        ].map(([label, amount]) => (
          <tr key={label}>
            <td className="py-1.5">{label}</td>
            <td className="py-1.5 text-center text-muted-foreground">1</td>
            <td className="py-1.5 text-right text-muted-foreground">{money(amount)}</td>
            <td className="py-1.5 text-right font-semibold">{money(amount)}</td>
          </tr>
        ))}
        <tr className="border-t">
          <td className="pt-2 font-bold" colSpan={3}>Total</td>
          <td className="pt-2 text-right font-bold">{money(total)}</td>
        </tr>
      </tbody>
    </table>
  );

  const infoRow = (label: string, value: ReactNode) => (
    <div className="flex justify-between gap-4 border-b py-2.5 text-xs last:border-b-0">
      <span className="font-medium text-muted-foreground">{label}</span>
      <span className="text-right font-semibold">{value}</span>
    </div>
  );

  const adjustmentPill = (
    kind: B2BInvoice["revision_adjustments"] extends Array<infer T> ? T["kind"] : never,
    status: string
  ) => {
    const normalized = status.toLowerCase();
    const label =
      kind === "no_charge_revision"
        ? "No charge"
        : kind === "supplemental_charge"
          ? normalized === "paid" ? "Charged" : formatLabel(status)
          : normalized === "refunded"
            ? "Refunded"
            : ["pending", "due", "draft"].includes(normalized)
              ? "Pending"
              : formatLabel(status);
    const classes =
      label === "No charge"
        ? "border-slate-200 bg-slate-50 text-slate-600"
        : label === "Charged"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : label === "Refunded"
            ? "border-slate-200 bg-slate-100 text-slate-600"
            : label === "Failed" || label === "Canceled"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-amber-200 bg-amber-50 text-amber-700";
    return <span className={`rounded-full border px-2 py-0.5 text-[10px] ${classes}`}>{label}</span>;
  };

  const renderRevisionInvoiceModal = (invoice: B2BInvoice) => {
    const requested = invoice.requested_breakdown;
    const treatmentPrescription = invoice.treatment_prescription;
    const adjustments = invoice.revision_adjustments || [];
    const prescriptionEvents = invoice.prescription_events || [];
    const summary = invoice.adjustment_summary;
    const netAdjustment = Number(summary?.net_adjustment || 0);
    const requestedProductName = requested?.product_name || "";
    const requestedProductTotal = requested?.product_total || 0;
    const summaryInvoiceTotal = moneyNumber(summary?.invoice_total || invoice.total_amount);
    const adjustedInvoiceTotal = moneyNumber(summary?.adjusted_total || invoice.total_amount);
    const intendedAuthorizationAmount = moneyNumber(invoice.intended_authorization_amount);
    const originalRequestedProductTotal = moneyNumber(requested?.original_requested_product_total);
    const currentRequestedProductTotal = moneyNumber(requested?.product_total);
    const consultationAmount = moneyNumber(requested?.consultation_amount);
    const requestedAuthorizedTotal =
      originalRequestedProductTotal > 0 ? originalRequestedProductTotal + consultationAmount : 0;
    const baseInvoiceTotal = requestedAuthorizedTotal > 0
      ? requestedAuthorizedTotal
      : intendedAuthorizationAmount > summaryInvoiceTotal && intendedAuthorizationAmount > adjustedInvoiceTotal
        ? intendedAuthorizationAmount
        : currentRequestedProductTotal > 0
          ? currentRequestedProductTotal + consultationAmount
          : summaryInvoiceTotal;
    const capturedInvoiceTotal = moneyNumber(summary?.captured_amount || invoice.total_amount);
    const holdReleasedAmount = Math.max(0, baseInvoiceTotal - capturedInvoiceTotal);
    const hasReleasedHold = Number.isFinite(holdReleasedAmount) && holdReleasedAmount > 0.005;
    const captureStatusLabel = hasReleasedHold && invoice.status === "paid"
      ? "Partially Captured"
      : formatLabel(invoice.status);
    const requestedLabel = requested?.prescribed_differs
      ? (requested?.original_requested_product_name || "Original request")
      : (requested?.product_name || "Original prescription");
    const requestedMedicationAmount = requested?.prescribed_differs
      ? requested?.original_requested_medication_amount
      : requested?.medication_amount;
    const requestedShippingAmount = requested?.prescribed_differs
      ? requested?.original_requested_shipping_amount
      : requested?.shipping_amount;
    const requestedTotalAmount = requested?.prescribed_differs
      ? requested?.original_requested_product_total
      : requested?.product_total;
    const splitCaptureAdjustmentMirrorsBase = Boolean(
      requested?.prescribed_differs &&
      adjustments.some((adjustment) => {
        const revisionNumber = Number(adjustment.revision_number ?? -1);
        const sameProduct = (adjustment.product_name || "").trim().toLowerCase() ===
          requestedProductName.trim().toLowerCase();
        const sameTotal = Math.abs(
          Number(adjustment.product_total || 0) - Number(requestedProductTotal || 0)
        ) < 0.005;
        return adjustment.kind === "supplemental_charge" && revisionNumber === 0 && sameProduct && sameTotal;
      })
    );
    const showImplicitBaseRevision = Boolean(
      requested?.prescribed_differs && adjustments.length === 0 && !splitCaptureAdjustmentMirrorsBase
    );
    type RevisionAdjustment = NonNullable<B2BInvoice["revision_adjustments"]>[number];
    const normalizeProductName = (value?: string) => (value || "").trim().toLowerCase();
    const adjustmentForRevision = (revisionNumber: number) =>
      adjustments.find((adjustment) => Number(adjustment.revision_number ?? -1) === revisionNumber);
    const adjustmentForPrescriptionEvent = (
      event: B2BInvoicePrescriptionEvent,
      index: number,
      usedAdjustmentIds: Set<string>
    ): RevisionAdjustment | undefined => {
      const eventName = normalizeProductName(event.name);
      const eventRevisionNumber = Number(event.revision_number);
      const expectedRevisionNumber = index === 0
        ? 0
        : Number.isFinite(eventRevisionNumber) && eventRevisionNumber > 0
          ? eventRevisionNumber
          : index;
      const isUnused = (adjustment: RevisionAdjustment) => !usedAdjustmentIds.has(adjustment.id);
      const isSameProduct = (adjustment: RevisionAdjustment) =>
        Boolean(eventName && normalizeProductName(adjustment.product_name) === eventName);

      if (index > 0) {
        const byRevision = adjustments.find(
          (adjustment) =>
            isUnused(adjustment) &&
            Number(adjustment.revision_number ?? -1) === expectedRevisionNumber &&
            (!eventName || isSameProduct(adjustment))
        );
        if (byRevision) return byRevision;
      }

      return adjustments.find((adjustment) => isUnused(adjustment) && isSameProduct(adjustment));
    };
    const prescriptionEventAdjustmentMap = new Map<number, RevisionAdjustment>();
    const prescriptionEventAdjustmentIds = new Set<string>();
    prescriptionEvents.forEach((event, index) => {
      const adjustment = adjustmentForPrescriptionEvent(event, index, prescriptionEventAdjustmentIds);
      if (adjustment) {
        prescriptionEventAdjustmentMap.set(index, adjustment);
        prescriptionEventAdjustmentIds.add(adjustment.id);
      }
    });
    const prescriptionEventNames = new Set(
      prescriptionEvents
        .map((event) => normalizeProductName(event.name))
        .filter(Boolean)
    );
    const prescriptionRevisionNumbers = new Set(
      prescriptionEvents
        .filter((event, index) => index > 0 || event.event_kind === "revision")
        .map((event, index) => {
          const revisionNumber = Number(event.revision_number);
          return Number.isFinite(revisionNumber) && revisionNumber > 0 ? revisionNumber : index + 1;
        })
    );
    const fallbackAdjustments = prescriptionEvents.length > 0
      ? adjustments.filter((adjustment) => {
          if (prescriptionEventAdjustmentIds.has(adjustment.id)) return false;
          if (prescriptionEventNames.has(normalizeProductName(adjustment.product_name))) return false;
          if (adjustment.kind !== "no_charge_revision") return true;
          const revisionNumber = Number(adjustment.revision_number);
          return Number.isFinite(revisionNumber) && prescriptionRevisionNumbers.has(revisionNumber);
        })
      : adjustments;
    const firstFallbackIsInitialPrescription = Boolean(
      prescriptionEvents.length === 0 &&
      fallbackAdjustments.length > 0 &&
      fallbackAdjustments[0]?.kind === "no_charge_revision" &&
      Math.abs(Number(fallbackAdjustments[0]?.adjustment_amount || 0)) < 0.005 &&
      (
        !requestedProductName ||
        !fallbackAdjustments[0]?.product_name ||
        fallbackAdjustments[0].product_name.trim().toLowerCase() === requestedProductName.trim().toLowerCase()
      )
    );
    const pendingCredits = adjustments.filter(
      (adjustment) =>
        adjustment.kind === "credit_note" &&
        !["refunded", "canceled", "failed"].includes(adjustment.status.toLowerCase())
    );
    const pendingCreditTotal = pendingCredits.reduce(
      (sum, adjustment) => sum + Number(adjustment.adjustment_amount || 0),
      0
    );

    const renderCostTable = (
      medication?: string,
      shipping?: string,
      total?: string,
      showHeaders: boolean = false,
      medicationLabel: string = "Medication",
      totalLabel: string = "Total",
      adjustment?: B2BInvoice["revision_adjustments"] extends Array<infer T> ? T : never
    ) => {
      const rows = [
        [medicationLabel || "Medication", medication],
        ["Shipping", shipping],
      ].filter(([, amount]) => amount && amount !== "0.00" && amount !== "0");
      const isCredit = adjustment?.kind === "credit_note";
      const isNoCharge = adjustment?.kind === "no_charge_revision";

      return (
        <table className="mt-2 w-full table-fixed text-xs">
          {sharedColgroup}
          {showHeaders && sharedThead}
          <tbody>
            {rows.map(([label, amount]) => (
              <tr key={label}>
                <td className="py-1.5">{label}</td>
                <td className="py-1.5 text-center text-muted-foreground">1</td>
                <td className="py-1.5 text-right text-muted-foreground">{money(amount)}</td>
                <td className="py-1.5 text-right font-semibold">{money(amount)}</td>
              </tr>
            ))}
            <tr className="border-t">
              <td className="pt-2 font-bold" colSpan={3}>{totalLabel}</td>
              <td className="pt-2 text-right font-bold">{money(total)}</td>
            </tr>
            {adjustment && !isNoCharge && (
              <tr>
                <td className={`py-1.5 font-semibold ${isCredit ? "text-emerald-600" : "text-red-600"}`}>
                  <span className="inline-flex items-center gap-2">
                    {isCredit ? "Credit note" : "Supplemental charge"}
                    {adjustmentPill(adjustment.kind, adjustment.status)}
                  </span>
                </td>
                <td />
                <td />
                <td className={`py-1.5 text-right font-bold ${isCredit ? "text-emerald-600" : "text-red-600"}`}>
                  {isCredit ? "−" : "+"}{money(adjustment.adjustment_amount)}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      );
    };

    const renderProductCostTable = (
      items: B2BInvoicePrescriptionItem[] | undefined,
      fallback: {
        medication?: string;
        shipping?: string;
        total?: string;
        medicationLabel?: string;
        totalLabel?: string;
        adjustment?: B2BInvoice["revision_adjustments"] extends Array<infer T> ? T : never;
      },
      showHeaders: boolean = false
    ) => {
      const productRows = (items || []).filter((item) => item?.name);
      if (productRows.length === 0) {
        return renderCostTable(
          fallback.medication,
          fallback.shipping,
          fallback.total,
          showHeaders,
          fallback.medicationLabel,
          fallback.totalLabel,
          fallback.adjustment
        );
      }
      const shippingTotal = productRows.reduce((sum, item) => sum + moneyNumber(item.shipping_amount), 0);
      const explicitTotal = Number(fallback.total);
      const computedTotal = Number.isFinite(explicitTotal)
        ? explicitTotal
        : productRows.reduce((sum, item) => sum + moneyNumber(item.medication_amount || item.product_total), 0) + shippingTotal;
      const adjustment = fallback.adjustment;
      const isCredit = adjustment?.kind === "credit_note";
      const isNoCharge = adjustment?.kind === "no_charge_revision";

      return (
        <table className="mt-2 w-full table-fixed text-xs">
          {sharedColgroup}
          {showHeaders && sharedThead}
          <tbody>
            {productRows.map((item, index) => {
              const amount = item.medication_amount || item.product_total || "0.00";
              return (
                <tr key={`${item.name}-${item.med_id || item.rx_id || index}`}>
                  <td className="py-1.5">{item.name}</td>
                  <td className="py-1.5 text-center text-muted-foreground">1</td>
                  <td className="py-1.5 text-right text-muted-foreground">{money(amount)}</td>
                  <td className="py-1.5 text-right font-semibold">{money(amount)}</td>
                </tr>
              );
            })}
            {shippingTotal > 0 && (
              <tr>
                <td className="py-1.5">Shipping</td>
                <td className="py-1.5 text-center text-muted-foreground">1</td>
                <td className="py-1.5 text-right text-muted-foreground">{money(shippingTotal)}</td>
                <td className="py-1.5 text-right font-semibold">{money(shippingTotal)}</td>
              </tr>
            )}
            <tr className="border-t">
              <td className="pt-2 font-bold" colSpan={3}>{fallback.totalLabel || "Total"}</td>
              <td className="pt-2 text-right font-bold">{money(computedTotal)}</td>
            </tr>
            {adjustment && !isNoCharge && (
              <tr>
                <td className={`py-1.5 font-semibold ${isCredit ? "text-emerald-600" : "text-red-600"}`}>
                  <span className="inline-flex items-center gap-2">
                    {isCredit ? "Credit note" : "Supplemental charge"}
                    {adjustmentPill(adjustment.kind, adjustment.status)}
                  </span>
                </td>
                <td />
                <td />
                <td className={`py-1.5 text-right font-bold ${isCredit ? "text-emerald-600" : "text-red-600"}`}>
                  {isCredit ? "−" : "+"}{money(adjustment.adjustment_amount)}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      );
    };

    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/50 p-4 sm:p-8">
        <div className="w-full max-w-5xl overflow-hidden rounded-xl border bg-white shadow-2xl">
          <header className="border-b px-5 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Reimbursement invoice
                </div>
                <div className="mt-1 font-mono text-xs text-muted-foreground">{invoice.invoice_number}</div>
                <div className="mt-3 flex items-center gap-3">
                  <span className="text-2xl font-bold">{money(baseInvoiceTotal)}</span>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusPillClass(invoice.status || "")}`}>
                    {captureStatusLabel}
                  </span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {(invoice as any).client_name || "-"} · {getClientOrderNumber(invoice)}
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-md border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted">
                Close
              </button>
            </div>
          </header>

          <div className="grid md:grid-cols-[320px_1fr]">
            <aside className="border-b md:border-b-0 md:border-r">
              <section className="border-b p-5">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Summary</h4>
                {infoRow("Client", (invoice as any).client_name || "-")}
                {infoRow("Client order #", <span className="font-mono">{getClientOrderNumber(invoice)}</span>)}
                {infoRow("Type", "Reimbursement")}
                {infoRow("Issued", invoice.issued_at ? new Date(invoice.issued_at).toLocaleDateString() : "-")}
              </section>
              <section className="border-b p-5">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Amounts</h4>
                {infoRow("Invoice total", money(baseInvoiceTotal))}
                {Number(summary?.supplemental_charges || 0) > 0 &&
                  infoRow("Supplemental charges", <span className="text-red-600">+{money(summary?.supplemental_charges)}</span>)}
                {Number(summary?.credit_notes || 0) > 0 &&
                  infoRow("Credit notes", <span className="text-emerald-600">−{money(summary?.credit_notes)}</span>)}
                {hasReleasedHold &&
                  infoRow("Authorization hold released", <span className="text-emerald-600">−{money(holdReleasedAmount)}</span>)}
                {infoRow("Adjusted total", <strong>{money(adjustedInvoiceTotal)}</strong>)}
              </section>
              <section className="p-5">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Payment diagnostics</h4>
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs font-medium text-sky-600">Show auth &amp; capture details</summary>
                  <div className="mt-2">
                    {infoRow("Billing period", "N/A to N/A")}
                    {infoRow("Intended auth amount", money(baseInvoiceTotal))}
                    {hasReleasedHold && infoRow("Captured amount", money(capturedInvoiceTotal))}
                    {hasReleasedHold && infoRow("Hold released", <span className="text-emerald-600">−{money(holdReleasedAmount)}</span>)}
                    {infoRow("Capture status", captureStatusLabel)}
                    {infoRow("Auth retry count", invoice.authorization_retry_count ?? 0)}
                    {infoRow("Next auth retry", invoice.authorization_next_retry_at ? new Date(invoice.authorization_next_retry_at).toLocaleString() : "—")}
                    {infoRow("Auth error code", invoice.authorization_last_error_code || "—")}
                    {infoRow("Auth error message", invoice.authorization_last_error_message || "—")}
                  </div>
                </details>
              </section>
            </aside>

            <main>
              {treatmentPrescription && (
                <div className="border-b p-5">
                  <TreatmentPrescriptionInvoiceSets contract={treatmentPrescription} />
                </div>
              )}
              {Number(requested?.consultation_amount || 0) > 0 && (
                <section className="border-b p-5">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Consultation</h4>
                  <table className="mt-2 w-full table-fixed text-xs">
                    {sharedColgroup}
                    {sharedThead}
                    <tbody>
                      <tr>
                        <td className="py-1.5">{requested?.consult_mode === "sync" ? "Sync Consult" : "Async Consult"}</td>
                        <td className="py-1.5 text-center text-muted-foreground">1</td>
                        <td className="py-1.5 text-right text-muted-foreground">{money(requested?.consultation_amount)}</td>
                        <td className="py-1.5 text-right font-semibold">{money(requested?.consultation_amount)}</td>
                      </tr>
                    </tbody>
                  </table>
                </section>
              )}
              {!treatmentPrescription && (
                <section className="border-b p-5">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Requested · {requestedLabel}
                  </h4>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Amount authorized at checkout — captured after prescription
                  </p>
                  {renderCostTable(
                    requestedMedicationAmount,
                    requestedShippingAmount,
                    requestedTotalAmount,
                    Number(requested?.consultation_amount || 0) === 0,
                    requestedLabel,
                    "Authorized total"
                  )}
                </section>
              )}
              {!treatmentPrescription && prescriptionEvents.map((event, index) => {
                const revisionNumber = index;
                const adjustment = prescriptionEventAdjustmentMap.get(index) || adjustmentForRevision(revisionNumber);
                const sectionLabel = index === 0 ? "Initial prescription" : `Revision ${revisionNumber}`;
                return (
                  <section key={event.webhook_event_id || `${sectionLabel}-${index}`} className="border-b p-5">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {sectionLabel} · {event.name || "Prescribed product"}
                    </h4>
                    <div className="mt-2">
                      {renderProductCostTable(event.items, {
                        medication: event.medication_amount,
                        shipping: event.shipping_amount,
                        total: event.product_total,
                        medicationLabel: event.name || "Prescribed product",
                        adjustment,
                      })}
                    </div>
                  </section>
                );
              })}
              {!treatmentPrescription && prescriptionEvents.length === 0 && showImplicitBaseRevision && (
                <section className="border-b p-5">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Initial prescription · {requested?.product_name || "Prescribed product"}
                </h4>
                  <div className="mt-2">
                    {renderCostTable(
                      requested?.medication_amount,
                      requested?.shipping_amount,
                      requested?.product_total,
                      false,
                      requested?.product_name || "Prescribed product"
                    )}
                  </div>
                </section>
              )}
              {!treatmentPrescription && fallbackAdjustments.map((adjustment, index) => {
                const isNoCharge = adjustment.kind === "no_charge_revision";
                const explicitRevisionNumber = Number(adjustment.revision_number);
                const isInitialFallback = firstFallbackIsInitialPrescription && index === 0;
                const normalizedRevisionNumber = firstFallbackIsInitialPrescription && Number.isFinite(explicitRevisionNumber) && explicitRevisionNumber > 0
                  ? explicitRevisionNumber - 1
                  : explicitRevisionNumber;
                const displayRevisionNumber = Number.isFinite(normalizedRevisionNumber) && normalizedRevisionNumber > 0
                  ? normalizedRevisionNumber
                  : firstFallbackIsInitialPrescription ? index : index + 1;
                const sectionLabel = isInitialFallback ? "Initial prescription" : `Revision ${displayRevisionNumber}`;
                const productName = adjustment.product_name || "Revised prescription";
                return (
                  <section key={adjustment.id} className="border-b p-5">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {sectionLabel} · {productName}
                    </h4>
                    <div className="mt-2">
                      {renderCostTable(
                        adjustment.medication_amount,
                        adjustment.shipping_amount,
                        adjustment.product_total,
                        false,
                        productName,
                        "Total",
                        isNoCharge ? undefined : adjustment
                      )}
                    </div>
                  </section>
                );
              })}
              <div className="flex items-center justify-between px-5 py-4 text-sm font-bold">
                <span>Net adjustment</span>
                <span className={netAdjustment < 0 ? "text-emerald-600" : "text-red-600"}>
                  {netAdjustment >= 0 ? "+" : "−"}{money(Math.abs(netAdjustment))}
                </span>
              </div>
            </main>
          </div>

          <footer className="flex justify-end gap-3 border-t bg-muted/20 px-5 py-4">
            <button className="rounded-md border px-4 py-2 text-sm" onClick={() => setSelected(null)}>
              Close
            </button>
            {pendingCredits.length > 0 && (
              <button
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                onClick={() =>
                  setRefundTargets(
                    pendingCredits.map((credit) => ({
                      id: credit.id,
                      invoice_number: credit.invoice_number,
                      invoice_type: "credit_note",
                      status: credit.status as any,
                      total_amount: credit.adjustment_amount,
                      client: (invoice as any).client,
                      client_id: (invoice as any).client_id,
                    } as any))
                  )
                }
              >
                Issue refund via Stripe · {money(pendingCreditTotal)}
              </button>
            )}
          </footer>
        </div>
      </div>
    );
  };

  const renderCreditNoteModal = (invoice: B2BInvoice) => {
    const isRefunded = invoice.status === "refunded";
    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/50 p-4 sm:p-8">
        <div className="w-full max-w-5xl overflow-hidden rounded-xl border bg-white shadow-2xl">
          <header className="border-b px-5 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Credit note
                </div>
                <div className="mt-1 font-mono text-xs text-muted-foreground">{invoice.invoice_number}</div>
                <div className="mt-3 flex items-center gap-3">
                  <span className="text-2xl font-bold">{money(invoice.total_amount)}</span>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusPillClass(invoice.status || "")}`}>
                    {formatLabel(invoice.status)}
                  </span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {(invoice as any).client_name || "-"}
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-md border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted">
                Close
              </button>
            </div>
          </header>

          <div className="grid md:grid-cols-[320px_1fr]">
            <aside className="border-b md:border-b-0 md:border-r">
              <section className="border-b p-5">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Details</h4>
                {infoRow("Client", (invoice as any).client_name || "-")}
                {infoRow("Type", "Credit note")}
                {infoRow("Issued against", (invoice as any).source_tenant_order_display_id ? <span className="font-mono text-blue-600">{(invoice as any).source_tenant_order_display_id}</span> : "—")}
                {infoRow("Status", formatLabel(invoice.status))}
                {isRefunded && infoRow("Refunded on", invoice.paid_at ? new Date(invoice.paid_at).toLocaleDateString() : "-")}
              </section>
            </aside>

            <main>
              <section className="border-b p-5">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Refund reason</h4>
                <div className="mt-2 rounded-xl border border-orange-200 bg-orange-50 p-3 text-sm font-medium text-orange-900">
                  {formatLabel((invoice as any).refund_required_reason || "Rx Revision Over Reimbursed")}
                </div>
              </section>
              <section className="border-b p-5">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Refund</h4>
                <div className="mt-2">
                  <table className="w-full text-xs">
                    <colgroup>
                      <col />
                      <col className="w-12" />
                      <col className="w-24" />
                      <col className="w-24" />
                    </colgroup>
                    <tbody>
                      <tr>
                        <td className="py-1.5">Refund · {(invoice as any).source_tenant_order_display_id || ""}</td>
                        <td className="py-1.5 text-center text-muted-foreground">1</td>
                        <td className="py-1.5 text-right text-muted-foreground">{money(invoice.total_amount)}</td>
                        <td className="py-1.5 text-right font-semibold">{money(invoice.total_amount)}</td>
                      </tr>
                      <tr className="border-t">
                        <td className="pt-2 font-bold" colSpan={3}>Refund total</td>
                        <td className="pt-2 text-right font-bold">{money(invoice.total_amount)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            </main>
          </div>

          <footer className="flex justify-end gap-3 border-t bg-muted/20 px-5 py-4">
            <button className="rounded-md border px-4 py-2 text-sm" onClick={() => setSelected(null)}>
              Close
            </button>
            {!isRefunded && (
              <button
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                onClick={() =>
                  setRefundTargets([
                    {
                      id: invoice.id,
                      invoice_number: invoice.invoice_number,
                      invoice_type: "credit_note",
                      status: invoice.status as any,
                      total_amount: invoice.total_amount,
                      client: (invoice as any).client,
                      client_id: invoice.client_id,
                    } as any,
                  ])
                }
              >
                Issue refund via Stripe
              </button>
            )}
          </footer>
        </div>
      </div>
    );
  };

  const renderSaasInvoiceModal = (invoice: B2BInvoice) => {
    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/50 p-4 sm:p-8">
        <div className="w-full max-w-5xl overflow-hidden rounded-xl border bg-white shadow-2xl">
          <header className="border-b px-5 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  SAAS FEE INVOICE
                </div>
                <div className="mt-1 font-mono text-xs text-muted-foreground">{invoice.invoice_number}</div>
                <div className="mt-3 flex items-center gap-3">
                  <span className="text-2xl font-bold">{money(invoice.total_amount)}</span>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusPillClass(invoice.status || "")}`}>
                    {formatLabel(invoice.status)}
                  </span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {(invoice as any).client_name || "-"}
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-md border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted">
                Close
              </button>
            </div>
          </header>

          <div className="grid md:grid-cols-[320px_1fr]">
            <aside className="border-b md:border-b-0 md:border-r">
              <section className="border-b p-5">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Summary</h4>
                {infoRow("Client", (invoice as any).client_name || "-")}
                {infoRow("Client order #", "—")}
                {infoRow("Type", "SaaS Fee")}
                {infoRow("Issued", invoice.issued_at ? new Date(invoice.issued_at).toLocaleDateString() : "-")}
              </section>
              <section className="border-b p-5">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Amounts</h4>
                {infoRow("Invoice total", money(invoice.total_amount))}
              </section>
              <section className="p-5">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Payment diagnostics</h4>
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs font-medium text-sky-600">Show auth &amp; capture details</summary>
                  <div className="mt-2">
                    {infoRow("Billing period", "N/A to N/A")}
                    {infoRow("Intended auth amount", money(invoice.intended_authorization_amount || invoice.total_amount))}
                    {infoRow("Auth retry count", invoice.authorization_retry_count ?? 0)}
                    {infoRow("Next auth retry", invoice.authorization_next_retry_at ? new Date(invoice.authorization_next_retry_at).toLocaleString() : "—")}
                    {infoRow("Auth error code", invoice.authorization_last_error_code || "—")}
                    {infoRow("Auth error message", invoice.authorization_last_error_message || "—")}
                  </div>
                </details>
              </section>
            </aside>

            <main>
              <section className="p-5">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Line items</h4>
                <div className="mt-2">
                  <table className="w-full text-xs">
                    <colgroup>
                      <col />
                      <col className="w-12" />
                      <col className="w-24" />
                      <col className="w-24" />
                    </colgroup>
                    <thead className="text-muted-foreground">
                      <tr className="border-b">
                        <th className="pb-2 text-left font-medium uppercase tracking-wider text-[10px]">Type</th>
                        <th className="pb-2 text-center font-medium uppercase tracking-wider text-[10px]">Qty</th>
                        <th className="pb-2 text-right font-medium uppercase tracking-wider text-[10px]">Unit</th>
                        <th className="pb-2 text-right font-medium uppercase tracking-wider text-[10px]">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.line_items?.map((item) => (
                        <tr key={item.id} className="border-b last:border-b-0">
                          <td className="py-2.5">{lineItemTypeLabel(item)}</td>
                          <td className="py-2.5 text-center text-muted-foreground">{item.quantity ?? 1}</td>
                          <td className="py-2.5 text-right text-muted-foreground">{money(item.unit_price)}</td>
                          <td className="py-2.5 text-right font-semibold">{money(item.total_amount)}</td>
                        </tr>
                      ))}
                      <tr className="border-t">
                        <td className="pt-3 font-bold" colSpan={3}>Total</td>
                        <td className="pt-3 text-right font-bold">{money(invoice.total_amount)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            </main>
          </div>

          <footer className="flex justify-end gap-3 border-t bg-muted/20 px-5 py-4">
            <button className="rounded-md border px-4 py-2 text-sm" onClick={() => setSelected(null)}>
              Close
            </button>
            {invoice.status !== "refunded" && invoice.status === "paid" && (
              <button
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                onClick={() => {
                  alert("Refund SaaS invoices from Stripe dashboard.");
                }}
              >
                Refund
              </button>
            )}
          </footer>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Invoices</h1>
      </div>

      <div className="flex items-center gap-3">
        {[
          { key: "all", label: "All Invoices" },
          { key: "reimbursement", label: "Reimbursement Billings" },
          { key: "credit_note", label: "Credit Notes" },
          { key: "saas_fee", label: "Monthly SaaS Fee Invoices" },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`px-3 py-1 rounded text-sm ${invoiceType === tab.key ? "bg-muted" : "hover:bg-muted/50"
              }`}
            onClick={() => {
              setInvoiceType(tab.key as any);
              setPage(1);
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                className="w-full pl-9 pr-3 py-2 rounded-md border bg-background text-sm focus:ring-1 focus:ring-primary"
                placeholder="Search invoice # or client order #"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <select
              className="w-full px-3 py-2 rounded-md border bg-background text-sm"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="authorized">Authorized</option>
              <option value="authorization_failed">Authorization Failed</option>
              <option value="due">Due</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="failed">Failed</option>
              <option value="canceled">Canceled</option>
              <option value="refunded">Refunded</option>
            </select>
            <select
              className="w-full px-3 py-2 rounded-md border bg-background text-sm"
              value={ordering}
              onChange={(e) => {
                setOrdering(e.target.value);
                setPage(1);
              }}
            >
              <option value="-issued_at">Newest first</option>
              <option value="issued_at">Oldest first</option>
              <option value="-total_amount">Amount high → low</option>
              <option value="total_amount">Amount low → high</option>
              <option value="status">Status A → Z</option>
            </select>
            <input
              className="w-full px-3 py-2 rounded-md border bg-background text-sm"
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
            />
            <input
              className="w-full px-3 py-2 rounded-md border bg-background text-sm"
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardContent className="p-6">
          {isLoading && (
            <div className="text-sm text-muted-foreground">Loading invoices…</div>
          )}
          {error && (
            <div className="text-sm text-red-500">Failed to load invoices.</div>
          )}
          {!isLoading && invoices.length === 0 && (
            <div className="text-sm text-muted-foreground">No invoices found.</div>
          )}
          {groupedInvoices.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase text-muted-foreground bg-muted/30">
                  <tr className="border-b">
                    <th className="px-6 py-3 font-semibold tracking-wider">Date</th>
                    <th className="px-6 py-3 font-semibold tracking-wider">Invoice</th>
                    <th className="px-6 py-3 font-semibold tracking-wider">Client Order #</th>
                    <th className="px-6 py-3 font-semibold tracking-wider">Client</th>
                    <th className="px-6 py-3 font-semibold tracking-wider">Type</th>
                    <th className="px-6 py-3 font-semibold tracking-wider">Breakdown</th>
                    <th className="px-6 py-3 font-semibold tracking-wider">Status</th>
                    <th className="px-6 py-3 font-semibold tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedInvoices.map((inv) => {
                    const baseAmount = parseFloat(
                      (inv as any).total_amount ?? "0"
                    );
                    const displayDate = getDisplayDate(inv);
                    const status = ((inv as any).is_overdue && inv.status !== "paid"
                      ? "overdue"
                      : inv.status || "-").toString();
                    const supplementalTotal = (inv.supplementalInvoices || []).reduce(
                      (sum, child) => sum + parseFloat((child as any).total_amount ?? "0"),
                      0
                    );
                    const hasNestedSupplementals = (inv.supplementalInvoices || []).length > 0;
                    const adjustedAmount = Number(inv.adjustment_summary?.adjusted_total);
                    const displayAmount = Number.isFinite(adjustedAmount)
                      ? adjustedAmount
                      : baseAmount + supplementalTotal;
                    const hasPendingCredit = (inv.revision_adjustments || []).some(
                      (adjustment) =>
                        adjustment.kind === "credit_note" &&
                        !["refunded", "canceled", "failed"].includes(
                          adjustment.status.toLowerCase()
                        )
                    );
                    return (
                      <tr
                        key={inv.id}
                        className={`border-b hover:bg-muted/10 transition-colors ${hasNestedSupplementals ? "bg-amber-50/50" : ""
                          }`}
                        onClick={() => setSelected(inv)}
                        role="button"
                      >
                        <td className="px-6 py-4">
                          {displayDate
                            ? new Date(displayDate).toLocaleDateString()
                            : "-"}
                        </td>
                        <td className="px-6 py-4 font-medium">
                          {inv.invoice_number}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs">
                          {getClientOrderNumber(inv)}
                        </td>
                        <td className="px-6 py-4">
                          {(inv as any).client_name || (inv as any).client?.name || "-"}
                        </td>
                        <td className="px-6 py-4">
                          {formatLabel(inv.invoice_type)}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          <div>{formatBreakdown(inv)}</div>
                          {hasNestedSupplementals && (
                            <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                              <GitBranch className="h-3 w-3" />
                              Split Capture · +${supplementalTotal.toFixed(2)} supplemental
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${statusPillClass(status)}`}>
                            {formatLabel(status)}
                          </span>
                          {hasPendingCredit && (
                            <div className="mt-1 text-[11px] font-semibold text-amber-600">
                              Refund pending
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium">${displayAmount.toFixed(2)}</div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {data && (data.next || data.previous) && (
            <div className="flex items-center justify-between mt-4 text-sm">
              <button
                className="px-3 py-1 rounded border disabled:opacity-50"
                disabled={!data.previous}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span className="text-muted-foreground">
                Page {page} · {invoices.length} of {data.count}
              </span>
              <button
                className="px-3 py-1 rounded border disabled:opacity-50"
                disabled={!data.next}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {selected && isReimbursementInvoice(selected) && renderRevisionInvoiceModal(selected)}
      {selected && selected.invoice_type === "credit_note" && renderCreditNoteModal(selected)}
      {selected && selected.invoice_type === "saas_fee" && renderSaasInvoiceModal(selected)}

      {refundTargets.length > 0 && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/55 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="p-5">
              <h3 className="text-base font-bold">Issue refund via Stripe</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Issue a {money(
                  refundTargets.reduce(
                    (sum, invoice) => sum + Number(invoice.total_amount || 0),
                    0
                  )
                )} refund to {(selected as any)?.client_name || "the client"} via Stripe?
                This returns the funds to the original payment method.
              </p>
            </div>
            <div className="flex justify-end gap-3 border-t bg-muted/30 px-5 py-4">
              <button
                className="rounded-md border px-4 py-2 text-sm"
                onClick={() => setRefundTargets([])}
                disabled={markRefundMutation.isPending}
              >
                Cancel
              </button>
              <button
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                onClick={() => markRefundMutation.mutate(refundTargets)}
                disabled={markRefundMutation.isPending}
              >
                {markRefundMutation.isPending ? "Refunding..." : "Issue refund"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
