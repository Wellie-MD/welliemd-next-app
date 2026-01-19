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
  })
  const [loading, setLoading] = useState(true)
  const [savingGtm, setSavingGtm] = useState(false)
  const [savingFacebook, setSavingFacebook] = useState(false)
  const [savingTikTok, setSavingTikTok] = useState(false)
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
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              This feature is still in development and is coming soon.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* GTM Tag Section */}
      <Card>
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
      </Card>

      {/* Facebook Tag Section */}
      <Card>
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
      </Card>

      {/* TikTok Tag Section */}
      <Card>
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
      </Card>
    </div>
  )
}
