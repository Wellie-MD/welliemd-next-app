import { Calendar, AlertCircle, X, MessageSquare, TestTube } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";

export function Dashboard() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      </div>

      {/* Alert Banner */}
      <Alert className="border-blue-200 bg-blue-50">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          Your ID photo was not correctly uploaded. Please tap to update or talk to your doctor.
        </AlertDescription>
        <Button variant="ghost" size="sm" className="absolute right-2 top-2 h-6 w-6 p-0">
          <X className="h-4 w-4" />
        </Button>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Dates */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium text-gray-900">Upcoming dates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming dates</h3>
              <p className="text-gray-600 text-sm">There are no upcoming dates at the moment.</p>
            </div>
          </CardContent>
        </Card>

        {/* Treatments */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium text-gray-900">Treatments</CardTitle>
              <Button variant="link" className="text-blue-600 p-0">
                View all
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No active treatments</h3>
              <p className="text-gray-600 text-sm">There are not active treatments at the moment.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-3" />
            <h3 className="font-medium text-gray-900 mb-1">Schedule Appointment</h3>
            <p className="text-sm text-gray-600">Book your next visit</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <MessageSquare className="h-8 w-8 text-blue-600 mx-auto mb-3" />
            <h3 className="font-medium text-gray-900 mb-1">Send Message</h3>
            <p className="text-sm text-gray-600">Contact your doctor</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <TestTube className="h-8 w-8 text-blue-600 mx-auto mb-3" />
            <h3 className="font-medium text-gray-900 mb-1">View Lab Results</h3>
            <p className="text-sm text-gray-600">Check your latest tests</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}