/**
 * SendFollowUpDialog - Dialog for creating and sending follow-up questionnaires.
 * 
 * Used in client portal to:
 * - Select follow-up questionnaire template
 * - Set expiry time
 * - Generate and display follow-up link
 * - Copy link or send via email
 */
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { AlertCircle, CheckCircle2, Copy, Mail, Loader2 } from 'lucide-react';
import { createFollowUp, getFollowUpTemplates, FollowUpTemplate, CreateFollowUpResponse } from '@/api/followUpApi';
import { patientService, TreatmentEpisode } from '@/services/patientService';

interface SendFollowUpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  patientName: string;
  patientEmail?: string;
  onSuccess?: (result: CreateFollowUpResponse) => void;
}

export function SendFollowUpDialog({
  open,
  onOpenChange,
  patientId,
  patientName,
  patientEmail,
  onSuccess,
}: SendFollowUpDialogProps) {
  const [templates, setTemplates] = useState<FollowUpTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [expiryHours, setExpiryHours] = useState<number>(48);
  const [loading, setLoading] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [result, setResult] = useState<CreateFollowUpResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [episodes, setEpisodes] = useState<TreatmentEpisode[]>([]);
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string>('');

  useEffect(() => {
    if (open) {
      loadTemplates();
      setEpisodes([]);
      setSelectedEpisodeId('');
      // Reset state when dialog opens
      setResult(null);
      setCopied(false);
    }
  }, [open]);

  useEffect(() => {
    if (open && selectedTemplate) {
      loadEpisodes(selectedTemplate);
    }
  }, [open, selectedTemplate]);

  const loadTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const data = await getFollowUpTemplates();
      setTemplates(data);
      if (data.length > 0) {
        setSelectedTemplate(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const loadEpisodes = async (templateId: string) => {
    setLoadingEpisodes(true);
    try {
      const data = await patientService.getTreatmentEpisodes(patientId, templateId);
      setEpisodes(data);
      if (data.length === 1) {
        setSelectedEpisodeId(data[0].id);
      } else {
        setSelectedEpisodeId('');
      }
    } catch (error) {
      console.error('Failed to load treatment episodes:', error);
      setEpisodes([]);
      setSelectedEpisodeId('');
    } finally {
      setLoadingEpisodes(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedTemplate) return;
    if (episodes.length > 1 && !selectedEpisodeId) return;

    setLoading(true);
    try {
      const response = await createFollowUp({
        patient_id: patientId,
        questionnaire_id: selectedTemplate,
        expiry_hours: expiryHours,
        episode_id: selectedEpisodeId || null,
      });

      setResult(response);

      if (response.success && onSuccess) {
        onSuccess(response);
      }
    } catch (error) {
      console.error('Failed to create follow-up:', error);
      setResult({
        success: false,
        session_id: '',
        follow_up_url: '',
        expires_at: '',
        status: 'error',
        error: 'Failed to create follow-up. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (result?.follow_up_url) {
      try {
        await navigator.clipboard.writeText(result.follow_up_url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy:', error);
      }
    }
  };

  const handleSendEmail = () => {
    if (result?.follow_up_url && patientEmail) {
      const subject = encodeURIComponent('Complete Your Follow-Up Questionnaire');
      const body = encodeURIComponent(
        `Hello,\n\nPlease complete your follow-up questionnaire by clicking the link below:\n\n${result.follow_up_url}\n\nThis link will expire in ${expiryHours} hours.\n\nThank you.`
      );
      window.open(`mailto:${patientEmail}?subject=${subject}&body=${body}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Send Follow-Up Questionnaire</DialogTitle>
          <DialogDescription>
            Create a secure follow-up questionnaire link for {patientName}.
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          // Creation form
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template">Questionnaire Template</Label>
              {loadingTemplates ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading templates...
                </div>
              ) : templates.length > 0 ? (
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a questionnaire" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                        {template.treatment_type && (
                          <span className="text-muted-foreground ml-2">
                            ({template.treatment_type})
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No follow-up questionnaire templates available.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiry">Link Expiry (hours)</Label>
              <Select
                value={expiryHours.toString()}
                onValueChange={(v) => setExpiryHours(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24">24 hours</SelectItem>
                  <SelectItem value="48">48 hours (recommended)</SelectItem>
                  <SelectItem value="72">72 hours</SelectItem>
                  <SelectItem value="168">1 week</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="episode">Treatment Episode</Label>
              {loadingEpisodes ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading treatment history...
                </div>
              ) : episodes.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No prior treatment episode found. The follow-up will still be sent,
                  but prefill may be limited.
                </p>
              ) : (
                <Select value={selectedEpisodeId} onValueChange={setSelectedEpisodeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select treatment episode" />
                  </SelectTrigger>
                  <SelectContent>
                    {episodes.map((episode) => (
                      <SelectItem key={episode.id} value={episode.id}>
                        {episode.current_product_name || episode.treatment_key} • {episode.status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {episodes.length > 1 && !selectedEpisodeId && (
                <p className="text-xs text-red-600">
                  Please select the correct treatment episode.
                </p>
              )}
            </div>
          </div>
        ) : result.success ? (
          // Success state
          <div className="py-4 space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">Follow-up created successfully!</span>
            </div>

            <div className="space-y-2">
              <Label>Follow-Up Link</Label>
              <div className="flex gap-2">
                <Input
                  value={result.follow_up_url}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyLink}
                  title="Copy link"
                >
                  {copied ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              This link expires on{' '}
              {new Date(result.expires_at).toLocaleString('en-US', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </p>
          </div>
        ) : (
          // Error state
          <div className="py-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">{result.error}</span>
            </div>
          </div>
        )}

        <DialogFooter>
          {!result ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={
                  loading ||
                  !selectedTemplate ||
                  loadingTemplates ||
                  loadingEpisodes ||
                  (episodes.length > 1 && !selectedEpisodeId)
                }
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Follow-Up'
                )}
              </Button>
            </>
          ) : result.success ? (
            <>
              {patientEmail && (
                <Button variant="outline" onClick={handleSendEmail}>
                  <Mail className="mr-2 h-4 w-4" />
                  Send via Email
                </Button>
              )}
              <Button onClick={() => onOpenChange(false)}>Done</Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setResult(null)}>
                Try Again
              </Button>
              <Button onClick={() => onOpenChange(false)}>Close</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default SendFollowUpDialog;
