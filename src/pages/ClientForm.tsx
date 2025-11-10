import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save, Loader2, Info, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import {
  clientApi,
  ClientCreatePayload,
  ClientUpdatePayload,
} from "@/api/clientApi";
import { PasswordDisplayModal } from "@/components/clients/PasswordDisplayModal";

// Helper component for field info tooltips
const FieldInfo = ({ content }: { content: string }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Info className="h-4 w-4 text-muted-foreground cursor-help inline-block ml-1" />
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p className="text-sm">{content}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export default function ClientForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const isEditMode = !!id;

  const [activeTab, setActiveTab] = useState("basic");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [clientName, setClientName] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Form state
  const [formData, setFormData] = useState<ClientCreatePayload>({
    // User Information
    email: "",
    first_name: "",
    last_name: "",
    phone: "",

    // Client Basic Information
    name: "",
    domain: "",
    subdomain: "",
    master_id_prefix: "welliemd",
    admin_panel_domain: "",
    patient_portal_domain: "",
    api_endpoint: "",
    questionnaire_url: "",

    // Configuration
    allowed_iframe_domains: [],
    default_template_id: "",
    branding_config: {},
    token_expiry_minutes: 30,

    // Database Configuration
    database_host: "127.0.0.1",
    database_name: "",

    // Billing Settings
    patient_fee: 5.0,
    async_consult_fee_to_client: 30.0,
    async_consult_cost: 25.0,
    sync_video_consult_fee_to_client: 60.0,
    sync_consult_cost: 50.0,
    monthly_saas_fee: 500.0,
    first_next_saas_fees_billing_date: "",

    // Payment Gateway
    payment_gateway: "nmi",

    // Status
    is_active: true,
  });

  // Fetch existing client data if editing
  const { data: existingClient, isLoading: isLoadingClient } = useQuery({
    queryKey: ["client", id],
    queryFn: () => clientApi.get(id!),
    enabled: isEditMode,
  });

  // Populate form with existing data
  useEffect(() => {
    if (existingClient) {
      setFormData({
        email: existingClient.user?.email || "",
        first_name: existingClient.user?.first_name || "",
        last_name: existingClient.user?.last_name || "",
        phone: existingClient.user?.phone || "",
        name: existingClient.name,
        domain: existingClient.domain || "",
        subdomain: existingClient.subdomain || "",
        master_id_prefix: existingClient.master_id_prefix || "welliemd",
        admin_panel_domain: existingClient.admin_panel_domain,
        patient_portal_domain: existingClient.patient_portal_domain || "",
        api_endpoint: existingClient.api_endpoint || "",
        questionnaire_url: existingClient.questionnaire_url || "",
        allowed_iframe_domains: existingClient.allowed_iframe_domains || [],
        default_template_id: existingClient.default_template_id || "",
        branding_config: existingClient.branding_config || {},
        token_expiry_minutes: existingClient.token_expiry_minutes || 30,
        database_host: existingClient.database_host || "127.0.0.1",
        database_name: existingClient.database_name,
        patient_fee: existingClient.patient_fee || 5.0,
        async_consult_fee_to_client:
          existingClient.async_consult_fee_to_client || 30.0,
        async_consult_cost: existingClient.async_consult_cost || 25.0,
        sync_video_consult_fee_to_client:
          existingClient.sync_video_consult_fee_to_client || 60.0,
        sync_consult_cost: existingClient.sync_consult_cost || 50.0,
        monthly_saas_fee: existingClient.monthly_saas_fee || 500.0,
        first_next_saas_fees_billing_date:
          existingClient.first_next_saas_fees_billing_date || "",
        payment_gateway: existingClient.payment_gateway || "nmi",
        is_active: existingClient.is_active,
      });
      setClientName(existingClient.name);
    }
  }, [existingClient]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: ClientCreatePayload) => clientApi.create(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setGeneratedPassword(response.deployment_password);
      setClientName(response.client.name);
      setShowPasswordModal(true);
      toast({
        title: "Success",
        description: response.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description:
          error.response?.data?.detail ||
          error.response?.data?.message ||
          "Failed to create client",
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: ClientUpdatePayload) => clientApi.update(id!, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["client", id] });
      toast({
        title: "Success",
        description: response.message,
      });
      navigate("/dashboard/clients");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description:
          error.response?.data?.detail ||
          error.response?.data?.message ||
          "Failed to update client",
        variant: "destructive",
      });
    },
  });

  // Validate JSON fields
  const validateJSON = (value: string, fieldName: string): boolean => {
    try {
      JSON.parse(value);
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
      return true;
    } catch (error) {
      setValidationErrors((prev) => ({
        ...prev,
        [fieldName]: "Invalid JSON format",
      }));
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous validation errors
    setValidationErrors({});

    // Validation
    const errors: Record<string, string> = {};

    if (!formData.name) {
      errors.name = "Client name is required";
    }
    if (!formData.admin_panel_domain) {
      errors.admin_panel_domain = "Admin panel domain is required";
    }
    if (!formData.database_name) {
      errors.database_name = "Database name is required";
    }

    if (!isEditMode) {
      if (!formData.email) {
        errors.email = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = "Invalid email format";
      }
      if (!formData.first_name) {
        errors.first_name = "First name is required";
      }
      if (!formData.last_name) {
        errors.last_name = "Last name is required";
      }
    }

    // Validate URL fields
    const urlFields = [
      "admin_panel_domain",
      "patient_portal_domain",
      "api_endpoint",
      "questionnaire_url",
    ];
    urlFields.forEach((field) => {
      const value = formData[field as keyof typeof formData];
      if (value && typeof value === "string" && value.trim()) {
        try {
          new URL(value);
        } catch {
          errors[field] = "Invalid URL format (must include http:// or https://)";
        }
      }
    });

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      });
      return;
    }

    if (isEditMode) {
      // For update, only send changed fields
      const updatePayload: ClientUpdatePayload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        name: formData.name,
        domain: formData.domain,
        subdomain: formData.subdomain,
        master_id_prefix: formData.master_id_prefix,
        admin_panel_domain: formData.admin_panel_domain,
        patient_portal_domain: formData.patient_portal_domain,
        api_endpoint: formData.api_endpoint,
        questionnaire_url: formData.questionnaire_url,
        allowed_iframe_domains: formData.allowed_iframe_domains,
        default_template_id: formData.default_template_id,
        branding_config: formData.branding_config,
        token_expiry_minutes: formData.token_expiry_minutes,
        database_host: formData.database_host,
        database_name: formData.database_name,
        patient_fee: formData.patient_fee,
        async_consult_fee_to_client: formData.async_consult_fee_to_client,
        async_consult_cost: formData.async_consult_cost,
        sync_video_consult_fee_to_client:
          formData.sync_video_consult_fee_to_client,
        sync_consult_cost: formData.sync_consult_cost,
        monthly_saas_fee: formData.monthly_saas_fee,
        first_next_saas_fees_billing_date:
          formData.first_next_saas_fees_billing_date,
        payment_gateway: formData.payment_gateway,
        is_active: formData.is_active,
      };
      updateMutation.mutate(updatePayload);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handlePasswordModalClose = () => {
    setShowPasswordModal(false);
    navigate("/dashboard/clients");
  };

  if (isEditMode && isLoadingClient) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard/clients")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isEditMode ? "Edit Client" : "Create New Client"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isEditMode
                ? "Update client information and settings"
                : "Set up a new client with admin user account"}
            </p>
          </div>
        </div>
        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {isEditMode ? "Updating..." : "Creating..."}
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {isEditMode ? "Update Client" : "Create Client"}
            </>
          )}
        </Button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="domains">Domains</TabsTrigger>
            <TabsTrigger value="database">Database</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          {/* Tab 1: Basic Information */}
          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Client Information</CardTitle>
                <CardDescription>
                  Basic details about the client organization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Client Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (validationErrors.name) {
                          setValidationErrors((prev) => {
                            const newErrors = { ...prev };
                            delete newErrors.name;
                            return newErrors;
                          });
                        }
                      }}
                      placeholder="Acme Healthcare"
                      required
                      className={validationErrors.name ? "border-red-500" : ""}
                    />
                    {validationErrors.name && (
                      <p className="text-xs text-red-500">{validationErrors.name}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="master_id_prefix">
                      Master ID Prefix
                      <FieldInfo content="Prefix for patient master_id generation (e.g., 'kinmeds', 'knysys'). Lowercase recommended." />
                    </Label>
                    <Input
                      id="master_id_prefix"
                      value={formData.master_id_prefix}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          master_id_prefix: e.target.value.toLowerCase(),
                        })
                      }
                      placeholder="welliemd"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <Label htmlFor="is_active">Active Status</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable or disable this client
                    </p>
                  </div>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_active: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Admin User Information</CardTitle>
                <CardDescription>
                  {isEditMode
                    ? "Update admin user details (email cannot be changed)"
                    : "This user will be created with Admin role and can login to the client portal"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        if (validationErrors.email) {
                          setValidationErrors((prev) => {
                            const newErrors = { ...prev };
                            delete newErrors.email;
                            return newErrors;
                          });
                        }
                      }}
                      placeholder="admin@acme.com"
                      required
                      disabled={isEditMode}
                      className={validationErrors.email ? "border-red-500" : ""}
                    />
                    {validationErrors.email && (
                      <p className="text-xs text-red-500">{validationErrors.email}</p>
                    )}
                    {isEditMode && !validationErrors.email && (
                      <p className="text-xs text-muted-foreground">
                        Email cannot be changed after creation
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">
                      First Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => {
                        setFormData({ ...formData, first_name: e.target.value });
                        if (validationErrors.first_name) {
                          setValidationErrors((prev) => {
                            const newErrors = { ...prev };
                            delete newErrors.first_name;
                            return newErrors;
                          });
                        }
                      }}
                      placeholder="John"
                      required
                      className={validationErrors.first_name ? "border-red-500" : ""}
                    />
                    {validationErrors.first_name && (
                      <p className="text-xs text-red-500">{validationErrors.first_name}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">
                      Last Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => {
                        setFormData({ ...formData, last_name: e.target.value });
                        if (validationErrors.last_name) {
                          setValidationErrors((prev) => {
                            const newErrors = { ...prev };
                            delete newErrors.last_name;
                            return newErrors;
                          });
                        }
                      }}
                      placeholder="Doe"
                      required
                      className={validationErrors.last_name ? "border-red-500" : ""}
                    />
                    {validationErrors.last_name && (
                      <p className="text-xs text-red-500">{validationErrors.last_name}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Domain Configuration */}
          <TabsContent value="domains" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Domain Configuration</CardTitle>
                <CardDescription>
                  Configure client domains and endpoints
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="domain">Primary Domain</Label>
                    <Input
                      id="domain"
                      value={formData.domain}
                      onChange={(e) =>
                        setFormData({ ...formData, domain: e.target.value })
                      }
                      placeholder="acme.welliemd.com"
                    />
                    <p className="text-xs text-muted-foreground">
                      Main domain for tenant resolution
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subdomain">Subdomain</Label>
                    <Input
                      id="subdomain"
                      value={formData.subdomain}
                      onChange={(e) =>
                        setFormData({ ...formData, subdomain: e.target.value })
                      }
                      placeholder="acme"
                    />
                    <p className="text-xs text-muted-foreground">
                      For questionnaire app (e.g.,
                      acme.questionnaire.welliemd.com)
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin_panel_domain">
                    Admin Panel Domain <span className="text-red-500">*</span>
                    <FieldInfo content="Full URL to the client's admin panel (must include https://)" />
                  </Label>
                  <Input
                    id="admin_panel_domain"
                    type="url"
                    value={formData.admin_panel_domain}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        admin_panel_domain: e.target.value,
                      });
                      if (validationErrors.admin_panel_domain) {
                        setValidationErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.admin_panel_domain;
                          return newErrors;
                        });
                      }
                    }}
                    placeholder="https://admin.acme.com"
                    required
                    className={validationErrors.admin_panel_domain ? "border-red-500" : ""}
                  />
                  {validationErrors.admin_panel_domain && (
                    <p className="text-xs text-red-500">{validationErrors.admin_panel_domain}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="patient_portal_domain">
                    Patient Portal Domain
                  </Label>
                  <Input
                    id="patient_portal_domain"
                    type="url"
                    value={formData.patient_portal_domain}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        patient_portal_domain: e.target.value,
                      })
                    }
                    placeholder="https://portal.acme.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="api_endpoint">API Endpoint</Label>
                  <Input
                    id="api_endpoint"
                    type="url"
                    value={formData.api_endpoint}
                    onChange={(e) =>
                      setFormData({ ...formData, api_endpoint: e.target.value })
                    }
                    placeholder="https://api.acme.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="questionnaire_url">Questionnaire URL</Label>
                  <Input
                    id="questionnaire_url"
                    type="url"
                    value={formData.questionnaire_url}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        questionnaire_url: e.target.value,
                      })
                    }
                    placeholder="https://questionnaire.acme.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="allowed_iframe_domains">
                    Allowed Iframe Domains (JSON Array)
                    <FieldInfo content='Enter a JSON array of domains. Example: ["example.com", "*.subdomain.com"]. Use * for wildcards.' />
                  </Label>
                  <Textarea
                    id="allowed_iframe_domains"
                    value={JSON.stringify(
                      formData.allowed_iframe_domains,
                      null,
                      2
                    )}
                    onChange={(e) => {
                      const value = e.target.value;
                      try {
                        const parsed = JSON.parse(value);
                        if (Array.isArray(parsed)) {
                          setFormData({
                            ...formData,
                            allowed_iframe_domains: parsed,
                          });
                          setValidationErrors((prev) => {
                            const newErrors = { ...prev };
                            delete newErrors.allowed_iframe_domains;
                            return newErrors;
                          });
                        } else {
                          setValidationErrors((prev) => ({
                            ...prev,
                            allowed_iframe_domains: "Must be a JSON array",
                          }));
                        }
                      } catch (error) {
                        setValidationErrors((prev) => ({
                          ...prev,
                          allowed_iframe_domains: "Invalid JSON format",
                        }));
                      }
                    }}
                    placeholder='["example.com", "*.subdomain.com"]'
                    rows={4}
                    className={validationErrors.allowed_iframe_domains ? "border-red-500" : ""}
                  />
                  {validationErrors.allowed_iframe_domains ? (
                    <p className="text-xs text-red-500">{validationErrors.allowed_iframe_domains}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      List of domains allowed to embed this client's questionnaire
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: Database Configuration */}
          <TabsContent value="database" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Database Configuration</CardTitle>
                <CardDescription>
                  Database connection settings for this client
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="database_host">
                      Database Host
                      <FieldInfo content="Database server hostname or IP address. Default is 127.0.0.1 (localhost)" />
                    </Label>
                    <Input
                      id="database_host"
                      value={formData.database_host}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          database_host: e.target.value,
                        })
                      }
                      placeholder="127.0.0.1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="database_name">
                      Database Name <span className="text-red-500">*</span>
                      <FieldInfo content="Unique database name for this client (e.g., acme_db, client_healthcare)" />
                    </Label>
                    <Input
                      id="database_name"
                      value={formData.database_name}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          database_name: e.target.value,
                        });
                        if (validationErrors.database_name) {
                          setValidationErrors((prev) => {
                            const newErrors = { ...prev };
                            delete newErrors.database_name;
                            return newErrors;
                          });
                        }
                      }}
                      placeholder="acme_db"
                      required
                      className={validationErrors.database_name ? "border-red-500" : ""}
                    />
                    {validationErrors.database_name && (
                      <p className="text-xs text-red-500">{validationErrors.database_name}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 4: Billing Configuration */}
          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Fee Configuration</CardTitle>
                <CardDescription>
                  Configure fees and billing settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="patient_fee">Patient Fee ($)</Label>
                    <Input
                      id="patient_fee"
                      type="number"
                      step="0.01"
                      value={formData.patient_fee}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          patient_fee: parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="async_consult_fee_to_client">
                      Async Consult Fee ($)
                    </Label>
                    <Input
                      id="async_consult_fee_to_client"
                      type="number"
                      step="0.01"
                      value={formData.async_consult_fee_to_client}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          async_consult_fee_to_client: parseFloat(
                            e.target.value
                          ),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="async_consult_cost">
                      Async Consult Cost ($)
                    </Label>
                    <Input
                      id="async_consult_cost"
                      type="number"
                      step="0.01"
                      value={formData.async_consult_cost}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          async_consult_cost: parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sync_video_consult_fee_to_client">
                      Sync Consult Fee ($)
                    </Label>
                    <Input
                      id="sync_video_consult_fee_to_client"
                      type="number"
                      step="0.01"
                      value={formData.sync_video_consult_fee_to_client}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          sync_video_consult_fee_to_client: parseFloat(
                            e.target.value
                          ),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sync_consult_cost">
                      Sync Consult Cost ($)
                    </Label>
                    <Input
                      id="sync_consult_cost"
                      type="number"
                      step="0.01"
                      value={formData.sync_consult_cost}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          sync_consult_cost: parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="monthly_saas_fee">
                      Monthly SaaS Fee ($)
                    </Label>
                    <Input
                      id="monthly_saas_fee"
                      type="number"
                      step="0.01"
                      value={formData.monthly_saas_fee}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          monthly_saas_fee: parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="first_next_saas_fees_billing_date">
                    First/Next SaaS Billing Date
                  </Label>
                  <Input
                    id="first_next_saas_fees_billing_date"
                    type="date"
                    value={formData.first_next_saas_fees_billing_date}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        first_next_saas_fees_billing_date: e.target.value,
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Gateway</CardTitle>
                <CardDescription>
                  Select the primary payment gateway for this client
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="payment_gateway">Payment Gateway</Label>
                  <Select
                    value={formData.payment_gateway}
                    onValueChange={(value) =>
                      setFormData({ ...formData, payment_gateway: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gateway" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nmi">NMI</SelectItem>
                      <SelectItem value="authorize_net">
                        Authorize.Net
                      </SelectItem>
                      <SelectItem value="stripe">Stripe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 5: Advanced Settings */}
          <TabsContent value="advanced" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Configuration</CardTitle>
                <CardDescription>
                  Template, branding, and security settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="default_template_id">
                    Default Template ID
                  </Label>
                  <Input
                    id="default_template_id"
                    value={formData.default_template_id}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        default_template_id: e.target.value,
                      })
                    }
                    placeholder="template-uuid"
                  />
                  <p className="text-xs text-muted-foreground">
                    Default questionnaire template for this client
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="token_expiry_minutes">
                    Token Expiry (Minutes)
                  </Label>
                  <Input
                    id="token_expiry_minutes"
                    type="number"
                    min="5"
                    max="1440"
                    value={formData.token_expiry_minutes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        token_expiry_minutes: parseInt(e.target.value),
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Token expiry time (5-1440 minutes)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="branding_config">
                    Branding Configuration (JSON)
                  </Label>
                  <Textarea
                    id="branding_config"
                    value={JSON.stringify(formData.branding_config, null, 2)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        setFormData({ ...formData, branding_config: parsed });
                      } catch (error) {
                        // Invalid JSON, don't update
                      }
                    }}
                    placeholder='{"primary_color": "#007bff", "logo_url": "..."}'
                    rows={8}
                  />
                  <p className="text-xs text-muted-foreground">
                    Client-specific branding (colors, logo, theme, etc.)
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </form>

      {/* Password Display Modal */}
      <PasswordDisplayModal
        open={showPasswordModal}
        onClose={handlePasswordModalClose}
        password={generatedPassword}
        clientName={clientName}
      />
    </div>
  );
}
