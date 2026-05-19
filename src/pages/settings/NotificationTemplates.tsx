import { useState, useEffect, useCallback, useMemo } from "react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Loader2, Pencil, ChevronDown, ChevronUp, Mail, MessageSquare, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  notificationTemplatesApi,
  type NotificationTemplateListItem,
  type NotificationTemplate,
  type TemplateTypeInfo,
  type CreateNotificationTemplatePayload,
  type UpdateNotificationTemplatePayload,
  type TestAllTemplatesResponse,
} from "@/api/notificationTemplatesApi";

type PaginatedResponse<T> = {
  results?: T[];
};

type ApiErrorResponse = {
  response?: {
    data?: {
      subject?: string | string[];
      email_body?: string | string[];
      sms_body?: string | string[];
      template_type?: string | string[];
      detail?: string;
    };
  };
};

const formatFieldError = (error?: string | string[]) => {
  if (!error) return "";
  return Array.isArray(error) ? error.join(", ") : error;
};

export default function NotificationTemplates() {
  const [templates, setTemplates] = useState<NotificationTemplateListItem[]>([]);
  const [templateTypes, setTemplateTypes] = useState<TemplateTypeInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<NotificationTemplateListItem | null>(null);
  const [variablesOpen, setVariablesOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Test Templates state
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testingAll, setTestingAll] = useState(false);
  const [testResults, setTestResults] = useState<TestAllTemplatesResponse | null>(null);
  const [selectedTestTemplates, setSelectedTestTemplates] = useState<string[]>([]);
  
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState<CreateNotificationTemplatePayload>({
    name: "",
    template_type: "",
    subject: "",
    short_description: "",
    email_body: "",
    sms_body: "",
    email_enabled: true,
    sms_enabled: true,
  });

  // Load templates
  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const [templatesResponse, typesResponse] = await Promise.all([
        notificationTemplatesApi.fetchAll(),
        notificationTemplatesApi.fetchTemplateTypes(),
      ]);
      // Handle both array and paginated response formats
      const templateList = templatesResponse as NotificationTemplateListItem[] | PaginatedResponse<NotificationTemplateListItem>;
      const typeList = typesResponse as TemplateTypeInfo[] | PaginatedResponse<TemplateTypeInfo>;
      const templatesData = Array.isArray(templateList) ? templateList : templateList.results || [];
      const typesData = Array.isArray(typeList) ? typeList : typeList.results || [];
      setTemplates(templatesData);
      setTemplateTypes(typesData);
    } catch (error) {
      console.error("Failed to load templates:", error);
      toast({
        title: "Error",
        description: "Failed to load notification templates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // Get variables for selected template type
  const getVariablesForType = (templateType: string) => {
    const type = templateTypes.find((t) => t.value === templateType);
    return type?.variables || [];
  };

  // Get template types that are already used
  const usedTemplateTypes = useMemo(() => {
    return new Set(templates.map(t => t.template_type));
  }, [templates]);

  // Get available template types for creation (not yet used)
  const availableTemplateTypes = useMemo(() => {
    return templateTypes.filter(t => !usedTemplateTypes.has(t.value));
  }, [templateTypes, usedTemplateTypes]);

  // Handle channel toggle
  const handleToggleChannel = async (
    template: NotificationTemplateListItem,
    channel: "email_enabled" | "sms_enabled",
    checked: boolean
  ) => {
    try {
      await notificationTemplatesApi.update(template.id, { [channel]: checked });
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === template.id ? { ...t, [channel]: checked } : t
        )
      );
      toast({
        title: "Success",
        description: `${channel === "email_enabled" ? "Email" : "SMS"} notifications updated`,
      });
    } catch (error) {
      console.error("Failed to toggle template:", error);
      toast({
        title: "Error",
        description: "Failed to update notification channel",
        variant: "destructive",
      });
    }
  };

  // Open edit sheet
  const handleEdit = async (template: NotificationTemplateListItem) => {
    try {
      const fullTemplate = await notificationTemplatesApi.fetch(template.id);
      setSelectedTemplate(fullTemplate);
      setFormData({
        name: fullTemplate.name,
        template_type: fullTemplate.template_type,
        subject: fullTemplate.subject || "",
        short_description: fullTemplate.short_description || "",
        email_body: fullTemplate.email_body || "",
        sms_body: fullTemplate.sms_body || "",
        email_enabled: fullTemplate.email_enabled,
        sms_enabled: fullTemplate.sms_enabled,
      });
      setVariablesOpen(false);
      setIsSheetOpen(true);
    } catch (error) {
      console.error("Failed to load template:", error);
      toast({
        title: "Error",
        description: "Failed to load template details",
        variant: "destructive",
      });
    }
  };

  // Open create sheet
  const handleCreate = () => {
    setSelectedTemplate(null);
    setFormData({
      name: "",
      template_type: "",
      subject: "",
      short_description: "",
      email_body: "",
      sms_body: "",
      email_enabled: true,
      sms_enabled: true,
    });
    setVariablesOpen(false);
    setIsSheetOpen(true);
  };

  // Extract variables from text using regex
  const extractVariables = (text: string): Set<string> => {
    if (!text) return new Set();
    const pattern = /\{\{\s*(\w+)\s*\}\}/g;
    const matches = [...text.matchAll(pattern)];
    return new Set(matches.map(m => m[1]));
  };

  // Validate variables in template content
  const validateVariables = (): { isValid: boolean; errors: string[] } => {
    if (!formData.template_type) {
      return { isValid: true, errors: [] };
    }

    const allowedVars = getVariablesForType(formData.template_type);
    const allowedKeys = new Set(allowedVars.map(v => v.key));
    const errors: string[] = [];

    // Check subject
    const subjectVars = extractVariables(formData.subject);
    const invalidInSubject = [...subjectVars].filter(v => !allowedKeys.has(v));
    if (invalidInSubject.length > 0) {
      errors.push(`Subject contains invalid variable(s): ${invalidInSubject.map(v => `{{ ${v} }}`).join(', ')}`);
    }

    // Check email body
    const emailVars = extractVariables(formData.email_body);
    const invalidInEmail = [...emailVars].filter(v => !allowedKeys.has(v));
    if (invalidInEmail.length > 0) {
      errors.push(`Email Body contains invalid variable(s): ${invalidInEmail.map(v => `{{ ${v} }}`).join(', ')}`);
    }

    // Check SMS body
    const smsVars = extractVariables(formData.sms_body);
    const invalidInSms = [...smsVars].filter(v => !allowedKeys.has(v));
    if (invalidInSms.length > 0) {
      errors.push(`SMS Body contains invalid variable(s): ${invalidInSms.map(v => `{{ ${v} }}`).join(', ')}`);
    }

    return { isValid: errors.length === 0, errors };
  };

  // Handle form submit
  const handleSubmit = async () => {
    if (!formData.name || !formData.template_type) {
      toast({
        title: "Validation Error",
        description: "Template Name and Type are required",
        variant: "destructive",
      });
      return;
    }

    // Validate variables before submission
    const validation = validateVariables();
    if (!validation.isValid) {
      toast({
        title: "Invalid Variables",
        description: validation.errors.join('\n'),
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      if (selectedTemplate) {
        // Update existing
        const updatePayload: UpdateNotificationTemplatePayload = {
          name: formData.name,
          subject: formData.subject,
          short_description: formData.short_description,
          email_body: formData.email_body,
          sms_body: formData.sms_body,
          email_enabled: formData.email_enabled,
          sms_enabled: formData.sms_enabled,
        };
        await notificationTemplatesApi.update(selectedTemplate.id, updatePayload);
        toast({
          title: "Success",
          description: "Template updated successfully",
        });
      } else {
        // Create new
        await notificationTemplatesApi.create(formData);
        toast({
          title: "Success",
          description: "Template created successfully",
        });
      }
      setIsSheetOpen(false);
      loadTemplates();
    } catch (error: unknown) {
      console.error("Failed to save template:", error);
      
      // Handle field-specific validation errors from backend
      const responseData = (error as ApiErrorResponse).response?.data;
      let errorMessage = "Failed to save template";
      
      if (responseData) {
        const fieldErrors: string[] = [];
        if (responseData.subject) fieldErrors.push(`Subject: ${formatFieldError(responseData.subject)}`);
        if (responseData.email_body) fieldErrors.push(`Email: ${formatFieldError(responseData.email_body)}`);
        if (responseData.sms_body) fieldErrors.push(`SMS: ${formatFieldError(responseData.sms_body)}`);
        if (responseData.template_type) fieldErrors.push(formatFieldError(responseData.template_type));
        if (responseData.detail) fieldErrors.push(responseData.detail);
        
        if (fieldErrors.length > 0) {
          errorMessage = fieldErrors.join('\n');
        }
      }
      
      toast({
        title: "Validation Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!templateToDelete) return;

    try {
      await notificationTemplatesApi.delete(templateToDelete.id);
      toast({
        title: "Success",
        description: "Template deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      setTemplateToDelete(null);
      loadTemplates();
    } catch (error) {
      console.error("Failed to delete template:", error);
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      });
    }
  };

  // Handle test templates
  const handleTestTemplates = async () => {
    if (!testEmail) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    if (selectedTestTemplates.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one template to test",
        variant: "destructive",
      });
      return;
    }

    try {
      setTestingAll(true);
      setTestResults(null);
      const results = await notificationTemplatesApi.testTemplates(
        testEmail, 
        selectedTestTemplates
      );
      setTestResults(results);
      toast({
        title: "Test Complete",
        description: results.summary,
      });
    } catch (error) {
      console.error("Failed to test templates:", error);
      toast({
        title: "Error",
        description: "Failed to send test emails",
        variant: "destructive",
      });
    } finally {
      setTestingAll(false);
    }
  };

  // Toggle template selection
  const handleToggleTestTemplate = (templateType: string) => {
    setSelectedTestTemplates(prev => 
      prev.includes(templateType)
        ? prev.filter(t => t !== templateType)
        : [...prev, templateType]
    );
  };

  // Select/deselect all templates
  const handleSelectAllTemplates = () => {
    if (selectedTestTemplates.length === templates.length) {
      setSelectedTestTemplates([]);
    } else {
      setSelectedTestTemplates(templates.map(t => t.template_type));
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  };

  // Filter templates based on search term
  const filteredTemplates = useMemo(() => {
    if (!searchTerm.trim()) return templates;
    const search = searchTerm.toLowerCase();
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(search) ||
        t.template_type.toLowerCase().includes(search) ||
        (t.subject && t.subject.toLowerCase().includes(search))
    );
  }, [templates, searchTerm]);

  const patientTemplates = useMemo(
    () => filteredTemplates.filter((template) => !template.template_type.startsWith("admin_")),
    [filteredTemplates]
  );

  const adminTemplates = useMemo(
    () => filteredTemplates.filter((template) => template.template_type.startsWith("admin_")),
    [filteredTemplates]
  );

  // DataTable columns configuration
  const columns = [
    {
      key: "name",
      label: "Name",
      render: (value: unknown, row: unknown) => {
        const template = row as NotificationTemplateListItem;
        return (
          <span className="text-blue-600 font-medium cursor-pointer hover:underline">
            {template.name}
          </span>
        );
      },
    },
    {
      key: "template_type_display",
      label: "Type",
    },
    {
      key: "subject",
      label: "Subject",
      render: (value: unknown) => {
        const subject = value as string;
        return subject || <span className="text-muted-foreground italic">No subject</span>;
      },
    },
    {
      key: "email_enabled",
      label: "Email",
      render: (_value: unknown, row: unknown) => {
        const template = row as NotificationTemplateListItem;
        return (
          <Switch
            checked={template.email_enabled}
            onClick={(event) => event.stopPropagation()}
            onCheckedChange={(checked) => handleToggleChannel(template, "email_enabled", checked)}
            aria-label={`Toggle email notifications for ${template.name}`}
          />
        );
      },
    },
    {
      key: "sms_enabled",
      label: "SMS",
      render: (_value: unknown, row: unknown) => {
        const template = row as NotificationTemplateListItem;
        return (
          <Switch
            checked={template.sms_enabled}
            onClick={(event) => event.stopPropagation()}
            onCheckedChange={(checked) => handleToggleChannel(template, "sms_enabled", checked)}
            aria-label={`Toggle SMS notifications for ${template.name}`}
          />
        );
      },
    },
    {
      key: "created_at",
      label: "Created At",
      render: (value: unknown) => {
        const date = value as string;
        return formatDate(date);
      },
    },
    {
      key: "__actions",
      label: "Actions",
      render: (_: unknown, row: unknown) => {
        const template = row as NotificationTemplateListItem;
        return (
          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              className="hover:opacity-80"
              title="Edit"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(template);
              }}
            >
              <Pencil className="h-4 w-4" />
            </button>
            {/* Delete button hidden in client portal */}
          </div>
        );
      },
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            className="gap-2" 
            onClick={() => {
              setTestEmail("");
              setTestResults(null);
              setIsTestDialogOpen(true);
            }}
          >
            <Mail className="h-4 w-4" />
            Test All Templates
          </Button>
          {/* Create Template button hidden in client portal */}
        </div>
      </div>

      <Input
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
        placeholder="Search by template name, type, or subject..."
        className="max-w-xl"
      />

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Patient Notifications</h2>
        <DataTable
          data={patientTemplates}
          columns={columns}
          emptyMessage="No patient notification templates found"
          loading={loading}
          onRowClick={(row) => handleEdit(row as NotificationTemplateListItem)}
          showExport={false}
          showResetFilters={false}
          hideToolbar
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Admin Notifications</h2>
        <DataTable
          data={adminTemplates}
          columns={columns}
          emptyMessage="No admin notification templates found"
          loading={loading}
          onRowClick={(row) => handleEdit(row as NotificationTemplateListItem)}
          showExport={false}
          showResetFilters={false}
          hideToolbar
        />
      </section>

      {/* Create/Edit Sheet - Slides from Bottom */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="bottom" className="h-[85vh] p-0">
          <ScrollArea className="h-full">
            <div className="p-6 max-w-4xl mx-auto">
              <SheetHeader className="mb-6">
                <SheetTitle>
                  {selectedTemplate ? "Edit Notification Template" : "Create Notification Template"}
                </SheetTitle>
                <SheetDescription>
                  {selectedTemplate
                    ? "Update your notification template settings"
                    : "Create a new notification template for your patients"}
                </SheetDescription>
              </SheetHeader>

              <div className="grid gap-6">
                {/* Row 1: Name and Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Template Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Appointment Reminder"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="template_type">
                      Choose Type <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.template_type}
                      onValueChange={(value) => setFormData({ ...formData, template_type: value })}
                      disabled={!!selectedTemplate}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a template type" />
                      </SelectTrigger>
                      <SelectContent>
                        {(selectedTemplate ? templateTypes : availableTemplateTypes).map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Subject */}
                <div className="space-y-2">
                  <Label htmlFor="subject">
                    Subject <span className="text-muted-foreground text-xs">(Required for email notification)</span>
                  </Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g., {{ event_type_name }} Appointment Reminder"
                  />
                </div>

                {/* Short Description */}
                <div className="space-y-2">
                  <Label htmlFor="short_description">Short Description</Label>
                  <Textarea
                    id="short_description"
                    value={formData.short_description}
                    onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                    placeholder="Brief description of this template"
                    rows={2}
                  />
                </div>

                {/* Available Variables */}
                {formData.template_type && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      You can insert dynamic variables using{" "}
                      <code className="text-blue-600">{"{{ variableName }}"}</code>. For buttons, use{" "}
                      <code className="text-blue-600">{"[button:Label{{url_key}}]"}</code> format.
                    </p>
                    <Collapsible open={variablesOpen} onOpenChange={setVariablesOpen}>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="w-full justify-between text-blue-600 hover:text-blue-700 p-0">
                          Show Available Variables
                          {variablesOpen ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="mt-2 p-4 rounded-md bg-blue-50 border border-blue-100">
                          {getVariablesForType(formData.template_type).map((variable) => (
                            <div key={variable.key} className="py-1">
                              <code className="text-blue-600">{`{{ ${variable.key} }}`}</code>
                              <span className="text-muted-foreground ml-2">— {variable.description}</span>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                )}

                {/* Email Body */}
                <div className="space-y-2">
                  <Label htmlFor="email_body">
                    Email Body <span className="text-destructive">*</span>
                  </Label>
                  <div className="border rounded-md">
                    {/* Simple toolbar */}
                    <div className="border-b p-2 bg-muted/30 flex items-center gap-2">
                      <select className="text-sm border rounded px-2 py-1 bg-background">
                        <option>Paragraph</option>
                        <option>Heading 1</option>
                        <option>Heading 2</option>
                      </select>
                      <div className="h-4 w-px bg-border" />
                      <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 font-bold">
                        B
                      </Button>
                      <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 italic">
                        I
                      </Button>
                    </div>
                    <Textarea
                      id="email_body"
                      value={formData.email_body}
                      onChange={(e) => setFormData({ ...formData, email_body: e.target.value })}
                      placeholder="Hello {{ name }},&#10;&#10;Your appointment has been scheduled for {{ appointment_date }}.&#10;&#10;Thank you for choosing us!"
                      className="min-h-[200px] border-0 focus-visible:ring-0"
                    />
                  </div>
                </div>

                {/* SMS Body */}
                <div className="space-y-2">
                  <Label htmlFor="sms_body">SMS Body</Label>
                  <Textarea
                    id="sms_body"
                    value={formData.sms_body}
                    onChange={(e) => setFormData({ ...formData, sms_body: e.target.value })}
                    placeholder="Hi {{ name }}, your appointment is on {{ appointment_date }}. Thanks {{ app_name }}"
                    rows={3}
                  />
                </div>

                {/* Channels */}
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="email_enabled">Email</Label>
                    <Switch
                      id="email_enabled"
                      checked={formData.email_enabled}
                      onCheckedChange={(checked) => setFormData({ ...formData, email_enabled: checked })}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="sms_enabled">SMS</Label>
                    <Switch
                      id="sms_enabled"
                      checked={formData.sms_enabled}
                      onCheckedChange={(checked) => setFormData({ ...formData, sms_enabled: checked })}
                    />
                  </div>
                </div>
              </div>

              <SheetFooter className="mt-6 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsSheetOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {selectedTemplate ? "Save Changes" : "Create Template"}
                </Button>
              </SheetFooter>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template?</AlertDialogTitle>
            <AlertDialogDescription>
              {templateToDelete
                ? `This will permanently delete "${templateToDelete.name}". This action cannot be undone.`
                : "This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Test Templates Dialog */}
      <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Test Notification Templates</DialogTitle>
            <DialogDescription>
              Select templates to test and enter an email address to receive test emails.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="test-email">Test Email Address</Label>
              <Input
                id="test-email"
                type="email"
                placeholder="test@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                disabled={testingAll}
              />
            </div>

            {/* Template Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Select Templates to Test</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAllTemplates}
                  disabled={testingAll}
                >
                  {selectedTestTemplates.length === templates.length ? "Deselect All" : "Select All"}
                </Button>
              </div>
              <div className="border rounded-lg max-h-48 overflow-y-auto">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="flex items-center gap-3 px-3 py-2 border-b last:border-b-0 hover:bg-muted/50 cursor-pointer"
                    onClick={() => !testingAll && handleToggleTestTemplate(template.template_type)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTestTemplates.includes(template.template_type)}
                      onChange={() => handleToggleTestTemplate(template.template_type)}
                      disabled={testingAll}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium">{template.name}</span>
                      <p className="text-xs text-muted-foreground">{template.template_type}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant={template.email_enabled ? "secondary" : "outline"} className="text-xs">
                        Email
                      </Badge>
                      <Badge variant={template.sms_enabled ? "secondary" : "outline"} className="text-xs">
                        SMS
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                {selectedTestTemplates.length} of {templates.length} templates selected
              </p>
            </div>

            {/* Test Results */}
            {testResults && (
              <div className="space-y-3">
                <div className={`p-3 rounded-lg ${testResults.failed === 0 ? 'bg-green-50 dark:bg-green-950' : 'bg-yellow-50 dark:bg-yellow-950'}`}>
                  <p className="font-semibold">{testResults.summary}</p>
                  <p className="text-sm text-muted-foreground">Sent to: {testResults.recipient}</p>
                </div>
                
                <div className="border rounded-lg max-h-32 overflow-y-auto">
                  {Object.entries(testResults.results).map(([template, result]) => (
                    <div key={template} className="flex items-center justify-between px-3 py-2 border-b last:border-b-0">
                      <span className="text-sm font-mono">{template}</span>
                      {result.success ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTestDialogOpen(false)}>
              Close
            </Button>
            <Button 
              onClick={handleTestTemplates} 
              disabled={testingAll || !testEmail || selectedTestTemplates.length === 0}
            >
              {testingAll ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Test ({selectedTestTemplates.length})
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
