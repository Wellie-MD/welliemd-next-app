/**
 * PatientFollowUpStatus - Component displaying follow-up status for a patient.
 * 
 * Used in patient detail pages to show:
 * - Current follow-up status
 * - Send new follow-up button
 * - History of follow-ups
 */
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Clock, CheckCircle2, AlertCircle, Eye, RefreshCw, BellRing, Loader2, CalendarDays } from 'lucide-react';
import { getPatientFollowUps, FollowUpSession, sendFollowUpNotification } from '@/api/followUpApi';
import { SendFollowUpDialog } from './SendFollowUpDialog';
import { useToast } from '@/hooks/use-toast';

interface PatientFollowUpStatusProps {
  patientId: string;
  patientName: string;
  patientEmail?: string;
}

const STATUS_CONFIG = {
  CREATED: {
    label: 'Pending',
    variant: 'secondary' as const,
    icon: Clock,
  },
  VIEWED: {
    label: 'Viewed',
    variant: 'outline' as const,
    icon: Eye,
  },
  IN_PROGRESS: {
    label: 'In Progress',
    variant: 'default' as const,
    icon: RefreshCw,
  },
  COMPLETED: {
    label: 'Completed',
    variant: 'secondary' as const,
    icon: CheckCircle2,
  },
  EXPIRED: {
    label: 'Expired',
    variant: 'destructive' as const,
    icon: AlertCircle,
  },
};

export function PatientFollowUpStatus({
  patientId,
  patientName,
  patientEmail,
}: PatientFollowUpStatusProps) {
  const { toast } = useToast();
  const [followUps, setFollowUps] = useState<FollowUpSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sendingReminderId, setSendingReminderId] = useState<string | null>(null);
  const [recentlySentIds, setRecentlySentIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadFollowUps();
  }, [patientId]);

  const loadFollowUps = async () => {
    setLoading(true);
    try {
      const data = await getPatientFollowUps(patientId);
      setFollowUps(data);
    } catch (error) {
      console.error('Failed to load follow-ups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowUpCreated = () => {
    loadFollowUps();
  };

  const formatDate = (dateString: string) => {
    const normalized = /^\d{4}-\d{2}-\d{2}$/.test(dateString)
      ? `${dateString}T12:00:00`
      : dateString;
    return new Date(normalized).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const pendingFollowUps = followUps.filter((f) =>
    ['CREATED', 'VIEWED', 'IN_PROGRESS'].includes(f.status)
  );
  const completedFollowUps = followUps.filter((f) => f.status === 'COMPLETED');
  const expiredFollowUps = followUps.filter((f) => f.status === 'EXPIRED');

  const handleSendReminder = async (session: FollowUpSession) => {
    if (sendingReminderId === session.id) return;
    setSendingReminderId(session.id);
    try {
      const idempotencyKey =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      const response = await sendFollowUpNotification(session.id, {
        template_type: 'follow_up_reminder',
        channels: ['email', 'sms'],
        idempotency_key: idempotencyKey,
      });

      if (response.success) {
        setRecentlySentIds((prev) => ({ ...prev, [session.id]: true }));
        toast({
          title: response.skipped_duplicate
            ? 'Reminder was already sent recently'
            : 'Reminder notification sent',
          description: response.skipped_duplicate
            ? 'Please wait a few minutes before trying again.'
            : `Follow-up reminder sent to ${patientName}.`,
        });
      } else {
        toast({
          title: 'Failed to send reminder',
          description: response.error || 'Something went wrong while sending reminder notification.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Failed to send reminder',
        description: error?.message || 'Something went wrong while sending reminder notification.',
        variant: 'destructive',
      });
    } finally {
      setSendingReminderId(null);
    }
  };

  return (
    <>
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-slate-100 bg-slate-50/70 pb-3">
          <div>
            <CardTitle className="text-base font-medium">Follow-Up Questionnaires</CardTitle>
            <CardDescription>Manage patient follow-up assessments</CardDescription>
          </div>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Send Follow-Up
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading follow-up sessions...
            </div>
          ) : followUps.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 py-6 text-center text-sm text-muted-foreground">
              No follow-ups sent yet. Click "Send Follow-Up" to create one.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Pending/Active Follow-ups */}
              {pendingFollowUps.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                    Active ({pendingFollowUps.length})
                  </h4>
                  <div className="space-y-2">
                    {pendingFollowUps.map((followUp) => (
                      <FollowUpRow
                        key={followUp.id}
                        followUp={followUp}
                        formatDate={formatDate}
                        onSendReminder={handleSendReminder}
                        sendingReminder={sendingReminderId === followUp.id}
                        recentlySent={!!recentlySentIds[followUp.id]}
                        showReminderAction
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Completed Follow-ups */}
              {completedFollowUps.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    Completed ({completedFollowUps.length})
                  </h4>
                  <div className="space-y-2">
                    {completedFollowUps.slice(0, 3).map((followUp) => (
                      <FollowUpRow
                        key={followUp.id}
                        followUp={followUp}
                        formatDate={formatDate}
                      />
                    ))}
                    {completedFollowUps.length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        +{completedFollowUps.length - 3} more
                      </p>
                    )}
                  </div>
                </div>
              )}

              {expiredFollowUps.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                    Expired ({expiredFollowUps.length})
                  </h4>
                  <div className="space-y-2">
                    {expiredFollowUps.slice(0, 3).map((followUp) => (
                      <FollowUpRow
                        key={followUp.id}
                        followUp={followUp}
                        formatDate={formatDate}
                      />
                    ))}
                    {expiredFollowUps.length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        +{expiredFollowUps.length - 3} more
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <SendFollowUpDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        patientId={patientId}
        patientName={patientName}
        patientEmail={patientEmail}
        onSuccess={handleFollowUpCreated}
      />
    </>
  );
}

interface FollowUpRowProps {
  followUp: FollowUpSession;
  formatDate: (date: string) => string;
  onSendReminder?: (session: FollowUpSession) => void;
  sendingReminder?: boolean;
  recentlySent?: boolean;
  showReminderAction?: boolean;
}

function FollowUpRow({
  followUp,
  formatDate,
  onSendReminder,
  sendingReminder = false,
  recentlySent = false,
  showReminderAction = false,
}: FollowUpRowProps) {
  const config = STATUS_CONFIG[followUp.status] || STATUS_CONFIG.CREATED;
  const StatusIcon = config.icon;
  const linkExpiryDate = followUp.link_expires_at || followUp.expires_at;
  const accessLabel = linkExpiryDate ? 'Access expires' : 'Access';
  const accessValue = linkExpiryDate ? formatDate(linkExpiryDate) : 'Active until completion';

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3 shadow-sm">
      <div className="min-w-0 flex items-center gap-3">
        <StatusIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <div>
          <p className="truncate text-sm font-medium">
            {followUp.questionnaire_name || 'Follow-Up Questionnaire'}
          </p>
          <p className="text-xs text-muted-foreground">
            Sent {formatDate(followUp.created_at)}
            {followUp.completed_at && ` • Completed ${formatDate(followUp.completed_at)}`}
          </p>
          {followUp.due_date && (
            <p className="text-xs font-medium text-slate-700">
              Due date: {formatDate(followUp.due_date)}
            </p>
          )}
          <p className="text-xs text-slate-600">{accessLabel}: {accessValue}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {showReminderAction && onSendReminder && (
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => onSendReminder(followUp)}
            disabled={sendingReminder}
          >
            {sendingReminder ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <BellRing className="mr-1.5 h-3.5 w-3.5" />
            )}
            {recentlySent ? 'Reminder Sent' : 'Send Reminder'}
          </Button>
        )}
        <Badge variant={config.variant} className="whitespace-nowrap">
          <CalendarDays className="mr-1 h-3 w-3" />
          {config.label}
        </Badge>
      </div>
    </div>
  );
}

export default PatientFollowUpStatus;
