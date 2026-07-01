import { Beaker, ChevronRight } from "lucide-react"
import type { JunctionIntegrationDetail, JunctionEnvironment } from "@/api/junctionIntegration"

interface Props {
  detail: JunctionIntegrationDetail
  env: JunctionEnvironment
  provisioned: boolean
  onManage: () => void
}

export function JunctionLabAccountsCard({ detail, env, provisioned, onManage }: Props) {
  return (
    <div className="bg-card border rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between gap-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3.5">
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 shadow-sm shrink-0">
          <Beaker className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold">Lab Account Access</h3>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            View org-level lab accounts and link the active client team to the accounts it should use for ordering.
          </p>
        </div>
      </div>
      <div className="bg-muted/30 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border">
        <span className="text-xs font-medium text-muted-foreground">
          {detail.lab_accounts.linked_count} of {detail.lab_accounts.total_count} accounts linked
          <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded text-[9px] border border-amber-200 ml-1 font-bold uppercase">
            {env}
          </span>
        </span>
        <button
          onClick={onManage}
          disabled={!provisioned}
          className="text-xs font-bold text-primary hover:underline flex items-center gap-1 disabled:opacity-50"
        >
          Manage lab accounts <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
