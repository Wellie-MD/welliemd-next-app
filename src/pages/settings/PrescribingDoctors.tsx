import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

const visitStatuses = [
  {
    status: "On Hold",
    color: "bg-orange-100 text-orange-700",
    definition: "The patients questionnaire was successfully sent to the doctor."
  },
  {
    status: "Pending",
    color: "bg-orange-100 text-orange-700", 
    definition: "Patient communication confirmed with doctor."
  },
  {
    status: "Approved",
    color: "bg-green-100 text-green-700",
    definition: "Doctor has written a prescription but has not sent it to the pharmacy."
  },
  {
    status: "Approved & Sent",
    color: "bg-green-100 text-green-700",
    definition: "Doctor has written and sent a prescription to the pharmacy. Doctor has marked this consult as complete."
  },
  {
    status: "Cancelled",
    color: "bg-yellow-100 text-yellow-700",
    definition: "The doctor did not write a prescription. This is automatic if the visit status does not move within 14 days."
  },
  {
    status: "Referred",
    color: "bg-yellow-100 text-yellow-700",
    definition: "The doctor referred this patient for alternate treatment."
  },
  {
    status: "Error",
    color: "bg-red-100 text-red-700",
    definition: "An error occurred while communicating or transferring data with the doctor."
  }
]

const messagingStatuses = [
  {
    status: "Inactive",
    color: "bg-gray-100 text-gray-700",
    definition: "No secure or successful messaging connection is made to doctor."
  },
  {
    status: "Active",
    color: "bg-green-100 text-green-700",
    definition: "The patient has received a message from the doctor and the chat is working and connected to a doctor."
  },
  {
    status: "Error",
    color: "bg-red-100 text-red-700",
    definition: "An error occurred when communication was attempted between the patient and doctor."
  }
]

const prescriptionStatuses = [
  {
    status: "Written",
    color: "bg-green-100 text-green-700",
    definition: "A prescription was written and sent."
  },
  {
    status: "Expired",
    color: "bg-yellow-100 text-yellow-700",
    definition: "The prescription has expired."
  },
  {
    status: "Complete",
    color: "bg-green-100 text-green-700",
    definition: "The prescription was written but not sent."
  },
  {
    status: "Pending",
    color: "bg-blue-100 text-blue-700",
    definition: "No prescription has been written."
  },
  {
    status: "Expiring",
    color: "bg-yellow-100 text-yellow-700",
    definition: "The prescription is set to expire in 30 days or less."
  },
  {
    status: "No Refills Left",
    color: "bg-yellow-100 text-yellow-700",
    definition: "All of the refills for this prescription have been used."
  },
  {
    status: "Error",
    color: "bg-red-100 text-red-700",
    definition: "Something is wrong with the prescription."
  },
  {
    status: "Cancelled",
    color: "bg-yellow-100 text-yellow-700",
    definition: "The doctor has cancelled this prescription."
  }
]

export default function PrescribingDoctors() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">E-prescribing & Doctors</h1>
      </div>
      <CardHeader>
          <CardTitle className="text-lg font-medium">E-prescribing</CardTitle>
          <p className="text-sm text-muted-foreground">
            How will you be treating your patients?
          </p>
        </CardHeader>
      <Card>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Doctor Group</label>
              <Select defaultValue="welliemd-doctor-group">
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="welliemd-doctor-group">WellieMD Doctor Group</SelectItem>
                  <SelectItem value="other-group">Other Doctor Group</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-6 text-sm">
              <div>
                <div className="text-muted-foreground">Asynchronous Visit Cost</div>
                <div className="font-medium text-lg">$30</div>
              </div>
              <div>
                <div className="text-muted-foreground">Synchronous Visit Cost</div>
                <div className="font-medium text-lg">-</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 text-sm font-medium text-muted-foreground border-b pb-2">
                <div>VISIT STATUS</div>
                <div>DEFINITION</div>
              </div>

              {visitStatuses.map((item, index) => (
                <div key={index} className="grid grid-cols-2 text-sm py-1">
                  <div>
                    <Badge variant="secondary" className={`${item.color} border-0 text-xs`}>
                      {item.status}
                    </Badge>
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {item.definition}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 pt-4">
              <div className="grid grid-cols-2 text-sm font-medium text-muted-foreground border-b pb-2">
                <div>MESSAGING STATUS</div>
                <div>DEFINITION</div>
              </div>

              {messagingStatuses.map((item, index) => (
                <div key={index} className="grid grid-cols-2 text-sm py-1">
                  <div>
                    <Badge variant="secondary" className={`${item.color} border-0 text-xs`}>
                      {item.status}
                    </Badge>
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {item.definition}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 pt-4">
              <div className="grid grid-cols-2 text-sm font-medium text-muted-foreground border-b pb-2">
                <div>PRESCRIPTION STATUS</div>
                <div>DEFINITION</div>
              </div>

              {prescriptionStatuses.map((item, index) => (
                <div key={index} className="grid grid-cols-2 text-sm py-1">
                  <div>
                    <Badge variant="secondary" className={`${item.color} border-0 text-xs`}>
                      {item.status}
                    </Badge>
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {item.definition}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Legal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="text-sm text-muted-foreground">
                Download a copy of the Doctor name(s), license numbers, and clinics by state.
              </p>
            </div>
            <Button variant="outline" size="sm">
              Download
            </Button>
          </div>
          
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm text-muted-foreground">
                View a list of the medications our doctors can prescribe and diseases they can treat.
              </p>
            </div>
            <Button variant="outline" size="sm">
              Download
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}