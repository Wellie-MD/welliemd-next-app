import { useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Order } from "@/api/ordersApi"
import { PatientResponsesModal } from "./PatientResponsesModal"
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Package,
  FileText,
  CreditCard,
  Truck,
  Building2,
  ClipboardList
} from "lucide-react"
import { format } from "date-fns"

interface OrderDetailsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: Order | null
}

// Status badge color mapping
const statusColors: Record<string, string> = {
  created: "bg-gray-100 text-gray-800",
  processing: "bg-blue-100 text-blue-800",
  visit_failed: "bg-red-100 text-red-800",
  visit_pending: "bg-yellow-100 text-yellow-800",
  consult_canceled: "bg-red-100 text-red-800",
  referred: "bg-purple-100 text-purple-800",
  prescribed: "bg-green-100 text-green-800",
  billing_pending: "bg-orange-100 text-orange-800",
  rx_sent: "bg-indigo-100 text-indigo-800",
  shipped: "bg-emerald-100 text-emerald-800",
  canceled: "bg-red-100 text-red-800",
}

// Status labels
const statusLabels: Record<string, string> = {
  created: "Created",
  processing: "Processing",
  visit_failed: "Visit Failed",
  visit_pending: "Visit Pending",
  consult_canceled: "Consult Canceled",
  referred: "Referred",
  prescribed: "Prescribed",
  billing_pending: "Billing Pending",
  rx_sent: "Rx Sent",
  shipped: "Shipped",
  canceled: "Canceled",
}

export function OrderDetailsSheet({
  open,
  onOpenChange,
  order
}: OrderDetailsSheetProps) {
  const [showPatientResponses, setShowPatientResponses] = useState(false)

  if (!order) return null

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "-"
    try {
      return format(new Date(dateString), "MMM d, yyyy h:mm a")
    } catch {
      return dateString
    }
  }

  const status = order.orderStatus || order.status || "created"

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-xl p-0">
          <SheetHeader className="p-6 pb-4 border-b">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-xl">Order Details</SheetTitle>
              <Badge className={statusColors[status] || "bg-gray-100 text-gray-800"}>
                {statusLabels[status] || status}
              </Badge>
            </div>
            {order.display_id && (
              <p className="text-sm text-muted-foreground">
                Order #{order.display_id}
              </p>
            )}
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-140px)]">
            <div className="p-6 space-y-6">
              {/* Patient Information */}
              <section>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Patient Information
                </h3>
                <div className="bg-muted/40 rounded-lg p-4 space-y-3">
                  <InfoItem 
                    icon={<User className="h-4 w-4" />} 
                    label="Name" 
                    value={order.name} 
                  />
                  <InfoItem 
                    icon={<Mail className="h-4 w-4" />} 
                    label="Email" 
                    value={order.email} 
                  />
                  <InfoItem 
                    icon={<Phone className="h-4 w-4" />} 
                    label="Phone" 
                    value={order.phone} 
                  />
                  <InfoItem 
                    icon={<MapPin className="h-4 w-4" />} 
                    label="Address" 
                    value={order.address} 
                  />
                  {order.mrn && (
                    <InfoItem 
                      icon={<FileText className="h-4 w-4" />} 
                      label="MRN" 
                      value={order.mrn} 
                    />
                  )}
                </div>
              </section>

              <Separator />

              {/* Order Information */}
              <section>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Order Information
                </h3>
                <div className="bg-muted/40 rounded-lg p-4 space-y-3">
                  <InfoItem 
                    icon={<Calendar className="h-4 w-4" />} 
                    label="Order Date" 
                    value={formatDate(order.orderDate)} 
                  />
                  <InfoItem 
                    icon={<Calendar className="h-4 w-4" />} 
                    label="Date Prescribed" 
                    value={formatDate(order.datePrescribed)} 
                  />
                  <InfoItem 
                    icon={<Calendar className="h-4 w-4" />} 
                    label="Date Printed/Shipped" 
                    value={formatDate(order.datePrintedShipped)} 
                  />
                  <InfoItem 
                    icon={<CreditCard className="h-4 w-4" />} 
                    label="Order Total" 
                    value={order.orderTotal ? `$${order.orderTotal}` : undefined} 
                  />
                </div>
              </section>

              <Separator />

              {/* Payment & Visit Status */}
              <section>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Payment & Visit Status
                </h3>
                <div className="bg-muted/40 rounded-lg p-4 space-y-3">
                  <InfoItem 
                    icon={<CreditCard className="h-4 w-4" />} 
                    label="Payment Status" 
                    value={order.paymentStatus} 
                  />
                  <InfoItem 
                    icon={<Calendar className="h-4 w-4" />} 
                    label="Payment Date" 
                    value={formatDate(order.paymentDate)} 
                  />
                  <InfoItem 
                    icon={<ClipboardList className="h-4 w-4" />} 
                    label="Visit Status" 
                    value={order.visitStatus} 
                  />
                </div>
              </section>

              <Separator />

              {/* Fulfillment */}
              <section>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Fulfillment
                </h3>
                <div className="bg-muted/40 rounded-lg p-4 space-y-3">
                  <InfoItem 
                    icon={<Building2 className="h-4 w-4" />} 
                    label="Pharmacy" 
                    value={order.pharmacy_display} 
                  />
                  <InfoItem 
                    icon={<Truck className="h-4 w-4" />} 
                    label="Tracking Number" 
                    value={order.tracking_number} 
                  />
                </div>
              </section>

              <Separator />

              {/* Patient Responses Button */}
              <section>
                <Button 
                  onClick={() => setShowPatientResponses(true)}
                  className="w-full"
                  variant="outline"
                  size="lg"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View Patient Responses
                </Button>
                {!order.patient_responses && (
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Questionnaire responses may not be available for all orders.
                  </p>
                )}
              </section>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Patient Responses Modal */}
      <PatientResponsesModal
        open={showPatientResponses}
        onOpenChange={setShowPatientResponses}
        patientResponses={order.patient_responses}
        patientName={order.name || "Patient"}
      />
    </>
  )
}

// Helper component for displaying info items
function InfoItem({ 
  icon, 
  label, 
  value 
}: { 
  icon: React.ReactNode
  label: string
  value?: string | null
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-muted-foreground mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{value || "-"}</p>
      </div>
    </div>
  )
}
