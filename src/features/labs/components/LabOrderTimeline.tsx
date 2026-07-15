import { AlertTriangle, CalendarClock, CheckCircle2, FileText, FlaskConical, Package, Truck } from "lucide-react"

import { formatLabTimelineDate } from "@/features/labs/utils/formatting"

type LifecycleEvent = Record<string, unknown>

interface Props {
  createdAt: string
  collectionMethod?: string
  provider?: string
  currentLabel?: string
  events: LifecycleEvent[]
}

const eventText = (event: LifecycleEvent) =>
  [event.status, event.title, event.event_type].filter(Boolean).join(" ").toLowerCase()

const eventIcon = (event: LifecycleEvent) => {
  const text = eventText(event)
  if (/failed|cancel|problem|blocked|lost|redraw/.test(text)) return AlertTriangle
  if (/result|completed/.test(text)) return CheckCircle2
  if (/appointment/.test(text)) return CalendarClock
  if (/ship|transit|delivery/.test(text)) return Truck
  if (/kit|registered/.test(text)) return Package
  if (/sample|draw|lab/.test(text)) return FlaskConical
  return FileText
}

export default function LabOrderTimeline({ createdAt, events }: Props) {
  const actualEvents = events.length > 0 ? events : [{
    title: "Order created",
    description: "The lab order was created in WellieMD.",
    occurred_at: createdAt,
    event_type: "welliemd.order.created",
  }]

  return (
    <div className="relative space-y-0">
      {actualEvents.map((event, index) => {
        const Icon = eventIcon(event)
        const title = String(event.title || event.status || "Lab update")
        const description = String(event.description || "")
        const occurredAt = String(event.occurred_at || event.created_at || event.timestamp || "")
        return (
          <div key={String(event.id || `${event.event_type}-${occurredAt}-${index}`)} className="relative flex gap-4 pb-5 last:pb-0">
            {index < actualEvents.length - 1 && <span className="absolute left-[13px] top-7 h-[calc(100%-12px)] w-px bg-slate-200 dark:bg-gray-800" />}
            <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-500"><Icon className="h-4 w-4" /></span>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div className="min-w-0"><p className="text-sm font-semibold text-slate-800 dark:text-gray-200">{title}</p>{description && <p className="text-xs leading-5 text-slate-400 dark:text-gray-500">{description}</p>}</div>
              <span className="whitespace-nowrap text-[10px] text-slate-400 dark:text-gray-500">{formatLabTimelineDate(occurredAt)}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
