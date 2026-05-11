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
        <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
        {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
      </div>
      <div className="flex gap-2">
        {secondaryAction && (
          <Button onClick={secondaryAction.onClick} variant="outline" className="gap-2">
            {secondaryAction.icon && <secondaryAction.icon className="h-4 w-4" />}
            {secondaryAction.label}
          </Button>
        )}
        {action && (
          <Button onClick={action.onClick} className="gap-2">
            {action.icon && <action.icon className="h-4 w-4" />}
            {action.label}
          </Button>
        )}
      </div>
    </div>
  );
}
