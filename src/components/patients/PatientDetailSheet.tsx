import React, { useEffect, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Patient, patientService } from '@/services/patientService';
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
  Pill,
  ClipboardList
} from 'lucide-react';
import { ordersApi, Order } from '@/api/ordersApi';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { Permissions } from '@/constants/permissions';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface PatientDetailSheetProps {
  patient: Patient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPatientUpdated?: (patient: Patient) => void;
  onPatientDeleted?: (patientId: string) => void;
  readOnly?: boolean;
}

const buildInitialForm = (patient: Patient) => ({
  first_name: patient.first_name || '',
  last_name: patient.last_name || '',
  email: patient.email || '',
  phone: patient.phone || '',
  sex: patient.sex || 'Other',
  address: patient.address || '',
  address_line_2: patient.address_line_2 || '',
  city: patient.city || '',
  state: patient.state || '',
  zip_code: patient.zip_code || '',
  allergies: patient.allergies || '',
  medical_conditions: patient.medical_conditions || '',
  self_reported_meds: patient.self_reported_meds || '',
});

export function PatientDetailSheet({ patient, open, onOpenChange, onPatientUpdated, onPatientDeleted, readOnly }: PatientDetailSheetProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formState, setFormState] = useState(() => patient ? buildInitialForm(patient) : buildInitialForm({
    id: '',
    email: '',
    first_name: '',
    last_name: '',
    full_name: '',
    phone: '',
    date_of_birth: '',
    sex: 'Other',
    address: '',
    address_line_2: '',
    city: '',
    state: '',
    zip_code: '',
    allergies: '',
    medical_conditions: '',
    self_reported_meds: '',
    created_at: '',
    updated_at: '',
  } as Patient));
  const { toast } = useToast();

  useEffect(() => {
    if (patient) {
      setFormState(buildInitialForm(patient));
    }
  }, [patient?.id]);

  useEffect(() => {
    let isMounted = true;
    if (open && patient?.id) {
      setOrdersLoading(true);
      ordersApi.fetchOrdersByPatient(patient.id, { page_size: 5, ordering: '-created_at' })
        .then((resp) => {
          if (isMounted) setOrders(resp.results || []);
        })
        .catch(() => {
          if (isMounted) setOrders([]);
        })
        .finally(() => {
          if (isMounted) setOrdersLoading(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [open, patient?.id]);

  if (!patient) return null;

  const handleUpdate = async () => {
    if (!patient?.id) return;
    setSaving(true);
    try {
      const payload: Partial<Patient> = {
        first_name: formState.first_name,
        last_name: formState.last_name,
        email: formState.email,
        phone: formState.phone,
        sex: formState.sex,
        address: formState.address,
        address_line_2: formState.address_line_2,
        city: formState.city,
        state: formState.state,
        zip_code: formState.zip_code,
        allergies: formState.allergies,
        medical_conditions: formState.medical_conditions,
        self_reported_meds: formState.self_reported_meds,
      };
      await patientService.updatePatient(patient.id, payload);
      const updated = await patientService.getPatient(patient.id);
      toast({ title: 'Patient updated' });
      onPatientUpdated?.(updated);
      setEditOpen(false);
    } catch (err: any) {
      toast({ title: err?.message || 'Failed to update patient', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!patient?.id) return;
    setSaving(true);
    try {
      await patientService.deletePatient(patient.id);
      toast({ title: 'Patient deleted' });
      setDeleteOpen(false);
      onOpenChange(false);
      onPatientDeleted?.(patient.id);
    } catch (err: any) {
      toast({ title: err?.message || 'Failed to delete patient', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md md:max-w-lg lg:max-w-xl">
        <SheetHeader className="pr-12">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <SheetTitle>Patient Details</SheetTitle>
              <SheetDescription>
                View and manage patient information and assessments.
              </SheetDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {!readOnly && (
                <PermissionGate permission={Permissions.USER_UPDATE}>
                  <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
                    Edit
                  </Button>
                </PermissionGate>
              )}
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-4 sm:mt-6 pr-2 sm:pr-4">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <p className="text-sm break-words">
                  {patient.address ? (
                    <>
                      {patient.address}
                      {patient.address_line_2 && <>, {patient.address_line_2}</>}
                      <br />
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

            <Separator />

            {/* Recent Orders */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <ClipboardList size={16} /> Recent Orders
              </h4>

              {ordersLoading ? (
                <p className="text-sm text-muted-foreground">Loading orders...</p>
              ) : orders.length === 0 ? (
                <p className="text-sm text-muted-foreground">No orders found.</p>
              ) : (
                <div className="space-y-2">
                  {orders.map((order) => (
                    <div key={order.id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-md border border-border p-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {order.order_id || order.display_id ? `Order #${order.order_id || order.display_id}` : `Order ${order.id}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : '-'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{order.orderStatus || order.status || '-'}</Badge>
                        <span className="text-sm font-semibold">
                          {order.orderTotal ? `$${order.orderTotal}` : '-'}
                        </span>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="w-full" onClick={() => onOpenChange(false)}>
                    View all orders in Orders page
                  </Button>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Patient</DialogTitle>
              <DialogDescription>
                Update contact and medical details for this patient.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-3 scrollbar-hide overscroll-contain">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">First Name</label>
                  <Input
                    placeholder="First name"
                    value={formState.first_name}
                    onChange={(e) => setFormState((prev) => ({ ...prev, first_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Last Name</label>
                  <Input
                    placeholder="Last name"
                    value={formState.last_name}
                    onChange={(e) => setFormState((prev) => ({ ...prev, last_name: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Email</label>
                <Input
                  placeholder="Email address"
                  value={formState.email}
                  onChange={(e) => setFormState((prev) => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Phone</label>
                  <Input
                    placeholder="e.g. (555) 123-4567"
                    value={formState.phone}
                    onChange={(e) => setFormState((prev) => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Sex</label>
                  <Select
                    value={formState.sex}
                    onValueChange={(value) => setFormState((prev) => ({ ...prev, sex: value as Patient['sex'] }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Address</label>
                <Input
                  placeholder="Street address"
                  value={formState.address}
                  onChange={(e) => setFormState((prev) => ({ ...prev, address: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Apt / Suite / Unit</label>
                <Input
                  placeholder="Apartment, suite, unit, etc."
                  value={formState.address_line_2}
                  onChange={(e) => setFormState((prev) => ({ ...prev, address_line_2: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">City</label>
                  <Input
                    placeholder="City"
                    value={formState.city}
                    onChange={(e) => setFormState((prev) => ({ ...prev, city: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">State</label>
                  <Input
                    placeholder="State"
                    value={formState.state}
                    onChange={(e) => setFormState((prev) => ({ ...prev, state: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Zip Code</label>
                  <Input
                    placeholder="Zip"
                    value={formState.zip_code}
                    onChange={(e) => setFormState((prev) => ({ ...prev, zip_code: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Allergies</label>
                <Textarea
                  placeholder="List allergies or note none"
                  value={formState.allergies}
                  onChange={(e) => setFormState((prev) => ({ ...prev, allergies: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Medical Conditions</label>
                <Textarea
                  placeholder="Relevant conditions"
                  value={formState.medical_conditions}
                  onChange={(e) => setFormState((prev) => ({ ...prev, medical_conditions: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Current Medications</label>
                <Textarea
                  placeholder="Current medications"
                  value={formState.self_reported_meds}
                  onChange={(e) => setFormState((prev) => ({ ...prev, self_reported_meds: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={saving}>
                {saving ? 'Saving...' : 'Save changes'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete patient?</AlertDialogTitle>
              <AlertDialogDescription>
                This action permanently deletes the patient record and cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={saving}>
                {saving ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  );
}
