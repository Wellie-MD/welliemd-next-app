import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Loader2, ChevronDown, X } from 'lucide-react';
import axiosInstance from '@/api/axiosInstance';

type Patient = {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  user?: { email: string };
}

type PatientOption = { value: string; label: string }

interface PatientSelectionDropdownProps {
  selectedPatients: PatientOption[];
  onSelectionChange: (patients: PatientOption[]) => void;
  placeholder?: string;
}

export function PatientSelectionDropdown({
  selectedPatients,
  onSelectionChange,
  placeholder = "Search patients by name or email...",
}: PatientSelectionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch patients with pagination
  const fetchPatients = useCallback(async (pageNum: number, search: string, reset: boolean = false) => {
    setLoading(true);
    try {
      let url = `/medical/patients/?page=${pageNum}&page_size=20`;
      if (search) url += `&search=${encodeURIComponent(search)}`;

      const res = await axiosInstance.get(url);
      const patientList = res.data?.results || res.data || [];
      const options: PatientOption[] = patientList.map((p: Patient) => ({
        value: p.id,
        label: `${p.first_name || ''} ${p.last_name || ''} - ${p.user?.email || p.email || p.id}`.trim()
      }));

      if (reset) {
        setPatients(options);
      } else {
        setPatients(prev => [...prev, ...options]);
      }

      setHasMore(res.data?.next !== null);
    } catch (err) {
      console.error('Failed to fetch patients:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setPage(1);
      setPatients([]);
      fetchPatients(1, searchTerm, true);
    }
  }, [isOpen]);

  // Handle search with debounce
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      setPage(1);
      fetchPatients(1, searchTerm, true);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, isOpen, fetchPatients]);

  // Handle scroll for lazy loading
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 50 && !loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPatients(nextPage, searchTerm);
    }
  };

  const togglePatient = (patient: PatientOption) => {
    const isSelected = selectedPatients.some(p => p.value === patient.value);
    if (isSelected) {
      onSelectionChange(selectedPatients.filter(p => p.value !== patient.value));
    } else {
      onSelectionChange([...selectedPatients, patient]);
    }
  };

  const removePatient = (patientValue: string) => {
    onSelectionChange(selectedPatients.filter(p => p.value !== patientValue));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selected patients chips */}
      {selectedPatients.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {selectedPatients.map((p) => (
            <span 
              key={p.value}
              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
            >
              {p.label.split(' - ')[0]}
              <button 
                onClick={(e) => { e.stopPropagation(); removePatient(p.value); }}
                className="hover:text-blue-600"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input trigger */}
      <div 
        className="flex items-center border rounded-md px-3 py-2 cursor-pointer bg-white hover:border-gray-400"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Search className="h-4 w-4 text-muted-foreground mr-2" />
        <span className="flex-1 text-sm text-muted-foreground">
          {placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg">
          {/* Search input */}
          <div className="p-2 border-b">
            <Input
              placeholder="Type to search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
              className="h-8"
            />
          </div>

          {/* Patient list with scroll */}
          <div 
            ref={listRef}
            className="max-h-60 overflow-y-auto"
            onScroll={handleScroll}
          >
            {patients.map((patient) => {
              const isSelected = selectedPatients.some(p => p.value === patient.value);
              return (
                <div
                  key={patient.value}
                  className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}
                  onClick={() => togglePatient(patient)}
                >
                  <Checkbox checked={isSelected} />
                  <span className="text-sm flex-1">{patient.label}</span>
                </div>
              );
            })}

            {loading && (
              <div className="flex justify-center py-3">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}

            {!loading && patients.length === 0 && (
              <div className="text-center py-4 text-sm text-muted-foreground">
                No patients found
              </div>
            )}

            {!loading && hasMore && patients.length > 0 && (
              <div className="text-center py-2 text-xs text-muted-foreground">
                Scroll for more...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
