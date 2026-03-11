/**
 * SendFollowUpDialog - Dialog for creating and sending follow-up questionnaires.
 * 
 * Used in client portal to:
 * - Select follow-up questionnaire template
 * - Set expiry time
 * - Generate and display follow-up link
 * - Copy link or send via email
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { AlertCircle, AlertTriangle, CheckCircle2, Copy, Mail, Loader2 } from 'lucide-react';
import { createFollowUp, getFollowUpTemplates, FollowUpTemplate, CreateFollowUpResponse, sendFollowUpNotification } from '@/api/followUpApi';
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
  const [episodesFallbackUsed, setEpisodesFallbackUsed] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSentOnce, setEmailSentOnce] = useState(false);
  const [sendEmailMessage, setSendEmailMessage] = useState<string | null>(null);

  const selectedTemplateRecord = useMemo(
    () => templates.find((t) => t.id === selectedTemplate) || null,
    [templates, selectedTemplate]
  );

  const selectedEpisodeRecord = useMemo(() => {
    if (selectedEpisodeId) {
      return episodes.find((e) => e.id === selectedEpisodeId) || null;
    }
    if (episodes.length === 1) {
      return episodes[0];
    }
    return null;
  }, [episodes, selectedEpisodeId]);

  const templateEpisodeWarning = useMemo(() => {
    if (!selectedTemplateRecord || !selectedEpisodeRecord) return null;

    const templateText = `${selectedTemplateRecord.name || ''} ${selectedTemplateRecord.treatment_type || ''}`.toLowerCase();
    const episodeText = `${selectedEpisodeRecord.current_product_name || ''} ${selectedEpisodeRecord.current_product_category_name || ''} ${selectedEpisodeRecord.current_product_titration_category || ''} ${selectedEpisodeRecord.treatment_key || ''}`.toLowerCase();

    const glpPattern =
      /(glp|semaglutide|tirzepatide|ozempic|wegovy|mounjaro|zepbound|individualized weight loss)/;
    const glpTemplateLike = glpPattern.test(templateText);
    const glpEpisodeLike = glpPattern.test(episodeText);

    if (glpTemplateLike && !glpEpisodeLike) {
      return "Selected template looks GLP-focused, but selected episode looks non-GLP. Prefill and checkout routing may be incorrect.";
    }

    const regimenText = (selectedEpisodeRecord.current_product_titration_category || '').toLowerCase();
    const protocolRegimenPattern = /(alternative|rapid|twice weekly|biweekly)/;
    if (glpTemplateLike && regimenText && !protocolRegimenPattern.test(regimenText)) {
      return "Selected template expects GLP protocol branches, but episode regimen does not look like Alternative/Rapid/Twice Weekly.";
    }

    return null;
  }, [selectedTemplateRecord, selectedEpisodeRecord]);

  const describeEpisode = useCallback((episode: TreatmentEpisode) => {
    const primary = [
      episode.current_product_name,
      episode.current_product_category_name,
      episode.current_product_titration_category,
    ].filter(Boolean);

    const summary = primary.length > 0 ? primary.join(' • ') : episode.treatment_key;
    return `${summary} • ${episode.status}`;
  }, []);

  const loadTemplates = useCallback(async () => {
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
  }, []);

  const loadEpisodes = useCallback(async (templateId: string) => {
    setLoadingEpisodes(true);
    try {
      // First try: episodes compatible with selected follow-up template
      const filteredEpisodes = await patientService.getTreatmentEpisodes(patientId, templateId);

      // Fallback: if template filter returns nothing, load all patient episodes
      // to avoid false "no episode" when treatment-key mapping is strict.
      const data =
        filteredEpisodes.length > 0
          ? filteredEpisodes
          : await patientService.getTreatmentEpisodes(patientId);

      setEpisodesFallbackUsed(filteredEpisodes.length === 0 && data.length > 0);
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
  }, [patientId]);

  useEffect(() => {
    if (open) {
      loadTemplates();
      setEpisodes([]);
      setSelectedEpisodeId('');
      setEpisodesFallbackUsed(false);
      // Reset state when dialog opens
      setResult(null);
      setCopied(false);
      setEmailSentOnce(false);
      setSendEmailMessage(null);
    }
  }, [open, loadTemplates]);

  useEffect(() => {
    if (open && selectedTemplate) {
      loadEpisodes(selectedTemplate);
    }
  }, [open, selectedTemplate, loadEpisodes]);

  const handleSubmit = async () => {
    if (!selectedTemplate) return;
    if (episodes.length === 0) return;
    if (episodes.length > 1 && !selectedEpisodeId) return;

    setLoading(true);
    try {
      const response = await createFollowUp({
        patient_id: patientId,
        questionnaire_id: selectedTemplate,
        expiry_hours: expiryHours,
        episode_id: selectedEpisodeId || selectedEpisodeRecord?.id || null,
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

  const handleSendEmail = async () => {
    if (!result?.session_id || sendingEmail || emailSentOnce) return;

    setSendingEmail(true);
    setSendEmailMessage(null);
    try {
      const idempotencyKey =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      const response = await sendFollowUpNotification(result.session_id, {
        template_type: 'follow_up_scheduled',
        channels: ['email'],
        idempotency_key: idempotencyKey,
      });

      if (response.success) {
        setEmailSentOnce(true);
        setSendEmailMessage(
          response.skipped_duplicate
            ? 'Email was already sent recently for this follow-up.'
            : 'Follow-up email sent successfully.'
        );
        if (response.notification_result?.follow_up_url) {
          setResult((prev) => (
            prev ? { ...prev, follow_up_url: response.notification_result?.follow_up_url || prev.follow_up_url } : prev
          ));
        }
      } else {
        setSendEmailMessage(response.error || 'Failed to send follow-up email.');
      }
    } catch (error) {
      console.error('Failed to send follow-up email:', error);
      setSendEmailMessage('Failed to send follow-up email.');
    } finally {
      setSendingEmail(false);
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
                <p className="text-sm text-red-600">
                  No treatment episode is available for this patient and template yet. Create or attach the correct treatment track before sending a manual follow-up.
                </p>
              ) : (
                <>
                  <Select value={selectedEpisodeId} onValueChange={setSelectedEpisodeId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select treatment episode" />
                    </SelectTrigger>
                    <SelectContent>
                      {episodes.map((episode) => (
                        <SelectItem key={episode.id} value={episode.id}>
                          {describeEpisode(episode)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {episodesFallbackUsed && (
                    <p className="text-xs text-amber-700">
                      No template-matched episode found. Showing all patient episodes; select the correct one.
                    </p>
                  )}
                </>
              )}
              {episodes.length > 1 && !selectedEpisodeId && (
                <p className="text-xs text-red-600">
                  Please select the correct treatment episode.
                </p>
              )}
              {templateEpisodeWarning && (
                <div className="mt-2 p-2 rounded border border-amber-300 bg-amber-50 text-amber-900 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5" />
                  <p className="text-xs">{templateEpisodeWarning}</p>
                </div>
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
            {patientEmail && (
              <p className="text-xs text-muted-foreground">
                A scheduled follow-up email is sent automatically when the session is created. Use resend only if needed.
              </p>
            )}
            {sendEmailMessage && (
              <p className="text-sm text-muted-foreground">{sendEmailMessage}</p>
            )}
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
                  episodes.length === 0 ||
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
                <Button variant="outline" onClick={handleSendEmail} disabled={sendingEmail || emailSentOnce}>
                  {sendingEmail ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : emailSentOnce ? (
                    <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                  ) : (
                    <Mail className="mr-2 h-4 w-4" />
                  )}
                  {emailSentOnce ? 'Email Sent' : 'Resend Email'}
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
