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
import { Plus, Clock, CheckCircle2, AlertCircle, Eye, RefreshCw } from 'lucide-react';
import { getPatientFollowUps, FollowUpSession } from '@/api/followUpApi';
import { SendFollowUpDialog } from './SendFollowUpDialog';

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
  const [followUps, setFollowUps] = useState<FollowUpSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

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
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const pendingFollowUps = followUps.filter((f) =>
    ['CREATED', 'VIEWED', 'IN_PROGRESS'].includes(f.status)
  );
  const completedFollowUps = followUps.filter((f) => f.status === 'COMPLETED');

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
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
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : followUps.length === 0 ? (
            <div className="text-sm text-muted-foreground py-4 text-center">
              No follow-ups sent yet. Click "Send Follow-Up" to create one.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Pending/Active Follow-ups */}
              {pendingFollowUps.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    Active ({pendingFollowUps.length})
                  </h4>
                  <div className="space-y-2">
                    {pendingFollowUps.map((followUp) => (
                      <FollowUpRow key={followUp.id} followUp={followUp} formatDate={formatDate} />
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
                      <FollowUpRow key={followUp.id} followUp={followUp} formatDate={formatDate} />
                    ))}
                    {completedFollowUps.length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        +{completedFollowUps.length - 3} more
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
}

function FollowUpRow({ followUp, formatDate }: FollowUpRowProps) {
  const config = STATUS_CONFIG[followUp.status] || STATUS_CONFIG.CREATED;
  const StatusIcon = config.icon;

  return (
    <div className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-3">
        <StatusIcon className="h-4 w-4 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">
            {followUp.questionnaire_name || 'Follow-Up Questionnaire'}
          </p>
          <p className="text-xs text-muted-foreground">
            Sent {formatDate(followUp.created_at)}
            {followUp.completed_at && ` • Completed ${formatDate(followUp.completed_at)}`}
          </p>
        </div>
      </div>
      <Badge variant={config.variant}>{config.label}</Badge>
    </div>
  );
}

export default PatientFollowUpStatus;
