import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { assignmentApi } from "@/api/questionnaires";
import { clientApi } from "@/api/clientApi";
import { Loader2, Archive, RotateCcw, Search, ChevronLeft, ChevronRight, FileText } from "lucide-react";

export default function ArchiveTemplatesTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(30);

  const { data: clients, isLoading: isLoadingClients } = useQuery({
    queryKey: ["clients"],
    queryFn: clientApi.list,
  });

  const { data: paginationData, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ["client-templates", selectedClient, currentPage, pageSize, searchQuery],
    queryFn: async (): Promise<{ results: any[]; count: number }> => {
      if (!selectedClient) return { results: [], count: 0 };
      const history = await assignmentApi.getAssignmentHistory({
        client_id: selectedClient,
        status: "success",
        latest_only: "true",
        page: currentPage,
        page_size: pageSize,
      });
      return history;
    },
    enabled: !!selectedClient,
  });

  const assignedTemplates = paginationData?.results || [];
  const totalCount = paginationData?.count || 0;

  const archiveMutation = useMutation({
    mutationFn: assignmentApi.archiveTemplates,
    onSuccess: (data) => {
      if (data.success) {
        toast({ title: "Success", description: data.message || "Templates archived successfully" });
        queryClient.invalidateQueries({ queryKey: ["client-templates", selectedClient] });
        setSelectedTemplates([]);
      } else {
        toast({ title: "Error", description: data.error || "Failed to archive templates", variant: "destructive" });
      }
    },
    onError: (error: unknown) => {
      const errorMessage =
        error instanceof Error
          ? error.message
          : (error as { response?: { data?: { error?: string } } })?.response?.data?.error || "An error occurred";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    },
  });

  const unarchiveMutation = useMutation({
    mutationFn: assignmentApi.unarchiveTemplates,
    onSuccess: (data) => {
      if (data.success) {
        toast({ title: "Success", description: data.message || "Templates restored successfully" });
        queryClient.invalidateQueries({ queryKey: ["client-templates", selectedClient] });
        setSelectedTemplates([]);
      } else {
        toast({ title: "Error", description: data.error || "Failed to restore templates", variant: "destructive" });
      }
    },
    onError: (error: unknown) => {
      const errorMessage =
        error instanceof Error
          ? error.message
          : (error as { response?: { data?: { error?: string } } })?.response?.data?.error || "An error occurred";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    },
  });

  const filteredTemplates = useMemo(() => {
    if (!assignedTemplates) return [];
    if (!searchQuery) return assignedTemplates;
    return assignedTemplates.filter((log) =>
      log.template_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [assignedTemplates, searchQuery]);

  const totalPages = Math.ceil(totalCount / pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedClient]);

  const handleSelectAll = (checked: boolean) => {
    if (checked && filteredTemplates) {
      setSelectedTemplates(filteredTemplates.map((log) => log.template_id));
    } else {
      setSelectedTemplates([]);
    }
  };

  const handleSelectTemplate = (templateId: string, checked: boolean) => {
    if (checked) {
      setSelectedTemplates([...selectedTemplates, templateId]);
    } else {
      setSelectedTemplates(selectedTemplates.filter((id) => id !== templateId));
    }
  };

  const handleArchive = () => {
    if (!selectedClient || selectedTemplates.length === 0) return;
    archiveMutation.mutate({ template_ids: selectedTemplates, client_ids: [selectedClient] });
  };

  const handleUnarchive = () => {
    if (!selectedClient || selectedTemplates.length === 0) return;
    unarchiveMutation.mutate({ template_ids: selectedTemplates, client_ids: [selectedClient] });
  };

  return (
    <div className="space-y-6">
      <div className="w-full md:w-1/3">
        <label className="text-sm font-medium mb-2 block">Select Client</label>
        <Select value={selectedClient} onValueChange={setSelectedClient}>
          <SelectTrigger>
            <SelectValue placeholder="Select a client..." />
          </SelectTrigger>
          <SelectContent>
            {isLoadingClients ? (
              <div className="p-2 flex justify-center">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : (
              clients?.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {!selectedClient ? (
        <div className="flex flex-col items-center justify-center py-16 text-center max-w-xl mx-auto">
          <FileText className="h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-base font-semibold text-slate-700 mb-1">Select a client</h3>
          <p className="text-sm text-slate-500">Choose a client above to view their archived templates.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={handleUnarchive}
                disabled={selectedTemplates.length === 0 || unarchiveMutation.isPending}
              >
                {unarchiveMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="mr-2 h-4 w-4" />
                )}
                Restore Selected
              </Button>
              <Button
                variant="destructive"
                onClick={handleArchive}
                disabled={selectedTemplates.length === 0 || archiveMutation.isPending}
              >
                {archiveMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Archive className="mr-2 h-4 w-4" />
                )}
                Archive Selected
              </Button>
            </div>
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        filteredTemplates &&
                        filteredTemplates.length > 0 &&
                        selectedTemplates.length === filteredTemplates.length
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Template Name</TableHead>
                  <TableHead>Assigned At</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingTemplates ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                    </TableCell>
                  </TableRow>
                ) : filteredTemplates && filteredTemplates.length > 0 ? (
                  filteredTemplates.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedTemplates.includes(log.template_id)}
                          onCheckedChange={(checked) =>
                            handleSelectTemplate(log.template_id, checked as boolean)
                          }
                        />
                      </TableCell>
                      <TableCell className="font-medium">{log.template_name}</TableCell>
                      <TableCell>{new Date(log.assigned_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-50 text-green-700 border-green-200">
                          {log.status === "success" ? "Active" : log.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-sm text-slate-500">
                      {searchQuery ? "No templates match your search." : "No templates found for this client."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-slate-500">
              Showing {filteredTemplates.length} of {totalCount} templates
            </div>
            <div className="flex items-center space-x-4">
              {totalCount > 0 && (
                <>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-slate-500">Items per page:</span>
                    <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(parseInt(value))}>
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="30">30</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-slate-500">
                      Page {currentPage} of {totalPages}
                    </span>
                    <div className="flex space-x-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
