import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";

export function Profile() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Account Settings</h1>
        <p className="text-gray-600 mt-2">Manage your account information and preferences</p>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <p className="text-sm text-gray-600">Update your account's profile information and email address.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" defaultValue="Legitscript" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" defaultValue="Test" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue="test@legitscripttest.com" />
            </div>
          </div>
          <div className="flex justify-start">
            <Button className="bg-orange-400 hover:bg-orange-500 text-white">Save</Button>
          </div>
        </CardContent>
      </Card>

      {/* Update Password */}
      <Card>
        <CardHeader>
          <CardTitle>Update Password</CardTitle>
          <p className="text-sm text-gray-600">Ensure your account is using a long, random password to stay secure.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input id="currentPassword" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input id="newPassword" type="password" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input id="confirmPassword" type="password" className="max-w-md" />
          </div>
          <div className="flex justify-start">
            <Button className="bg-orange-400 hover:bg-orange-500 text-white">Save</Button>
          </div>
        </CardContent>
      </Card>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone<span className="text-red-500">*</span></Label>
              <Input id="phone" defaultValue="3103101234" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mrn">MRN Number</Label>
              <Input id="mrn" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address<span className="text-red-500">*</span></Label>
              <Input id="address" defaultValue="test" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="address2">Address Line 2</Label>
              <Input id="address2" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City<span className="text-red-500">*</span></Label>
              <Input id="city" defaultValue="Los Angeles, California" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State<span className="text-red-500">*</span></Label>
              <Select defaultValue="california">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="california">California</SelectItem>
                  <SelectItem value="texas">Texas</SelectItem>
                  <SelectItem value="florida">Florida</SelectItem>
                  <SelectItem value="newyork">New York</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="zipCode">Zip Code<span className="text-red-500">*</span></Label>
              <Input id="zipCode" defaultValue="90250" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="heightFeet">Height (Feet)<span className="text-red-500">*</span></Label>
              <Input id="heightFeet" defaultValue="5" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="heightInches">Height (Inches)<span className="text-red-500">*</span></Label>
              <Input id="heightInches" defaultValue="5" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (lbs)<span className="text-red-500">*</span></Label>
              <Input id="weight" defaultValue="190" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sex">Sex<span className="text-red-500">*</span></Label>
              <Select defaultValue="male">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth<span className="text-red-500">*</span></Label>
              <Input id="dob" type="date" defaultValue="1990-01-01" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="bloodType">Blood Type<span className="text-red-500">*</span></Label>
              <Select defaultValue="a-positive">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="a-positive">A+</SelectItem>
                  <SelectItem value="a-negative">A-</SelectItem>
                  <SelectItem value="b-positive">B+</SelectItem>
                  <SelectItem value="b-negative">B-</SelectItem>
                  <SelectItem value="ab-positive">AB+</SelectItem>
                  <SelectItem value="ab-negative">AB-</SelectItem>
                  <SelectItem value="o-positive">O+</SelectItem>
                  <SelectItem value="o-negative">O-</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select defaultValue="eastern">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="eastern">Eastern Time</SelectItem>
                  <SelectItem value="central">Central Time</SelectItem>
                  <SelectItem value="mountain">Mountain Time</SelectItem>
                  <SelectItem value="pacific">Pacific Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="driverLicense">Driver License Number</Label>
              <Input id="driverLicense" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="medicalConditions">Current medical conditions</Label>
              <Textarea 
                id="medicalConditions" 
                rows={4}
                className="resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="medications">Current medications with dosages</Label>
              <Textarea 
                id="medications" 
                rows={4}
                className="resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="allergies">Allergies</Label>
              <Textarea 
                id="allergies" 
                rows={4}
                className="resize-none"
              />
            </div>
          </div>

          <div className="flex justify-start">
            <Button className="bg-orange-400 hover:bg-orange-500 text-white">Save</Button>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500 py-8">
        <p>2025 © KinMeds.</p>
        <div className="flex justify-center items-center space-x-2 mt-2">
          <span>Designed & Developed by</span>
          <span className="font-medium">Your Company Name</span>
        </div>
      </div>
    </div>
  );
}