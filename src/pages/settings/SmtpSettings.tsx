import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { smtpApi, ClientEmailConfiguration, ClientEmailConfigurationResponse } from "@/api/smtpApi"
import { AlertCircle, CheckCircle, Loader } from "lucide-react"


export default function SmtpSettings() {
  const navigate = useNavigate();
  navigate('/dashboard/settings/email-domain')
  const [formData, setFormData] = useState<ClientEmailConfiguration>({
    email_host_user: "",
    email_host_password: "",
    default_from_email: ""
  })
  
  const [configId, setConfigId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Fetch existing configuration on mount
  useEffect(() => {
    loadConfiguration()
  }, [])

  const loadConfiguration = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const configs = await smtpApi.fetchEmailConfigurations()
      if (configs.count > 0) {
        const config = configs.results[0]
        setConfigId(config.id)
        setFormData({
          email_host_user: config.email_host_user,
          email_host_password: config.email_host_password,
          default_from_email: config.default_from_email
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load configuration')
      console.error('Error loading email configuration:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setIsSaving(true)

    try {
      if (configId) {
        // Update existing
        await smtpApi.updateEmailConfiguration(configId, formData)
        setSuccess('Email configuration updated successfully!')
      } else {
        // Create new
        const response = await smtpApi.createEmailConfiguration(formData)
        setConfigId(response.id)
        setSuccess('Email configuration created successfully!')
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save configuration'
      setError(errorMsg)
      console.error('Error saving email configuration:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!configId) return
    
    if (!window.confirm('Are you sure you want to delete this configuration? This cannot be undone.')) {
      return
    }

    setError(null)
    setSuccess(null)
    setIsSaving(true)

    try {
      await smtpApi.deleteEmailConfiguration(configId)
      setConfigId(null)
      setFormData({
        email_host_user: "",
        email_host_password: "",
        default_from_email: ""
      })
      setSuccess('Email configuration deleted successfully!')
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete configuration'
      setError(errorMsg)
      console.error('Error deleting email configuration:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">SMTP Settings</h1>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Success Alert */}
      {success && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{success}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <Card>
          <CardContent className="p-6 flex items-center justify-center gap-2">
            <Loader className="w-5 h-5 animate-spin" />
            <p className="text-muted-foreground">Loading email configuration...</p>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Email settings Section */}
          <Card>
            <CardContent className="p-6 space-y-6">
              <div>
                <h2 className="text-lg font-medium mb-1">Email Settings</h2>
                <p className="text-sm text-muted-foreground">
                  Configure your SMTP email settings below.
                </p>
              </div>

              <div className="space-y-4">
                {/* SMTP credentials */}
                <div>
                  <Label className="text-sm font-medium">SMTP Username (`EMAIL_HOST_USER`)</Label>
                  <Input
                    value={formData.email_host_user}
                    onChange={(e) => handleInputChange('email_host_user', e.target.value)}
                    className="mt-1 focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
                    placeholder="SMTP username or user email"
                    required
                    disabled={isSaving}
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">SMTP Password (`EMAIL_HOST_PASSWORD`)</Label>
                  <Input
                    type="password"
                    value={formData.email_host_password}
                    onChange={(e) => handleInputChange('email_host_password', e.target.value)}
                    className="mt-1 focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
                    placeholder="SMTP password"
                    required
                    disabled={isSaving}
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">Default From Email (`DEFAULT_FROM_EMAIL`)</Label>
                  <Input
                    type="email"
                    value={formData.default_from_email}
                    onChange={(e) => handleInputChange('default_from_email', e.target.value)}
                    className="mt-1 focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
                    placeholder="no-reply@example.com"
                    required
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  type="submit" 
                  variant="outline" 
                  size="sm" 
                  className="text-sky-600 border-sky-600 hover:bg-sky-50"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Configuration'
                  )}
                </Button>
                
                {configId && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="text-red-600 border-red-600 hover:bg-red-50"
                    onClick={handleDelete}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      'Delete Configuration'
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </form>
      )}
    </div>
  )
}
