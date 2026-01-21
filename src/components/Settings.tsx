import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useProfile } from '@/features/profile';
import { useAuth } from '@/features/auth';
import { VisitService, type Visit } from '@/features/visits/services/visit.service';
import { toast } from 'sonner';
import { formatDate } from '@/shared/lib/utils';

export default function Settings() {
  const { userProfile, patientProfile, isLoading: profileLoading } = useProfile();
  const { changePassword } = useAuth();

  // Password reset state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  // Visits state
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loadingVisits, setLoadingVisits] = useState(true);

  // Load visits
  useEffect(() => {
    const loadVisits = async () => {
      try {
        setLoadingVisits(true);
        const patientVisits = await VisitService.getPatientVisits();
        setVisits(patientVisits);
      } catch (error) {
        console.error('Failed to load visits:', error);
        toast.error('Failed to load visits');
      } finally {
        setLoadingVisits(false);
      }
    };

    loadVisits();
  }, []);

  // Validate password form
  const validatePasswordForm = (): boolean => {
    const errors: typeof passwordErrors = {};

    if (!currentPassword) {
      errors.currentPassword = 'Current password is required';
    }

    if (!newPassword) {
      errors.newPassword = 'New password is required';
    } else if (newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters long';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle password reset
  const handlePasswordReset = async () => {
    // Clear previous errors
    setPasswordErrors({});

    // Validate form
    if (!validatePasswordForm()) {
      return;
    }

    try {
      setResettingPassword(true);
      await changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      // Success - user will be logged out and redirected by authService
      toast.success('Password changed successfully. Please login with your new password.');
      
      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      // Error handling - extract message from error
      const errorMessage = error.message || error.response?.data?.detail || 'Failed to change password. Please try again.';
      
      // Check if it's a current password error
      if (error.response?.data?.current_password) {
        const currentPasswordError = Array.isArray(error.response.data.current_password)
          ? error.response.data.current_password[0]
          : error.response.data.current_password;
        setPasswordErrors({ currentPassword: currentPasswordError });
      } else if (errorMessage.toLowerCase().includes('current password') || 
                 errorMessage.toLowerCase().includes('incorrect')) {
        setPasswordErrors({ currentPassword: 'Current password is incorrect' });
      } else if (error.response?.data?.new_password) {
        const newPasswordError = Array.isArray(error.response.data.new_password)
          ? error.response.data.new_password[0]
          : error.response.data.new_password;
        setPasswordErrors({ newPassword: newPasswordError });
      } else {
        setPasswordErrors({ newPassword: errorMessage });
      }

      toast.error(errorMessage);
    } finally {
      setResettingPassword(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences.</p>
      </div>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium text-primary">Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-sm font-medium">Name</Label>
            <div className="mt-2 grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="legal-first-name" className="text-xs text-muted-foreground">
                  Legal First Name
                </Label>
                <Input
                  id="legal-first-name"
                  value={userProfile?.first_name || ''}
                  disabled
                  className="mt-1 bg-muted"
                />
              </div>
              <div>
                <Label htmlFor="legal-last-name" className="text-xs text-muted-foreground">
                  Legal Last Name
                </Label>
                <Input
                  id="legal-last-name"
                  value={userProfile?.last_name || ''}
                  disabled
                  className="mt-1 bg-muted"
                />
              </div>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Other</Label>
            <div className="mt-2 space-y-4">
              <div>
                <Label htmlFor="date-of-birth" className="text-xs text-muted-foreground">
                  Date of Birth
                </Label>
                <Input
                  id="date-of-birth"
                  type="text"
                  value={patientProfile?.date_of_birth ? formatDate(patientProfile.date_of_birth) : 'Not set'}
                  disabled
                  className="mt-1 bg-muted"
                />
              </div>
              <div>
                <Label htmlFor="email-address" className="text-xs text-muted-foreground">
                  Email Address
                </Label>
                <Input
                  id="email-address"
                  type="email"
                  value={userProfile?.email || ''}
                  disabled
                  className="mt-1 bg-muted"
                />
              </div>
              <div>
                <Label htmlFor="phone-number" className="text-xs text-muted-foreground">
                  Phone Number
                </Label>
                <Input
                  id="phone-number"
                  type="tel"
                  value={patientProfile?.phone || userProfile?.phone || 'Not set'}
                  disabled
                  className="mt-1 bg-muted"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visits */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium text-primary">Your Visits</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingVisits ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : visits.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No visits found.</p>
          ) : (
            <div className="space-y-3">
              {visits.map((visit) => (
                <div
                  key={visit.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <div className="font-medium">{visit.visit_type || 'Visit'}</div>
                    <div className="text-sm text-muted-foreground">
                      {visit.master_id && `ID: ${visit.master_id}`}
                      {visit.submitted_at && (
                        <span className="ml-2">
                          • Submitted: {formatDate(visit.submitted_at)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(visit.created_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reset Password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium text-primary">Reset Password</CardTitle>
          <p className="text-sm text-muted-foreground">
            Change your account password. You will be logged out after changing your password.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Password */}
          <div>
            <Label htmlFor="current-password" className="text-xs text-muted-foreground">
              Current Password
            </Label>
            <div className="relative mt-1">
              <Input
                id="current-password"
                type={showCurrentPassword ? 'text' : 'password'}
                placeholder="Enter your current password"
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  if (passwordErrors.currentPassword) {
                    setPasswordErrors({ ...passwordErrors, currentPassword: undefined });
                  }
                }}
                className={passwordErrors.currentPassword ? 'border-destructive' : ''}
                disabled={resettingPassword}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                disabled={resettingPassword}
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {passwordErrors.currentPassword && (
              <p className="text-xs text-destructive mt-1">{passwordErrors.currentPassword}</p>
            )}
          </div>

          {/* New Password */}
          <div>
            <Label htmlFor="new-password" className="text-xs text-muted-foreground">
              New Password
            </Label>
            <div className="relative mt-1">
              <Input
                id="new-password"
                type={showNewPassword ? 'text' : 'password'}
                placeholder="Enter your new password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (passwordErrors.newPassword) {
                    setPasswordErrors({ ...passwordErrors, newPassword: undefined });
                  }
                  // Clear confirm password error if passwords now match
                  if (e.target.value === confirmPassword && passwordErrors.confirmPassword) {
                    setPasswordErrors({ ...passwordErrors, confirmPassword: undefined });
                  }
                }}
                className={passwordErrors.newPassword ? 'border-destructive' : ''}
                disabled={resettingPassword}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowNewPassword(!showNewPassword)}
                disabled={resettingPassword}
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {passwordErrors.newPassword && (
              <p className="text-xs text-destructive mt-1">{passwordErrors.newPassword}</p>
            )}
            {!passwordErrors.newPassword && newPassword && newPassword.length < 8 && (
              <p className="text-xs text-muted-foreground mt-1">
                Password must be at least 8 characters long
              </p>
            )}
          </div>

          {/* Confirm New Password */}
          <div>
            <Label htmlFor="confirm-password" className="text-xs text-muted-foreground">
              Confirm New Password
            </Label>
            <div className="relative mt-1">
              <Input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (passwordErrors.confirmPassword) {
                    setPasswordErrors({ ...passwordErrors, confirmPassword: undefined });
                  }
                }}
                className={passwordErrors.confirmPassword ? 'border-destructive' : ''}
                disabled={resettingPassword}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={resettingPassword}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {passwordErrors.confirmPassword && (
              <p className="text-xs text-destructive mt-1">{passwordErrors.confirmPassword}</p>
            )}
          </div>

          {/* Reset Password Button */}
          <div className="pt-2">
            <Button
              onClick={handlePasswordReset}
              disabled={resettingPassword}
              className="w-full sm:w-auto"
            >
              {resettingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting Password...
                </>
              ) : (
                'Reset Password'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

