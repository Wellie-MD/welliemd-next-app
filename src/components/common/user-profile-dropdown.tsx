import { ChevronDown, User, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { useDropdown } from '@/contexts/DropdownContext';

interface UserProfileDropdownProps {
  className?: string;
  style?: React.CSSProperties;
  compact?: boolean;
}

export const UserProfileDropdown = ({ className, style, compact = false }: UserProfileDropdownProps) => {
  const { user, logout, isImpersonated } = useAuth();
  const navigate = useNavigate();
  const { isOpen, toggleDropdown } = useDropdown();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getDisplayName = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user?.email || 'User';
  };

  const getInitials = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    return (user?.email?.[0] || 'U').toUpperCase();
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Chip trigger */}
      <button
        onClick={() => toggleDropdown('profile')}
        className={className}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '3px 9px 3px 3px',
          borderRadius: 20,
          border: '1px solid var(--km-b)',
          background: 'var(--km-s2)',
          cursor: 'pointer',
          transition: 'all 0.2s',
          ...style,
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #4f8ef7, #a78bfa)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 9,
            fontWeight: 700,
            color: '#fff',
            flexShrink: 0,
          }}
        >
          {getInitials()}
        </div>
        {/* Name — hidden on compact/mobile */}
        {!compact && (
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--km-t)', whiteSpace: 'nowrap' }}>
            {getDisplayName()}
          </span>
        )}
        <ChevronDown size={11} style={{ color: 'var(--km-tm)', flexShrink: 0 }} />
      </button>

      {/* Dropdown */}
      {isOpen('profile') && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '100%',
            marginTop: 8,
            width: 200,
            background: 'var(--km-s1)',
            border: '1px solid var(--km-b)',
            borderRadius: 'var(--km-r)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            padding: 4,
            zIndex: 50,
          }}
        >
          <button
            onClick={() => {
              navigate('/dashboard/profile');
              toggleDropdown(null);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              width: '100%',
              padding: '10px 10px',
              borderRadius: 'var(--km-rs)',
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--km-tm)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.18s',
              fontFamily: "'Outfit', sans-serif",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--km-s2)'; e.currentTarget.style.color = 'var(--km-t)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--km-tm)'; }}
          >
            <User size={15} />
            View Profile
          </button>

          {!isImpersonated && (
            <>
              <div style={{ borderTop: '1px solid var(--km-b)', margin: '4px 0' }} />

              <button
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9,
                  width: '100%',
                  padding: '10px 10px',
                  borderRadius: 'var(--km-rs)',
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'var(--km-re)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  fontFamily: "'Outfit', sans-serif",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--km-rep)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <LogOut size={15} />
                Sign Out
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
