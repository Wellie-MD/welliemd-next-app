/**
 * SendFollowUpDialog - Dialog for creating and sending follow-up questionnaires.
 * 
 * Used in client portal to:
 * - Select follow-up questionnaire template
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
import {
  createFollowUp,
  getOnboardingTemplates,
  getFollowUpOrderCandidates,
  getFollowUpTemplates,
  FollowUpOrderCandidate,
  OnboardingTemplate,
  FollowUpTemplate,
  CreateFollowUpResponse,
  sendFollowUpNotification,
} from '@/api/followUpApi';
import { patientService, TreatmentEpisode } from '@/services/patientService';

interface SendFollowUpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  patientName: string;
  patientEmail?: string;
  onSuccess?: (result: CreateFollowUpResponse) => void;
}

const normalizeTreatmentType = (value?: string | null) =>
  (value || '').toLowerCase().replace(/[^a-z0-9]/g, '');

export function SendFollowUpDialog({
  open,
  onOpenChange,
  patientId,
  patientName,
  patientEmail,
  onSuccess,
}: SendFollowUpDialogProps) {
  const [templates, setTemplates] = useState<FollowUpTemplate[]>([]);
  const [onboardingTemplates, setOnboardingTemplates] = useState<OnboardingTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedOnboardingTemplate, setSelectedOnboardingTemplate] = useState<string>('none');
  const [loading, setLoading] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [result, setResult] = useState<CreateFollowUpResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [episodes, setEpisodes] = useState<TreatmentEpisode[]>([]);
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string>('');
  const [episodesFallbackUsed, setEpisodesFallbackUsed] = useState(false);
  const [orderCandidates, setOrderCandidates] = useState<FollowUpOrderCandidate[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [loadingOrderCandidates, setLoadingOrderCandidates] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSentOnce, setEmailSentOnce] = useState(false);
  const [sendEmailMessage, setSendEmailMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

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

  const selectedOrderRecord = useMemo(
    () => orderCandidates.find((o) => o.id === selectedOrderId) || null,
    [orderCandidates, selectedOrderId]
  );

  const resultAccessText = useMemo(() => {
    if (!result?.success) {
      return null;
    }
    const rawExpiry = result.link_expires_at || result.expires_at;
    if (!rawExpiry) {
      return {
        label: 'Access',
        value: 'Active until completion',
      };
    }
    return {
      label: 'Access expires',
      value: new Date(rawExpiry).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    };
  }, [result]);

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
      const [followUpData, onboardingData, patientEpisodes] = await Promise.all([
        getFollowUpTemplates(),
        getOnboardingTemplates(),
        patientService.getTreatmentEpisodes(patientId),
      ]);

      const activeTreatmentTypes = new Set(
        patientEpisodes
          .filter(ep => ep.status === 'active')
          .map(ep => normalizeTreatmentType(ep.treatment_key))
          .filter(Boolean)
      );

      const filteredFollowUpTemplates = followUpData.filter((template) =>
        !template.treatment_type ||
        activeTreatmentTypes.has(normalizeTreatmentType(template.treatment_type))
      );

      setTemplates(filteredFollowUpTemplates);
      setOnboardingTemplates(onboardingData);
      setSelectedTemplate((currentSelectedTemplate) => {
        if (
          currentSelectedTemplate &&
          filteredFollowUpTemplates.some((template) => template.id === currentSelectedTemplate)
        ) {
          return currentSelectedTemplate;
        }
        return filteredFollowUpTemplates[0]?.id || '';
      });
    } catch (error) {
      console.error('Failed to load templates:', error);
      const [followUpData, onboardingData] = await Promise.all([
        getFollowUpTemplates(),
        getOnboardingTemplates(),
      ]);
      setTemplates(followUpData);
      setOnboardingTemplates(onboardingData);
      setSelectedTemplate((currentSelectedTemplate) => {
        if (
          currentSelectedTemplate &&
          followUpData.some((template) => template.id === currentSelectedTemplate)
        ) {
          return currentSelectedTemplate;
        }
        return followUpData[0]?.id || '';
      });
    } finally {
      setLoadingTemplates(false);
    }
  }, [patientId]);

  const loadOrderCandidates = useCallback(async () => {
    setLoadingOrderCandidates(true);
    try {
      const response = await getFollowUpOrderCandidates(patientId);
      if (response.success) {
        setOrderCandidates(response.order_candidates || []);
        if ((response.order_candidates || []).length === 1) {
          setSelectedOrderId(response.order_candidates[0].id);
        }
      } else {
        setOrderCandidates([]);
      }
    } catch (error) {
      console.error('Failed to load order candidates:', error);
      setOrderCandidates([]);
    } finally {
      setLoadingOrderCandidates(false);
    }
  }, [patientId]);

  const loadEpisodes = useCallback(async (templateId: string) => {
    setLoadingEpisodes(true);
    try {
      const allEpisodes = await patientService.getTreatmentEpisodes(patientId);
      const template = templates.find((item) => item.id === templateId) || null;
      const normalizedTemplateTreatment = normalizeTreatmentType(template?.treatment_type);

      const treatmentMatchedEpisodes = normalizedTemplateTreatment
        ? allEpisodes.filter(
            (episode) =>
              normalizeTreatmentType(episode.treatment_key) === normalizedTemplateTreatment
          )
        : allEpisodes;

      const activeTreatmentMatchedEpisodes = treatmentMatchedEpisodes.filter(
        (episode) => episode.status === 'active'
      );

      const preferredEpisodes =
        activeTreatmentMatchedEpisodes.length > 0
          ? activeTreatmentMatchedEpisodes
          : treatmentMatchedEpisodes;

      const data = preferredEpisodes.length > 0 ? preferredEpisodes : allEpisodes;

      setEpisodesFallbackUsed(
        Boolean(normalizedTemplateTreatment) &&
          treatmentMatchedEpisodes.length === 0 &&
          allEpisodes.length > 0
      );
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
  }, [patientId, templates]);

  useEffect(() => {
    if (open) {
      loadTemplates();
      setEpisodes([]);
      setSelectedEpisodeId('');
      setEpisodesFallbackUsed(false);
      setOrderCandidates([]);
      setSelectedOrderId('');
      setSelectedOnboardingTemplate('none');
      loadOrderCandidates();
      // Reset state when dialog opens
      setResult(null);
      setFormError(null);
      setCopied(false);
      setEmailSentOnce(false);
      setSendEmailMessage(null);
    }
  }, [open, loadTemplates, loadOrderCandidates]);

  useEffect(() => {
    if (open && selectedTemplate) {
      loadEpisodes(selectedTemplate);
    }
  }, [open, selectedTemplate, loadEpisodes]);

  const handleSubmit = async () => {
    if (!selectedTemplate) return;

    const hasEpisodePath = Boolean(selectedEpisodeId || selectedEpisodeRecord?.id);
    const hasOrderPath = Boolean(selectedOrderId || selectedOrderRecord?.id);
    if (!hasEpisodePath && !hasOrderPath) return;

    setLoading(true);
    setFormError(null);
    try {
      const response = await createFollowUp({
        patient_id: patientId,
        questionnaire_id: selectedTemplate,
        episode_id: selectedEpisodeId || selectedEpisodeRecord?.id || null,
        context_order_id: selectedOrderId || selectedOrderRecord?.id || null,
        onboarding_template_id:
          selectedOnboardingTemplate && selectedOnboardingTemplate !== 'none'
            ? selectedOnboardingTemplate
            : null,
      });

      if (!response.success && response.code === 'EPISODE_RESOLUTION_REQUIRED') {
        const candidates = response.order_candidates || [];
        setOrderCandidates(candidates);
        if (candidates.length === 1) {
          setSelectedOrderId(candidates[0].id);
        }
        setFormError(
          response.error || 'Episode is ambiguous or missing. Select an order context and retry.'
        );
        return;
      }

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
              <Label htmlFor="onboarding_template">Onboarding Template (Optional)</Label>
              <Select value={selectedOnboardingTemplate} onValueChange={setSelectedOnboardingTemplate}>
                <SelectTrigger id="onboarding_template">
                  <SelectValue placeholder="Use existing episode context" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Use existing episode context</SelectItem>
                  {onboardingTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Set explicitly for legacy/manual episodes missing onboarding linkage.
              </p>
            </div>

            {formError && (
              <div className="p-2 rounded border border-red-200 bg-red-50 text-red-700 text-sm">
                {formError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="episode">Treatment Episode</Label>
              {loadingEpisodes ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading treatment history...
                </div>
              ) : episodes.length === 0 ? (
                <p className="text-sm text-red-600">
                  No template-matched treatment episode is available yet. You can select an order context below to create/use episode context automatically.
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
              {episodes.length > 1 && !selectedEpisodeId && !selectedOrderId && (
                <p className="text-xs text-red-600">
                  Select a treatment episode or an order context.
                </p>
              )}
              {templateEpisodeWarning && (
                <div className="mt-2 p-2 rounded border border-amber-300 bg-amber-50 text-amber-900 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5" />
                  <p className="text-xs">{templateEpisodeWarning}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="order-context">Order Context (Legacy-safe)</Label>
              {loadingOrderCandidates ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading patient orders...
                </div>
              ) : orderCandidates.length > 0 ? (
                <>
                  <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
                    <SelectTrigger id="order-context">
                      <SelectValue placeholder="Select order (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {orderCandidates.map((order) => (
                        <SelectItem key={order.id} value={order.id}>
                          {(order.order_id
                            ? `#${order.order_id}`
                            : order.display_id
                              ? `#${order.display_id}`
                              : order.id.slice(0, 8))}
                          {order.product_name ? ` • ${order.product_name}` : ''}
                          {order.status ? ` • ${order.status}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Use when episode resolution is ambiguous or missing. Selected order will be used as follow-up context.
                  </p>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No eligible orders available for fallback context.
                </p>
              )}
            </div>

            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-sm font-medium text-slate-900">Link policy</p>
              <p className="text-xs text-slate-600">
                Link remains active until questionnaire is completed.
              </p>
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

            {resultAccessText && (
              <p className="text-sm text-muted-foreground">
                {resultAccessText.label}: {resultAccessText.value}
              </p>
            )}
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
                  (!selectedEpisodeId && !selectedEpisodeRecord?.id && !selectedOrderId && !selectedOrderRecord?.id)
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
