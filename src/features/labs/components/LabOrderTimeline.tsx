import {
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FileText,
  FlaskConical,
  Package,
  Truck,
  type LucideIcon,
} from "lucide-react"

import { formatLabCollectionMethod, formatLabTimelineDate } from "@/features/labs/utils/formatting"

type LifecycleEvent = Record<string, unknown>

type TimelineKind =
  | "processing"
  | "ordered"
  | "requisition"
  | "appointment"
  | "shipped"
  | "delivered"
  | "sample"
  | "at_lab"
  | "partial_results"
  | "results"

interface TimelineItem {
  key: TimelineKind
  title: string
  description: string
  date: string
  icon: LucideIcon
}

interface Props {
  createdAt: string
  collectionMethod?: string
  provider?: string
  currentLabel?: string
  events: LifecycleEvent[]
}

const ICONS: Record<TimelineKind, LucideIcon> = {
  processing: ClipboardList,
  ordered: FileText,
  requisition: FileText,
  appointment: CalendarClock,
  shipped: Truck,
  delivered: Package,
  sample: FlaskConical,
  at_lab: FlaskConical,
  partial_results: CheckCircle2,
  results: CheckCircle2,
}

const eventText = (event: LifecycleEvent) =>
  [event.status, event.title, event.event_type]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

const eventDate = (event: LifecycleEvent) =>
  String(event.occurred_at || event.created_at || event.timestamp || "")

const eventDescription = (event: LifecycleEvent, fallback: string) => {
  const description = String(event.description || "").trim()
  return description && !/^order status:/i.test(description) ? description : fallback
}

const findEvent = (events: LifecycleEvent[], tokens: string[]) =>
  events.find((event) => {
    const text = eventText(event)
    return tokens.some((token) => text.includes(token))
  })

function buildTimeline({ createdAt, collectionMethod, provider, currentLabel, events }: Props): TimelineItem[] {
  const items = new Map<TimelineKind, TimelineItem>()
  const add = (
    key: TimelineKind,
    event: LifecycleEvent | undefined,
    title: string,
    description: string,
    fallbackDate = "",
    allowMissing = false,
  ) => {
    if (items.has(key) || (!event && !fallbackDate && !allowMissing)) return
    items.set(key, {
      key,
      title,
      description: event ? eventDescription(event, description) : description,
      date: formatLabTimelineDate(event ? eventDate(event) : fallbackDate),
      icon: ICONS[key],
    })
  }

  add("processing", undefined, "Processing", "Payment Pending → Processing", createdAt)
  add(
    "ordered",
    findEvent(events, ["ordered", "order created"]),
    "Ordered",
    collectionMethod === "testkit"
      ? `Test kit order created${provider ? ` with ${provider}` : ""}`
      : `Lab order created${provider ? ` with ${provider}` : ""}`,
    createdAt,
  )
  add(
    "requisition",
    findEvent(events, ["requisition_created", "requisition created"]),
    "Requisition Created",
    "Lab requisition generated",
  )

  if (collectionMethod === "testkit") {
    add(
      "shipped",
      findEvent(events, ["kit_shipped", "kit shipped", "transit_customer", "shipped"]),
      "Kit Shipped",
      "Test kit shipped to patient",
    )
    add(
      "delivered",
      findEvent(events, ["kit_delivered", "kit delivered", "with_customer"]),
      "Kit Delivered",
      "Test kit delivered — patient prompted to collect",
    )
  } else {
    add(
      "appointment",
      findEvent(events, ["appointment_pending", "appointment_scheduled", "appointment booked"]),
      "Appointment",
      "Patient appointment booking",
    )
  }

  const collectionLabel = formatLabCollectionMethod(collectionMethod).toLowerCase()
  add(
    "sample",
    findEvent(events, ["sample_collected", "draw_completed", "transit_lab"]),
    "Sample Collected",
    `${collectionLabel} completed`,
  )
  add(
    "at_lab",
    findEvent(events, ["at_lab", "delivered_to_lab"]),
    "At Lab",
    "Sample arrived at the lab",
  )
  add(
    "partial_results",
    findEvent(events, ["partial_results"]),
    "Partial Results",
    "Partial results returned by lab",
  )
  add(
    "results",
    findEvent(events, ["results_ready", "results ready", "completed"]),
    "Results Ready",
    "Results returned by lab",
  )

  // If a provider only returned a current status, keep that state visible even
  // when its webhook history has not been materialized yet.
  const current = String(currentLabel || "").toLowerCase()
  if (current.includes("kit delivered")) {
    add("delivered", undefined, "Kit Delivered", "Test kit delivered — patient prompted to collect", "", true)
  } else if (current.includes("kit shipped")) {
    add("shipped", undefined, "Kit Shipped", "Test kit shipped to patient", "", true)
  }

  return Array.from(items.values())
}

export default function LabOrderTimeline(props: Props) {
  const items = buildTimeline(props)

  return (
    <div className="relative space-y-0">
      {items.map((item, index) => {
        const Icon = item.icon
        return (
          <div key={item.key} className="relative flex gap-4 pb-5 last:pb-0">
            {index < items.length - 1 && (
              <span className="absolute left-[13px] top-7 h-[calc(100%-12px)] w-px bg-slate-200 dark:bg-gray-800" />
            )}
            <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-500">
              <Icon className="h-4 w-4" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 dark:text-gray-200">{item.title}</p>
                <p className="text-xs leading-5 text-slate-400 dark:text-gray-500">{item.description}</p>
              </div>
              <span className="whitespace-nowrap text-[10px] text-slate-400 dark:text-gray-500">{item.date}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
