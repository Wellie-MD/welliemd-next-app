import React, { createContext, useContext, useState } from 'react';

type DropdownType = 'notifications' | 'messages' | 'profile' | null;

interface DropdownContextType {
  openDropdown: DropdownType;
  toggleDropdown: (type: DropdownType) => void;
  closeAll: () => void;
  isOpen: (type: DropdownType) => boolean;
}

const DropdownContext = createContext<DropdownContextType | undefined>(undefined);

export const DropdownProvider = ({ children }: { children: React.ReactNode }) => {
  const [openDropdown, setOpenDropdown] = useState<DropdownType>(null);

  const toggleDropdown = (type: DropdownType) => {
    setOpenDropdown(current => current === type ? null : type);
  };

  const closeAll = () => {
    setOpenDropdown(null);
  };

  const isOpen = (type: DropdownType) => {
    return openDropdown === type;
  };

  return (
    <DropdownContext.Provider value={{ openDropdown, toggleDropdown, closeAll, isOpen }}>
      {children}
    </DropdownContext.Provider>
  );
};

export const useDropdown = () => {
  const context = useContext(DropdownContext);
  if (context === undefined) {
    throw new Error('useDropdown must be used within a DropdownProvider');
  }
  return context;
};
