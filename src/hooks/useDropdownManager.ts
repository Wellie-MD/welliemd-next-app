import { useState, useCallback } from 'react';

type DropdownType = 'notifications' | 'messages' | 'profile' | null;

let globalDropdownState: DropdownType = null;
let globalSetDropdown: ((type: DropdownType) => void) | null = null;

export const useDropdownManager = () => {
  const [openDropdown, setOpenDropdown] = useState<DropdownType>(null);

  // Register this hook as the global state manager
  if (!globalSetDropdown) {
    globalSetDropdown = setOpenDropdown;
    globalDropdownState = openDropdown;
  }

  const toggleDropdown = useCallback((type: DropdownType) => {
    const newState = globalDropdownState === type ? null : type;
    globalDropdownState = newState;
    if (globalSetDropdown) {
      globalSetDropdown(newState);
    }
  }, []);

  const closeAll = useCallback(() => {
    globalDropdownState = null;
    if (globalSetDropdown) {
      globalSetDropdown(null);
    }
  }, []);

  return {
    openDropdown: globalDropdownState,
    toggleDropdown,
    closeAll,
    isOpen: (type: DropdownType) => globalDropdownState === type,
  };
};
