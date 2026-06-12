import { Button } from '../ui/button';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    icon?: LucideIcon;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    icon?: LucideIcon;
    onClick: () => void;
  };
}

export function PageHeader({ title, description, action, secondaryAction }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-semibold text-white/90">{title}</h1>
        {description && <p className="text-sm text-white/40 mt-1">{description}</p>}
      </div>
      <div className="flex gap-2">
        {secondaryAction && (
          <Button
            onClick={secondaryAction.onClick}
            variant="outline"
            className="gap-2 border-white/15 text-white/70 hover:bg-white/10 hover:text-white bg-transparent"
          >
            {secondaryAction.icon && <secondaryAction.icon className="h-4 w-4" />}
            {secondaryAction.label}
          </Button>
        )}
        {action && (
          <Button
            onClick={action.onClick}
            className="gap-2 bg-[#E8491F] hover:bg-[#C93D18] text-white shadow-lg shadow-[#E8491F]/25"
          >
            {action.icon && <action.icon className="h-4 w-4" />}
            {action.label}
          </Button>
        )}
      </div>
    </div>
  );
}
