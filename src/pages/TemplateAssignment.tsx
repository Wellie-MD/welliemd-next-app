import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Search, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/components/ui/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  templateApi,
  QuestionnaireTemplate,
  assignmentApi,
} from "@/api/questionnaires";
import { clientApi, Client } from "@/api/clientApi";
import { useNavigate } from "react-router-dom";

export default function TemplateAssignment() {
  const navigate = useNavigate();

  // Data states
  const [templates, setTemplates] = useState<QuestionnaireTemplate[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  // Selection states
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(
    new Set()
  );
  const [selectedClients, setSelectedClients] = useState<Set<string>>(
    new Set()
  );

  // Search states
  const [templateSearch, setTemplateSearch] = useState("");
  const [clientSearch, setClientSearch] = useState("");

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [templatesData, clientsData] = await Promise.all([
          templateApi.listTemplates(),
          clientApi.list(),
        ]);

        console.log("Templates data:", templatesData);
        console.log("Clients data:", clientsData);

        // Handle both array response and paginated response (same as Questionnaires page)
        let templatesList: QuestionnaireTemplate[] = [];
        if (Array.isArray(templatesData)) {
          templatesList = templatesData;
        } else if (
          templatesData &&
          typeof templatesData === "object" &&
          "results" in templatesData
        ) {
          templatesList = (templatesData as unknown).results || [];
        }

        setTemplates(templatesList);
        setClients(Array.isArray(clientsData) ? clientsData : []);

        console.log("Templates set:", templatesList.length);
        console.log("Clients set:", clientsData.length);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast({
          title: "Error",
          description: "Failed to load templates and clients",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter templates based on search and publication status
  // Only show published templates (hide drafts)
  const filteredTemplates = useMemo(() => {
    // First filter: only published templates
    const publishedTemplates = templates.filter(
      (template) => template.is_published === true
    );

    // Second filter: search
    if (!templateSearch.trim()) return publishedTemplates;

    const search = templateSearch.toLowerCase();
    return publishedTemplates.filter(
      (template) =>
        template.name.toLowerCase().includes(search) ||
        template.questionnaire_type?.toLowerCase().includes(search)
    );
  }, [templates, templateSearch]);

  // Filter clients based on search
  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return clients;

    const search = clientSearch.toLowerCase();
    return clients.filter(
      (client) =>
        client.name.toLowerCase().includes(search) ||
        client.user?.email?.toLowerCase().includes(search) ||
        client.user?.full_name?.toLowerCase().includes(search)
    );
  }, [clients, clientSearch]);

  // Toggle template selection
  const toggleTemplate = (templateId: string) => {
    setSelectedTemplates((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(templateId)) {
        newSet.delete(templateId);
      } else {
        newSet.add(templateId);
      }
      return newSet;
    });
  };

  // Toggle client selection
  const toggleClient = (clientId: string) => {
    setSelectedClients((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(clientId)) {
        newSet.delete(clientId);
      } else {
        newSet.add(clientId);
      }
      return newSet;
    });
  };

  // Select all filtered templates
  const selectAllTemplates = () => {
    const allIds = new Set(filteredTemplates.map((t) => t.id));
    setSelectedTemplates(allIds);
  };

  // Deselect all templates
  const deselectAllTemplates = () => {
    setSelectedTemplates(new Set());
  };

  // Select all filtered clients
  const selectAllClients = () => {
    const allIds = new Set(filteredClients.map((c) => c.id));
    setSelectedClients(allIds);
  };

  // Deselect all clients
  const deselectAllClients = () => {
    setSelectedClients(new Set());
  };

  // Handle assignment
  const handleAssign = async () => {
    if (selectedTemplates.size === 0 || selectedClients.size === 0) {
      toast({
        title: "Selection Required",
        description: "Please select at least one template and one client",
        variant: "destructive",
      });
      return;
    }

    // Validate that all selected templates are published
    const selectedTemplateIds = Array.from(selectedTemplates);
    const draftTemplates = templates.filter(
      (t) => selectedTemplateIds.includes(t.id) && !t.is_published
    );

    if (draftTemplates.length > 0) {
      toast({
        title: "Draft Templates Selected",
        description: `Cannot assign draft templates. Please publish them first: ${draftTemplates
          .map((t) => t.name)
          .join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const result = await assignmentApi.assignToClients({
        template_ids: selectedTemplateIds,
        client_ids: Array.from(selectedClients),
      });

      if (result.success) {
        toast({
          title: "Success",
          description:
            result.message ||
            `Assigned ${result.successful} template(s) successfully`,
        });

        // Clear selections after successful assignment
        setSelectedTemplates(new Set());
        setSelectedClients(new Set());
      } else {
        toast({
          title: "Partial Success",
          description: `${result.successful} succeeded, ${result.failed} failed`,
          variant: "destructive",
        });
      }
    } catch (error: unknown) {
      console.error("Assignment error:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.error || "Failed to assign templates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle re-assignment for modified templates
  const handleReAssign = async () => {
    if (selectedTemplates.size === 0 || selectedClients.size === 0) {
      toast({
        title: "Selection Required",
        description: "Please select at least one template and one client",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const result = await assignmentApi.reAssignToClients({
        template_ids: Array.from(selectedTemplates),
        client_ids: Array.from(selectedClients),
      });

      if (result.success) {
        toast({
          title: "Success",
          description:
            result.message ||
            `Re-assigned ${result.successful} template(s) successfully`,
        });

        // Clear selections and refresh templates
        setSelectedTemplates(new Set());
        setSelectedClients(new Set());
        
        // Refresh templates list to get updated modification flags
        const templatesData = await templateApi.listTemplates();
        let templatesList: QuestionnaireTemplate[] = [];
        if (Array.isArray(templatesData)) {
          templatesList = templatesData;
        } else if (
          templatesData &&
          typeof templatesData === "object" &&
          "results" in templatesData
        ) {
          templatesList = (templatesData as unknown).results || [];
        }
        setTemplates(templatesList);
      } else {
        toast({
          title: "Partial Success",
          description: `${result.successful} succeeded, ${result.failed} failed`,
          variant: "destructive",
        });
      }
    } catch (error: unknown) {
      console.error("Re-assignment error:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.error || "Failed to re-assign templates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Format template type for display
  const formatTemplateType = (type: string): string => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center p-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard/questionnaires")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Assign Templates to Clients</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Select templates and clients to create assignments
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() =>
              navigate("/dashboard/questionnaires/assignment-history")
            }
            size="lg"
          >
            Assignment History
          </Button>
          <Button
            onClick={handleAssign}
            disabled={
              selectedTemplates.size === 0 || selectedClients.size === 0
            }
            size="lg"
          >
            Assign Templates
          </Button>
          <Button
            onClick={handleReAssign}
            disabled={
              selectedTemplates.size === 0 || selectedClients.size === 0
            }
            size="lg"
            variant="secondary"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Re-assign
          </Button>
        </div>
      </div>

      {/* Selection Summary */}
      {(selectedTemplates.size > 0 || selectedClients.size > 0) && (
        <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900">
              {selectedTemplates.size} template(s) selected •{" "}
              {selectedClients.size} client(s) selected
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedTemplates(new Set());
              setSelectedClients(new Set());
            }}
          >
            Clear All
          </Button>
        </div>
      )}

      {/* Dual List Transfer Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Templates List */}
        <div className="border rounded-lg bg-white shadow-sm">
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-lg font-semibold">Templates</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Only published templates can be assigned
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selectAllTemplates}
                  disabled={filteredTemplates.length === 0}
                >
                  Select All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={deselectAllTemplates}
                  disabled={selectedTemplates.size === 0}
                >
                  Clear
                </Button>
              </div>
            </div>

            {/* Template Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={templateSearch}
                onChange={(e) => setTemplateSearch(e.target.value)}
                placeholder="Search templates..."
                className="pl-9 pr-9"
              />
              {templateSearch && (
                <button
                  onClick={() => setTemplateSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <ScrollArea className="h-[calc(100vh-28rem)]">
            <div className="p-2">
              {filteredTemplates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {templateSearch
                    ? "No templates found"
                    : "No templates available"}
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredTemplates.map((template) => (
                    <div
                      key={template.id}
                      onClick={() => toggleTemplate(template.id)}
                      className={`
                        flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors
                        ${
                          selectedTemplates.has(template.id)
                            ? "bg-blue-50 border-2 border-blue-500"
                            : "hover:bg-gray-50 border-2 border-transparent"
                        }
                      `}
                    >
                      <Checkbox
                        checked={selectedTemplates.has(template.id)}
                        onCheckedChange={() => toggleTemplate(template.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm truncate">
                            {template.name}
                          </p>
                          {template.is_modified_need_to_re_assigned && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge variant="destructive" className="text-xs">
                                    UPDATED
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>You have updated this template.</p>
                                  <p>You need to re-assign it to clients to push the updates.</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatTemplateType(template.questionnaire_type)}
                        </p>
                        {template.question_count !== undefined && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {template.question_count} question(s)
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-3 border-t bg-gray-50 text-sm text-muted-foreground">
            {selectedTemplates.size} of {filteredTemplates.length} selected
          </div>
        </div>

        {/* Clients List */}
        <div className="border rounded-lg bg-white shadow-sm">
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Clients</h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selectAllClients}
                  disabled={filteredClients.length === 0}
                >
                  Select All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={deselectAllClients}
                  disabled={selectedClients.size === 0}
                >
                  Clear
                </Button>
              </div>
            </div>

            {/* Client Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                placeholder="Search clients..."
                className="pl-9 pr-9"
              />
              {clientSearch && (
                <button
                  onClick={() => setClientSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <ScrollArea className="h-[calc(100vh-28rem)]">
            <div className="p-2">
              {filteredClients.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {clientSearch ? "No clients found" : "No clients available"}
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredClients.map((client) => (
                    <div
                      key={client.id}
                      onClick={() => toggleClient(client.id)}
                      className={`
                        flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors
                        ${
                          selectedClients.has(client.id)
                            ? "bg-blue-50 border-2 border-blue-500"
                            : "hover:bg-gray-50 border-2 border-transparent"
                        }
                      `}
                    >
                      <Checkbox
                        checked={selectedClients.has(client.id)}
                        onCheckedChange={() => toggleClient(client.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm truncate">
                            {client.name}
                          </p>
                          {client.is_active && (
                            <Badge variant="default" className="text-xs">
                              Active
                            </Badge>
                          )}
                        </div>
                        {client.user && (
                          <>
                            <p className="text-xs text-muted-foreground truncate">
                              {client.user.full_name ||
                                `${client.user.first_name} ${client.user.last_name}`}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {client.user.email}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-3 border-t bg-gray-50 text-sm text-muted-foreground">
            {selectedClients.size} of {filteredClients.length} selected
          </div>
        </div>
      </div>
    </div>
  );
}
