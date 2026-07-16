import { useState, useEffect } from "react";
import JunctionIntegrationPanel from "@/components/clients/junction/JunctionIntegrationPanel";
import type { AxiosError } from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save, Loader2, Info, AlertCircle, Eye, EyeOff, CreditCard, RefreshCcw } from "lucide-react";
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
import { B2BBillingDisplay } from "@/components/billing/B2BBillingDisplay";
import { B2BInvoiceList } from "@/components/billing/B2BInvoiceList";
import { BillingLockStatusCard } from "@/components/billing/BillingLockStatusCard";
import { BillingConfigEditor } from "@/components/billing/BillingConfigEditor";

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

const generateSecurePassword = (length = 20) => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";
  const cryptoObj = globalThis.crypto;
  if (!cryptoObj?.getRandomValues) {
    return Array.from({ length }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  }
  const bytes = new Uint32Array(length);
  cryptoObj.getRandomValues(bytes);
  return Array.from(bytes, (value) => alphabet[value % alphabet.length]).join("");
};

type ClientCreationDetails = {
  clientId: string;
  adminEmail: string;
  adminPanelDomain: string;
  apiEndpoint: string;
  questionnaireUrl?: string;
  customDomain?: string;
  domain?: string;
  subdomain?: string;
};

export default function ClientForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const isEditMode = !!id;

  const [activeTab, setActiveTab] = useState("basic");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [clientName, setClientName] = useState("");
  const [createdClientId, setCreatedClientId] = useState<string | null>(null);
  const [createdClientDetails, setCreatedClientDetails] = useState<ClientCreationDetails | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [hasPaymentMethod, setHasPaymentMethod] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form state
  const [formData, setFormData] = useState<ClientCreatePayload>({
    // User Information
    email: "",
    first_name: "",
    last_name: "",
    phone: "",
    password: generateSecurePassword(),

    // Client Basic Information
    name: "",
    domain: "",
    subdomain: "",
    custom_domain: "",
    master_id_prefix: "welliemd",
    beluga_company: "",
    admin_panel_domain: "",
    patient_portal_domain: "",
    api_endpoint: "",
    questionnaire_url: "",

    // Billing Settings
    async_consult_fee_to_client: 30.0,
    async_consult_cost: 25.0,
    sync_video_consult_fee_to_client: 60.0,
    sync_consult_cost: 50.0,
    include_cost_to_client_in_reimbursement: true,
    include_shipping_cost_to_client_in_reimbursement: true,

    // Payment Gateway
    payment_gateway: "nmi",

    // Status
    is_active: true,
  });

  // Track whether the master_id_prefix has been manually edited by the user.
  // If false, we'll auto-update the prefix when the client name changes.
  const [prefixTouched, setPrefixTouched] = useState(false);

  // Track whether other derived fields have been manually edited.
  const [emailTouched, setEmailTouched] = useState(false);
  const [firstNameTouched, setFirstNameTouched] = useState(false);
  const [lastNameTouched, setLastNameTouched] = useState(false);
  const [adminDomainTouched, setAdminDomainTouched] = useState(false);
  const [subdomainTouched, setSubdomainTouched] = useState(false);
  const [patientPortalDomainTouched, setPatientPortalDomainTouched] = useState(false);

  // Derive a safe master id prefix from a client name: lowercase + remove non-alphanumerics
  const derivePrefix = (name: string) => {
    if (!name) return "";
    return name.toLowerCase().replace(/[^a-z0-9]/g, "");
  };

  // Derive first name from client name (first word)
  const deriveFirstName = (name: string) => {
    if (!name) return "";
    return name.trim().split(/\s+/)[0];
  };

  // Derive last name from client name (remaining words joined)
  const deriveLastName = (name: string) => {
    if (!name) return "";
    const parts = name.trim().split(/\s+/);
    return parts.length > 1 ? parts.slice(1).join(" ") : "";
  };

  // Extract hostname for allowed_iframe_domains from a full URL value.
  const getIframeDomainFromUrl = (urlValue: string) => {
    try {
      return new URL(urlValue).hostname;
    } catch {
      return "";
    }
  };

  // Fetch existing client data if editing
  const { data: existingClient, isLoading: isLoadingClient } = useQuery({
    queryKey: ["client", id],
    queryFn: () => clientApi.get(id!),
    enabled: isEditMode,
  });

  // Fetch payment method status if editing
  const { data: paymentMethodData } = useQuery({
    queryKey: ["paymentMethod", id],
    queryFn: () => clientApi.getPaymentMethod(id!),
    enabled: isEditMode && !!id,
  });

  // Update hasPaymentMethod state when payment method data changes
  useEffect(() => {
    if (paymentMethodData) {
      setHasPaymentMethod(!!paymentMethodData.payment_method && paymentMethodData.status !== "none");
    }
  }, [paymentMethodData]);

  // Populate form with existing data
  useEffect(() => {
    if (existingClient) {
      setFormData({
        email: existingClient.user?.email || "",
        first_name: existingClient.user?.first_name || "",
        last_name: existingClient.user?.last_name || "",
        phone: existingClient.user?.phone || "",
        password: existingClient.deployment_password || "",
        name: existingClient.name,
        domain: existingClient.domain || "",
        subdomain: existingClient.subdomain || "",
        custom_domain: existingClient.custom_domain || "",
        master_id_prefix: existingClient.master_id_prefix || "welliemd",
        beluga_company: existingClient.beluga_company || "",
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
        async_consult_fee_to_client:
          existingClient.async_consult_fee_to_client || 30.0,
        async_consult_cost: existingClient.async_consult_cost || 25.0,
        sync_video_consult_fee_to_client:
          existingClient.sync_video_consult_fee_to_client || 60.0,
        sync_consult_cost: existingClient.sync_consult_cost || 50.0,
        include_cost_to_client_in_reimbursement:
          existingClient.include_cost_to_client_in_reimbursement ?? true,
        include_shipping_cost_to_client_in_reimbursement:
          existingClient.include_shipping_cost_to_client_in_reimbursement ?? true,
        payment_gateway: existingClient.payment_gateway || "nmi",
        is_active: existingClient.is_active,
      });
      setClientName(existingClient.name);
      // When loading an existing client, treat derived fields as already "touched"
      // so we don't override existing, intentional values.
      setPrefixTouched(true);
      setEmailTouched(true);
      setFirstNameTouched(true);
      setLastNameTouched(true);
      setAdminDomainTouched(true);
      setSubdomainTouched(true);
      setPatientPortalDomainTouched(true);
    }
  }, [existingClient]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: ClientCreatePayload) => clientApi.create(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["client-lifecycle", response.client.id] });
      setGeneratedPassword(response.deployment_password);
      setClientName(response.client.name);
      setCreatedClientId(response.client.id);
      setCreatedClientDetails({
        clientId: response.client.id,
        adminEmail: response.user.email,
        adminPanelDomain: response.client.admin_panel_domain,
        apiEndpoint: response.client.api_endpoint,
        questionnaireUrl: response.client.questionnaire_url,
        customDomain: response.client.custom_domain,
        domain: response.client.domain,
        subdomain: response.client.subdomain,
      });
      setShowPasswordModal(true);
      toast({
        title: "Success",
        description: response.message,
      });
    },
    onError: (error: unknown) => {
      const resp = (error as AxiosError<Record<string, unknown>>)?.response?.data || {};
      let message = "Failed to create client";

      // Check for field-specific validation errors (e.g., email already exists)
      if (resp.email) {
        // If email is an array, join the messages; otherwise convert to string
        const emailError = Array.isArray(resp.email) ? resp.email.join(' ') : String(resp.email);
        
        // Transform backend email error to user-friendly message
        if (emailError.toLowerCase().includes("already exists")) {
          message = "A client with this email already exists.";
        } else {
          message = emailError;
        }
      } else if (resp.error) {
        // Generic error message from backend
        message = String(resp.error);
      } else if (resp.message) {
        message = String(resp.message);
      }

      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    },
  });

  // Email update mutation (separate from regular update)
  const emailUpdateMutation = useMutation({
    mutationFn: (newEmail: string) => clientApi.updateEmail(id!, newEmail),
    onSuccess: (response) => {
      toast({
        title: "Email Updated",
        description: response.message,
      });
    },
    onError: (error: unknown) => {
      toast({
        title: "Error",
        description:
          error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to update email",
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
    },
    onError: (error: unknown) => {
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
      // In edit mode, user-related fields (email, phone, first_name, last_name, password) are disabled
      // so we only update client-related fields
      const updatePayload: ClientUpdatePayload = {
        name: formData.name,
        domain: formData.domain,
        subdomain: formData.subdomain,
        master_id_prefix: formData.master_id_prefix,
        beluga_company: formData.beluga_company,
        admin_panel_domain: formData.admin_panel_domain,
        patient_portal_domain: formData.patient_portal_domain,
        questionnaire_url: formData.questionnaire_url,
        allowed_iframe_domains: formData.allowed_iframe_domains,
        default_template_id: formData.default_template_id,
        branding_config: formData.branding_config,
        token_expiry_minutes: formData.token_expiry_minutes,
        database_host: formData.database_host,
        database_name: formData.database_name,
        async_consult_fee_to_client: formData.async_consult_fee_to_client,
        async_consult_cost: formData.async_consult_cost,
        sync_video_consult_fee_to_client:
          formData.sync_video_consult_fee_to_client,
        sync_consult_cost: formData.sync_consult_cost,
        include_cost_to_client_in_reimbursement:
          formData.include_cost_to_client_in_reimbursement,
        include_shipping_cost_to_client_in_reimbursement:
          formData.include_shipping_cost_to_client_in_reimbursement,
        payment_gateway: formData.payment_gateway,
        is_active: formData.is_active,
      };
      updateMutation.mutate(updatePayload);
    } else {
      const createPayload: ClientCreatePayload = { ...formData };
      delete createPayload.custom_domain;
      createMutation.mutate(createPayload);
    }
  };

  const handlePasswordModalClose = () => {
    setShowPasswordModal(false);
    navigate(createdClientId ? `/dashboard/clients/${createdClientId}/lifecycle` : "/dashboard/clients");
  };

  if (isEditMode && isLoadingClient) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const isLoading = createMutation.isPending || updateMutation.isPending || emailUpdateMutation.isPending;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-2 sm:gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0 mt-1 sm:mt-0 px-2 sm:px-3"
            onClick={() => navigate("/dashboard/clients")}
          >
            <ArrowLeft className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">
              {isEditMode ? "Edit Client" : "Create New Client"}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {isEditMode
                ? "Update client information and settings"
                : "Set up a new client with admin user account"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {isEditMode ? (
            <Button
              type="button"
              variant="outline"
              className="flex-1 sm:flex-none"
              onClick={() => navigate(`/dashboard/clients/${id}/lifecycle`)}
            >
              <span className="hidden sm:inline">View Lifecycle</span>
              <span className="sm:hidden">Lifecycle</span>
            </Button>
          ) : null}
          <Button onClick={handleSubmit} disabled={isLoading} className="flex-1 sm:flex-none">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                <span className="hidden sm:inline">{isEditMode ? "Updating..." : "Creating..."}</span>
                <span className="sm:hidden">{isEditMode ? "Updating" : "Creating"}</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{isEditMode ? "Update Client" : "Create Client"}</span>
                <span className="sm:hidden">{isEditMode ? "Update" : "Create"}</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="domains">Domains</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
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
                        const newName = e.target.value;
                        const p = derivePrefix(newName);
                        const fn = deriveFirstName(newName);
                        const ln = deriveLastName(newName);
                        const derivedQuestionnaireUrl = p
                          ? `https://${p}questionnaire.welliemd.com`
                          : "";
                        const derivedIframeDomain = getIframeDomainFromUrl(derivedQuestionnaireUrl);
                        setFormData((prev) => ({
                          ...prev,
                          name: newName,
                          master_id_prefix: prefixTouched
                            ? prev.master_id_prefix
                            : p || prev.master_id_prefix,
                          email: emailTouched
                            ? prev.email
                            : p
                              ? `${p}@welliemd.com`
                              : prev.email,
                          admin_panel_domain: adminDomainTouched
                            ? prev.admin_panel_domain
                            : p
                              ? `https://${p}client.welliemd.com`
                              : prev.admin_panel_domain,
                          subdomain: subdomainTouched
                            ? prev.subdomain
                            : p
                              ? `https://${p}questionnaire.welliemd.com`
                              : prev.subdomain,
                          questionnaire_url: subdomainTouched
                            ? prev.questionnaire_url
                            : derivedQuestionnaireUrl || prev.questionnaire_url,
                          allowed_iframe_domains: subdomainTouched
                            ? prev.allowed_iframe_domains
                            : derivedIframeDomain
                              ? [derivedIframeDomain]
                              : prev.allowed_iframe_domains,
                          domain: p
                            ? `${p}.api.welliemd.com`
                            : prev.domain,
                          api_endpoint: p
                            ? `https://${p}.api.welliemd.com`
                            : prev.api_endpoint,
                          patient_portal_domain: patientPortalDomainTouched
                            ? prev.patient_portal_domain
                            : p
                              ? `https://${p}patientportal.welliemd.com`
                              : prev.patient_portal_domain,
                          first_name: firstNameTouched
                            ? prev.first_name
                            : fn || prev.first_name,
                          last_name: lastNameTouched
                            ? prev.last_name
                            : ln || prev.last_name,
                        }));
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
                      onChange={(e) => {
                        setPrefixTouched(true);
                        setFormData({
                          ...formData,
                          master_id_prefix: e.target.value.toLowerCase(),
                        });
                      }}
                      onFocus={() => setPrefixTouched(true)}
                      placeholder="welliemd"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="beluga_company">
                    Beluga Company Name
                    <FieldInfo content="This is the company name that will be sent to Beluga when a visit is created." />
                  </Label>
                  <Input
                    id="beluga_company"
                    value={formData.beluga_company}
                    onChange={(e) =>
                      setFormData({ ...formData, beluga_company: e.target.value })
                    }
                    placeholder="e.g., wellieMDKinMeds"
                  />
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
                    ? "Admin user details (cannot be changed)"
                    : "This user will be created as the client's Primary Owner and can log in with the password shown after submission"}
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
                        setEmailTouched(true);
                        setFormData({ ...formData, email: e.target.value });
                        if (validationErrors.email) {
                          setValidationErrors((prev) => {
                            const newErrors = { ...prev };
                            delete newErrors.email;
                            return newErrors;
                          });
                        }
                      }}
                      onFocus={() => setEmailTouched(true)}
                      placeholder="admin@acme.com"
                      required
                      disabled={isEditMode}
                      className={validationErrors.email ? "border-red-500" : ""}
                    />
                    {validationErrors.email && (
                      <p className="text-xs text-red-500">{validationErrors.email}</p>
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
                      disabled={isEditMode}
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
                        setFirstNameTouched(true);
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
                      disabled={isEditMode}
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
                        setLastNameTouched(true);
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
                      disabled={isEditMode}
                      className={validationErrors.last_name ? "border-red-500" : ""}
                    />
                    {validationErrors.last_name && (
                      <p className="text-xs text-red-500">{validationErrors.last_name}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value.replace(/\s+/g, '') })
                      }
                      placeholder={isEditMode ? "Leave blank to keep current password" : "Password"}
                      required={false}
                      disabled={isEditMode}
                      className={validationErrors.password ? "border-red-500 pr-24" : "pr-24"}
                    />
                    <div className="absolute right-0 top-0 flex h-full items-center">
                      {!isEditMode ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-full px-2 hover:bg-transparent"
                          onClick={() =>
                            setFormData((prev) => ({ ...prev, password: generateSecurePassword() }))
                          }
                        >
                          <RefreshCcw className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                  {validationErrors.password && (
                    <p className="text-xs text-red-500">{validationErrors.password}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Domain Configuration - Streamlined */}
          <TabsContent value="domains" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Domain Configuration</CardTitle>
                <CardDescription>
                  Essential domain and endpoint configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin_panel_domain">
                    Client Portal Domain <span className="text-red-500">*</span>
                    <FieldInfo content="Full URL to the client's admin panel (must include https://)" />
                  </Label>
                  <Input
                    id="admin_panel_domain"
                    type="url"
                    value={formData.admin_panel_domain}
                    onChange={(e) => {
                      setAdminDomainTouched(true);
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
                    onFocus={() => setAdminDomainTouched(true)}
                    placeholder="https://admin.acme.com"
                    required
                    className={validationErrors.admin_panel_domain ? "border-red-500" : ""}
                  />
                  {validationErrors.admin_panel_domain && (
                    <p className="text-xs text-red-500">{validationErrors.admin_panel_domain}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Primary URL where client admins will access the system
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="patient_portal_domain">Patient Portal Preview URL</Label>
                  <Input
                    id="patient_portal_domain"
                    type="url"
                    value={formData.patient_portal_domain}
                    onChange={(e) => {
                      setPatientPortalDomainTouched(true);
                      setFormData({ ...formData, patient_portal_domain: e.target.value });
                      if (validationErrors.patient_portal_domain) {
                        setValidationErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.patient_portal_domain;
                          return newErrors;
                        });
                      }
                    }}
                    onFocus={() => setPatientPortalDomainTouched(true)}
                    placeholder="https://patient.acme.com"
                    className={validationErrors.patient_portal_domain ? "border-red-500" : ""}
                  />
                  {validationErrors.patient_portal_domain && (
                    <p className="text-xs text-red-500">{validationErrors.patient_portal_domain}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Patient portal domain (editable)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subdomain">Questionnaire Domain</Label>
                  <Input
                    id="subdomain"
                    value={formData.subdomain}
                    onChange={(e) => {
                      setSubdomainTouched(true);
                      const questionnaireDomain = e.target.value;
                      const iframeDomain = getIframeDomainFromUrl(questionnaireDomain);
                      setFormData({
                        ...formData,
                        subdomain: questionnaireDomain,
                        questionnaire_url: questionnaireDomain,
                        allowed_iframe_domains: iframeDomain ? [iframeDomain] : [],
                      });
                    }}
                    onFocus={() => setSubdomainTouched(true)}
                    placeholder="https://acme.questionnaire.welliemd.com"
                  />
                  <p className="text-xs text-muted-foreground">
                    URL used for questionnaire app
                  </p>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription className="space-y-2">
                    <p>
                      Custom domain management is client-owned. Operators should direct Primary Owner or Admin users to
                      the client portal settings page to add, verify, or delete domain aliases.
                    </p>
                    {isEditMode && formData.custom_domain ? (
                      <p className="text-xs text-muted-foreground">
                        Legacy base domain on this client: <span className="font-mono">{formData.custom_domain}</span>
                      </p>
                    ) : null}
                    {isEditMode && existingClient?.pending_custom_domain ? (
                      <p className="text-xs text-muted-foreground">
                        Legacy pending domain: <span className="font-mono">{existingClient.pending_custom_domain}</span>
                      </p>
                    ) : null}
                    {isEditMode && existingClient?.domain_provisioning_error ? (
                      <p className="text-xs text-destructive">
                        Legacy provisioning error: {existingClient.domain_provisioning_error.error || "Unknown error"}
                      </p>
                    ) : null}
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="api_endpoint">API Endpoint</Label>
                  <Input
                    id="api_endpoint"
                    type="url"
                    value={formData.api_endpoint}
                    placeholder="https://api.acme.com"
                    readOnly
                    className="bg-muted cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground">
                    Base API URL for this client's backend services
                  </p>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Additional domain fields (Patient Portal, Questionnaire URL, etc.) can be configured later if needed.
                    These three fields are sufficient for initial setup.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: Billing Configuration */}
          <TabsContent value="billing" className="space-y-6">
            {/* Section 1: Fee Configuration */}
            <section className="bg-card rounded-2xl border shadow-sm overflow-hidden">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Fee Configuration
                </h2>
                <p className="text-xs text-muted-foreground mt-1">Configure fees and billing settings</p>
              </div>
              <div className="p-4 space-y-6">
                {/* Async Consult Fees */}
                <div className="bg-muted/50 rounded-xl p-4 border">
                  <h3 className="text-sm font-semibold mb-3">Async Consult Fees</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="async_consult_fee_to_client" className="block text-xs font-medium text-muted-foreground mb-1.5">
                        Async Consult Fee ($)
                      </Label>
                      <Input
                        id="async_consult_fee_to_client"
                        type="number"
                        step="0.01"
                        className="bg-card"
                        value={formData.async_consult_fee_to_client}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            async_consult_fee_to_client: e.target.value === "" ? 0 : parseFloat(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="async_consult_cost" className="block text-xs font-medium text-muted-foreground mb-1.5">
                        Async Consult Cost ($)
                      </Label>
                      <Input
                        id="async_consult_cost"
                        type="number"
                        step="0.01"
                        className="bg-card"
                        value={formData.async_consult_cost}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            async_consult_cost: e.target.value === "" ? 0 : parseFloat(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Sync Consult Fees */}
                <div className="bg-muted/50 rounded-xl p-4 border">
                  <h3 className="text-sm font-semibold mb-3">Sync Consult Fees</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="sync_video_consult_fee_to_client" className="block text-xs font-medium text-muted-foreground mb-1.5">
                        Sync Consult Fee ($)
                      </Label>
                      <Input
                        id="sync_video_consult_fee_to_client"
                        type="number"
                        step="0.01"
                        className="bg-card"
                        value={formData.sync_video_consult_fee_to_client}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            sync_video_consult_fee_to_client: e.target.value === "" ? 0 : parseFloat(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="sync_consult_cost" className="block text-xs font-medium text-muted-foreground mb-1.5">
                        Sync Consult Cost ($)
                      </Label>
                      <Input
                        id="sync_consult_cost"
                        type="number"
                        step="0.01"
                        className="bg-card"
                        value={formData.sync_consult_cost}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            sync_consult_cost: e.target.value === "" ? 0 : parseFloat(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Reimbursement Charge Options */}
                <div className="bg-muted/50 rounded-xl p-4 border">
                  <h3 className="text-sm font-semibold mb-3">Reimbursement Charge Options</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="pr-4">
                        <p className="text-sm font-medium">Include medication cost to client</p>
                        <p className="text-xs text-muted-foreground">Charges product cost on reimbursement invoices.</p>
                      </div>
                      <Switch
                        checked={formData.include_cost_to_client_in_reimbursement ?? true}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            include_cost_to_client_in_reimbursement: checked,
                          })
                        }
                      />
                    </div>
                    <div className="h-px bg-border w-full" />
                    <div className="flex items-center justify-between">
                      <div className="pr-4">
                        <p className="text-sm font-medium">Include shipping cost to client</p>
                        <p className="text-xs text-muted-foreground">Charges shipping cost on reimbursement invoices.</p>
                      </div>
                      <Switch
                        checked={formData.include_shipping_cost_to_client_in_reimbursement ?? true}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            include_shipping_cost_to_client_in_reimbursement: checked,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* B2B Billing - Only show in edit mode */}
            {isEditMode && id && (
              <>
                {/* Section 2: Billing Status - Lock state indicator */}
                <BillingLockStatusCard clientId={id} />

                {/* Section 3: Billing Configuration - Base fee, patient fee, schedule */}
                <BillingConfigEditor clientId={id} />

                {/* Section 4: B2B Billing Status - Payment method & subscription */}
                <B2BBillingDisplay clientId={id} client={existingClient} />

                {/* Section 5: B2B Invoices - Invoice history */}
                <B2BInvoiceList clientId={id} />
              </>
            )}
          </TabsContent>

          {/* Tab 4: Integrations */}
          <TabsContent value="integrations" className="space-y-6">
            {isEditMode && id ? (
              <JunctionIntegrationPanel clientId={id} />
            ) : (
              <div className="rounded-md border bg-muted/30 p-6 text-sm text-muted-foreground">
                Save the client first, then provision and manage its Junction integration here.
              </div>
            )}
          </TabsContent>

        </Tabs>
      </form>

      {/* Password Display Modal */}
      {createdClientDetails ? (
        <PasswordDisplayModal
          open={showPasswordModal}
          onClose={handlePasswordModalClose}
          password={generatedPassword}
          clientName={clientName}
          clientDetails={createdClientDetails}
        />
      ) : null}
    </div>
  );
}
