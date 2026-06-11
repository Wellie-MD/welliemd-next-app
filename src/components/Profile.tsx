import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { profileService, useProfile } from '@/features/profile';
import { MEDICAL, SUCCESS_MESSAGES, ERROR_MESSAGES, LOADING_MESSAGES } from '@/config/constants';
import { Eye, EyeOff, ShieldOff } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth';

export default function Profile() {
  const { isImpersonated } = useAuth();
  const {
    userProfile,
    patientProfile,
    isLoading,
    error,
    updateUserProfile,
    updatePatientProfile,
    clearError,
  } = useProfile();

  const [basicInfo, setBasicInfo] = useState({
    first_name: '',
    last_name: '',
    phone: '',
  });

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [profileInfo, setProfileInfo] = useState({
    phone: '',
    date_of_birth: '',
    address: '',
    address_line_2: '',
    city: '',
    state: '',
    zip_code: '',
    sex: '',
    allergies: '',
    medical_conditions: '',
    self_reported_meds: '',
  });

  const [savingBasic, setSavingBasic] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

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
        address_line_2: patientProfile.address_line_2 || '',
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

  useEffect(() => {
    if (error) clearError();
  }, []);

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
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSaveBasicInfo = async () => {
    setSavingBasic(true);
    try {
      await updateUserProfile(basicInfo);
      toast.success(SUCCESS_MESSAGES.PROFILE_UPDATED);
    } catch {
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
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (error: any) {
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
    if (!profileInfo.phone || !profileInfo.date_of_birth || !profileInfo.address || !profileInfo.city || !profileInfo.state || !profileInfo.zip_code || !profileInfo.sex) {
      toast.error('Please complete all required profile fields.');
      return;
    }
    setSavingProfile(true);
    try {
      await updatePatientProfile({
        phone: profileInfo.phone,
        date_of_birth: profileInfo.date_of_birth,
        address: profileInfo.address,
        address_line_2: profileInfo.address_line_2,
        city: profileInfo.city,
        state: profileInfo.state,
        zip_code: profileInfo.zip_code,
        sex: profileInfo.sex as 'Male' | 'Female' | 'Other',
        allergies: profileInfo.allergies,
        medical_conditions: profileInfo.medical_conditions,
        self_reported_meds: profileInfo.self_reported_meds,
      });
      toast.success(SUCCESS_MESSAGES.PATIENT_PROFILE_UPDATED);
    } catch {
      toast.error(ERROR_MESSAGES.GENERIC);
    } finally {
      setSavingProfile(false);
    }
  };

  const initials = `${(userProfile?.first_name || 'U')[0]}${(userProfile?.last_name || '')[0] || ''}`.toUpperCase();

  if (isLoading) {
    return (
      <div id="pg-profile">
        <div className="km-fade" style={{ marginBottom: 18 }}>
          <div className="km-page-title">Profile</div>
          <div className="km-page-sub">Manage your account information and preferences</div>
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="km-profile-card" style={{ padding: 24 }}>
            <div className="km-skel" style={{ width: '40%', height: 18, marginBottom: 10 }} />
            <div className="km-skel" style={{ width: '70%', height: 12, marginBottom: 20 }} />
            <div className="km-skel" style={{ height: 40, marginBottom: 12, borderRadius: 10 }} />
            <div className="km-skel" style={{ height: 40, borderRadius: 10 }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div id="pg-profile">
      {/* Header */}
      <div className="km-fade" style={{ marginBottom: 18 }}>
        <div className="km-page-title">Profile</div>
        <div className="km-page-sub">Manage your account information and preferences</div>
      </div>

      {/* Avatar + Name */}
      <div className="km-profile-card km-fade">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: 'var(--km-ac)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 700,
          }}>
            {initials}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--km-t)' }}>
              {userProfile?.first_name} {userProfile?.last_name}
            </div>
            <div style={{ fontSize: 13, color: 'var(--km-ac)', textDecoration: 'underline' }}>
              {userProfile?.email}
            </div>
          </div>
        </div>
      </div>

      {/* Basic Information */}
      <div className="km-profile-card km-fade">
        <h3>Basic Information</h3>
        <div className="km-card-desc">Update your account's profile information and email address.</div>

        {isImpersonated && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', marginBottom: 16, borderRadius: 8, background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
            <ShieldOff size={16} style={{ color: '#ca8a04' }} />
            <span style={{ fontSize: 13, color: '#ca8a04' }}>Editing is disabled during impersonation</span>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="km-field-label">First Name</label>
            <input
              className="km-field-input"
              value={basicInfo.first_name}
              onChange={e => handleBasicInfoChange('first_name', e.target.value)}
              disabled={isImpersonated}
            />
          </div>
          <div>
            <label className="km-field-label">Last Name</label>
            <input
              className="km-field-input"
              value={basicInfo.last_name}
              onChange={e => handleBasicInfoChange('last_name', e.target.value)}
              disabled={isImpersonated}
            />
          </div>
          <div>
            <label className="km-field-label">Email</label>
            <input
              className="km-field-input"
              value={userProfile?.email || ''}
              disabled
            />
          </div>
          {!isImpersonated && (
            <div>
              <button className="km-save-btn" onClick={handleSaveBasicInfo} disabled={savingBasic}>
                {savingBasic ? LOADING_MESSAGES.SAVING_CHANGES : 'Save'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Update Password */}
      {!isImpersonated && (
        <div className="km-profile-card km-fade">
          <h3>Update Password</h3>
          <div className="km-card-desc">Ensure your account is using a long, random password to stay secure.</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="km-field-label">Current Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="km-field-input"
                  type={showPasswords.current ? 'text' : 'password'}
                  value={passwordData.current_password}
                  onChange={e => handlePasswordChange('current_password', e.target.value)}
                />
                <button className="km-pw-toggle" onClick={() => togglePasswordVisibility('current')}>
                  {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="km-field-label">New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="km-field-input"
                  type={showPasswords.new ? 'text' : 'password'}
                  value={passwordData.new_password}
                  onChange={e => handlePasswordChange('new_password', e.target.value)}
                />
                <button className="km-pw-toggle" onClick={() => togglePasswordVisibility('new')}>
                  {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="km-field-label">Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="km-field-input"
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={passwordData.confirm_password}
                  onChange={e => handlePasswordChange('confirm_password', e.target.value)}
                />
                <button className="km-pw-toggle" onClick={() => togglePasswordVisibility('confirm')}>
                  {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <button className="km-save-btn" onClick={handleSavePassword} disabled={savingPassword}>
                {savingPassword ? LOADING_MESSAGES.UPDATING_PASSWORD : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Information */}
      <div className="km-profile-card km-fade">
        <h3>Profile Information</h3>
        <div className="km-card-desc">Keep your medical and contact details current so your care team can reach you quickly.</div>

        {isImpersonated && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', marginBottom: 16, borderRadius: 8, background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
            <ShieldOff size={16} style={{ color: '#ca8a04' }} />
            <span style={{ fontSize: 13, color: '#ca8a04' }}>Editing is disabled during impersonation</span>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="km-field-label">Phone *</label>
            <input
              className="km-field-input"
              value={profileInfo.phone}
              onChange={e => handleProfileInfoChange('phone', e.target.value)}
              disabled={isImpersonated}
            />
          </div>
          <div>
            <label className="km-field-label">Address *</label>
            <input
              className="km-field-input"
              value={profileInfo.address}
              onChange={e => handleProfileInfoChange('address', e.target.value)}
              disabled={isImpersonated}
            />
          </div>
          <div>
            <label className="km-field-label">Apt / Suite / Unit</label>
            <input
              className="km-field-input"
              placeholder="Apartment, suite, unit, etc."
              value={profileInfo.address_line_2}
              onChange={e => handleProfileInfoChange('address_line_2', e.target.value)}
              disabled={isImpersonated}
            />
          </div>
          <div className="km-grid-2">
            <div>
              <label className="km-field-label">City *</label>
              <input
                className="km-field-input"
                value={profileInfo.city}
                onChange={e => handleProfileInfoChange('city', e.target.value)}
                disabled={isImpersonated}
              />
            </div>
            <div>
              <label className="km-field-label">State *</label>
              <Select
                value={profileInfo.state}
                onValueChange={value => handleProfileInfoChange('state', value)}
                disabled={isImpersonated}
              >
                <SelectTrigger className="km-field-input">
                  <SelectValue placeholder="Select a state" />
                </SelectTrigger>
                <SelectContent>
                  {MEDICAL.US_STATES.map(state => (
                    <SelectItem key={state.value} value={state.value}>
                      {state.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="km-grid-3">
            <div>
              <label className="km-field-label">Zip Code *</label>
              <input
                className="km-field-input"
                value={profileInfo.zip_code}
                onChange={e => handleProfileInfoChange('zip_code', e.target.value)}
                disabled={isImpersonated}
              />
            </div>
            <div>
              <label className="km-field-label">Sex *</label>
              <Select
                value={profileInfo.sex}
                onValueChange={value => handleProfileInfoChange('sex', value)}
                disabled={isImpersonated}
              >
                <SelectTrigger className="km-field-input">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {MEDICAL.GENDERS.map(gender => (
                    <SelectItem key={gender} value={gender}>{gender}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="km-field-label">Date of Birth *</label>
              <input
                className="km-field-input"
                type="date"
                value={profileInfo.date_of_birth}
                onChange={e => handleProfileInfoChange('date_of_birth', e.target.value)}
                disabled={isImpersonated}
              />
            </div>
          </div>
          <div>
            <label className="km-field-label">Current medical conditions</label>
            <textarea
              className="km-field-input"
              rows={3}
              style={{ resize: 'none' }}
              value={profileInfo.medical_conditions}
              onChange={e => handleProfileInfoChange('medical_conditions', e.target.value)}
              disabled={isImpersonated}
            />
          </div>
          <div>
            <label className="km-field-label">Current medications with dosages</label>
            <textarea
              className="km-field-input"
              rows={3}
              style={{ resize: 'none' }}
              value={profileInfo.self_reported_meds}
              onChange={e => handleProfileInfoChange('self_reported_meds', e.target.value)}
              disabled={isImpersonated}
            />
          </div>
          <div>
            <label className="km-field-label">Allergies</label>
            <textarea
              className="km-field-input"
              rows={3}
              style={{ resize: 'none' }}
              value={profileInfo.allergies}
              onChange={e => handleProfileInfoChange('allergies', e.target.value)}
              disabled={isImpersonated}
            />
          </div>
          {!isImpersonated && (
            <div>
              <button className="km-save-btn" onClick={handleSaveProfileInfo} disabled={savingProfile}>
                {savingProfile ? LOADING_MESSAGES.SAVING_CHANGES : 'Save'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
