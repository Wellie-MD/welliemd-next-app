import { useEffect, useState } from "react";
import { Pill, Calendar, Plus, FileCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { AvailableTreatmentsList } from "@/features/treatments";
import { VisitService, Visit } from "@/features/visits/services/visit.service";

// Status mapping for visits
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  submitted: { label: "Submitted", color: "bg-blue-100 text-blue-800" },
  approved: { label: "Approved", color: "bg-green-100 text-green-800" },
  in_review: { label: "In Review", color: "bg-yellow-100 text-yellow-800" },
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  completed: { label: "Completed", color: "bg-gray-100 text-gray-800" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800" },
};

// Statuses considered "active"
const ACTIVE_STATUSES = ["submitted", "approved", "in_review", "pending"];

export default function Treatments() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadVisits();
  }, []);

  const loadVisits = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await VisitService.getPatientVisits();
      setVisits(data);
    } catch (err) {
      console.error("Failed to load visits:", err);
      setError("Failed to load treatments. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Separate active and completed treatments
  const activeTreatments = visits.filter((v) =>
    ACTIVE_STATUSES.includes(v.status.toLowerCase())
  );
  const completedTreatments = visits.filter(
    (v) => !ACTIVE_STATUSES.includes(v.status.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusConfig = (status: string) => {
    return (
      STATUS_CONFIG[status.toLowerCase()] || {
        label: status,
        color: "bg-gray-100 text-gray-800",
      }
    );
  };

  const TreatmentCard = ({ visit }: { visit: Visit }) => {
    const statusConfig = getStatusConfig(visit.status);

    return (
      <Card className="mb-4">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <Pill className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="font-semibold text-lg text-gray-900">
                    {visit.visit_type}
                  </h3>
                  <Badge className={statusConfig.color}>
                    {statusConfig.label}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    <span>Started: {formatDate(visit.created_at)}</span>
                  </div>
                  {visit.submitted_at && (
                    <div className="flex items-center">
                      <FileCheck className="h-4 w-4 mr-2 text-gray-400" />
                      <span>Submitted: {formatDate(visit.submitted_at)}</span>
                    </div>
                  )}
                </div>

                {visit.master_id && (
                  <div className="mt-2 text-xs text-gray-400">
                    ID: {visit.master_id}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Treatments</h1>
          <p className="text-gray-600">Manage your current and past treatments</p>
        </div>
      </div>

      {/* Start New Treatment Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-green-600" />
            <CardTitle className="text-lg font-medium text-gray-900">
              Start New Treatment
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <AvailableTreatmentsList />
        </CardContent>
      </Card>

      {/* Treatment History Tabs */}
      <Tabs defaultValue="active" className="space-y-6">
        <TabsList>
          <TabsTrigger value="active">
            Active Treatments ({activeTreatments.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Treatment History ({completedTreatments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {loading ? (
            <div className="p-6 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3 text-gray-600">Loading treatments...</span>
            </div>
          ) : error ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-red-600">{error}</p>
                <button
                  onClick={loadVisits}
                  className="mt-2 text-sm text-blue-600 hover:underline"
                >
                  Try again
                </button>
              </CardContent>
            </Card>
          ) : activeTreatments.length > 0 ? (
            activeTreatments.map((visit) => (
              <TreatmentCard key={visit.id} visit={visit} />
            ))
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Pill className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No active treatments
                </h3>
                <p className="text-gray-600">
                  Start a new treatment above to get started.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {loading ? (
            <div className="p-6 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3 text-gray-600">Loading...</span>
            </div>
          ) : completedTreatments.length > 0 ? (
            completedTreatments.map((visit) => (
              <TreatmentCard key={visit.id} visit={visit} />
            ))
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Pill className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No completed treatments
                </h3>
                <p className="text-gray-600">
                  You don't have any completed treatments yet.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}