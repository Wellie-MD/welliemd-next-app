import { ChevronDown, User, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { useDropdown } from '@/contexts/DropdownContext';

export const UserProfileDropdown = ({ className }: { className?: string }) => {
  const { user, logout } = useAuth();
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
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
          <button
            onClick={() => {
              navigate('/dashboard/profile');
              toggleDropdown(null);
            }}
            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <User className="h-4 w-4 mr-3" />
            View Profile
          </button>
          
          <div className="border-t border-gray-100 my-1" />
          
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4 mr-3" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};
