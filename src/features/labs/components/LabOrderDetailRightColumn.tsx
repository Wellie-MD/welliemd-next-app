/** Compact right rail for the client lab-order detail view. */
import { humanizeLabStatus } from "@/features/labs/constants/status"
import { labPillTone } from "@/features/labs/constants/tones"
import { formatLabCollectionMethod } from "@/features/labs/utils/formatting"
import type { LabOrderView } from "@/features/labs/types"
import { cn } from "@/lib/utils"

interface Props {
  order: LabOrderView
  formattedOrderDate: string
  getInitials: (name?: string) => string
}

function SideLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-gray-500">{children}</p>
}

function SideValue({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-medium leading-5 text-slate-700 dark:text-gray-300">{children}</p>
}

function SideCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <h3 className="mb-3 text-sm font-semibold text-slate-800 dark:text-gray-200">{title}</h3>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

export default function LabOrderDetailRightColumn({
  order,
  formattedOrderDate,
  getInitials,
}: Props) {
  const labStatus = humanizeLabStatus(order.ui_lab_event_label || order.results_status || order.order_status || "In Process")
  const physician = order.physicianName || (order.junction_physician_ordering_mode === "own_physician"
    ? "WellieMD own physician"
    : "Junction Physician Network")

  return (
    <aside className="space-y-4">
      <SideCard title="Lab">
        <div>
          <SideLabel>Processing lab</SideLabel>
          <SideValue>{order.pharmacy_display || order.lab_provider || "—"}</SideValue>
        </div>
        <div>
          <SideLabel>Collection</SideLabel>
          <SideValue>{formatLabCollectionMethod(order.collection_method)}</SideValue>
        </div>
        <div>
          <SideLabel>Status</SideLabel>
          <span className={cn("inline-flex rounded border px-2 py-1 text-xs font-semibold", labPillTone(labStatus))}>
            {labStatus}
          </span>
        </div>
        <div><SideLabel>Ordered for</SideLabel><SideValue>{order.display_id || order.id} · lab order</SideValue></div>
        {order.sampleId && <div><SideLabel>Sample ID</SideLabel><SideValue>{order.sampleId}</SideValue></div>}
      </SideCard>

      <SideCard title="Patient Details">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
            {getInitials(order.patient_name)}
          </div>
          <span className="text-sm font-semibold text-slate-800 dark:text-gray-200">
            {order.patient_name || "—"}
          </span>
        </div>
        <div><SideLabel>Email</SideLabel><SideValue>{order.patient_email || order.email || "—"}</SideValue></div>
        <div><SideLabel>Phone</SideLabel><SideValue>{order.patient_phone || order.phone || "—"}</SideValue></div>
      </SideCard>

      <SideCard title="Medical Network">
        <div><SideLabel>Ordering physician</SideLabel><SideValue>{physician}</SideValue></div>
        {order.physicianNpi && <div><SideLabel>NPI</SideLabel><SideValue>{order.physicianNpi}</SideValue></div>}
        <div>
          <SideLabel>Results review</SideLabel>
          <SideValue>Junction physicians review abnormal and critical results; the patient is called if needed.</SideValue>
        </div>
        {order.resultsAvailable && <p className="border-t border-slate-100 pt-3 text-xs font-semibold text-emerald-700 dark:border-gray-800 dark:text-emerald-400">Results available in the patient portal</p>}
      </SideCard>

      <SideCard title="Payment Info">
        <div className="flex justify-between gap-2"><SideLabel>Date</SideLabel><SideValue>{formattedOrderDate}</SideValue></div>
        <div className="flex justify-between gap-2"><SideLabel>Provider</SideLabel><SideValue>{order.payment_provider || "—"}</SideValue></div>
        <div className="flex items-center justify-between gap-2"><SideLabel>Status</SideLabel><span className="rounded border border-emerald-100 bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">{humanizeLabStatus(order.payment_status || "captured")}</span></div>
        <div className="flex justify-between border-t border-slate-100 pt-3 dark:border-gray-800"><span className="text-xs font-bold text-slate-800 dark:text-gray-200">Amount</span><strong className="text-xs text-slate-800 dark:text-gray-200">${parseFloat(order.orderTotal || order.price || "0").toFixed(2)}</strong></div>
      </SideCard>
    </aside>
  )
}
