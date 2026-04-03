import { useState } from "react";
import { Calendar, Clock, MapPin, Plus, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface Appointment {
  id: number;
  doctor: string;
  specialty: string;
  date: string;
  time: string;
  location: string;
  type: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  notes?: string;
}

export default function Appointments() {
  const [appointments] = useState<Appointment[]>([]);

  const upcomingAppointments = appointments.filter(apt => apt.status === 'upcoming');
  const pastAppointments = appointments.filter(apt => apt.status === 'completed');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const AppointmentCard = ({ appointment }: { appointment: Appointment }) => (
    <Card className="mb-4">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="font-semibold text-lg text-foreground">{appointment.doctor}</h3>
              <Badge variant="outline">{appointment.specialty}</Badge>
              <Badge className={getStatusColor(appointment.status)}>
                {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-gray-400 dark:text-slate-500" />
                {appointment.date}
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-gray-400 dark:text-slate-500" />
                {appointment.time}
              </div>
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-gray-400 dark:text-slate-500" />
                {appointment.location}
              </div>
            </div>
            
            <div className="mt-3">
              <span className="inline-block bg-muted text-foreground px-2 py-1 rounded text-sm">
                {appointment.type}
              </span>
            </div>
            
            {appointment.notes && (
              <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-950/40 border-l-4 border-yellow-400 rounded">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Notes:</strong> {appointment.notes}
                </p>
              </div>
            )}
          </div>
          
          <div className="flex space-x-2 ml-4">
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4" />
            </Button>
            {appointment.status === 'upcoming' && (
              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Appointments</h1>
          <p className="text-muted-foreground">Manage your healthcare appointments</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Appointment
        </Button>
      </div>

      <Tabs defaultValue="upcoming" className="space-y-6">
        <TabsList>
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Past Appointments ({pastAppointments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingAppointments.length > 0 ? (
            upcomingAppointments.map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Calendar className="h-12 w-12 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No upcoming appointments</h3>
                <p className="text-muted-foreground">You have no appointments scheduled.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {pastAppointments.length > 0 ? (
            pastAppointments.map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No past appointments</h3>
                <p className="text-gray-600">You don't have any appointment history yet.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
