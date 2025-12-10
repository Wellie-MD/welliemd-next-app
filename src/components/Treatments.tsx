import { Pill, Calendar, Clock, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface Treatment {
  id: number;
  name: string;
  doctor: string;
  status: 'active' | 'completed' | 'pending';
  startDate: string;
  endDate?: string;
  dosage: string;
  frequency: string;
  instructions: string;
}

export default function Treatments() {
  const treatments: Treatment[] = [];

  const activeT = treatments.filter(t => t.status === 'active');
  const completedT = treatments.filter(t => t.status === 'completed');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const TreatmentCard = ({ treatment }: { treatment: Treatment }) => (
    <Card className="mb-4">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Pill className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="font-semibold text-lg text-gray-900">{treatment.name}</h3>
                <Badge className={getStatusColor(treatment.status)}>
                  {treatment.status.charAt(0).toUpperCase() + treatment.status.slice(1)}
                </Badge>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2 text-gray-400" />
                  <span>Prescribed by {treatment.doctor}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                  <span>Started: {treatment.startDate}</span>
                  {treatment.endDate && <span className="ml-2">• Ended: {treatment.endDate}</span>}
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{treatment.dosage} • {treatment.frequency}</span>
                </div>
              </div>
              
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Instructions:</strong> {treatment.instructions}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-2 ml-4">
            <Button variant="outline" size="sm">
              View Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Treatments</h1>
          <p className="text-gray-600">Manage your current and past treatments</p>
        </div>
      </div>

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList>
          <TabsTrigger value="active">
            Active Treatments ({activeT.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Treatment History ({completedT.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeT.length > 0 ? (
            activeT.map((treatment) => (
              <TreatmentCard key={treatment.id} treatment={treatment} />
            ))
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Pill className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No treatments recorded</h3>
                <p className="text-gray-600">No treatment history available.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedT.length > 0 ? (
            completedT.map((treatment) => (
              <TreatmentCard key={treatment.id} treatment={treatment} />
            ))
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Pill className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No completed treatments</h3>
                <p className="text-gray-600">You don't have any completed treatments yet.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}