import { useState, useEffect } from 'react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { profileService, useProfile } from '@/features/profile';
import { MEDICAL, SUCCESS_MESSAGES, ERROR_MESSAGES, LOADING_MESSAGES } from '@/config/constants';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function Profile() {
  const {
    userProfile,
    patientProfile,
    isLoading,
    error,
    updateUserProfile,
    updatePatientProfile,
    clearError,
  } = useProfile();

  // Form states for Basic Information
  const [basicInfo, setBasicInfo] = useState({
    first_name: '',
    last_name: '',
    phone: '',
  });

  // Form states for Password Update
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  // Form states for Profile Information
  const [profileInfo, setProfileInfo] = useState({
    phone: '',
    date_of_birth: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    sex: '',
    allergies: '',
    medical_conditions: '',
    self_reported_meds: '',
    // Fields that don't exist in backend but keeping for now
    mrn: '',
    address_line_2: '',
    height_feet: '',
    height_inches: '',
    weight: '',
    blood_type: '',
    timezone: '',
    driver_license: '',
  });

  // Loading states for each section
  const [savingBasic, setSavingBasic] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  
  // Populate form fields when data loads
  useEffect(() => {
    if (userProfile) {
      setBasicInfo({
        first_name: userProfile.first_name || '',
        last_name: userProfile.last_name || '',
        phone: userProfile.phone || '',
      });
    }
  }, [userProfile]);

  useEffect(() => {
    if (patientProfile) {
      setProfileInfo(prev => ({
        ...prev,
        phone: patientProfile.phone || '',
        date_of_birth: patientProfile.date_of_birth || '',
        address: patientProfile.address || '',
        city: patientProfile.city || '',
        state: patientProfile.state || '',
        zip_code: patientProfile.zip_code || '',
        sex: patientProfile.sex || '',
        allergies: patientProfile.allergies || '',
        medical_conditions: patientProfile.medical_conditions || '',
        self_reported_meds: patientProfile.self_reported_meds || '',
      }));
    }
  }, [patientProfile]);

  // Clear errors when component mounts
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, []);

  // Handle form input changes
  const handleBasicInfoChange = (field: string, value: string) => {
    setBasicInfo(prev => ({ ...prev, [field]: value }));
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
  };

  const handleProfileInfoChange = (field: string, value: string) => {
    setProfileInfo(prev => ({ ...prev, [field]: value }));
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Save handlers
  const handleSaveBasicInfo = async () => {
    setSavingBasic(true);
    try {
      await updateUserProfile(basicInfo);
      toast.success(SUCCESS_MESSAGES.PROFILE_UPDATED);
    } catch (error) {
      toast.error(ERROR_MESSAGES.GENERIC);
    } finally {
      setSavingBasic(false);
    }
  };

  const handleSavePassword = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }
  
    setSavingPassword(true);
    try {
      await profileService.changePassword({
        currentPassword: passwordData.current_password,
        newPassword: passwordData.new_password,
        confirmPassword: passwordData.confirm_password,
      });
      
      toast.success('Password updated successfully');
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (error: any) {
      // Handle validation errors from backend
      if (error.response?.data?.current_password) {
        toast.error('Current password is incorrect');
      } else if (error.response?.data?.new_password) {
        toast.error('New password does not meet requirements');
      } else {
        toast.error('Failed to update password');
      }
    } finally {
      setSavingPassword(false);
    }
  };
  
  const handleSaveProfileInfo = async () => {
    setSavingProfile(true);
    try {
      // Only send backend fields
      const backendData = {
        phone: profileInfo.phone,
        date_of_birth: profileInfo.date_of_birth,
        address: profileInfo.address,
        city: profileInfo.city,
        state: profileInfo.state,
        zip_code: profileInfo.zip_code,
        sex: profileInfo.sex as 'Male' | 'Female' | 'Other',
        allergies: profileInfo.allergies,
        medical_conditions: profileInfo.medical_conditions,
        self_reported_meds: profileInfo.self_reported_meds,
      };

      await updatePatientProfile(backendData);
      toast.success(SUCCESS_MESSAGES.PATIENT_PROFILE_UPDATED);
    } catch (error) {
      toast.error(ERROR_MESSAGES.GENERIC);
    } finally {
      setSavingProfile(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">{LOADING_MESSAGES.LOADING_PROFILE}</p>
          </div>
        </div>
      </div>
    );
  }

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
              <Input 
                id="firstName" 
                value={basicInfo.first_name}
                onChange={(e) => handleBasicInfoChange('first_name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input 
                id="lastName" 
                value={basicInfo.last_name}
                onChange={(e) => handleBasicInfoChange('last_name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={userProfile?.email || ''} 
                disabled
                className="bg-gray-50"
              />
            </div>
          </div>
          <div className="flex justify-start">
            <Button 
              className="bg-orange-400 hover:bg-orange-500 text-white"
              onClick={handleSaveBasicInfo}
              disabled={savingBasic}
            >
              {savingBasic ? LOADING_MESSAGES.SAVING_CHANGES : 'Save'}
            </Button>
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
              <div className="relative">
                <Input 
                  id="currentPassword" 
                  type={showPasswords.current ? "text" : "password"}
                  value={passwordData.current_password}
                  onChange={(e) => handlePasswordChange('current_password', e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-2 flex items-center hover:bg-gray-50 rounded-r-md"
                  onClick={() => togglePasswordVisibility('current')}
                >
                  {showPasswords.current ? (
                    <EyeOff className="h-4 w-4 text-gray-500 hover:text-gray-700" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500 hover:text-gray-700" />
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input 
                  id="newPassword" 
                  type={showPasswords.new ? "text" : "password"}
                  value={passwordData.new_password}
                  onChange={(e) => handlePasswordChange('new_password', e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-2 flex items-center hover:bg-gray-50 rounded-r-md"
                  onClick={() => togglePasswordVisibility('new')}
                >
                  {showPasswords.new ? (
                    <EyeOff className="h-4 w-4 text-gray-500 hover:text-gray-700" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500 hover:text-gray-700" />
                  )}
                </button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input 
                  id="confirmPassword" 
                  type={showPasswords.confirm ? "text" : "password"}
                  value={passwordData.confirm_password}
                  onChange={(e) => handlePasswordChange('confirm_password', e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-2 flex items-center hover:bg-gray-50 rounded-r-md"
                  onClick={() => togglePasswordVisibility('confirm')}
                >
                  {showPasswords.confirm ? (
                    <EyeOff className="h-4 w-4 text-gray-500 hover:text-gray-700" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500 hover:text-gray-700" />
                  )}
                </button>
              </div>
            </div>
          </div>
          <div className="flex justify-start">
            <Button 
              className="bg-orange-400 hover:bg-orange-500 text-white"
              onClick={handleSavePassword}
              disabled={savingPassword}
            >
              {savingPassword ? LOADING_MESSAGES.UPDATING_PASSWORD : 'Save'}
            </Button>
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
              <Input 
                id="phone" 
                value={profileInfo.phone}
                onChange={(e) => handleProfileInfoChange('phone', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mrn">MRN Number</Label>
              <Input 
                id="mrn" 
                value={profileInfo.mrn}
                onChange={(e) => handleProfileInfoChange('mrn', e.target.value)}
                disabled
                className="bg-gray-50"
                placeholder="Not implemented yet"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address<span className="text-red-500">*</span></Label>
              <Input 
                id="address" 
                value={profileInfo.address}
                onChange={(e) => handleProfileInfoChange('address', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="address2">Address Line 2</Label>
              <Input 
                id="address2" 
                value={profileInfo.address_line_2}
                onChange={(e) => handleProfileInfoChange('address_line_2', e.target.value)}
                disabled
                className="bg-gray-50"
                placeholder="Not implemented yet"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City<span className="text-red-500">*</span></Label>
              <Input 
                id="city" 
                value={profileInfo.city}
                onChange={(e) => handleProfileInfoChange('city', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State<span className="text-red-500">*</span></Label>
              <Select 
                value={profileInfo.state} 
                onValueChange={(value) => handleProfileInfoChange('state', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a state" />
                </SelectTrigger>
                <SelectContent>
                  {MEDICAL.US_STATES.map((state) => (
                    <SelectItem key={state.value} value={state.value}>
                      {state.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="zipCode">Zip Code<span className="text-red-500">*</span></Label>
              <Input 
                id="zipCode" 
                value={profileInfo.zip_code}
                onChange={(e) => handleProfileInfoChange('zip_code', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="heightFeet">Height (Feet)<span className="text-red-500">*</span></Label>
              <Input 
                id="heightFeet" 
                value={profileInfo.height_feet}
                onChange={(e) => handleProfileInfoChange('height_feet', e.target.value)}
                disabled
                className="bg-gray-50"
                placeholder="Not implemented yet"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="heightInches">Height (Inches)<span className="text-red-500">*</span></Label>
              <Input 
                id="heightInches" 
                value={profileInfo.height_inches}
                onChange={(e) => handleProfileInfoChange('height_inches', e.target.value)}
                disabled
                className="bg-gray-50"
                placeholder="Not implemented yet"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (lbs)<span className="text-red-500">*</span></Label>
              <Input 
                id="weight" 
                value={profileInfo.weight}
                onChange={(e) => handleProfileInfoChange('weight', e.target.value)}
                disabled
                className="bg-gray-50"
                placeholder="Not implemented yet"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sex">Sex<span className="text-red-500">*</span></Label>
              <Select 
                value={profileInfo.sex} 
                onValueChange={(value) => handleProfileInfoChange('sex', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sex" />
                </SelectTrigger>
                <SelectContent>
                  {MEDICAL.GENDERS.map((gender) => (
                    <SelectItem key={gender} value={gender}>
                      {gender}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth<span className="text-red-500">*</span></Label>
              <Input 
                id="dob" 
                type="date" 
                value={profileInfo.date_of_birth}
                onChange={(e) => handleProfileInfoChange('date_of_birth', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="bloodType">Blood Type<span className="text-red-500">*</span></Label>
              <Select 
                value={profileInfo.blood_type} 
                onValueChange={(value) => handleProfileInfoChange('blood_type', value)}
                disabled
              >
                <SelectTrigger className="bg-gray-50">
                  <SelectValue placeholder="Not implemented yet" />
                </SelectTrigger>
                <SelectContent>
                  {MEDICAL.BLOOD_TYPES.map((type) => (
                    <SelectItem key={type} value={type.toLowerCase().replace('+', '-positive').replace('-', '-negative')}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select 
                value={profileInfo.timezone} 
                onValueChange={(value) => handleProfileInfoChange('timezone', value)}
                disabled
              >
                <SelectTrigger className="bg-gray-50">
                  <SelectValue placeholder="Not implemented yet" />
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
              <Input 
                id="driverLicense" 
                value={profileInfo.driver_license}
                onChange={(e) => handleProfileInfoChange('driver_license', e.target.value)}
                disabled
                className="bg-gray-50"
                placeholder="Not implemented yet"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="medicalConditions">Current medical conditions</Label>
              <Textarea 
                id="medicalConditions" 
                rows={4}
                className="resize-none"
                value={profileInfo.medical_conditions}
                onChange={(e) => handleProfileInfoChange('medical_conditions', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="medications">Current medications with dosages</Label>
              <Textarea 
                id="medications" 
                rows={4}
                className="resize-none"
                value={profileInfo.self_reported_meds}
                onChange={(e) => handleProfileInfoChange('self_reported_meds', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="allergies">Allergies</Label>
              <Textarea 
                id="allergies" 
                rows={4}
                className="resize-none"
                value={profileInfo.allergies}
                onChange={(e) => handleProfileInfoChange('allergies', e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-start">
            <Button 
              className="bg-orange-400 hover:bg-orange-500 text-white"
              onClick={handleSaveProfileInfo}
              disabled={savingProfile}
            >
              {savingProfile ? LOADING_MESSAGES.SAVING_CHANGES : 'Save'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
    </div>
  );
}
