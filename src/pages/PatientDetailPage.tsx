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
  Pencil,
  TrendingUp,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CustomInsightsModal } from "@/components/patients/CustomInsightsModal";
import { PatientFollowUpStatus } from "@/components/followups/PatientFollowUpStatus";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { Permissions } from "@/constants/permissions";
import { useToast } from "@/hooks/use-toast";
import { ordersApi, type Order } from "@/api/ordersApi";
import { patientService, type Patient, type TreatmentEpisode } from "@/services/patientService";
import { useClients } from "@/hooks/useClients";
import { useAuthStore } from "@/store/useAuthStore";
import axiosInstance from "@/api/axiosInstance";
import api from "@/api/axiosInstance";

type WearableConnection = {
  id: string;
  provider: string;
  status: string;
  last_sync_at: string | null;
  last_error?: string;
};

type WorkoutItem = {
  date: string;
  sport: string;
  durationMinutes: number | null;
  calories: number | null;
  avgHr?: number | null;
  distanceKm?: number | null;
};

type WearableDeviceData = {
  steps?: string;
  sleep?: string;
  restingHr?: string;
  activeDays?: string;
  readiness?: number | null;
  recovery?: number | null;
  sleepScore?: number | null;
  weightSeries?: number[];
  stepsSeries?: { date: string; val: number }[];
  sleepSeries?: { date: string; val: number }[];
  readinessSeries?: { date: string; val: number }[];
  sleepDetail?: {
    deep?: number;
    light?: number;
    rem?: number;
    awake?: number;
    efficiency?: number;
    avgHr?: number;
  };
  workoutsCount?: number;
  recentWorkouts?: WorkoutItem[];
  workoutsSeries?: { date: string; val: number }[];
  customQueries?: {
    id: string;
    name: string;
    metrics: string[];
    series: any[];
  }[];
};

type MetricItem = { l: string; v: string | number; u?: string };

function buildWearableMetrics(data: WearableDeviceData | null, timeRange: number) {
  const sleep: MetricItem[] = [];
  const activity: MetricItem[] = [];
  const workouts: MetricItem[] = [];
  if (!data) return { sleep, activity, workouts };

  if (data.sleep && data.sleep !== "--" && data.sleep !== "0") sleep.push({ l: "Time asleep", v: data.sleep });
  if (data.sleepScore != null && data.sleepScore > 0) sleep.push({ l: "Sleep score", v: data.sleepScore, u: "/100" });
  if (data.sleepDetail) {
    const { deep, rem, light, awake, efficiency, avgHr } = data.sleepDetail;
    if (deep) sleep.push({ l: "Deep sleep", v: deep, u: "min" });
    if (rem) sleep.push({ l: "REM sleep", v: rem, u: "min" });
    if (light) sleep.push({ l: "Light sleep", v: light, u: "min" });
    if (awake) sleep.push({ l: "Awake", v: awake, u: "min" });
    if (efficiency) sleep.push({ l: "Efficiency", v: efficiency, u: "%" });
    if (avgHr) sleep.push({ l: "Avg heart rate", v: avgHr, u: "bpm" });
  }

  if (data.steps && data.steps !== "--" && data.steps !== "0") activity.push({ l: "Steps", v: data.steps, u: "/day" });
  if (data.activeDays && data.activeDays !== "--" && data.activeDays !== "0") activity.push({ l: "Active days", v: data.activeDays, u: `of ${timeRange}` });
  if (data.restingHr && data.restingHr !== "--" && data.restingHr !== "0") {
    activity.push({ l: "Resting HR", v: data.restingHr, u: "bpm" });
  }

  const recentWorkouts = data.recentWorkouts || [];
  if (recentWorkouts.length > 0) {
    workouts.push({ l: "Workouts", v: data.workoutsCount ?? recentWorkouts.length, u: "this week" });
    const totalMin = recentWorkouts.reduce((sum, w) => sum + (w.durationMinutes || 0), 0);
    if (totalMin > 0) workouts.push({ l: "Total time", v: totalMin, u: "min" });
    const totalCal = recentWorkouts.reduce((sum, w) => sum + (w.calories || 0), 0);
    if (totalCal > 0) workouts.push({ l: "Calories burned", v: Math.round(totalCal) });
    const hrReadings = recentWorkouts.map((w) => w.avgHr).filter((v): v is number => v != null);
    if (hrReadings.length > 0) {
      workouts.push({ l: "Avg heart rate", v: Math.round(hrReadings.reduce((a, b) => a + b, 0) / hrReadings.length), u: "bpm" });
    }
    const sportCounts = recentWorkouts.reduce<Record<string, number>>((acc, w) => {
      acc[w.sport] = (acc[w.sport] || 0) + 1;
      return acc;
    }, {});
    const topSport = Object.entries(sportCounts).sort((a, b) => b[1] - a[1])[0];
    if (topSport) workouts.push({ l: "Most frequent", v: `${topSport[0]} (${topSport[1]})` });
  }

  return { sleep, activity, workouts };
}

const buildInitialForm = (patient: Patient) => ({
  first_name: patient.first_name || "",
  last_name: patient.last_name || "",
  email: patient.email || "",
  phone: patient.phone || "",
  date_of_birth: patient.date_of_birth ? patient.date_of_birth.slice(0, 10) : "",
  sex: patient.sex || "Other",
  address: patient.address || "",
  address_line_2: patient.address_line_2 || "",
  city: patient.city || "",
  state: patient.state || "",
  zip_code: patient.zip_code || "",
  allergies: patient.allergies || "",
  medical_conditions: patient.medical_conditions || "",
  self_reported_meds: patient.self_reported_meds || "",
});

const getApiRoot = () => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || window.location.origin;
  try {
    const url = new URL(baseUrl);
    const trimmedPath = url.pathname.replace(/\/+$/, "");
    if (trimmedPath.endsWith("/api/v1")) {
      const nextPath = trimmedPath.slice(0, -"/api/v1".length) || "/";
      return `${url.origin}${nextPath.replace(/\/+$/, "")}`;
    }
    return `${url.origin}${trimmedPath}`.replace(/\/+$/, "");
  } catch {
    return baseUrl.replace(/\/+$/, "").replace(/\/api\/v1$/, "");
  }
};

const normalizePortalUrl = (value?: string | null) => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
};

function ProviderLogo({ provider, logoUrl }: { provider: string; logoUrl?: string }) {
  const [errored, setErrored] = useState(false);
  if (logoUrl && !errored) {
    return (
      <img
        src={logoUrl}
        alt=""
        className="h-8 w-8 flex-shrink-0 rounded-md border border-slate-200 bg-white object-contain p-1"
        onError={() => setErrored(true)}
      />
    );
  }
  return (
    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
      {provider.slice(0, 2)}
    </div>
  );
}

export default function PatientDetailPage() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentClient } = useClients();
  const authUser = useAuthStore((state) => state.user);
  const [isImpersonating, setIsImpersonating] = useState(false);

  const canImpersonate = useMemo(() => {
    return Boolean(authUser?.primary_role === 'Super Admin' || authUser?.roles?.includes('Super Admin'));
  }, [authUser?.primary_role, authUser?.roles]);

  const patientPortalUrl = useMemo(() => {
    return normalizePortalUrl(
      currentClient?.resolved_patient_portal_domain || currentClient?.patient_portal_domain
    );
  }, [currentClient?.patient_portal_domain, currentClient?.resolved_patient_portal_domain]);

  const impersonationDisabledReason = !patientPortalUrl
    ? 'Patient portal domain is not configured'
    : undefined;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [episodes, setEpisodes] = useState<TreatmentEpisode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [wearableConnections, setWearableConnections] = useState<WearableConnection[]>([]);
  const [masterWearableData, setMasterWearableData] = useState<WearableDeviceData | null>(null);
  const [wearablesLoading, setWearablesLoading] = useState(false);
  const [wearableConsent, setWearableConsent] = useState<{ granted: boolean; date: string | null } | null>(null);
  const [providerLogos, setProviderLogos] = useState<Record<string, string>>({});
  const [healthTab, setHealthTab] = useState<"sleep" | "activity" | "workouts">("sleep");
  const [customInsightsOpen, setCustomInsightsOpen] = useState(false);
  const [timeRange, setTimeRange] = useState(30);
  const [masterVitalsData, setMasterVitalsData] = useState<any[]>([]);

  const vitalsData = useMemo(() => {
    if (!masterVitalsData.length) return [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - timeRange);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];
    return masterVitalsData.filter(v => (v.measured_at || "").split('T')[0] >= cutoffStr);
  }, [masterVitalsData, timeRange]);

  const wearableData = useMemo(() => {
    if (!masterWearableData) return null;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - timeRange);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];

    const filterSeries = <T extends { date: string }>(series?: T[]) => {
      if (!series) return [];
      return series.filter(item => item.date >= cutoffStr);
    };

    const stepsSeries = filterSeries(masterWearableData.stepsSeries);
    const sleepSeries = filterSeries(masterWearableData.sleepSeries);
    const readinessSeries = filterSeries(masterWearableData.readinessSeries);
    const workoutsSeries = filterSeries(masterWearableData.workoutsSeries);
    const recentWorkouts = filterSeries(masterWearableData.recentWorkouts);

    const customQueries = masterWearableData.customQueries?.map(q => ({
      ...q,
      series: filterSeries(q.series)
    })) || [];

    const activeDays = stepsSeries.length;
    const workoutsCount = recentWorkouts.length;
    
    const steps = stepsSeries.length ? String(stepsSeries[stepsSeries.length - 1].val) : masterWearableData.steps;
    
    let sleep = masterWearableData.sleep;
    if (sleepSeries.length) {
      const val = sleepSeries[sleepSeries.length - 1].val;
      const hrs = Math.floor(val);
      const mins = Math.round((val - hrs) * 60);
      sleep = `${hrs}h ${mins}m`;
    } else if (masterWearableData.sleepSeries?.length === 0) {
      sleep = null;
    }

    const readiness = readinessSeries.length ? readinessSeries[readinessSeries.length - 1].val : masterWearableData.readiness;
    
    return {
      ...masterWearableData,
      stepsSeries,
      sleepSeries,
      readinessSeries,
      workoutsSeries,
      recentWorkouts,
      customQueries,
      activeDays: String(activeDays),
      workoutsCount,
      steps,
      sleep,
      readiness,
    };
  }, [masterWearableData, timeRange]);
  const [formState, setFormState] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    sex: "Other" as Patient["sex"],
    address: "",
    address_line_2: "",
    city: "",
    state: "",
    zip_code: "",
    allergies: "",
    medical_conditions: "",
    self_reported_meds: "",
  });

  const handleImpersonate = useCallback(async () => {
    if (!patient?.id) return;
    if (!patientPortalUrl) {
      toast({
        title: 'Missing patient portal URL',
        description: 'Set the patient portal domain before impersonating.',
        variant: 'destructive',
      });
      return;
    }

    setIsImpersonating(true);
    try {
      const apiRoot = getApiRoot();
      const { data } = await axiosInstance.post(
        `${apiRoot}/api/admin/impersonate-patient/${patient.id}/`
      );

      if (!data?.token) {
        throw new Error('No impersonation token returned');
      }

      const url = new URL(patientPortalUrl);
      url.searchParams.set('impersonate_token', data.token);
      window.open(url.toString(), '_blank', 'noopener');
    } catch (err: any) {
      toast({
        title: 'Impersonation failed',
        description: err?.message || 'Unable to impersonate patient.',
        variant: 'destructive',
      });
    } finally {
      setIsImpersonating(false);
    }
  }, [patient?.id, patientPortalUrl, toast]);

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

  useEffect(() => {
    if (!patientId) return;
    let active = true;
    async function loadWearables() {
      // Prevent full component unmount on timeline changes by only showing the spinner initially
      // eslint-disable-next-line react-hooks/exhaustive-deps
      if (!masterWearableData) setWearablesLoading(true);
      try {
        api
          .get("/wearables/consent/", { params: { patient_id: patientId } })
          .then((res) => {
            const consent = res.data?.consent;
            if (active && consent) {
              setWearableConsent({
                granted: !!consent.consent_granted,
                date: consent.consented_at
                  ? new Date(consent.consented_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                  : null,
              });
            }
          })
          .catch((err) => console.error("Failed to load wearables consent:", err));

        const connRes = await api.get("/wearables/connections/", { params: { patient_id: patientId } });
        const allConns: WearableConnection[] = connRes.data?.connections || [];
        const conns = allConns.filter((c) => c.status === "connected");
        if (!active) return;
        setWearableConnections(conns);

        const hasConnected = conns.length > 0;
        if (hasConnected) {
          const [dataRes, vitalsRes] = await Promise.all([
            api.get("/wearables/device-data/", { params: { patient_id: patientId, days: 365 } }),
            api.get("/medical/vitals/", { params: { patient_id: patientId, days: 365 } }).catch(() => ({ data: [] })),
          ]);
          if (active) {
            setMasterWearableData(dataRes.data || null);
            setMasterVitalsData(Array.isArray(vitalsRes.data) ? vitalsRes.data : vitalsRes.data?.results || []);
          }
        } else if (active) {
          setMasterWearableData(null);
          setMasterVitalsData([]);
        }
      } catch (err) {
        console.error("Failed to load wearables data:", err);
      } finally {
        if (active) setWearablesLoading(false);
      }
    }
    loadWearables();
    return () => {
      active = false;
    };
  }, [patientId]);

  useEffect(() => {
    let active = true;
    api
      .get("/wearables/providers/")
      .then((res) => {
        if (!active) return;
        const sources: Array<{ slug?: string; logo_url?: string }> = res.data?.sources || [];
        const map: Record<string, string> = {};
        sources.forEach((s) => {
          if (s.slug && s.logo_url) map[s.slug] = s.logo_url;
        });
        setProviderLogos(map);
      })
      .catch((err) => console.error("Failed to load wearable provider catalog:", err));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (patient) {
      setFormState(buildInitialForm(patient));
    }
  }, [patient?.id]);

  const ordersByEpisode = useMemo(() => {
    const map = new Map<string, Order[]>();
    orders.forEach((order) => {
      const epId = order.episode_id;
      if (!epId) return;
      if (!map.has(epId)) map.set(epId, []);
      map.get(epId)!.push(order);
    });
    return map;
  }, [orders]);

  const fullName = patient?.full_name || `${patient?.first_name || ""} ${patient?.last_name || ""}`.trim();
  const initials = `${patient?.first_name?.[0] || ""}${patient?.last_name?.[0] || ""}`.toUpperCase() || "PT";
  const fullAddress = patient?.address
    ? `${patient.address}${patient.city || patient.state || patient.zip_code ? ", " : ""}${[patient.city, patient.state, patient.zip_code].filter(Boolean).join(" ")}`
    : "-";

  const getConnectionStatusTone = (connStatus?: string) => {
    const s = (connStatus || "").toLowerCase();
    if (s === "connected") return "text-emerald-700 bg-emerald-50 border-emerald-200";
    if (s === "pending") return "text-amber-700 bg-amber-50 border-amber-200";
    if (s === "error") return "text-red-700 bg-red-50 border-red-200";
    return "text-slate-700 bg-slate-50 border-slate-200";
  };

  // `renderTrendChart` has been extracted to `StaffTrendChart` component below to support interactive hooks

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

  const getCanonicalOrderAmount = (order?: Order | null) => {
    if (!order) return "-"
    const raw =
      order.pricing?.grand_total ||
      order.grand_total ||
      order.payable_amount ||
      order.orderTotal ||
      order.amount
    const value = Number.parseFloat(String(raw ?? ""))
    if (!Number.isFinite(value)) return "-"
    return `$${value.toFixed(2)}`
  }

  const handleUpdate = async () => {
    if (!patient?.id) return;

    setSaving(true);
    try {
      const payload: Partial<Patient> = {
        first_name: formState.first_name,
        last_name: formState.last_name,
        email: formState.email,
        phone: formState.phone,
        date_of_birth: formState.date_of_birth,
        sex: formState.sex,
        address: formState.address,
        address_line_2: formState.address_line_2,
        city: formState.city,
        state: formState.state,
        zip_code: formState.zip_code,
        allergies: formState.allergies,
        medical_conditions: formState.medical_conditions,
        self_reported_meds: formState.self_reported_meds,
      };
      await patientService.updatePatient(patient.id, payload);
      const updated = await patientService.getPatient(patient.id);
      setPatient(updated);
      toast({ title: "Patient updated" });
      setEditOpen(false);
    } catch (err: any) {
      toast({ title: err?.message || "Failed to update patient", variant: "destructive" });
    } finally {
      setSaving(false);
    }
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
              {canImpersonate && (
                <Button
                  variant="outline"
                  onClick={handleImpersonate}
                  disabled={!patientPortalUrl || isImpersonating}
                  title={impersonationDisabledReason}
                >
                  <ShieldAlert className="mr-2 h-4 w-4" />
                  {isImpersonating ? "Impersonating..." : "Impersonate Patient"}
                </Button>
              )}
              <PermissionGate permission={Permissions.USER_UPDATE}>
                <Button variant="outline" onClick={() => setEditOpen(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Patient
                </Button>
              </PermissionGate>
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
                    <TabsTrigger value="wearables" className="rounded-lg px-3">Devices</TabsTrigger>
                  </TabsList>

                  <TabsContent value="treatments" className="space-y-3">
                    {episodes.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                        No treatment episodes found.
                      </div>
                    ) : episodes.map((episode) => {
                      const episodeOrders = ordersByEpisode.get(episode.id) || [];
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
                                  {episodeOrders.length > 0 ? episodeOrders.map((order) => (
                                    <tr key={order.id} className="bg-white hover:bg-slate-50 border-t border-slate-100">
                                      <td className="p-2">
                                        <Link
                                          className="font-medium text-blue-600 hover:underline"
                                          to={`/dashboard/orders/details/${order.order_id || order.display_id || order.id}`}
                                        >
                                          {order.order_id || order.display_id || order.id.slice(0, 8)}
                                        </Link>
                                      </td>
                                      <td className="p-2 text-slate-700">{order.product_name || "-"}</td>
                                      <td className="p-2 font-semibold text-slate-900">{getCanonicalOrderAmount(order)}</td>
                                      <td className="p-2">
                                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${getOrderStatusTone(order.orderStatus || order.status)}`}>
                                          {order.orderStatus || order.status || "-"}
                                        </span>
                                      </td>
                                      <td className="p-2 text-slate-700">
                                        {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : "-"}
                                      </td>
                                    </tr>
                                  )) : (
                                    <tr>
                                      <td className="p-3 text-slate-500" colSpan={5}>
                                        No orders linked to this treatment.
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
                                <td className="p-3 font-semibold text-slate-900">{getCanonicalOrderAmount(order)}</td>
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

                  <TabsContent value="wearables" className="space-y-3">
                    {wearablesLoading ? (
                      <div className="flex items-center gap-2 p-6 text-sm text-slate-500">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading wearables...
                      </div>
                    ) : wearableConnections.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                        No wearable connected. The patient can connect a device from their portal.
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {wearableConnections.map((c) => (
                            <div
                              key={c.id}
                              className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3"
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                <ProviderLogo provider={c.provider} logoUrl={providerLogos[c.provider]} />
                                <div className="min-w-0">
                                  <div className="truncate font-semibold capitalize text-slate-900">
                                    {c.provider.replace(/_/g, " ")}
                                  </div>
                                  <div className="mt-0.5 text-xs text-slate-500">
                                    {c.last_sync_at ? `Last synced ${new Date(c.last_sync_at).toLocaleString()}` : "Never synced"}
                                  </div>
                                </div>
                              </div>
                              <span className={`inline-flex flex-shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${getConnectionStatusTone(c.status)}`}>
                                {c.status}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                          <h3 className="mb-2 text-sm font-semibold text-slate-900">Data Sources Priority</h3>
                          <p className="mb-3 text-xs text-slate-500">
                            The priority this patient has configured for deduplicating their vitals data (read-only).
                          </p>
                          {patient.vitals_source_priority && patient.vitals_source_priority.length > 0 ? (
                            <div className="flex flex-col gap-2">
                              {patient.vitals_source_priority.map((source, index) => {
                                const labels: Record<string, string> = {
                                  questionnaire: 'Clinical Intake (Questionnaire)',
                                  patient_portal: 'Manual Dashboard Logs',
                                  wearable: 'Smart Devices (Wearables)',
                                };
                                return (
                                  <div key={source} className="flex items-center gap-3 rounded-md bg-slate-50 px-3 py-2 text-sm border border-slate-100">
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-xs font-medium text-slate-600">
                                      {index + 1}
                                    </span>
                                    <span className="font-medium text-slate-700">{labels[source] || source}</span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-sm text-slate-500 italic">No custom priority set by patient.</div>
                          )}
                        </div>

                        {wearableData && (() => {
                          const {
                            sleep: sleepMetrics,
                            activity: activityMetrics,
                            heart: heartMetrics,
                            workouts: workoutsMetrics,
                            glucose: glucoseMetrics,
                          } = buildWearableMetrics(wearableData, timeRange);
                          const healthTabs: { id: "sleep" | "activity" | "workouts"; label: string; metrics: MetricItem[] }[] = [
                            { id: "sleep", label: "Sleep", metrics: sleepMetrics },
                            { id: "activity", label: "Activity", metrics: activityMetrics },
                            { id: "workouts", label: "Workouts", metrics: workoutsMetrics },
                          ];
                          const activeMetrics = healthTabs.find((t) => t.id === healthTab)?.metrics ?? [];
                          const activeTrend =
                            healthTab === "sleep" && wearableData.sleepSeries && wearableData.sleepSeries.length > 1
                              ? { series: wearableData.sleepSeries, unit: "hrs", dec: 1 }
                              : healthTab === "activity" && wearableData.stepsSeries && wearableData.stepsSeries.length > 1
                              ? { series: wearableData.stepsSeries, unit: "", dec: 0 }
                              : healthTab === "workouts" && wearableData.workoutsSeries && wearableData.workoutsSeries.length > 1 && wearableData.workoutsSeries.some(s => s.val > 0)
                              ? { series: wearableData.workoutsSeries, unit: "min", dec: 0 }
                              : null;

                          const readinessSeries = wearableData.readinessSeries || [];
                          const weightSeries = wearableData.weightSeries || [];

                          return (
                            <>
                              <Card className="border-slate-200 shadow-sm">
                                <CardHeader className="border-b border-slate-100 pb-2">
                                  <CardTitle className="text-base text-slate-900">Readiness</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4">
                                  <div className="mb-2 text-2xl font-bold text-slate-900">
                                    {wearableData.readiness ?? "—"}
                                    <span className="text-sm font-normal text-slate-500"> /100</span>
                                  </div>
                                  {readinessSeries.length > 1 ? (
                                    <StaffTrendChart series={readinessSeries} dec={0} color="#0ea5e9" />
                                  ) : (
                                    <div className="p-4 text-center text-sm text-slate-500">Not enough history yet for a trend line.</div>
                                  )}
                                  <div className="mt-4 grid grid-cols-3 gap-3">
                                    {[
                                      { label: "Recovery", val: wearableData.recovery != null ? `${wearableData.recovery}%` : "—" },
                                      { label: "Sleep score", val: wearableData.sleepScore != null ? `${wearableData.sleepScore}/100` : "—" },
                                      { label: "Resting HR", val: wearableData.restingHr ? `${wearableData.restingHr} bpm` : "—" },
                                    ].map((m) => (
                                      <div key={m.label} className="rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2">
                                        <div className="text-[11px] uppercase tracking-wide text-slate-500">{m.label}</div>
                                        <div className="mt-0.5 text-lg font-bold text-slate-900">{m.val}</div>
                                      </div>
                                    ))}
                                  </div>
                                </CardContent>
                              </Card>

                              {vitalsData.length > 0 && (() => {
                                const priorityList = patient?.vitals_source_priority || ['questionnaire', 'patient_portal', 'wearable'];
                                const byDate = new Map<string, any>();
                                
                                for (const entry of vitalsData) {
                                  if (entry.weight_lbs == null) continue;
                                  
                                  const dateKey = entry.measured_at.split('T')[0];
                                  const existing = byDate.get(dateKey);
                                  
                                  if (!existing) {
                                    byDate.set(dateKey, entry);
                                  } else {
                                    const existingRank = priorityList.indexOf(existing.source);
                                    const newRank = priorityList.indexOf(entry.source);
                                    
                                    const eRank = existingRank === -1 ? 999 : existingRank;
                                    const nRank = newRank === -1 ? 999 : newRank;
                                    
                                    if (nRank < eRank) {
                                      byDate.set(dateKey, entry);
                                    } else if (nRank === eRank && new Date(entry.measured_at).getTime() > new Date(existing.measured_at).getTime()) {
                                      byDate.set(dateKey, entry);
                                    }
                                  }
                                }

                                const sortedVitals = Array.from(byDate.values())
                                  .sort((a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime());

                                const points = sortedVitals.map(v => ({
                                  date: v.measured_at,
                                  weight: Number(v.weight_lbs),
                                  height: v.height_in ? Number(v.height_in) : null,
                                  bmi: v.bmi ? Number(v.bmi) : null,
                                }));
                                const cur = points[points.length - 1]?.weight;
                                const chg = points.length > 1 ? +(cur - points[0].weight).toFixed(1) : null;
                                return (
                                  <Card className="border-slate-200 shadow-sm">
                                    <CardHeader className="border-b border-slate-100 pb-2">
                                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex items-center gap-2">
                                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
                                            <TrendingUp size={16} strokeWidth={2} />
                                          </div>
                                          <CardTitle className="text-base text-slate-900">Weight Trend</CardTitle>
                                        </div>
                                        <div className="flex gap-1.5">
                                          {[
                                            { label: '1W', days: 7 },
                                            { label: '1M', days: 30 },
                                            { label: '3M', days: 90 },
                                            { label: '1Y', days: 365 },
                                          ].map(opt => (
                                            <button
                                              key={opt.days}
                                              onClick={() => {
                                                if (opt.days === 90 || opt.days === 365) {
                                                  toast({
                                                    title: 'Fetching extended historical data. This may take a moment...',
                                                    duration: 4000,
                                                  });
                                                }
                                                setTimeRange(opt.days);
                                              }}
                                              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                                                timeRange === opt.days
                                                  ? 'bg-slate-900 text-white'
                                                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                              }`}
                                            >
                                              {opt.label}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    </CardHeader>
                                    <CardContent className="pt-4">
                                      <div className="mb-4 flex items-baseline justify-between">
                                        <div>
                                          <div className="text-3xl font-bold text-slate-900">
                                            {cur} <span className="text-lg font-normal text-slate-500">lb</span>
                                          </div>
                                          {chg != null && (
                                            <div className={`mt-1 text-sm font-semibold ${chg <= 0 ? "text-emerald-600" : "text-amber-600"}`}>
                                              {chg <= 0 ? "▼" : "▲"} {Math.abs(chg)} lb overall
                                            </div>
                                          )}
                                        </div>
                                        <div className="text-right text-xs text-slate-500">
                                          BMI <span className="font-semibold text-slate-900">{points[points.length - 1]?.bmi?.toFixed(1) || 'N/A'}</span>
                                        </div>
                                      </div>
                                      {points.length > 1 ? (
                                        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                                          <WeightTrendChart points={points as any} targetBmi={null} />
                                        </div>
                                      ) : (
                                        <div className="p-4 text-center text-sm text-slate-500">Not enough history yet for a trend line.</div>
                                      )}
                                    </CardContent>
                                  </Card>
                                );
                              })()}

                              <Card className="border-slate-200 shadow-sm">
                                <CardHeader className="border-b border-slate-100 pb-3">
                                  <div className="flex flex-wrap gap-2">
                                    {healthTabs.map((t) => (
                                      <button
                                        key={t.id}
                                        onClick={() => setHealthTab(t.id)}
                                        className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                                          healthTab === t.id
                                            ? "border-slate-900 bg-slate-900 text-white"
                                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                        }`}
                                      >
                                        {t.label}
                                      </button>
                                    ))}
                                    {wearableData?.customQueries && wearableData.customQueries.length > 0 && (
                                      <button
                                        onClick={() => setCustomInsightsOpen(true)}
                                        className="flex-none rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[12px] font-semibold text-slate-500 hover:bg-slate-100 transition-colors ml-auto"
                                      >
                                        Custom Insights ✦
                                      </button>
                                    )}
                                  </div>
                                  <CustomInsightsModal 
                                    open={customInsightsOpen}
                                    onOpenChange={setCustomInsightsOpen}
                                    customQueries={wearableData?.customQueries}
                                  />
                                </CardHeader>
                                <CardContent className="pt-4 space-y-4">
                                  {activeTrend && <StaffTrendChart series={activeTrend.series} unit={activeTrend.unit} dec={activeTrend.dec} color="#0ea5e9" />}
                                  {activeMetrics.length === 0 ? (
                                    <div className="p-4 text-center text-sm text-slate-500">No recent data available.</div>
                                  ) : (
                                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                      {activeMetrics.map((m) => (
                                        <div key={m.l} className="rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2">
                                          <div className="text-[11px] uppercase tracking-wide text-slate-500">{m.l}</div>
                                          <div className="mt-0.5 font-medium text-slate-900">
                                            {m.v}
                                            {m.u ? <span className="ml-1 text-xs font-normal text-slate-500">{m.u}</span> : null}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            </>
                          );
                        })()}
                      </>
                    )}

                    {wearableConsent && (
                      <div
                        className={`rounded-lg border px-3 py-2.5 text-xs ${
                          wearableConsent.granted ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-semibold">
                          <span className={`inline-block h-2 w-2 rounded-full ${wearableConsent.granted ? "bg-emerald-500" : "bg-slate-400"}`} />
                          <span className={wearableConsent.granted ? "text-emerald-700" : "text-slate-600"}>
                            {wearableConsent.granted ? "Consent on file" : "No consent on file"}
                          </span>
                        </div>
                        <p className="mt-1 leading-relaxed text-slate-600">
                          {wearableConsent.granted ? (
                            <>Patient agreed to share this data{wearableConsent.date ? ` on ${wearableConsent.date}` : ""}. </>
                          ) : (
                            "The patient has not granted consent to share wearables data. "
                          )}
                          Synced from the patient's connected devices via Junction. Sections populate based on the sources the
                          patient has linked, and refresh automatically several times a day. This view is read-only — the
                          patient manages connections and consent from their own portal.
                        </p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Patient</DialogTitle>
            <DialogDescription>
              Update contact and medical details for this patient.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-3 scrollbar-hide overscroll-contain">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">First Name</label>
                <Input
                  placeholder="First name"
                  value={formState.first_name}
                  onChange={(e) => setFormState((prev) => ({ ...prev, first_name: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Last Name</label>
                <Input
                  placeholder="Last name"
                  value={formState.last_name}
                  onChange={(e) => setFormState((prev) => ({ ...prev, last_name: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Email</label>
              <Input
                placeholder="Email address"
                value={formState.email}
                onChange={(e) => setFormState((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Phone</label>
                <Input
                  placeholder="e.g. (555) 123-4567"
                  value={formState.phone}
                  onChange={(e) => setFormState((prev) => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Date of Birth</label>
                <Input
                  type="date"
                  value={formState.date_of_birth}
                  onChange={(e) => setFormState((prev) => ({ ...prev, date_of_birth: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Sex</label>
                <Select
                  value={formState.sex}
                  onValueChange={(value) => setFormState((prev) => ({ ...prev, sex: value as Patient["sex"] }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Address</label>
              <Input
                placeholder="Street address"
                value={formState.address}
                onChange={(e) => setFormState((prev) => ({ ...prev, address: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Apt / Suite / Unit</label>
              <Input
                placeholder="Apartment, suite, unit, etc."
                value={formState.address_line_2}
                onChange={(e) => setFormState((prev) => ({ ...prev, address_line_2: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">City</label>
                <Input
                  placeholder="City"
                  value={formState.city}
                  onChange={(e) => setFormState((prev) => ({ ...prev, city: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">State</label>
                <Input
                  placeholder="State"
                  value={formState.state}
                  onChange={(e) => setFormState((prev) => ({ ...prev, state: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Zip Code</label>
                <Input
                  placeholder="Zip"
                  value={formState.zip_code}
                  onChange={(e) => setFormState((prev) => ({ ...prev, zip_code: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Allergies</label>
              <Textarea
                placeholder="List allergies or note none"
                value={formState.allergies}
                onChange={(e) => setFormState((prev) => ({ ...prev, allergies: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Medical Conditions</label>
              <Textarea
                placeholder="Relevant conditions"
                value={formState.medical_conditions}
                onChange={(e) => setFormState((prev) => ({ ...prev, medical_conditions: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Current Medications</label>
              <Textarea
                placeholder="Current medications"
                value={formState.self_reported_meds}
                onChange={(e) => setFormState((prev) => ({ ...prev, self_reported_meds: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


/* ─── Weight Trend Chart ─── */
function WeightTrendChart({
  points,
  targetBmi,
}: {
  points: { date: string; weight: number; height?: number | null; bmi?: number | null }[];
  targetBmi?: number | null;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!points || points.length < 2) return null;

  const series = points.map(p => p.weight);
  const w = 500, h = 170;
  const padL = 14, padR = 44, padT = 36, padB = 24;
  const n = series.length - 1;
  let mn = Math.min(...series);
  let mx = Math.max(...series);

  let targetWeight: number | null = null;
  if (targetBmi) {
    const pWithHeight = [...points].reverse().find(p => p.height != null);
    if (pWithHeight && pWithHeight.height) {
      targetWeight = (targetBmi * pWithHeight.height * pWithHeight.height) / 703;
      mn = Math.min(mn, targetWeight);
      mx = Math.max(mx, targetWeight);
    }
  }

  const rng = mx - mn || 1;
  const lo = mn - rng * 0.15;
  const vr = mx + rng * 0.15 - lo || 1;

  const X = (i: number) => padL + i * ((w - padL - padR) / n);
  const Y = (v: number) => padT + (1 - (v - lo) / vr) * (h - padT - padB);

  let pathD = `M ${X(0)},${Y(series[0]!)}`;
  for (let i = 0; i < n; i++) {
    const p0x = X(i), p0y = Y(series[i]!);
    const p1x = X(i + 1), p1y = Y(series[i + 1]!);
    const cx = (p0x + p1x) / 2;
    pathD += ` C ${cx},${p0y} ${cx},${p1y} ${p1x},${p1y}`;
  }

  const areaD = `${pathD} L ${w - padR},${h - padB} L ${padL},${h - padB} Z`;

  const fmtD = (dStr: string) => {
    const d = new Date(dStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const ti = [0, Math.round(n / 2), n].filter((v, ix, a) => a.indexOf(v) === ix);

  return (
    <div style={{ position: 'relative' }}>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible', touchAction: 'none' }}
        preserveAspectRatio="none"
        onPointerMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const scaleX = w / rect.width;
          const x = (e.clientX - rect.left) * scaleX;
          if (x < padL - 10 || x > w - padR + 10) {
            setHoveredIndex(null);
            return;
          }
          const ratio = (x - padL) / (w - padL - padR);
          const index = Math.round(ratio * n);
          setHoveredIndex(Math.max(0, Math.min(n, index)));
        }}
        onPointerLeave={() => setHoveredIndex(null)}
      >
        <defs>
          <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
          </linearGradient>
        </defs>
        {targetWeight !== null && (
          <line
            x1={padL} y1={Y(targetWeight)}
            x2={w - padR} y2={Y(targetWeight)}
            stroke="var(--km-t2, #94a3b8)" strokeWidth={1} strokeDasharray="4 4"
          />
        )}
        <path d={areaD} fill="url(#area-gradient)" stroke="none" />
        <path d={pathD} fill="none" stroke="#0ea5e9" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        
        {series.map((v, i) => {
          const isHovered = hoveredIndex === i;
          const isLast = i === n;
          const showDot = points.length < 30 || isHovered || isLast;
          if (!showDot) return null;
          return (
            <circle
              key={i} cx={X(i)} cy={Y(v)}
              r={isHovered ? 5 : (isLast ? 3.4 : 2.4)}
              fill="#0ea5e9"
              stroke={isLast || isHovered ? '#fff' : undefined}
              strokeWidth={isLast || isHovered ? 1.5 : undefined}
              style={{ transition: 'all 0.2s ease', pointerEvents: 'none' }}
            />
          );
        })}

        {hoveredIndex !== null && (
          <line
            x1={X(hoveredIndex)} y1={Y(series[hoveredIndex]!)}
            x2={X(hoveredIndex)} y2={h - padB}
            stroke="#0ea5e9" strokeWidth={1} strokeDasharray="3 3"
            opacity={0.5}
            pointerEvents="none"
          />
        )}

        {ti.map((i) => (
          <text
            key={`date-${i}`} x={X(i)} y={h - 4} fontSize={10} fill="var(--km-tm)"
            textAnchor={i === 0 ? 'start' : i === n ? 'end' : 'middle'}
          >
            {fmtD(points[i]!.date)}
          </text>
        ))}


      </svg>
      
      {hoveredIndex !== null && (
        <div
          style={{
            position: 'absolute',
            left: `${((X(hoveredIndex) / w) * 100)}%`,
            top: `${((Y(series[hoveredIndex]!) / h) * 100)}%`,
            transform: 'translate(-50%, -115%)',
            pointerEvents: 'none',
            background: 'var(--km-s1, rgba(255, 255, 255, 0.9))',
            backdropFilter: 'blur(8px)',
            border: '1px solid var(--km-b)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            padding: '8px 12px',
            borderRadius: 8,
            fontSize: 11,
            zIndex: 10,
            whiteSpace: 'nowrap',
          }}
        >
          <div style={{ fontWeight: 700, color: 'var(--km-t)', marginBottom: 2 }}>
            {new Date(points[hoveredIndex]!.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          <div style={{ color: 'var(--km-t2)' }}>Weight: <b style={{ color: 'var(--km-t)' }}>{points[hoveredIndex]!.weight} lb</b></div>
          {points[hoveredIndex]!.height != null && (
            <div style={{ color: 'var(--km-t2)' }}>Height: <b style={{ color: 'var(--km-t)' }}>{points[hoveredIndex]!.height} in</b></div>
          )}
          {points[hoveredIndex]!.bmi != null && (
            <div style={{ color: 'var(--km-t2)' }}>BMI: <b style={{ color: 'var(--km-t)' }}>{points[hoveredIndex]!.bmi}</b></div>
          )}
        </div>
      )}
    </div>
  );
}

function StaffTrendChart({
  series,
  dec = 0,
  color = '#0ea5e9',
  unit = '',
}: {
  series: { date: string; val: number }[];
  dec?: number;
  color?: string;
  unit?: string;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!series || series.length < 2) return null;

  const w = 640, h = 140;
  const padL = 14, padR = 46, padT = 24, padB = 24;
  
  const n = series.length - 1;
  const vals = series.map(s => s.val);
  const mn = Math.min(...vals);
  const mx = Math.max(...vals);
  const rng = mx - mn || 1;
  const lo = mn - rng * 0.15;
  const vr = mx + rng * 0.15 - lo || 1;

  // Map dates to timestamps for proportional X axis spacing
  const times = series.map(s => new Date(s.date).getTime());
  const mnTime = times[0]!;
  const mxTime = times[n]!;
  const timeRng = mxTime - mnTime || 1;

  const X = (i: number) => padL + ((times[i]! - mnTime) / timeRng) * (w - padL - padR);
  const Y = (v: number) => padT + (1 - (v - lo) / vr) * (h - padT - padB);

  let pathD = `M ${X(0)},${Y(vals[0]!)}`;
  for (let i = 0; i < n; i++) {
    const p0x = X(i), p0y = Y(vals[i]!);
    const p1x = X(i + 1), p1y = Y(vals[i + 1]!);
    const cx = (p0x + p1x) / 2;
    pathD += ` C ${cx},${p0y} ${cx},${p1y} ${p1x},${p1y}`;
  }

  const areaD = `${pathD} L ${w - padR},${h - padB} L ${padL},${h - padB} Z`;

  const fmtD = (dStr: string) => {
    const d = new Date(dStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="block h-auto w-full overflow-visible touch-none"
        preserveAspectRatio="none"
        onPointerMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const scaleX = w / rect.width;
          const x = (e.clientX - rect.left) * scaleX;
          if (x < padL - 10 || x > w - padR + 10) {
            setHoveredIndex(null);
            return;
          }
          // Find the closest point by X coordinate
          let closestIdx = 0;
          let minDist = Infinity;
          for (let i = 0; i <= n; i++) {
            const dist = Math.abs(X(i) - x);
            if (dist < minDist) {
              minDist = dist;
              closestIdx = i;
            }
          }
          setHoveredIndex(closestIdx);
        }}
        onPointerLeave={() => setHoveredIndex(null)}
      >
        <defs>
          <linearGradient id={`area-gradient-${color.replace(/[^a-zA-Z0-9]/g, '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        
        <path d={areaD} fill={`url(#area-gradient-${color.replace(/[^a-zA-Z0-9]/g, '')})`} stroke="none" />
        <path d={pathD} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        
        {series.map((s, i) => {
          const isHovered = hoveredIndex === i;
          const isLast = i === n;
          const showDot = series.length < 30 || isHovered || isLast;
          if (!showDot) return null;
          return (
            <circle
              key={i} cx={X(i)} cy={Y(s.val)}
              r={isHovered ? 5 : (isLast ? 3.4 : 2.4)}
              fill={color}
              stroke={isLast || isHovered ? '#fff' : undefined}
              strokeWidth={isLast || isHovered ? 1.5 : undefined}
              style={{ transition: 'all 0.2s ease', pointerEvents: 'none' }}
            />
          );
        })}

        {hoveredIndex !== null && (
          <line
            x1={X(hoveredIndex)} y1={Y(vals[hoveredIndex]!)}
            x2={X(hoveredIndex)} y2={h - padB}
            stroke={color} strokeWidth={1} strokeDasharray="3 3"
            opacity={0.5}
            pointerEvents="none"
          />
        )}

        <text x={X(n)} y={Y(vals[n]!) - 10} fontSize={10.5} fontWeight={700} fill="#334155" textAnchor="end">
          {dec ? vals[n]!.toFixed(dec) : Math.round(vals[n]!).toLocaleString()}
          {unit ? ` ${unit}` : ''}
        </text>
      </svg>
      
      {hoveredIndex !== null && (
        <div
          style={{
            position: 'absolute',
            left: `${((X(hoveredIndex) / w) * 100)}%`,
            top: `${((Y(vals[hoveredIndex]!) / h) * 100)}%`,
            transform: 'translate(-50%, -115%)',
            background: 'var(--km-s1, rgba(255, 255, 255, 0.9))',
            backdropFilter: 'blur(8px)',
            color: 'var(--km-t, #0f172a)',
            padding: '4px 8px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
            pointerEvents: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            border: '1px solid var(--km-b, #e2e8f0)',
            whiteSpace: 'nowrap',
            zIndex: 10,
          }}
        >
          {dec ? vals[hoveredIndex]!.toFixed(dec) : Math.round(vals[hoveredIndex]!).toLocaleString()}
          {unit ? ` ${unit}` : ''}
          <div style={{ fontSize: 9, color: 'var(--km-tm, #64748b)', fontWeight: 500, marginTop: 1 }}>
            {fmtD(series[hoveredIndex]!.date)}
          </div>
        </div>
      )}
    </div>
  );
}
