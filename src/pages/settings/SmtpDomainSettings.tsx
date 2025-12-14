import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { smtpApi, ClientEmailConfiguration, deleteMailgunCredentials, createMailgunCredentials } from "@/api/smtpApi"
import { AlertCircle, CheckCircle, Loader } from "lucide-react"


export default function SmtpDomainSettings() {
  const [formData, setFormData] = useState<ClientEmailConfiguration>({
    email_host_user: "",
    email_host_password: "",
    default_from_email: "",
  })
  
  const [configId, setConfigId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [mgDomain, setMgDomain] = useState<string>("");
  const [credError, setCredError] = useState<string | null>(null)
  const [credSuccess, setCredSuccess] = useState<string | null>(null)
  const [isExist, setIsExist] = useState(false)
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
        setMgDomain(config.smtp_domain_name)
        if (config.smtp_domain_name) {
          setIsExist(true)
        }
        setFormData({
          email_host_user: config.email_host_user,
          email_host_password: config.email_host_password,
          default_from_email: config.default_from_email,
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
    if (!mgDomain) {
      setCredError('Domain name is required')
      return
    }
    setError(null)
    setSuccess(null)
    setIsSaving(true)
    setCredError(null)
    setCredSuccess(null)
    try {
      const response = await smtpApi.createMailgunCredentials(mgDomain, formData.email_host_user)
      setCredSuccess('Crdentials created and saved successfully!')
    } catch (err) {
      const data = err.response?.data;
      let message = "Something went wrong";
      if (typeof data?.error === "string") {
        try {
          message = JSON.parse(data.error).message;
        } catch {
          message = data.error;
        }
      }
      const errorMsg = message || 'Failed to save credentials'
      setCredError(errorMsg)
      console.error('Error saving email credentials:', err)
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
      await smtpApi.deleteMailgunCredentials(mgDomain, formData.email_host_user)
      setConfigId(null)
      setFormData({
        email_host_user: "",
        email_host_password: "",
        default_from_email: "",
      })
      setCredSuccess('Credentials deleted successfully!')
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete credentials'
      setCredError(errorMsg)
      console.error('Error deleting email credentials:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // --- Mailgun Domain Management State ---
  const [mgStatus, setMgStatus] = useState<any>(null);
  const [mgLoading, setMgLoading] = useState(false);
  const [mgError, setMgError] = useState<string | null>(null);
  const [mgSuccess, setMgSuccess] = useState<string | null>(null);

  // Mailgun: Create Domain
  const handleCreateDomain = async () => {
    setMgError(null);
    setMgSuccess(null);
    setMgLoading(true);
    try {
      const res = await smtpApi.createMailgunDomain({ name: mgDomain });
      setMgStatus(res);
      setIsExist(true);
      setMgSuccess("Domain created. Check DNS records below. And Add these records in your DNS settings.");
    } catch (err: any) {
      setMgError(err?.response?.data?.error || err.message || "Failed to create domain");
    } finally {
      setMgLoading(false);
    }
  };
  // Mailgun: Get Domain Status
  const handleGetDomain = async () => {
    setMgError(null);
    setMgSuccess(null);
    setMgLoading(true);
    try {
      const res = await smtpApi.getMailgunDomain(mgDomain);
      setMgStatus(res);
      if (res.domain?.state === "unverified") {
        setMgSuccess("Domain status fetched. Please verify the domain. Check DNS records below.");
      } else {
        setMgSuccess("Domain status fetched.");
      }
    } catch (err: any) {
      setMgError(err?.response?.data?.error || err.message || "Failed to fetch domain");
    } finally {
      setMgLoading(false);
    }
  };
  // Mailgun: Delete Domain
  const handleDeleteDomain = async () => {
    if (!window.confirm('Are you sure you want to delete this Mailgun domain? This cannot be undone.')) return;
    setMgError(null);
    setMgSuccess(null);
    setMgLoading(true);
    try {
      await smtpApi.deleteMailgunDomain(mgDomain);
      setMgStatus(null);
      setMgDomain("");
      setIsExist(false);
      setMgSuccess("Domain deleted.");
    } catch (err: any) {
      setMgError(err?.response?.data?.error || err.message || "Failed to delete domain");
    } finally {
      setMgLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">SMTP Domain Settings</h1>
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
      {/* --- Mailgun Domain Management UI --- */}
      <Card>
        <CardContent className="p-6 space-y-6">
          <div>
            <h2 className="text-lg font-medium mb-1">Mailgun Domain Management</h2>
            <p className="text-sm text-muted-foreground">
              Use these controls to create, check, or delete a Mailgun domain. See DNS records below after creation.
            </p>
          </div>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Name</Label>
              <Input
                value={mgDomain}
                onChange={e => setMgDomain(e.target.value)}
                className="mt-1"
                placeholder="e.g. mail.example.com"
                disabled={mgLoading}
              />
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={handleCreateDomain} 
                disabled={mgLoading || isExist}
                variant="outline" 
                size="sm"
              >
                {mgLoading ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : null}
                Create Domain
              </Button>
              <Button onClick={handleGetDomain} disabled={mgLoading || !mgDomain} variant="outline" size="sm">
                {mgLoading ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : null}
                Get Status
              </Button>
              <Button onClick={handleDeleteDomain} disabled={mgLoading || !mgDomain} variant="outline" size="sm" className="text-red-600 border-red-600 hover:bg-red-50">
                {mgLoading ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : null}
                Delete Domain
              </Button>
            </div>
            {mgError && (
              <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">{mgError}</p>
              </div>
            )}
            {mgSuccess && (
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">{mgSuccess}</p>
              </div>
            )}
            {mgStatus && (
              <div className="mt-4 space-y-2">
                <h3 className="font-semibold">Domain Status: <span className="font-normal">{mgStatus.domain?.state || 'Unknown'}</span></h3>
                <div>
                  <h4 className="font-medium">Receiving DNS Records</h4>
                  <ul className="text-xs bg-gray-50 rounded p-2">
                    {mgStatus.receiving_dns_records?.map((rec: any, i: number) => (
                      <li key={i} className="mb-1">
                        <b>{rec.record_type}</b> {rec.value} {rec.name ? <span>({rec.name})</span> : null} {rec.priority ? <span>Priority: {rec.priority}</span> : null} <span>Status: {rec.valid}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium">Sending DNS Records</h4>
                  <ul className="text-xs bg-gray-50 rounded p-2">
                    {mgStatus.sending_dns_records?.map((rec: any, i: number) => (
                      <li key={i} className="mb-1">
                        <b>{rec.record_type}</b> {rec.value} {rec.name ? <span>({rec.name})</span> : null} <span>Status: {rec.valid}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      {/* --- Existing App SMTP config form --- */}
      {isLoading ? (
        <Card>
          <CardContent className="p-6 flex items-center justify-center gap-2">
            <Loader className="w-5 h-5 animate-spin" />
            <p className="text-muted-foreground">Loading email domain configuration...</p>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Email settings Section */}
          <Card>
            <CardContent className="p-6 space-y-6">
              <div>
                <h2 className="text-lg font-medium mb-1">Credentials</h2>
                <p className="text-sm text-muted-foreground">
                  Click button below to create the credentials.
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Login</Label>
                <Input
                  value={formData.email_host_user}
                  onChange={e => handleInputChange('email_host_user', e.target.value)}
                  className="mt-1"
                  placeholder="e.g. mail.example.com"
                  disabled={isSaving}
                />
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
                    'Create Credentials'
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
                      'Delete Credentials'
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </form>
      )}
          {credError && (
      <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <p className="text-sm">{credError}</p>
      </div>
    )}
    {credSuccess && (
      <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800">
        <CheckCircle className="w-5 h-5 flex-shrink-0" />
        <p className="text-sm">{credSuccess}</p>
      </div>
    )}
    </div>
  )
}
