import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Pill,
  ShieldAlert,
  Stethoscope,
  User,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PatientFollowUpStatus } from "@/components/followups/PatientFollowUpStatus";
import { ordersApi, type Order } from "@/api/ordersApi";
import { patientService, type Patient, type TreatmentEpisode } from "@/services/patientService";

export default function PatientDetailPage() {
  const { patientId } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [episodes, setEpisodes] = useState<TreatmentEpisode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    setError(null);
    try {
      const [patientResp, ordersResp, episodesResp] = await Promise.all([
        patientService.getPatient(patientId),
        ordersApi.fetchOrdersByPatient(patientId, { page_size: 100, ordering: "-created_at" }),
        patientService.getTreatmentEpisodes(patientId),
      ]);

      setPatient(patientResp);
      setOrders(ordersResp.results || []);
      setEpisodes(episodesResp || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load patient details");
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const ordersById = useMemo(() => {
    const map = new Map<string, Order>();
    orders.forEach((order) => map.set(order.id, order));
    return map;
  }, [orders]);

  const fullName = patient?.full_name || `${patient?.first_name || ""} ${patient?.last_name || ""}`.trim();
  const initials = `${patient?.first_name?.[0] || ""}${patient?.last_name?.[0] || ""}`.toUpperCase() || "PT";
  const fullAddress = patient?.address
    ? `${patient.address}${patient.address_line_2 ? `, ${patient.address_line_2}` : ""}${patient.city || patient.state || patient.zip_code ? ", " : ""}${[patient.city, patient.state, patient.zip_code].filter(Boolean).join(" ")}`
    : "-";

  const getOrderStatusTone = (status?: string) => {
    const s = (status || "").toLowerCase();
    if (["prescribed", "rx_sent", "shipped", "completed"].includes(s)) return "text-emerald-700 bg-emerald-50 border-emerald-200";
    if (["billing_pending", "pending", "processing"].includes(s)) return "text-amber-700 bg-amber-50 border-amber-200";
    if (["canceled", "visit_failed", "declined", "error"].includes(s)) return "text-red-700 bg-red-50 border-red-200";
    return "text-slate-700 bg-slate-50 border-slate-200";
  };

  const getTreatmentDisplayName = (episode: TreatmentEpisode) => {
    const key = (episode.treatment_key || "").toLowerCase().trim();
    const map: Record<string, string> = {
      weightloss: "Weight Loss",
      weight_loss: "Weight Loss",
      ed: "ED",
      hair: "Hair",
      antiaging: "Anti-Aging",
      anti_aging: "Anti-Aging",
      skincare: "Skincare",
      skin_care: "Skincare",
      wellness: "Wellness",
    };

    if (map[key]) return map[key];
    if (key) return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

    return (
      episode.current_product_category_name ||
      episode.current_product_name ||
      "Treatment"
    );
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading patient details...
      </div>
    );
  }

  if (!patient || error) {
    return (
      <div className="p-6 space-y-3">
        <p className="text-red-600 text-sm">{error || "Patient not found"}</p>
        <Button variant="outline" onClick={() => navigate("/dashboard/patients")}>
          Back to Patients
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-50 to-white px-4 py-6 md:px-6">
      <div className="mx-auto max-w-[1440px] space-y-5">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm md:p-5">
          <Button
            variant="ghost"
            className="mb-3 h-8 px-2 text-slate-600 hover:text-slate-900"
            onClick={() => navigate("/dashboard/patients")}
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to Patients
          </Button>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white shadow-sm">
                {initials}
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-bold tracking-tight text-slate-900">
                  {fullName || "Patient"}
                </h1>
                <p className="text-sm text-slate-500">
                  MRN: {patient.id.slice(0, 8).toUpperCase()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="rounded-full border-slate-300 bg-slate-50 px-3 py-1 text-slate-700">
                <ClipboardList className="mr-1.5 h-3.5 w-3.5" />
                {episodes.length} Treatment{episodes.length === 1 ? "" : "s"}
              </Badge>
              <Badge variant="outline" className="rounded-full border-slate-300 bg-slate-50 px-3 py-1 text-slate-700">
                {orders.length} Order{orders.length === 1 ? "" : "s"}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="space-y-4 xl:col-span-3">
          <Card className="h-fit border-slate-200 bg-white shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-2">
              <CardTitle className="flex items-center gap-2 text-base text-slate-900">
                <User className="h-4 w-4" />
                Patient Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4 text-sm">
              <div className="rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2">
                <div className="text-[11px] uppercase tracking-wide text-slate-500">Joined</div>
                <div className="mt-0.5 font-medium text-slate-900">
                  {patient.created_at ? new Date(patient.created_at).toLocaleDateString() : "-"}
                </div>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2">
                <div className="text-[11px] uppercase tracking-wide text-slate-500">Email</div>
                <div className="mt-0.5 break-all font-medium text-slate-900">{patient.email || "-"}</div>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2">
                <div className="text-[11px] uppercase tracking-wide text-slate-500">Date of Birth</div>
                <div className="mt-0.5 flex items-center gap-1.5 font-medium text-slate-900">
                  <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                  {patient.date_of_birth || "-"}
                </div>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2">
                <div className="text-[11px] uppercase tracking-wide text-slate-500">Phone</div>
                <div className="mt-0.5 flex items-center gap-1.5 font-medium text-slate-900">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  {patient.phone || "-"}
                </div>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2">
                <div className="text-[11px] uppercase tracking-wide text-slate-500">Sex</div>
                <div className="mt-0.5 font-medium text-slate-900">{patient.sex || "-"}</div>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2">
                <div className="text-[11px] uppercase tracking-wide text-slate-500">Location</div>
                <div className="mt-0.5 flex items-center gap-1.5 font-medium text-slate-900">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  {patient.city && patient.state ? `${patient.city}, ${patient.state}` : patient.state || "-"}
                </div>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2">
                <div className="text-[11px] uppercase tracking-wide text-slate-500">Address</div>
                <div className="mt-0.5 break-words font-medium text-slate-900">
                  {fullAddress}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="h-fit border-slate-200 bg-white shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-2">
              <CardTitle className="flex items-center gap-2 text-base text-slate-900">
                <Stethoscope className="h-4 w-4" />
                Medical History
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4 text-sm">
              <div className="rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2">
                <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-slate-500">
                  <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                  Allergies
                </div>
                <div className="mt-1 whitespace-pre-wrap font-medium text-slate-900">
                  {patient.allergies || "None reported"}
                </div>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2">
                <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-slate-500">
                  <Stethoscope className="h-3.5 w-3.5 text-blue-600" />
                  Medical Conditions
                </div>
                <div className="mt-1 whitespace-pre-wrap font-medium text-slate-900">
                  {patient.medical_conditions || "None reported"}
                </div>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2">
                <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-slate-500">
                  <Pill className="h-3.5 w-3.5 text-violet-600" />
                  Current Medications
                </div>
                <div className="mt-1 whitespace-pre-wrap font-medium text-slate-900">
                  {patient.self_reported_meds || "None reported"}
                </div>
              </div>
            </CardContent>
          </Card>
          </div>

          <div className="xl:col-span-9">
            <Card className="border-slate-200 bg-white shadow-sm">
              <CardContent className="p-4 md:p-5">
                <Tabs defaultValue="treatments" className="w-full">
                  <TabsList className="mb-3 h-10 w-full justify-start gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-1">
                    <TabsTrigger value="treatments" className="rounded-lg px-3">Treatments</TabsTrigger>
                    <TabsTrigger value="orders" className="rounded-lg px-3">Orders</TabsTrigger>
                    <TabsTrigger value="followups" className="rounded-lg px-3">Follow-ups</TabsTrigger>
                  </TabsList>

                  <TabsContent value="treatments" className="space-y-3">
                    {episodes.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                        No treatment episodes found.
                      </div>
                    ) : episodes.map((episode) => {
                      const currentOrder = episode.current_order_id ? ordersById.get(episode.current_order_id) : undefined;
                      return (
                        <Card key={episode.id} className="overflow-hidden border-slate-200 shadow-sm">
                          <CardHeader className="border-b border-slate-100 bg-slate-50/80 pb-2">
                            <CardTitle className="flex items-center justify-between gap-2 text-base">
                              <span className="truncate text-slate-900">
                                {getTreatmentDisplayName(episode)}
                              </span>
                              <Badge variant="outline" className="rounded-full capitalize">
                                {episode.status || "active"}
                              </Badge>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3 pt-3 text-sm">
                            <p className="text-slate-700">
                              <span className="text-slate-500">Start date:</span>{" "}
                              <span className="font-medium">
                                {episode.started_at ? new Date(episode.started_at).toLocaleDateString() : "-"}
                              </span>
                            </p>
                            {episode.current_product_titration_category && (
                              <p className="text-slate-700">
                                <span className="text-slate-500">Regimen:</span>{" "}
                                <span className="font-medium">{episode.current_product_titration_category}</span>
                              </p>
                            )}

                            <div className="overflow-x-auto rounded-lg border border-slate-200">
                              <table className="w-full min-w-[640px] text-xs">
                                <thead className="bg-slate-50">
                                  <tr>
                                    <th className="p-2 text-left font-semibold text-slate-700">Order ID</th>
                                    <th className="p-2 text-left font-semibold text-slate-700">Product</th>
                                    <th className="p-2 text-left font-semibold text-slate-700">Amount</th>
                                    <th className="p-2 text-left font-semibold text-slate-700">Status</th>
                                    <th className="p-2 text-left font-semibold text-slate-700">Date</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {currentOrder ? (
                                    <tr className="bg-white hover:bg-slate-50">
                                      <td className="p-2">
                                        <Link
                                          className="font-medium text-blue-600 hover:underline"
                                          to={`/dashboard/orders/details/${currentOrder.order_id || currentOrder.display_id || currentOrder.id}`}
                                        >
                                          {currentOrder.order_id || currentOrder.display_id || currentOrder.id.slice(0, 8)}
                                        </Link>
                                      </td>
                                      <td className="p-2 text-slate-700">{currentOrder.product_name || "-"}</td>
                                      <td className="p-2 font-semibold text-slate-900">{currentOrder.orderTotal || currentOrder.amount || "-"}</td>
                                      <td className="p-2">
                                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${getOrderStatusTone(currentOrder.orderStatus || currentOrder.status)}`}>
                                          {currentOrder.orderStatus || currentOrder.status || "-"}
                                        </span>
                                      </td>
                                      <td className="p-2 text-slate-700">
                                        {currentOrder.orderDate ? new Date(currentOrder.orderDate).toLocaleDateString() : "-"}
                                      </td>
                                    </tr>
                                  ) : (
                                    <tr>
                                      <td className="p-3 text-slate-500" colSpan={5}>
                                        No contextual order linked.
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </TabsContent>

                  <TabsContent value="orders" className="space-y-3">
                    {orders.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                        No orders found.
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-lg border border-slate-200">
                        <table className="w-full min-w-[700px] text-sm">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Order</th>
                              <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Product</th>
                              <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Amount</th>
                              <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Date</th>
                              <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {orders.map((order) => (
                              <tr key={order.id} className="border-t border-slate-100 bg-white hover:bg-slate-50/70">
                                <td className="p-3">
                                  <Link
                                    className="font-medium text-blue-600 hover:underline"
                                    to={`/dashboard/orders/details/${order.order_id || order.display_id || order.id}`}
                                  >
                                    #{order.order_id || order.display_id || order.id.slice(0, 8)}
                                  </Link>
                                </td>
                                <td className="p-3 text-slate-700">{order.product_name || "-"}</td>
                                <td className="p-3 font-semibold text-slate-900">{order.orderTotal || order.amount || "-"}</td>
                                <td className="p-3 text-slate-700">
                                  {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : "-"}
                                </td>
                                <td className="p-3">
                                  <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${getOrderStatusTone(order.orderStatus || order.status)}`}>
                                    {order.orderStatus || order.status || "-"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="followups">
                    <PatientFollowUpStatus
                      patientId={patient.id}
                      patientName={fullName}
                      patientEmail={patient.email}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
