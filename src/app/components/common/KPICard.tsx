import { LucideIcon } from 'lucide-react';

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
    <div className="glass-card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-white/45 mb-1 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-semibold text-white/90">{value}</h3>
          {subtitle && <p className="text-xs text-white/35 mt-1">{subtitle}</p>}
          {trend && (
            <p
              className={`text-xs mt-2 font-medium ${
                trend.isPositive ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </p>
          )}
        </div>
        <div className="h-10 w-10 rounded-xl bg-[#E8491F]/15 border border-[#E8491F]/20 flex items-center justify-center shadow-lg shadow-[#E8491F]/10">
          <Icon className="h-5 w-5 text-[#E8491F]" />
        </div>
      </div>
    </div>
  );
}