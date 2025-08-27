import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Info } from "lucide-react"

const storeOwners = [
  {
    id: "1",
    name: "Jessica Lynne White",
    avatar: "/api/placeholder/32/32",
    initials: "JW",
    permissions: "Limited Permissions",
    lastLogin: "Saturday, August 16th 2025, 1:07:18 am"
  }
]

const admins = [
  {
    id: "1",
    name: "Kashif Rizwan",
    avatar: "/api/placeholder/32/32",
    initials: "KR",
    permissions: "Limited Permissions",
    lastLogin: "Thursday, May 22nd 2025, 9:27:01 pm"
  }
]

export default function UsersPermissions() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Your team</h1>
        <p className="text-muted-foreground mt-1">
          Manage what users can see or do in your store.
        </p>
      </div>

      {/* Store Owner Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-medium">Store Owner (1 of 1)</CardTitle>
          </div>
          <Button variant="outline" size="sm">Add Staff</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <Info className="h-4 w-4 text-blue-600 shrink-0" />
            <div className="text-sm text-blue-700">
              You have reached your staff limit. You can replace or add staff by deactivating a staff member or upgrading your plan.{" "}
              <button className="text-blue-600 underline hover:no-underline">
                Compare Plans
              </button>
            </div>
          </div>

          {storeOwners.map((owner) => (
            <div key={owner.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={owner.avatar} alt={owner.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {owner.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-foreground">{owner.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Last login was {owner.lastLogin}
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">
                {owner.permissions}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Admins Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-medium">Admins (1 of 1)</CardTitle>
          </div>
          <Button variant="outline" size="sm">Add Staff</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <Info className="h-4 w-4 text-blue-600 shrink-0" />
            <div className="text-sm text-blue-700">
              You have reached your staff limit. You can replace or add staff by deactivating a staff member or upgrading your plan.{" "}
              <button className="text-blue-600 underline hover:no-underline">
                Compare Plans
              </button>
            </div>
          </div>

          {admins.map((admin) => (
            <div key={admin.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={admin.avatar} alt={admin.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {admin.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-foreground">{admin.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Last login was {admin.lastLogin}
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">
                {admin.permissions}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}