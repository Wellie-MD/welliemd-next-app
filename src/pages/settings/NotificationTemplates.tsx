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
import { Loader2, Plus, Pencil, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  notificationTemplatesApi,
  type NotificationTemplateListItem,
  type NotificationTemplate,
  type TemplateTypeInfo,
  type CreateNotificationTemplatePayload,
  type UpdateNotificationTemplatePayload,
} from "@/api/notificationTemplatesApi";

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
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState<CreateNotificationTemplatePayload>({
    name: "",
    template_type: "",
    subject: "",
    short_description: "",
    email_body: "",
    sms_body: "",
    is_active: true,
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
      const templatesData = Array.isArray(templatesResponse) 
        ? templatesResponse 
        : (templatesResponse as any)?.results || [];
      const typesData = Array.isArray(typesResponse) 
        ? typesResponse 
        : (typesResponse as any)?.results || [];
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

  // Handle toggle active
  const handleToggleActive = async (e: React.MouseEvent, template: NotificationTemplateListItem) => {
    e.stopPropagation(); // Prevent row click
    try {
      const result = await notificationTemplatesApi.toggleActive(template.id);
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === template.id ? { ...t, is_active: result.is_active } : t
        )
      );
      toast({
        title: "Success",
        description: result.message,
      });
    } catch (error) {
      console.error("Failed to toggle template:", error);
      toast({
        title: "Error",
        description: "Failed to update template status",
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
        is_active: fullTemplate.is_active,
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
      is_active: true,
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
          is_active: formData.is_active,
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
    } catch (error: any) {
      console.error("Failed to save template:", error);
      
      // Handle field-specific validation errors from backend
      const responseData = error.response?.data;
      let errorMessage = "Failed to save template";
      
      if (responseData) {
        const fieldErrors: string[] = [];
        if (responseData.subject) fieldErrors.push(`Subject: ${responseData.subject}`);
        if (responseData.email_body) fieldErrors.push(`Email: ${responseData.email_body}`);
        if (responseData.sms_body) fieldErrors.push(`SMS: ${responseData.sms_body}`);
        if (responseData.template_type) fieldErrors.push(responseData.template_type[0]);
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
      key: "is_active",
      label: "Active",
      render: (value: unknown, row: unknown) => {
        const template = row as NotificationTemplateListItem;
        return (
          <Switch
            checked={template.is_active}
            onCheckedChange={() => {}}
            onClick={(e) => handleToggleActive(e, template)}
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
            <button
              type="button"
              className="text-red-600 hover:opacity-80"
              title="Delete"
              onClick={(e) => {
                e.stopPropagation();
                setTemplateToDelete(template);
                setIsDeleteDialogOpen(true);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notification Templates</h1>
        <Button className="gap-2" onClick={handleCreate}>
          <Plus className="h-4 w-4" />
          Create Template
        </Button>
      </div>

      <DataTable
        data={filteredTemplates}
        columns={columns}
        searchPlaceholder="Search by template name, type, or subject..."
        emptyMessage="No templates found"
        loading={loading}
        onRowClick={(row) => handleEdit(row as NotificationTemplateListItem)}
        onSearch={setSearchTerm}
        showExport={false}
        showResetFilters={false}
        hideToolbar={false}
      />

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
                        {templateTypes.map((type) => (
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

                {/* Active */}
                <div className="flex items-center gap-4">
                  <Label htmlFor="is_active">Active:</Label>
                  <Select
                    value={formData.is_active ? "yes" : "no"}
                    onValueChange={(value) => setFormData({ ...formData, is_active: value === "yes" })}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
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
    </div>
  );
}
