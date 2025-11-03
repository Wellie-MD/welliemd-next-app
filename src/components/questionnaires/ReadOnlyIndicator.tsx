import { Lock } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ReadOnlyIndicatorProps {
  className?: string;
  showLabel?: boolean;
}

export function ReadOnlyIndicator({ 
  className, 
  showLabel = true 
}: ReadOnlyIndicatorProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="secondary" 
            className={cn(
              "inline-flex items-center gap-1.5 cursor-help",
              className
            )}
          >
            <Lock className="h-3 w-3" />
            {showLabel && <span>Read-only</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>This question is from the admin template and cannot be modified</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
