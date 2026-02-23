import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { socialTagsApi, type SocialTags } from "@/api/socialTagsApi"
import { useSocialTags } from "@/hooks/useSocialTags"

export default function Metafields() {
  const [tags, setTags] = useState<SocialTags>({
    gtm_tag: "",
    facebook_tag: "",
    tiktok_tag: "",
    custom_global_js: "",
    conversion_tracking_js: "",
  })
  const [loading, setLoading] = useState(true)
  const [savingGtm, setSavingGtm] = useState(false)
  const [savingFacebook, setSavingFacebook] = useState(false)
  const [savingTikTok, setSavingTikTok] = useState(false)
  const [savingCustomGlobalJs, setSavingCustomGlobalJs] = useState(false)
  const [savingConversionTrackingJs, setSavingConversionTrackingJs] = useState(false)
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
        description: error.response?.data?.detail || 'Failed to load social tags',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveGtm = async () => {
    try {
      setSavingGtm(true)
      const updated = await socialTagsApi.updateGtmTag(tags.gtm_tag)
      setTags(updated)
      await refreshTags() // Refresh injected tags
      toast({
        title: 'Success',
        description: 'GTM tag saved successfully',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to save GTM tag',
        variant: 'destructive',
      })
    } finally {
      setSavingGtm(false)
    }
  }

  const handleSaveFacebook = async () => {
    try {
      setSavingFacebook(true)
      const updated = await socialTagsApi.updateFacebookTag(tags.facebook_tag)
      setTags(updated)
      await refreshTags() // Refresh injected tags
      toast({
        title: 'Success',
        description: 'Facebook tag saved successfully',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to save Facebook tag',
        variant: 'destructive',
      })
    } finally {
      setSavingFacebook(false)
    }
  }

  const handleSaveTikTok = async () => {
    try {
      setSavingTikTok(true)
      const updated = await socialTagsApi.updateTikTokTag(tags.tiktok_tag)
      setTags(updated)
      await refreshTags() // Refresh injected tags
      toast({
        title: 'Success',
        description: 'TikTok tag saved successfully',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to save TikTok tag',
        variant: 'destructive',
      })
    } finally {
      setSavingTikTok(false)
    }
  }

  const handleSaveCustomGlobalJs = async () => {
    try {
      setSavingCustomGlobalJs(true)
      const updated = await socialTagsApi.updateCustomGlobalJs(tags.custom_global_js)
      setTags(updated)
      await refreshTags() // Refresh injected tags
      toast({
        title: 'Success',
        description: 'Custom Global JS saved successfully',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to save Custom Global JS',
        variant: 'destructive',
      })
    } finally {
      setSavingCustomGlobalJs(false)
    }
  }

  const handleSaveConversionTrackingJs = async () => {
    try {
      setSavingConversionTrackingJs(true)
      const updated = await socialTagsApi.updateConversionTrackingJs(tags.conversion_tracking_js)
      setTags(updated)
      await refreshTags() // Refresh injected tags
      toast({
        title: 'Success',
        description: 'Conversion Tracking JS saved successfully',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to save Conversion Tracking JS',
        variant: 'destructive',
      })
    } finally {
      setSavingConversionTrackingJs(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">Metafields</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">Metafields</h1>
      </div>

      {/* Development Notice */}
      <Card>
        <CardHeader>
          <CardTitle>Add Metafields to your pages</CardTitle>
        </CardHeader>
        {/* <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              This feature is still in development and is coming soon.
            </AlertDescription>
          </Alert>
        </CardContent> */}
      </Card>

      {/* GTM Tag Section */}
      {/* <Card>
        <CardHeader>
          <CardTitle>GTM Tag</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Paste your Google Tag Manager code here"
            value={tags.gtm_tag}
            onChange={(e) => setTags({ ...tags, gtm_tag: e.target.value })}
            className="min-h-[200px] font-mono text-sm"
            disabled={savingGtm}
          />
          <Button
            onClick={handleSaveGtm}
            disabled={savingGtm}
          >
            {savingGtm ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save GTM Tag'
            )}
          </Button>
        </CardContent>
      </Card> */}

      {/* Facebook Tag Section */}
      {/* <Card>
        <CardHeader>
          <CardTitle>Facebook Tag</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Paste your Facebook Pixel code here"
            value={tags.facebook_tag}
            onChange={(e) => setTags({ ...tags, facebook_tag: e.target.value })}
            className="min-h-[200px] font-mono text-sm"
            disabled={savingFacebook}
          />
          <Button
            onClick={handleSaveFacebook}
            disabled={savingFacebook}
          >
            {savingFacebook ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Facebook Tag'
            )}
          </Button>
        </CardContent>
      </Card> */}

      {/* TikTok Tag Section */}
      {/* <Card>
        <CardHeader>
          <CardTitle>TikTok Tag</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Paste your TikTok Pixel code here"
            value={tags.tiktok_tag}
            onChange={(e) => setTags({ ...tags, tiktok_tag: e.target.value })}
            className="min-h-[200px] font-mono text-sm"
            disabled={savingTikTok}
          />
          <Button
            onClick={handleSaveTikTok}
            disabled={savingTikTok}
          >
            {savingTikTok ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save TikTok Tag'
            )}
          </Button>
        </CardContent>
      </Card> */}

      {/* Custom Global JS Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-baseline gap-2">
            Custom Global JS
            <span className="text-sm font-normal text-muted-foreground">
              (Will be injected in every page) (Don't forget to include &lt;script&gt;&lt;/script&gt; tags)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Paste your custom JavaScript code here (runs on all questionnaire pages)"
            value={tags.custom_global_js}
            onChange={(e) => setTags({ ...tags, custom_global_js: e.target.value })}
            className="min-h-[200px] font-mono text-sm"
            disabled={savingCustomGlobalJs}
          />
          <Button
            onClick={handleSaveCustomGlobalJs}
            disabled={savingCustomGlobalJs}
          >
            {savingCustomGlobalJs ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Custom Global JS'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Conversion Tracking JS Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-baseline gap-2">
            Conversion Tracking JS
            <span className="text-sm font-normal text-muted-foreground">
              (Will be injected in payment success page) (Don't forget to include &lt;script&gt;&lt;/script&gt; tags)
            </span>
          </CardTitle>
          <span className="text-sm font-normal text-muted-foreground">Available javascript variables that you can use on conversion script: buyer_name buyer_email order_id amount product coupon_code </span>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Paste your conversion tracking JavaScript code here (for future use)"
            value={tags.conversion_tracking_js}
            onChange={(e) => setTags({ ...tags, conversion_tracking_js: e.target.value })}
            className="min-h-[200px] font-mono text-sm"
            disabled={savingConversionTrackingJs}
          />
          <Button
            onClick={handleSaveConversionTrackingJs}
            disabled={savingConversionTrackingJs}
          >
            {savingConversionTrackingJs ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Conversion Tracking JS'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
