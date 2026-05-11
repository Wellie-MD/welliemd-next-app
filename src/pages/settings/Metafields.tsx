import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Loader2, Code2, Rocket, Info, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { socialTagsApi, type SocialTags } from "@/api/socialTagsApi"
import { useSocialTags } from "@/hooks/useSocialTags"

export default function Metafields() {
  const [tags, setTags] = useState<SocialTags>({
    custom_global_js: "",
    conversion_tracking_js: "",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("global")
  const { toast } = useToast()
  const { refreshTags } = useSocialTags()

  useEffect(() => {
    loadTags()
  }, [])

  const loadTags = async () => {
    try {
      setLoading(true)
      const data = await socialTagsApi.getCurrent()
      setTags(data)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to load tracking JS',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const updated = await socialTagsApi.updateTrackingJs(tags)
      setTags(updated)
      await refreshTags()
      toast({
        title: 'Settings Saved',
        description: 'Your tracking scripts have been updated successfully.',
      })
    } catch (error: any) {
      const backendMessage =
        error?.response?.data?.error ||
        error?.response?.data?.detail ||
        error?.response?.data?.message

      toast({
        title: 'Save Failed',
        description: backendMessage || 'Failed to save tracking JS',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Initializing editor...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground lg:text-4xl">
            Tracking & Metafields
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Manage your analytics and conversion scripts globally across all questionnaire flows.
          </p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={saving} 
          size="lg"
          className="transition-all duration-300 px-8"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Syncing Changes...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Save Configuration
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="global" className="w-full" onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <TabsList className="grid w-full sm:w-[400px] grid-cols-2 bg-muted/40 backdrop-blur-md p-1 border">
            <TabsTrigger 
              value="global" 
              className="data-[state=active]:bg-background transition-all"
            >
              <Code2 className="mr-2 h-4 w-4" />
              Global Scripts
            </TabsTrigger>
            <TabsTrigger 
              value="conversion"
              className="data-[state=active]:bg-background transition-all"
            >
              <Rocket className="mr-2 h-4 w-4" />
              Conversions
            </TabsTrigger>
          </TabsList>
          
          <div className="flex items-center text-xs text-muted-foreground px-2 py-1 bg-muted/30 rounded-full border">
            <Info className="mr-1.5 h-3 w-3" />
            Scripts are automatically sanitized for security
          </div>
        </div>

        <TabsContent value="global" className="space-y-4 focus-visible:outline-none">
          <Card className="border-none bg-card/40 backdrop-blur-xl ring-1 ring-border/50 overflow-hidden">
            <CardHeader className="bg-muted/30 pb-6">
              <div className="flex items-center space-x-3 mb-1">
                <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                <CardTitle className="text-xl font-bold">Custom Global JS</CardTitle>
              </div>
              <CardDescription className="text-sm leading-relaxed max-w-3xl">
                This script executes on every questionnaire page load. It is the ideal place for base tracking codes
                like the Meta Pixel, Google Analytics, or TikTok Pixel initialization.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-primary/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition duration-1000" />
                <div className="relative bg-background/50 border-t">
                  <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                    <span>questionnaire_header.js</span>
                    <div className="flex space-x-1.5">
                      <div className="h-2.5 w-2.5 rounded-full bg-red-500/30" />
                      <div className="h-2.5 w-2.5 rounded-full bg-amber-500/30" />
                      <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/40" />
                    </div>
                  </div>
                  <Textarea
                    placeholder="/* Paste your global <script> here */"
                    value={tags.custom_global_js}
                    onChange={(e) => setTags({ ...tags, custom_global_js: e.target.value })}
                    className="min-h-[450px] font-mono text-xs md:text-sm bg-transparent border-none focus-visible:ring-0 p-8 pt-6 resize-none leading-relaxed"
                    disabled={saving}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversion" className="grid grid-cols-1 lg:grid-cols-4 gap-8 focus-visible:outline-none">
          <div className="lg:col-span-3 space-y-4">
            <Card className="border-none bg-card/40 backdrop-blur-xl ring-1 ring-border/50 overflow-hidden">
              <CardHeader className="bg-muted/30 pb-6">
                <div className="flex items-center space-x-3 mb-1">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <CardTitle className="text-xl font-bold">Conversion Tracking JS</CardTitle>
                </div>
                <CardDescription className="text-sm leading-relaxed max-w-3xl">
                  Executes specifically on the Thank-You page after a payment completes. Access purchase data 
                  via the <code>window.welliemdConversion</code> object.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="relative group overflow-hidden">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition duration-1000" />
                  <div className="relative bg-background/50 border-t">
                     <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                      <span>purchase_tracking_success.js</span>
                      <div className="flex space-x-1.5">
                        <div className="h-2.5 w-2.5 rounded-full bg-red-500/30" />
                        <div className="h-2.5 w-2.5 rounded-full bg-amber-500/30" />
                        <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/40" />
                      </div>
                    </div>
                    <Textarea
                      placeholder="fbq('track', 'Purchase', { value: window.welliemdConversion.amount, currency: 'USD' });"
                      value={tags.conversion_tracking_js}
                      onChange={(e) => setTags({ ...tags, conversion_tracking_js: e.target.value })}
                      className="min-h-[450px] font-mono text-xs md:text-sm bg-transparent border-none focus-visible:ring-0 p-8 pt-6 resize-none leading-relaxed"
                      disabled={saving}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="rounded-2xl bg-primary/5 border border-primary/20 p-6 space-y-4 backdrop-blur-sm">
              <div className="flex flex-col space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/70">
                  Data Context
                </span>
                <CardTitle className="text-lg">Runtime Variables</CardTitle>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {['buyer_name', 'buyer_email', 'order_id', 'amount', 'product', 'coupon_code'].map(v => (
                  <Badge 
                    key={v} 
                    variant="outline" 
                    className="bg-background/80 hover:bg-background font-mono text-[10px] py-1 border-primary/10 transition-colors"
                  >
                    {v}
                  </Badge>
                ))}
              </div>
              
              <div className="space-y-3 pt-4 border-t border-primary/10">
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  These variables are automatically pre-populated on the thank-you page. 
                  Access them via the global namespace:
                </p>
                <div className="bg-background/90 rounded-md p-3 font-mono text-[10px] border border-primary/5 select-all">
                  <span className="text-muted-foreground">window.</span>
                  <span className="text-primary font-bold">welliemdConversion</span>
                  <span className="text-muted-foreground">.</span>
                  <span>amount</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-muted/30 border p-6 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider flex items-center">
                <Info className="mr-2 h-3.5 w-3.5 text-primary" />
                Implementation Note
              </h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                If pasting scripts from Meta or Google Ads, ensure they include the 
                <code>&lt;script&gt;</code> tags. The runtime handles the injection 
                cycle for you.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
