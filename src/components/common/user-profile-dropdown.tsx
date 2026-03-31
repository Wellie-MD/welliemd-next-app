import { ChevronDown, User, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { useDropdown } from '@/contexts/DropdownContext';
import { useTheme } from 'next-themes';
import { useMemo } from 'react';

export const UserProfileDropdown = ({ className }: { className?: string }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { isOpen, toggleDropdown } = useDropdown();
  const { theme } = useTheme();
  const isDark = useMemo(() => {
    if (theme === 'dark') return true;
    if (theme === 'light') return false;
    if (typeof document === 'undefined') return false;
    return document.documentElement.classList.contains('dark');
  }, [theme]);

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

  return (
    <div className="relative">
      <button
        onClick={() => toggleDropdown('profile')}
        className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm ${className}`}
      >
        <span>{getDisplayName()}</span>
        <ChevronDown className="h-4 w-4" />
      </button>

      {isOpen('profile') && (
        <div
          className="absolute right-0 top-full mt-2 w-56 bg-white dark:!bg-[#0f1216] rounded-md shadow-lg border border-gray-200 dark:!border-slate-700 py-1 z-50"
          style={isDark ? { backgroundColor: '#0f1216', borderColor: '#1f2329' } : undefined}
        >
          <button
            onClick={() => {
              navigate('/dashboard/profile');
              toggleDropdown(null);
            }}
            className="group profile-dropdown-item flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:!text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-100 dark:hover:!text-black"
          >
            <User className="h-4 w-4 mr-3 dark:!text-slate-100 dark:group-hover:!text-black" />
            View Profile
          </button>
          
          <div className="border-t border-gray-100 dark:border-slate-800 my-1" />
          
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40"
          >
            <LogOut className="h-4 w-4 mr-3" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};
