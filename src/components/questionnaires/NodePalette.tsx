import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NodePaletteProps {
  onAddNode: (questionType: string) => void;
}

const QUESTION_TYPES = [
  { type: 'text', label: 'Text Input', icon: '📝' },
  { type: 'textarea', label: 'Long Text', icon: '📄' },
  { type: 'single_choice', label: 'Single Choice', icon: '🔘' },
  { type: 'multiple_choice', label: 'Multiple Choice', icon: '☑️' },
  { type: 'number', label: 'Number', icon: '🔢' },
  { type: 'date', label: 'Date', icon: '📅' },
  { type: 'height_weight', label: 'Height/Weight', icon: '⚖️' },
  { type: 'consent', label: 'Consent Form', icon: '✍️' },
  { type: 'file_upload', label: 'File Upload', icon: '📎' },
];

export function NodePalette({ onAddNode }: NodePaletteProps) {
  return (
    <Card className="w-64 rounded-none border-r border-t-0 border-l-0 border-b-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Question Types</CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <ScrollArea className="h-[calc(100vh-140px)]">
          <div className="space-y-2">
            {QUESTION_TYPES.map((type) => (
              <Button
                key={type.type}
                variant="outline"
                className="w-full justify-start gap-2 h-auto py-3"
                onClick={() => onAddNode(type.type)}
              >
                <span className="text-xl">{type.icon}</span>
                <span className="text-sm">{type.label}</span>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
