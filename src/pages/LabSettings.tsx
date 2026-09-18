import { useMemo } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { ArrowLeft, KeyRound, ShieldCheck, TestTube2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import JunctionLabs from "@/pages/settings/JunctionLabs"
import LabPolicyTemplatesPanel from "@/features/labs/components/LabPolicyTemplatesPanel"

type TabKey = "junction-api" | "lab-policies"

const TAB_LABELS: Record<TabKey, string> = {
  "junction-api": "Junction API settings",
  "lab-policies": "Lab policy templates",
}

export default function LabSettings() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const currentTab = useMemo<TabKey>(() => {
    const raw = searchParams.get("tab")
    return raw === "lab-policies" ? "lab-policies" : "junction-api"
  }, [searchParams])

  const handleTabChange = (value: string) => {
    const tab = value === "lab-policies" ? "lab-policies" : "junction-api"
    setSearchParams({ tab })
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <TestTube2 className="h-4 w-4 text-[#12517A]" />
            <span>Labs via Junction</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Junction admin settings</h1>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              Manage the control-plane Junction catalog integration and the two platform-managed
              policy templates used by lab checkout.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => navigate("/dashboard/products/labs")}
          className="w-full sm:w-auto gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Labs
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">Admin tools</CardTitle>
            <CardDescription>
              These settings are intentionally kept out of the general settings flow.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <button
              type="button"
              onClick={() => handleTabChange("junction-api")}
              className={`flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${
                currentTab === "junction-api"
                  ? "border-[#12517A] bg-[#E6F1F6]"
                  : "border-border bg-background hover:bg-muted/50"
              }`}
            >
              <KeyRound className={`mt-0.5 h-4 w-4 shrink-0 ${currentTab === "junction-api" ? "text-[#12517A]" : "text-muted-foreground"}`} />
              <div>
                <div className="text-sm font-semibold text-foreground">{TAB_LABELS["junction-api"]}</div>
                <div className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Reference-catalog API key, environment, sync status, and reference catalog refresh.
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("lab-policies")}
              className={`flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${
                currentTab === "lab-policies"
                  ? "border-[#12517A] bg-[#E6F1F6]"
                  : "border-border bg-background hover:bg-muted/50"
              }`}
            >
              <ShieldCheck className={`mt-0.5 h-4 w-4 shrink-0 ${currentTab === "lab-policies" ? "text-[#12517A]" : "text-muted-foreground"}`} />
              <div>
                <div className="text-sm font-semibold text-foreground">{TAB_LABELS["lab-policies"]}</div>
                <div className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Edit the two platform-managed policy templates consumed by questionnaire lab checkout.
                </div>
              </div>
            </button>
          </CardContent>
        </Card>

        <Tabs value={currentTab} onValueChange={handleTabChange} className="min-w-0">
          <TabsList className="mb-4 grid h-auto w-full grid-cols-1 gap-1 rounded-lg bg-muted p-1 sm:grid-cols-2">
            <TabsTrigger value="junction-api" className="justify-center py-2 text-sm">
              Junction API settings
            </TabsTrigger>
            <TabsTrigger value="lab-policies" className="justify-center py-2 text-sm">
              Lab policy templates
            </TabsTrigger>
          </TabsList>

          <TabsContent value="junction-api" className="mt-0">
            <JunctionLabs embedded />
          </TabsContent>

          <TabsContent value="lab-policies" className="mt-0">
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Lab policy templates</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  These two templates sync into tenant runtimes and are shown during lab checkout. Client users can consume them, but they cannot edit them.
                </p>
              </div>
              <LabPolicyTemplatesPanel embedded />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
