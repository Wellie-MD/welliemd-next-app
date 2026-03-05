import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  Plus, MoreHorizontal, Eye, Copy, Trash2, XCircle, Play
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useForm, useFieldArray } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { webhooksApi, WebhookEndpoint } from "@/api/webhooksApi"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"

// --- Types ---
const EVENT_TYPES = [
  { value: "ORDER_CREATED", label: "New Order" },
  { value: "PATIENT_CREATED", label: "New Patient" },
  { value: "PRESCRIPTION_CREATED", label: "New Prescription" },
  { value: "ORDER_SHIPPED", label: "Order Shipped" },
  { value: "ORDER_UPDATED", label: "Order Updated" },
  { value: "TREATMENT_CREATED", label: "New Treatment" },
  { value: "TREATMENT_UPDATED", label: "Treatment Updated" },
  { value: "SUBSCRIPTION_CREATED", label: "Subscription Created" },
  { value: "SUBSCRIPTION_UPDATED", label: "Subscription Updated" },
  { value: "ABANDONED_SESSION", label: "Abandoned Session" },
  { value: "PAYMENT_CANCELLED", label: "Payment Cancelled" },
  { value: "PAYMENT_CREATED", label: "Payment Created" },
  { value: "PAYMENT_FAILED", label: "Payment Failed" },
  { value: "PAYMENT_SUCCEEDED", label: "Payment Succeeded" },
  { value: "PAYMENT_REFUNDED", label: "Payment Refunded" },
  { value: "AFFILIATE_CONVERSION", label: "New Affiliate Conversion" },
]

const webhookSchema = z.object({
  name: z.string().min(1, "Name is required"),
  url: z.string().url("Must be a valid URL"),
  method: z.enum(["POST", "PUT"]),
  status: z.enum(["active", "inactive", "archived"]),
  events: z.array(z.string()).min(1, "Select at least one event"),
  headers: z.array(z.object({
    key: z.string().min(1, "Key required"),
    value: z.string().min(1, "Value required")
  })).optional()
})

type WebhookFormValues = z.infer<typeof webhookSchema>

export default function WebhooksApis() {
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingWebhook, setEditingWebhook] = useState<WebhookEndpoint | null>(null)
  const [showSecret, setShowSecret] = useState(false)
  const { toast } = useToast()

  // --- Fetch Data ---
  const fetchWebhooks = async () => {
    try {
      const data = await webhooksApi.getEndpoints()
      // Ensure we have an array
      const results = Array.isArray(data) ? data : (data as any).results || []
      setWebhooks(results)
    } catch (error) {
      console.error(error)
      toast({ title: "Error", description: "Failed to load webhooks", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWebhooks()
  }, [])

  // --- Form Setup ---
  const form = useForm<WebhookFormValues>({
    resolver: zodResolver(webhookSchema),
    defaultValues: {
      name: "",
      url: "",
      method: "POST",
      status: "active",
      events: [],
      headers: []
    }
  })

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isDialogOpen) {
      if (editingWebhook) {
        // Transform backend headers object to array for form
        const headersArray = Object.entries(editingWebhook.headers || {}).map(([key, value]) => ({ key, value: String(value) }))

        form.reset({
          name: editingWebhook.name,
          url: editingWebhook.url,
          method: editingWebhook.method,
          status: editingWebhook.status,
          events: editingWebhook.events,
          headers: headersArray
        })
      } else {
        form.reset({
          name: "",
          url: "",
          method: "POST",
          status: "active",
          events: [],
          headers: []
        })
      }
    }
  }, [isDialogOpen, editingWebhook, form])

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "headers"
  })

  // --- Handlers ---
  const onSubmit = async (values: WebhookFormValues) => {
    try {
      // Transform headers array back to object
      const headersObj = values.headers?.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {}) || {}

      const payload: any = { ...values, headers: headersObj }

      if (editingWebhook) {
        await webhooksApi.updateEndpoint(editingWebhook.id, payload)
        toast({ title: "Success", description: "Webhook updated successfully" })
      } else {
        await webhooksApi.createEndpoint(payload)
        toast({ title: "Success", description: "Webhook created successfully" })
      }

      setIsDialogOpen(false)
      fetchWebhooks()
    } catch (error) {
      console.error(error)
      toast({ title: "Error", description: "Failed to save webhook", variant: "destructive" })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this webhook?")) return
    try {
      await webhooksApi.deleteEndpoint(id)
      toast({ title: "Deleted", description: "Webhook removed" })
      fetchWebhooks()
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete webhook", variant: "destructive" })
    }
  }

  const handleTest = async (id: string, name: string) => {
    try {
      toast({ title: "Sending Test Event", description: `Triggering test event for ${name}...` })
      const result = await webhooksApi.testEndpoint(id)

      if (result.status === "success") {
        toast({
          title: "Test Successful",
          description: `Received ${result.http_status} OK from endpoint.`,
          variant: "default"
        })
      } else {
        toast({
          title: "Test Failed",
          description: `Endpoint returned ${result.http_status} error.`,
          variant: "destructive"
        })
      }
    } catch (error: any) {
      console.error(error)
      const msg = error.response?.data?.detail || "Failed to trigger test event"
      toast({ title: "Error", description: msg, variant: "destructive" })
    }
  }

  // --- Render Helpers ---
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">Active</Badge>
      case 'inactive': return <Badge variant="secondary">Inactive</Badge>
      case 'archived': return <Badge variant="outline" className="text-muted-foreground">Archived</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Webhooks & API</h1>
          <p className="text-muted-foreground mt-1">Customize your API and webhook settings to suit your needs.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingWebhook(null)}>
              <Plus className="mr-2 h-4 w-4" /> Add New
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingWebhook ? "Edit Webhook" : "Add Webhook"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                {/* Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. New Order Sync" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Events Multi-Select */}
                <FormField
                  control={form.control}
                  name="events"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Type *</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          if (!field.value.includes(value)) {
                            field.onChange([...field.value, value])
                          }
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select events" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {EVENT_TYPES.map(evt => (
                            <SelectItem key={evt.value} value={evt.value}>{evt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {field.value.map(val => (
                          <Badge key={val} variant="secondary" className="gap-1 pr-1">
                            {EVENT_TYPES.find(e => e.value === val)?.label || val}
                            <XCircle
                              className="h-3 w-3 cursor-pointer text-muted-foreground hover:text-foreground"
                              onClick={() => field.onChange(field.value.filter(v => v !== val))}
                            />
                          </Badge>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* URL */}
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL *</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/webhook" {...field} />
                      </FormControl>
                      <FormDescription>Make sure to provide the correct URL for your webhooks to ensure seamless integration.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  {/* Method */}
                  <FormField
                    control={form.control}
                    name="method"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Method *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="POST">POST</SelectItem>
                            <SelectItem value="PUT">PUT</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Status */}
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Headers */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Headers</Label>
                    <Button type="button" variant="outline" size="sm" onClick={() => append({ key: "", value: "" })}>
                      + Add New
                    </Button>
                  </div>
                  {fields.length === 0 && <p className="text-sm text-muted-foreground">No headers added</p>}
                  <div className="space-y-2">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex gap-2">
                        <Input placeholder="Key" {...form.register(`headers.${index}.key`)} />
                        <Input placeholder="Value" {...form.register(`headers.${index}.value`)} />
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Signing Secret (Visible only when editing) */}
                {editingWebhook && (
                  <div className="space-y-2 p-4 bg-muted/50 rounded-md border">
                    <Label>Signing Secret</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        readOnly
                        value={editingWebhook.secret}
                        className="font-mono bg-background text-muted-foreground"
                        type={showSecret ? "text" : "password"}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setShowSecret(!showSecret)}
                        title={showSecret ? "Hide Secret" : "Show Secret"}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          navigator.clipboard.writeText(editingWebhook.secret)
                          toast({ title: "Copied", description: "Secret copied to clipboard" })
                        }}
                        title="Copy Secret"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-[0.8rem] text-muted-foreground">
                      Use this secret to verify the HMAC signature of incoming webhook events.
                    </p>
                  </div>
                )}

                <DialogFooter>
                  <Button type="submit">Save Webhook</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Webhooks</CardTitle>
            <Input placeholder="Search by name..." className="max-w-xs" />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : webhooks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No webhooks configured.</p>
              <Button variant="link" onClick={() => setIsDialogOpen(true)}>Create your first webhook</Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <div className="grid grid-cols-12 gap-4 p-4 font-medium border-b bg-muted/50 text-sm">
                <div className="col-span-3">Name</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-3">URL</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2 text-right">Created At</div>
              </div>
              {webhooks.map((webhook) => (
                <div key={webhook.id} className="grid grid-cols-12 gap-4 p-4 items-center border-b last:border-0 hover:bg-muted/50 transition-colors text-sm">
                  <div className="col-span-3 font-medium">{webhook.name}</div>
                  <div className="col-span-2 text-muted-foreground truncate">
                    {webhook.events.length > 1
                      ? `${webhook.events[0]} +${webhook.events.length - 1}`
                      : EVENT_TYPES.find(e => e.value === webhook.events[0])?.label || webhook.events[0]}
                  </div>
                  <div className="col-span-3 truncate font-mono text-xs text-muted-foreground" title={webhook.url}>{webhook.url}</div>
                  <div className="col-span-2">{getStatusBadge(webhook.status)}</div>
                  <div className="col-span-2 flex items-center justify-end gap-2">
                    <span className="text-muted-foreground">{format(new Date(webhook.created_at), "MMM d, yyyy")}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => {
                          setEditingWebhook(webhook)
                          setIsDialogOpen(true)
                        }}>
                          Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleTest(webhook.id, webhook.name)}>
                          <Play className="mr-2 h-4 w-4" />
                          Test Webhook
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(webhook.id)}>
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}