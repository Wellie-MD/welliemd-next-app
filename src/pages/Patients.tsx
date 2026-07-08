import { useEffect, useMemo, useState } from "react";
import type { AxiosError } from "axios";
import { ExternalLink, Eye, RotateCcw, Search } from "lucide-react";

import { fetchAdminPatients, type AdminPatient } from "@/api/adminPatientsApi";
import { startSuperAdminAccess } from "@/api/superAdminAccessApi";
import { useClients } from "@/hooks/useClients";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuthStore } from "@/store/useAuthStore";

const statusFilters = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "Drop-off", value: "dropoff" },
];

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(value || 0);

const statusClassName = (status: string) => {
  if (status === "active") return "bg-green-100 text-green-800";
  if (status === "dropoff") return "bg-purple-100 text-purple-800";
  return "bg-gray-100 text-gray-700";
};

export default function Patients() {
  const user = useAuthStore((state) => state.user);
  const { clients } = useClients();
  const { toast } = useToast();
  const [patients, setPatients] = useState<AdminPatient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<AdminPatient | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [clientId, setClientId] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [launching, setLaunching] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, clientId]);

  useEffect(() => {
    const loadPatients = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await fetchAdminPatients({
          page,
          page_size: pageSize,
          search: debouncedSearch || undefined,
          status: status === "all" ? undefined : status,
          client_id: clientId === "all" ? undefined : clientId,
        });
        setPatients(data.patients || []);
        setTotalPages(data.total_pages || 1);
        setTotalCount(data.total_count || 0);
      } catch (err) {
        const axiosError = err as AxiosError<{ error?: string }>;
        const message = axiosError.response?.data?.error || "Failed to fetch patients";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadPatients();
  }, [page, pageSize, debouncedSearch, status, clientId]);

  const visibleCountLabel = useMemo(() => {
    if (totalCount === 0) return "No patients";
    return `${totalCount.toLocaleString()} patient${totalCount === 1 ? "" : "s"}`;
  }, [totalCount]);
  const canLaunchSuperAdminAccess = useMemo(() => {
    const primaryRole = (user?.primary_role || "").trim().toLowerCase();
    if (primaryRole === "super admin") return true;
    if (primaryRole === "admin") return true;
    return (user?.roles || []).some((role) => {
      const normalizedRole = role.trim().toLowerCase();
      return normalizedRole === "super admin" || normalizedRole === "admin";
    });
  }, [user]);

  const resetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setStatus("all");
    setClientId("all");
    setPage(1);
  };

  const openPatientPortal = async (patient: AdminPatient) => {
    setLaunching(true);
    try {
      const data = await startSuperAdminAccess(patient.client_id, "patient", {
        patient_id: patient.id,
        patient_user_id: patient.user_id,
        patient_name: patient.name,
        patient_email: patient.email,
        access_mode: "read_only",
      });
      window.open(data.launch_url, "_blank", "noopener,noreferrer");
    } catch (err) {
      const axiosError = err as AxiosError<{ error?: string }>;
      toast({
        title: "Patient access failed",
        description: axiosError.response?.data?.error || "Could not open the patient portal",
        variant: "destructive",
      });
    } finally {
      setLaunching(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Patients</h1>
        <p className="text-muted-foreground">All patients across clients. Filter by treatment status or client.</p>
      </div>

      <div className="rounded-lg border bg-white p-4 space-y-4">
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((item) => (
            <Button
              key={item.value}
              variant={status === item.value ? "default" : "outline"}
              className={status === item.value ? "bg-[#66C7F0] text-black hover:bg-[#57BCE8]" : ""}
              onClick={() => setStatus(item.value)}
            >
              {item.label}
            </Button>
          ))}
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <Select value={clientId} onValueChange={setClientId}>
            <SelectTrigger className="w-full lg:w-56">
              <SelectValue placeholder="All clients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All clients</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search patients by name, email, phone, city, or state"
              className="pl-9"
            />
          </div>

          <Button variant="outline" onClick={resetFilters}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset Filters
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Orders</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Activity</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} className="h-32 text-center text-muted-foreground">
                  Loading patients...
                </TableCell>
              </TableRow>
            ) : patients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="h-32 text-center text-muted-foreground">
                  No results found
                </TableCell>
              </TableRow>
            ) : (
              patients.map((patient) => (
                <TableRow key={`${patient.client_id}:${patient.id}`}>
                  <TableCell className="font-medium">{patient.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{patient.client_name}</Badge>
                  </TableCell>
                  <TableCell>{formatDate(patient.joined)}</TableCell>
                  <TableCell>{patient.email || "-"}</TableCell>
                  <TableCell>{patient.phone || "-"}</TableCell>
                  <TableCell>{patient.orders_count}</TableCell>
                  <TableCell>{patient.location || "-"}</TableCell>
                  <TableCell>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClassName(patient.status)}`}>
                      {patient.status_display || patient.status}
                    </span>
                  </TableCell>
                  <TableCell>{formatDate(patient.last_activity)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedPatient(patient)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>{visibleCountLabel}</span>
          <Select value={String(pageSize)} onValueChange={(value) => setPageSize(Number(value))}>
            <SelectTrigger className="h-9 w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>
            Next
          </Button>
        </div>
      </div>

      <Dialog open={Boolean(selectedPatient)} onOpenChange={(open) => !open && setSelectedPatient(null)}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto p-0">
          {selectedPatient && (
            <>
              <DialogHeader className="border-b px-5 py-4">
                <DialogTitle>{selectedPatient.name}</DialogTitle>
                <p className="text-sm text-muted-foreground">{selectedPatient.client_name}</p>
              </DialogHeader>

              <div className="space-y-5 px-5 py-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Detail label="Email" value={selectedPatient.email} />
                  <Detail label="Phone" value={selectedPatient.phone} />
                  <Detail label="Location" value={selectedPatient.location || "-"} />
                  <Detail label="Joined" value={formatDate(selectedPatient.joined)} />
                  <Detail label="Orders" value={String(selectedPatient.orders_count)} />
                  <Detail label="Last Activity" value={formatDate(selectedPatient.last_activity)} />
                </div>

                <section className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Treatments ({selectedPatient.treatments.length})
                  </h3>
                  {selectedPatient.treatments.length === 0 ? (
                    <p className="rounded-lg border p-3 text-sm text-muted-foreground">No treatments found.</p>
                  ) : (
                    selectedPatient.treatments.map((treatment) => (
                      <div key={treatment.name} className="flex items-center justify-between rounded-lg border px-3 py-2">
                        <span className="font-medium">{treatment.name}</span>
                        <Badge className={treatment.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}>
                          {treatment.status === "active" ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    ))
                  )}
                </section>

                <section className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Orders ({selectedPatient.orders.length})
                  </h3>
                  {selectedPatient.orders.length === 0 ? (
                    <p className="rounded-lg border p-3 text-sm text-muted-foreground">No recent orders found.</p>
                  ) : (
                    selectedPatient.orders.map((order) => (
                      <div key={order.id} className="rounded-lg border px-3 py-2">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-medium">{order.product_name}</span>
                          <span className="font-semibold">{formatCurrency(order.amount)}</span>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                          <span>{order.display_id} · {formatDate(order.created_at)}</span>
                          <Badge variant="secondary">{order.status_display || order.payment_status}</Badge>
                        </div>
                      </div>
                    ))
                  )}
                </section>
              </div>

              <DialogFooter className="border-t px-5 py-4">
                <Button variant="outline" onClick={() => setSelectedPatient(null)}>
                  Close
                </Button>
                <Button
                  onClick={() => openPatientPortal(selectedPatient)}
                  disabled={launching || !selectedPatient.patient_portal_domain || !canLaunchSuperAdminAccess}
                  title={canLaunchSuperAdminAccess ? undefined : "Admin or Super Admin role required"}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  {launching ? "Opening..." : "View as patient"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b pb-2">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm">{value || "-"}</div>
    </div>
  );
}
