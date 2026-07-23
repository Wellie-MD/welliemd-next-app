import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { smtpApi, ClientEmailConfiguration } from "@/api/smtpApi"
import { 
  AlertCircle, 
  CheckCircle, 
  Loader, 
  ArrowLeft, 
  Settings, 
  Globe, 
  Shield, 
  Key, 
  MoreVertical, 
  Copy, 
  Plus,
  Check
} from "lucide-react"

// DNS Record Card Component
interface DnsRecordCardProps {
  type: string
  name: string
  value: string
  priority?: string
  valid?: string
}

function DnsRecordCard({ type, name, value, priority, valid }: DnsRecordCardProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-muted/50 border border-border rounded-lg p-4 mb-3">
      <div className="grid grid-cols-12 gap-4 items-start">
        <div className="col-span-2">
          <p className="text-xs text-muted-foreground mb-1">Type</p>
          <p className="font-medium text-sm">{type}</p>
          {priority && <p className="text-xs text-muted-foreground mt-1">Priority: {priority}</p>}
        </div>
        <div className="col-span-4">
          <p className="text-xs text-muted-foreground mb-1">Name</p>
          <p className="font-medium text-sm break-all">{name || "@"}</p>
        </div>
        <div className="col-span-5">
          <p className="text-xs text-muted-foreground mb-1">Value</p>
          <p className="font-mono text-xs break-all text-muted-foreground">{value}</p>
        </div>
        <div className="col-span-1 flex justify-end">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={handleCopy}
          >
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      {valid && (
        <div className="mt-2">
          <Badge variant={valid === "valid" ? "default" : "destructive"} className="text-xs">
            {valid === "valid" ? "✓ Verified" : "⚠ Not Verified"}
          </Badge>
        </div>
      )}
    </div>
  )
}

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
  const [activeTab, setActiveTab] = useState("settings")
  const [isDefaultDomain, setIsDefaultDomain] = useState(false)
  const [fromName, setFromName] = useState("")
  const [showAddDomain, setShowAddDomain] = useState(false)
  const [newDomainName, setNewDomainName] = useState("")
  // Mailgun Domain Status
  const [mgStatus, setMgStatus] = useState<any>(null);
  const [mgLoading, setMgLoading] = useState(false);
  const [mgError, setMgError] = useState<string | null>(null);
  const [mgSuccess, setMgSuccess] = useState<string | null>(null);

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
          // Also fetch domain status
          try {
            const domainStatus = await smtpApi.getMailgunDomain(config.smtp_domain_name)
            setMgStatus(domainStatus)
          } catch (e) {
            console.log("Could not fetch domain status")
          }
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
    setError(null)
    setSuccess(null)
    setIsSaving(true)
    setCredError(null)
    setCredSuccess(null)
    try {
      if (configId) {
        await smtpApi.updateEmailConfiguration(configId, formData)
        setCredSuccess('Email configuration updated successfully!')
      } else {
        const response = await smtpApi.createEmailConfiguration(formData)
        setConfigId(response.id)
        setCredSuccess('Email configuration created successfully!')
      }
    } catch (err: any) {
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
      setCredSuccess('Email configuration deleted successfully!')
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete configuration'
      setCredError(errorMsg)
      console.error('Error deleting email configuration:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Mailgun: Create Domain
  const handleCreateDomain = async () => {
    if (!newDomainName) {
      setMgError("Domain name is required")
      return
    }
    setMgError(null);
    setMgSuccess(null);
    setMgLoading(true);
    try {
      const res = await smtpApi.createMailgunDomain({ name: newDomainName });
      setMgStatus(res);
      setMgDomain(newDomainName);
      setIsExist(true);
      setShowAddDomain(false);
      setNewDomainName("");
      setMgSuccess("Domain created successfully! Check DNS records below.");
    } catch (err: any) {
      setMgError(err?.response?.data?.error || err.message || "Failed to create domain");
    } finally {
      setMgLoading(false);
    }
  };

  // Mailgun: Get Domain Status (refresh)
  const handleRefreshStatus = async () => {
    if (!mgDomain) return;
    setMgError(null);
    setMgSuccess(null);
    setMgLoading(true);
    try {
      const res = await smtpApi.getMailgunDomain(mgDomain);
      setMgStatus(res);
      setMgSuccess("Domain status refreshed.");
    } catch (err: any) {
      setMgError(err?.response?.data?.error || err.message || "Failed to fetch domain");
    } finally {
      setMgLoading(false);
    }
  };

  // Mailgun: Verify Domain Status
  const handleVerifyStatus = async () => {
    if (!mgDomain) return;
    setMgError(null);
    setMgSuccess(null);
    setMgLoading(true);
    try {
      const res = await smtpApi.verifyMailgunDomain(mgDomain);
      setMgStatus(res);
      setMgSuccess("DNS records verification triggered.");
    } catch (err: any) {
      setMgError(err?.response?.data?.error || err.message || "Failed to verify domain");
    } finally {
      setMgLoading(false);
    }
  };

  // Mailgun: Delete Domain
  const handleDeleteDomain = async () => {
    if (!window.confirm('Are you sure you want to delete this domain? This cannot be undone.')) return;
    setMgError(null);
    setMgSuccess(null);
    setMgLoading(true);
    try {
      await smtpApi.deleteMailgunDomain(mgDomain);
      setMgStatus(null);
      setMgDomain("");
      setIsExist(false);
      setMgSuccess("Domain deleted successfully.");
    } catch (err: any) {
      setMgError(err?.response?.data?.error || err.message || "Failed to delete domain");
    } finally {
      setMgLoading(false);
    }
  };

  // Get verification status badges
  const getDnsStatus = () => {
    if (!mgStatus?.receiving_dns_records) return "unknown"
    return mgStatus.receiving_dns_records.every((r: any) => r.valid === "valid") ? "valid" : "invalid"
  }

  const getSpfStatus = () => {
    if (!mgStatus?.sending_dns_records) return "unknown"
    const spfRecord = mgStatus.sending_dns_records.find((r: any) => r.value?.includes("spf"))
    return spfRecord?.valid === "valid" ? "valid" : "invalid"
  }

  const getDkimStatus = () => {
    if (!mgStatus?.sending_dns_records) return "unknown"
    const dkimRecord = mgStatus.sending_dns_records.find((r: any) => r.name?.includes("_domainkey"))
    return dkimRecord?.valid === "valid" ? "valid" : "invalid"
  }

  const getDmarcRecords = () => {
    if (!mgStatus) return []

    const candidates = [
      mgStatus.authentication_dns_records,
      mgStatus.authentications_dns_records,
      mgStatus.dmarc_dns_records,
      mgStatus.dmarc_dns_record,
      mgStatus.domain?.authentication_dns_records,
      mgStatus.domain?.authentications_dns_records,
      mgStatus.domain?.dmarc_dns_records,
      mgStatus.domain?.dmarc_dns_record,
    ]

    const records = candidates.flatMap((value) =>
      Array.isArray(value) ? value : value ? [value] : []
    )

    const sendingDmarcRecords = (mgStatus.sending_dns_records || []).filter((rec: any) => {
      const name = String(rec.name || rec.host || "").toLowerCase()
      const value = String(rec.value || "").toLowerCase()
      return name.includes("_dmarc") || value.includes("v=dmarc1")
    })

    const seen = new Set<string>()
    return [...records, ...sendingDmarcRecords].filter((rec: any) => {
      const key = `${rec.name || rec.host || ""}:${rec.value || rec.data || ""}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  const getDmarcStatus = () => {
    const dmarcRecords = getDmarcRecords()
    if (dmarcRecords.length === 0) return "unknown"
    return dmarcRecords.every((r: any) => r.valid === "valid" || r.status === "valid") ? "valid" : "invalid"
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <Card>
          <CardContent className="p-6 flex items-center justify-center gap-2">
            <Loader className="w-5 h-5 animate-spin" />
            <p className="text-muted-foreground">Loading email domain configuration...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // No domain configured - show add domain UI
  if (!isExist && !showAddDomain) {
    return (
      <div className="mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">Email Domains</h1>
          <Button onClick={() => setShowAddDomain(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Domain
          </Button>
        </div>
        
        <Card>
          <CardContent className="p-12 text-center">
            <Globe className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-medium mb-2">No Domain Configured</h2>
            <p className="text-muted-foreground mb-6">
              Add a custom email domain to start sending emails from your own domain.
            </p>
            <Button onClick={() => setShowAddDomain(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Your First Domain
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show Add Domain Form
  if (showAddDomain) {
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowAddDomain(false)}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-2xl font-semibold text-foreground">Add New Domain</h1>
        </div>

        <Card>
          <CardContent className="p-6 space-y-6">
            <div>
              <Label className="text-sm font-medium">Domain Name</Label>
              <Input
                value={newDomainName}
                onChange={e => setNewDomainName(e.target.value)}
                className="mt-1"
                placeholder="e.g. mail.example.com"
                disabled={mgLoading}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Enter the subdomain you want to use for sending emails (e.g., mail.yourdomain.com)
              </p>
            </div>

            {mgError && (
              <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">{mgError}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button 
                onClick={handleCreateDomain} 
                disabled={mgLoading || !newDomainName}
              >
                {mgLoading ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : null}
                Create Domain
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowAddDomain(false)}
                disabled={mgLoading}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Main domain settings view
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-3">{mgDomain}</h1>
          <div className="flex items-center gap-2 flex-wrap">
            {mgStatus?.domain?.state === "active" && (
              <Badge className="bg-green-500 text-white">Verified</Badge>
            )}
            {mgStatus?.domain?.state === "unverified" && (
              <Badge variant="outline" className="border-yellow-500 text-yellow-600">Pending Verification</Badge>
            )}
            <Badge 
              variant="outline" 
              className={getDnsStatus() === "valid" ? "border-green-500 text-green-600" : "border-muted-foreground"}
            >
              {getDnsStatus() === "valid" ? "✓" : "○"} DNS
            </Badge>
            <Badge 
              variant="outline" 
              className={getDkimStatus() === "valid" ? "border-green-500 text-green-600" : "border-muted-foreground"}
            >
              {getDkimStatus() === "valid" ? "✓" : "○"} DKIM
            </Badge>
            <Badge 
              variant="outline" 
              className={getSpfStatus() === "valid" ? "border-green-500 text-green-600" : "border-muted-foreground"}
            >
              {getSpfStatus() === "valid" ? "✓" : "○"} SPF
            </Badge>
            <Badge 
              variant="outline" 
              className={getDmarcStatus() === "valid" ? "border-green-500 text-green-600" : "border-muted-foreground"}
            >
              {getDmarcStatus() === "valid" ? "✓" : "○"} DMARC
            </Badge>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleRefreshStatus}>
              <Settings className="w-4 h-4 mr-2" />
              Refresh Status
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsDefaultDomain(!isDefaultDomain)}>
              <Check className="w-4 h-4 mr-2" />
              Make it Default
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={handleDeleteDomain}
              className="text-red-600 focus:text-red-600"
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              Delete Domain
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Alerts */}
      {(mgError || credError) && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{mgError || credError}</p>
        </div>
      )}
      {(mgSuccess || credSuccess) && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{mgSuccess || credSuccess}</p>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start bg-muted/50 border-b rounded-none h-auto p-0">
          <TabsTrigger 
            value="settings" 
            className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 px-4"
          >
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger 
            value="dns" 
            className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 px-4"
          >
            <Globe className="w-4 h-4" />
            DNS
          </TabsTrigger>
          <TabsTrigger 
            value="spf" 
            className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 px-4"
          >
            <Shield className="w-4 h-4" />
            SPF
          </TabsTrigger>
          <TabsTrigger 
            value="dkim" 
            className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 px-4"
          >
            <Key className="w-4 h-4" />
            DKIM
          </TabsTrigger>
          <TabsTrigger 
            value="dmarc" 
            className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 px-4"
          >
            <Shield className="w-4 h-4" />
            DMARC
          </TabsTrigger>
        </TabsList>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div>
                <h2 className="text-lg font-medium mb-1">Email Settings</h2>
                <p className="text-sm text-muted-foreground">
                  Configure how emails are sent from this domain
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label className="text-sm font-medium">From Email Address</Label>
                  <Input
                    value={formData.default_from_email}
                    onChange={e => handleInputChange('default_from_email', e.target.value)}
                    className="mt-1"
                    placeholder={`noreply@${mgDomain}`}
                    disabled={isSaving}
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">From Name</Label>
                  <Input
                    value={fromName}
                    onChange={e => setFromName(e.target.value)}
                    className="mt-1"
                    placeholder="Your Company Name"
                    disabled={isSaving}
                  />
                </div>

                <div className="flex items-center justify-between py-4 border-t">
                  <div>
                    <Label className="text-sm font-medium">Set as Default Domain</Label>
                    <p className="text-sm text-muted-foreground">
                      Use this domain as the default for sending emails
                    </p>
                  </div>
                  <Switch 
                    checked={isDefaultDomain} 
                    onCheckedChange={setIsDefaultDomain}
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={isSaving}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isSaving ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DNS Tab */}
        <TabsContent value="dns" className="mt-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-medium mb-1">DNS Records</h2>
              <p className="text-sm text-muted-foreground">
                Add these DNS records to your domain's DNS settings
              </p>
            </div>

            <div className="space-y-3">
              {mgStatus?.receiving_dns_records?.map((rec: any, i: number) => (
                <DnsRecordCard
                  key={`receiving-${i}`}
                  type={rec.record_type}
                  name={rec.name || mgDomain}
                  value={rec.value}
                  priority={rec.priority}
                  valid={rec.valid}
                />
              ))}
            </div>

            <Button 
              variant="outline" 
              onClick={handleVerifyStatus}
              disabled={mgLoading}
              className="mt-4"
            >
              {mgLoading ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : null}
              Verify DNS Records
            </Button>
          </div>
        </TabsContent>

        {/* SPF Tab */}
        <TabsContent value="spf" className="mt-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-medium mb-1">SPF Record</h2>
              <p className="text-sm text-muted-foreground">
                Add this SPF record to authorize email sending
              </p>
            </div>

            <div className="space-y-3">
              {mgStatus?.sending_dns_records
                ?.filter((rec: any) => rec.value?.includes("spf"))
                .map((rec: any, i: number) => (
                  <DnsRecordCard
                    key={`spf-${i}`}
                    type={rec.record_type}
                    name={rec.name || mgDomain}
                    value={rec.value}
                    valid={rec.valid}
                  />
                ))}
            </div>

            <Button 
              variant="outline" 
              onClick={handleVerifyStatus}
              disabled={mgLoading}
              className="mt-4"
            >
              {mgLoading ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : null}
              Verify SPF Record
            </Button>
          </div>
        </TabsContent>

        {/* DKIM Tab */}
        <TabsContent value="dkim" className="mt-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-medium mb-1">DKIM Records</h2>
              <p className="text-sm text-muted-foreground">
                Add these DKIM records to enable email authentication
              </p>
            </div>

            <div className="space-y-3">
              {mgStatus?.sending_dns_records
                ?.filter((rec: any) => rec.name?.includes("_domainkey") || rec.value?.includes("k=rsa"))
                .map((rec: any, i: number) => (
                  <DnsRecordCard
                    key={`dkim-${i}`}
                    type={rec.record_type}
                    name={rec.name}
                    value={rec.value}
                    valid={rec.valid}
                  />
                ))}
              
              {/* Also show CNAME record */}
              {mgStatus?.sending_dns_records
                ?.filter((rec: any) => rec.record_type === "CNAME")
                .map((rec: any, i: number) => (
                  <DnsRecordCard
                    key={`cname-${i}`}
                    type={rec.record_type}
                    name={rec.name}
                    value={rec.value}
                    valid={rec.valid}
                  />
                ))}
            </div>

            <Button 
              variant="outline" 
              onClick={handleVerifyStatus}
              disabled={mgLoading}
              className="mt-4"
            >
              {mgLoading ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : null}
              Verify DKIM Records
            </Button>
          </div>
        </TabsContent>

        {/* DMARC Tab */}
        <TabsContent value="dmarc" className="mt-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-medium mb-1">DMARC Record</h2>
              <p className="text-sm text-muted-foreground">
                Add this TXT record to complete domain authentication
              </p>
            </div>

            <div className="space-y-3">
              {getDmarcRecords().map((rec: any, i: number) => (
                <DnsRecordCard
                  key={`dmarc-${i}`}
                  type={rec.record_type || rec.type || "TXT"}
                  name={rec.name || rec.host || `_dmarc.${mgDomain}`}
                  value={rec.value || rec.data || ""}
                  priority={rec.priority}
                  valid={rec.valid || rec.status}
                />
              ))}

              {getDmarcRecords().length === 0 && (
                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  No DMARC record was returned for this Mailgun domain yet.
                </div>
              )}
            </div>

            <Button 
              variant="outline" 
              onClick={handleVerifyStatus}
              disabled={mgLoading}
              className="mt-4"
            >
              {mgLoading ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : null}
              Verify DMARC Record
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
