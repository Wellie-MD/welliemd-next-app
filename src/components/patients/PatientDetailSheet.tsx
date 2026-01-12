import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Patient } from '@/services/patientService';
import { PatientFollowUpStatus } from '@/components/followups/PatientFollowUpStatus';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  ShieldAlert, 
  Stethoscope, 
  Pill 
} from 'lucide-react';

interface PatientDetailSheetProps {
  patient: Patient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PatientDetailSheet({ patient, open, onOpenChange }: PatientDetailSheetProps) {
  if (!patient) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md md:max-w-lg lg:max-w-xl w-full">
        <SheetHeader>
          <SheetTitle>Patient Details</SheetTitle>
          <SheetDescription>
            View and manage patient information and assessments.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-6 pr-4">
          <div className="space-y-6">
            {/* Basic Info Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <User size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold leading-none">
                    {patient.full_name || `${patient.first_name} ${patient.last_name}`}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Joined {new Date(patient.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase font-semibold">
                    <Mail size={12} /> Email
                  </div>
                  <p className="text-sm truncate" title={patient.email}>{patient.email}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase font-semibold">
                    <Phone size={12} /> Phone
                  </div>
                  <p className="text-sm">{patient.phone || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase font-semibold">
                    <Calendar size={12} /> Date of Birth
                  </div>
                  <p className="text-sm">{patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase font-semibold">
                    <User size={12} /> Sex
                  </div>
                  <p className="text-sm">{patient.sex}</p>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase font-semibold">
                  <MapPin size={12} /> Address
                </div>
                <p className="text-sm">
                  {patient.address ? (
                    <>
                      {patient.address}<br />
                      {patient.city}, {patient.state} {patient.zip_code}
                    </>
                  ) : 'No address provided'}
                </p>
              </div>
            </div>

            <Separator />

            {/* Medical Info Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Stethoscope size={16} /> Medical History
              </h4>
              
              <div className="space-y-3">
                <div className="bg-muted/50 p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase font-bold mb-1">
                    <ShieldAlert size={12} className="text-amber-600" /> Allergies
                  </div>
                  <p className="text-sm">{patient.allergies || 'None reported'}</p>
                </div>

                <div className="bg-muted/50 p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase font-bold mb-1">
                    <Stethoscope size={12} className="text-blue-600" /> Medical Conditions
                  </div>
                  <p className="text-sm">{patient.medical_conditions || 'None reported'}</p>
                </div>

                <div className="bg-muted/50 p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase font-bold mb-1">
                    <Pill size={12} className="text-purple-600" /> Current Medications
                  </div>
                  <p className="text-sm">{patient.self_reported_meds || 'None reported'}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Follow-Ups Section */}
            <div>
              <PatientFollowUpStatus 
                patientId={patient.id} 
                patientName={patient.full_name || `${patient.first_name} ${patient.last_name}`}
                patientEmail={patient.email}
              />
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
