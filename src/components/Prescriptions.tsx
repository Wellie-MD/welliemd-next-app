import { useState } from "react";
import { Pill, Calendar, Clock, User, RefreshCw, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Alert, AlertDescription } from "./ui/alert";

interface Prescription {
  id: number;
  medication: string;
  genericName?: string;
  dosage: string;
  frequency: string;
  quantity: number;
  refillsRemaining: number;
  prescribedBy: string;
  prescribedDate: string;
  expiryDate: string;
  instructions: string;
  status: 'active' | 'expired' | 'discontinued' | 'pending';
  category: 'chronic' | 'acute' | 'preventive';
  sideEffects?: string[];
  refillRequestDate?: string;
}

export default function Prescriptions() {
  const [prescriptions] = useState<Prescription[]>([
    {
      id: 1,
      medication: "Lisinopril",
      genericName: "Lisinopril",
      dosage: "10mg tablets",
      frequency: "Once daily",
      quantity: 30,
      refillsRemaining: 3,
      prescribedBy: "Dr. Sarah Johnson",
      prescribedDate: "2024-12-01",
      expiryDate: "2025-12-01",
      instructions: "Take with food in the morning. Monitor blood pressure regularly.",
      status: "active",
      category: "chronic",
      sideEffects: ["Dizziness", "Dry cough", "Headache"]
    },
    {
      id: 2,
      medication: "Metformin",
      genericName: "Metformin HCl",
      dosage: "500mg tablets",
      frequency: "Twice daily with meals",
      quantity: 60,
      refillsRemaining: 2,
      prescribedBy: "Dr. Emily Rodriguez",
      prescribedDate: "2024-11-15",
      expiryDate: "2025-11-15",
      instructions: "Take with breakfast and dinner. May cause stomach upset initially.",
      status: "active",
      category: "chronic",
      sideEffects: ["Nausea", "Diarrhea", "Metallic taste"]
    },
    {
      id: 3,
      medication: "Amoxicillin",
      genericName: "Amoxicillin",
      dosage: "500mg capsules",
      frequency: "Three times daily",
      quantity: 21,
      refillsRemaining: 0,
      prescribedBy: "Dr. Michael Chen",
      prescribedDate: "2024-12-10",
      expiryDate: "2024-12-17",
      instructions: "Complete full course even if feeling better. Take with food.",
      status: "expired",
      category: "acute"
    },
    {
      id: 4,
      medication: "Atorvastatin",
      genericName: "Atorvastatin Calcium",
      dosage: "20mg tablets",
      frequency: "Once daily at bedtime",
      quantity: 30,
      refillsRemaining: 5,
      prescribedBy: "Dr. Sarah Johnson",
      prescribedDate: "2024-10-15",
      expiryDate: "2025-10-15",
      instructions: "Take at bedtime. Avoid grapefruit juice.",
      status: "active",
      category: "preventive",
      refillRequestDate: "2024-12-20"
    }
  ]);

  const activePrescriptions = prescriptions.filter(p => p.status === 'active');
  const expiredPrescriptions = prescriptions.filter(p => p.status === 'expired' || p.status === 'discontinued');
  const pendingRefills = prescriptions.filter(p => p.refillRequestDate);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'discontinued':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'chronic':
        return 'bg-blue-100 text-blue-800';
      case 'acute':
        return 'bg-orange-100 text-orange-800';
      case 'preventive':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const needsRefillSoon = (prescription: Prescription) => {
    return prescription.refillsRemaining <= 1 && prescription.status === 'active';
  };

  const PrescriptionCard = ({ prescription }: { prescription: Prescription }) => (
    <Card className="mb-4">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4 flex-1">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Pill className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="font-semibold text-lg text-gray-900">{prescription.medication}</h3>
                <Badge className={getStatusColor(prescription.status)}>
                  {prescription.status.charAt(0).toUpperCase() + prescription.status.slice(1)}
                </Badge>
                <Badge className={getCategoryColor(prescription.category)}>
                  {prescription.category.charAt(0).toUpperCase() + prescription.category.slice(1)}
                </Badge>
              </div>
              
              {prescription.genericName && prescription.genericName !== prescription.medication && (
                <p className="text-sm text-gray-600 mb-2">Generic: {prescription.genericName}</p>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                <div>
                  <p><strong>Dosage:</strong> {prescription.dosage}</p>
                  <p><strong>Frequency:</strong> {prescription.frequency}</p>
                  <p><strong>Quantity:</strong> {prescription.quantity}</p>
                </div>
                <div>
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-1 text-gray-400" />
                    <span>{prescription.prescribedBy}</span>
                  </div>
                  <div className="flex items-center mt-1">
                    <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                    <span>Prescribed: {prescription.prescribedDate}</span>
                  </div>
                  <div className="flex items-center mt-1">
                    <Clock className="h-4 w-4 mr-1 text-gray-400" />
                    <span>Expires: {prescription.expiryDate}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 p-3 rounded-lg mb-3">
                <p className="text-sm text-blue-800">
                  <strong>Instructions:</strong> {prescription.instructions}
                </p>
              </div>
              
              {prescription.sideEffects && prescription.sideEffects.length > 0 && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded mb-3">
                  <p className="text-sm text-yellow-800">
                    <strong>Common side effects:</strong> {prescription.sideEffects.join(', ')}
                  </p>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <span className={`font-medium ${prescription.refillsRemaining <= 1 ? 'text-orange-600' : ''}`}>
                    Refills remaining: {prescription.refillsRemaining}
                  </span>
                </div>
                
                {needsRefillSoon(prescription) && (
                  <div className="flex items-center text-orange-600 text-sm">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    <span>Refill needed soon</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col space-y-2 ml-4">
            {prescription.status === 'active' && prescription.refillsRemaining > 0 && (
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Request Refill
              </Button>
            )}
            <Button variant="outline" size="sm">
              View Details
            </Button>
          </div>
        </div>
        
        {prescription.refillRequestDate && (
          <div className="mt-4 p-3 bg-green-50 border-l-4 border-green-400 rounded">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
              <p className="text-sm text-green-800">
                Refill requested on {prescription.refillRequestDate} - Processing
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Prescriptions</h1>
          <p className="text-gray-600">Manage your medications and prescriptions</p>
        </div>
        <Button>
          <Pill className="h-4 w-4 mr-2" />
          Request New Prescription
        </Button>
      </div>

      {/* Alerts for refills needed */}
      {activePrescriptions.some(needsRefillSoon) && (
        <Alert className="mb-6 border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            You have {activePrescriptions.filter(needsRefillSoon).length} prescription(s) that need refills soon. 
            Request refills to avoid running out of medication.
          </AlertDescription>
        </Alert>
      )}

      {/* Pending refills alert */}
      {pendingRefills.length > 0 && (
        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <RefreshCw className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            You have {pendingRefills.length} refill request(s) being processed by your pharmacy.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList>
          <TabsTrigger value="active">
            Active Prescriptions ({activePrescriptions.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            Prescription History ({expiredPrescriptions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activePrescriptions.length > 0 ? (
            activePrescriptions.map((prescription) => (
              <PrescriptionCard key={prescription.id} prescription={prescription} />
            ))
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Pill className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No active prescriptions</h3>
                <p className="text-gray-600 mb-4">You don't have any active prescriptions at the moment.</p>
                <Button>
                  <Pill className="h-4 w-4 mr-2" />
                  Request New Prescription
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {expiredPrescriptions.map((prescription) => (
            <PrescriptionCard key={prescription.id} prescription={prescription} />
          ))}
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <RefreshCw className="h-8 w-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-medium text-gray-900 mb-1">Refill Prescriptions</h3>
              <p className="text-sm text-gray-600">Request refills for existing medications</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <Pill className="h-8 w-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-medium text-gray-900 mb-1">New Prescription</h3>
              <p className="text-sm text-gray-600">Request a new prescription from your doctor</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <User className="h-8 w-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-medium text-gray-900 mb-1">Pharmacy Info</h3>
              <p className="text-sm text-gray-600">Update your preferred pharmacy</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}