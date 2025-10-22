import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription, // ADDED
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { templateApi, QuestionnaireTemplate, CreateTemplatePayload } from '@/api/questionnaires';

interface CreateTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: QuestionnaireTemplate | null;
  onSuccess: () => void;
}

export function CreateTemplateModal({
  open,
  onOpenChange,
  template,
  onSuccess,
}: CreateTemplateModalProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState<CreateTemplatePayload>({
    name: '',
    description: '',
    questionnaire_type: 'client_custom',
    beluga_visit_type: 'none',
    requires_photo_upload: false,
    requires_identity_verification: false,
  });

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        description: template.description || '',
        questionnaire_type: template.questionnaire_type,
        beluga_visit_type: template.beluga_visit_type || 'none', // CHANGED
        requires_photo_upload: template.requires_photo_upload,
        requires_identity_verification: template.requires_identity_verification,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        questionnaire_type: 'intake',
        beluga_visit_type: 'none', // CHANGED
        requires_photo_upload: false,
        requires_identity_verification: false,
      });
    }
  }, [template, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Template name is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      
      // Remove beluga_visit_type if it's 'none'
      const payload = {
        ...formData,
        beluga_visit_type: formData.beluga_visit_type === 'none' ? undefined : formData.beluga_visit_type,
      };
      
      if (template) {
        await templateApi.updateTemplate(template.id, payload);
        toast({
          title: 'Success',
          description: 'Template updated successfully',
        });
      } else {
        await templateApi.createTemplate(payload);
        toast({
          title: 'Success',
          description: 'Template created successfully',
        });
      }
      
      onSuccess();
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || `Failed to ${template ? 'update' : 'create'} template`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto scrollbar-hide">
        <DialogHeader>
          <DialogTitle>
            {template ? 'Edit Template' : 'Create New Template'}
          </DialogTitle>
          {/* ADDED: DialogDescription to fix accessibility warning */}
          <DialogDescription>
            {template 
              ? 'Update the template details below.' 
              : 'Create a new questionnaire template to build question flows.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Template Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Template Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Weight Loss Intake Form"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of this template"
              rows={3}
            />
          </div>

        {/* Questionnaire Type */}
        <div className="space-y-2">
        <Label htmlFor="questionnaire_type">
            Questionnaire Type <span className="text-red-500">*</span>
        </Label>
        <Select
            value={formData.questionnaire_type}
            onValueChange={(value) =>
            setFormData({ ...formData, questionnaire_type: value })
            }
        >
            <SelectTrigger>
            <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
            <SelectItem value="standard_weight_loss">Standard Weight Loss Questionnaire</SelectItem>
            <SelectItem value="individualized_glp">Individualized GLP Weight Loss</SelectItem>
            <SelectItem value="follow_up">Weight Loss Follow-up Questionnaire</SelectItem>
            <SelectItem value="ed_questionnaire">Erectile Dysfunction Questionnaire</SelectItem>
            <SelectItem value="client_custom">Client Custom Questionnaire</SelectItem>
            </SelectContent>
        </Select>
        </div>


          {/* Beluga Visit Type */}
          <div className="space-y-2">
            <Label htmlFor="beluga_visit_type">Beluga Visit Type</Label>
            <Select
              value={formData.beluga_visit_type}
              onValueChange={(value) =>
                setFormData({ ...formData, beluga_visit_type: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select visit type (optional)" />
              </SelectTrigger>
              <SelectContent>
                {/* CHANGED: Use 'none' instead of empty string */}
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="initial">Initial Visit</SelectItem>
                <SelectItem value="follow_up">Follow Up Visit</SelectItem>
                <SelectItem value="consultation">Consultation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Toggles */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="requires_photo">Requires Photo Upload</Label>
              <Switch
                id="requires_photo"
                checked={formData.requires_photo_upload}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, requires_photo_upload: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="requires_verification">
                Requires Identity Verification
              </Label>
              <Switch
                id="requires_verification"
                checked={formData.requires_identity_verification}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, requires_identity_verification: checked })
                }
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : template ? 'Update Template' : 'Create Template'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
