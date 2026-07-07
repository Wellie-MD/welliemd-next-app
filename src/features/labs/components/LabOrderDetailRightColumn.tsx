/**
 * LabOrderDetailRightColumn — Lab, Patient, Medical Network, Payment cards.
 * Extracted from LabOrderDetail to stay under 600 lines.
 */
import { Button } from "@/components/ui/button";

interface Props {
  order: any;
  formattedOrderDate: string;
  togglingRelease: boolean;
  onToggleRelease: () => void;
  getInitials: (name?: string) => string;
  downloadingRequisition?: boolean;
  onDownloadRequisition?: () => void;
  downloadingCollection?: boolean;
  onDownloadCollection?: () => void;
}

function SideLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-gray-400 dark:text-gray-555 font-semibold mb-0.5">{children}</p>;
}
function SideValue({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{children}</p>;
}

export default function LabOrderDetailRightColumn({ 
  order, 
  formattedOrderDate, 
  togglingRelease, 
  onToggleRelease, 
  getInitials,
  downloadingRequisition,
  onDownloadRequisition,
  downloadingCollection,
  onDownloadCollection
}: Props) {
  return (
    <div className="lg:col-span-4 space-y-6">

      {/* Lab Card */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 space-y-4">
        <h3 className="text-xs font-bold uppercase text-gray-400 dark:text-gray-550 tracking-wider">Lab</h3>
        <div className="space-y-4">
          <div><SideLabel>PROCESSING LAB</SideLabel>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{order.pharmacy_display || order.lab_provider || "—"}</p>
          </div>
          <div><SideLabel>COLLECTION</SideLabel>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 capitalize">
              {order.collection_method ? order.collection_method.replace(/_/g, " ") : "—"}
            </p>
          </div>
          <div><SideLabel>STATUS</SideLabel>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/40">
              {order.results_status ? order.results_status.replace(/_/g, " ") : order.order_status || "In Progress"}
            </span>
          </div>
          <div><SideLabel>COLLECTED</SideLabel>
            <SideValue>
              {order.timeline?.sample_collected
                ? new Date(order.timeline.sample_collected).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                : formattedOrderDate}
            </SideValue>
          </div>
          <div><SideLabel>REPORTED</SideLabel>
            <SideValue>
              {order.timeline?.results
                ? new Date(order.timeline.results).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                : "—"}
            </SideValue>
          </div>
        </div>
      </div>

      {/* Patient Details Card */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 space-y-4">
        <h3 className="text-xs font-bold uppercase text-gray-400 dark:text-gray-550 tracking-wider">Patient Details</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
              {getInitials(order.patient?.full_name || order.patient_name || order.name)}
            </div>
            <span className="font-bold text-gray-800 dark:text-gray-200 text-sm">
              {order.patient?.full_name || order.patient_name || order.name}
            </span>
          </div>
          <div><SideLabel>EMAIL</SideLabel>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 break-all">{order.patient_email || order.email}</p>
          </div>
          <div><SideLabel>PHONE</SideLabel>
            <SideValue>{order.patient_phone || order.phone || "—"}</SideValue>
          </div>
        </div>
      </div>

      {/* Medical Network Card */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 space-y-4">
        <h3 className="text-xs font-bold uppercase text-gray-400 dark:text-gray-550 tracking-wider">Medical Network</h3>
        <div className="space-y-4">
          <div><SideLabel>ORDERING PROVIDER</SideLabel>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{order.doctor_name || "—"}</p>
          </div>
          <div><SideLabel>RESULTS RELEASED TO</SideLabel>
            <SideValue>Patient + ordering physician</SideValue>
          </div>
          <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-2">
            <p className="text-xs text-gray-500 leading-normal">
              Patient Portal Gating:{" "}
              {order.resultsReleased
                ? <span className="text-emerald-600 font-semibold">Released</span>
                : <span className="text-amber-600 font-semibold">Gated (Hidden)</span>}
            </p>
            <Button
              size="sm"
              variant={order.resultsReleased ? "outline" : "default"}
              onClick={onToggleRelease}
              disabled={togglingRelease}
              className="w-full text-xs font-semibold h-8"
            >
              {togglingRelease ? "Saving…" : order.resultsReleased ? "Gate Results" : "Release Results"}
            </Button>
          </div>
        </div>
      </div>

      {/* Payment Info Card */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 space-y-4">
        <h3 className="text-xs font-bold uppercase text-gray-400 dark:text-gray-550 tracking-wider">Payment Info</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400 dark:text-gray-500 text-xs font-semibold">Date</span>
            <span className="text-gray-700 dark:text-gray-350 font-medium">{formattedOrderDate}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400 dark:text-gray-500 text-xs font-semibold">Status</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/40">
              {order.payment_status || "captured"}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm pt-1 border-t border-gray-50 dark:border-gray-800/40">
            <span className="text-gray-900 dark:text-white font-bold">Amount</span>
            <span className="text-gray-900 dark:text-white font-bold">
              ${parseFloat(order.orderTotal || order.price || "0").toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Documents Card */}
      {(onDownloadRequisition || onDownloadCollection) && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase text-gray-400 dark:text-gray-550 tracking-wider">Documents</h3>
          <div className="space-y-2">
            {onDownloadRequisition && (
              <Button
                variant="outline"
                size="sm"
                onClick={onDownloadRequisition}
                disabled={downloadingRequisition}
                className="w-full justify-start text-xs font-semibold h-9 text-gray-700 dark:text-gray-300"
              >
                {downloadingRequisition ? "Downloading..." : "Download requisition form"}
              </Button>
            )}
            {onDownloadCollection && (
              <Button
                variant="outline"
                size="sm"
                onClick={onDownloadCollection}
                disabled={downloadingCollection}
                className="w-full justify-start text-xs font-semibold h-9 text-gray-700 dark:text-gray-300"
              >
                {downloadingCollection ? "Downloading..." : "Download collection instructions"}
              </Button>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
