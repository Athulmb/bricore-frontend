import { LucideIcon } from 'lucide-react';
import { Card } from '../ui/card';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  subtitle?: string;
}

export function KPICard({ title, value, icon: Icon, trend, subtitle }: KPICardProps) {
  return (
    <Card className="p-5 bg-white border border-gray-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <h3 className="text-2xl font-semibold text-gray-900">{value}</h3>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          {trend && (
            <p
              className={`text-xs mt-2 ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </p>
          )}
        </div>
        <div className="h-10 w-10 rounded-lg bg-[#f5f0ed] flex items-center justify-center">
          <Icon className="h-5 w-5 text-[#974926]" />
        </div>
      </div>
    </Card>
  );
}