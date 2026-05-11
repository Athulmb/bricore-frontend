import { Badge } from '../ui/badge';

interface StatusBadgeProps {
  status: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  processing: 'bg-[#f5f0ed] text-[#974926] border-[#974926]/30',
  completed: 'bg-green-100 text-green-800 border-green-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  'in-transit': 'bg-purple-100 text-purple-800 border-purple-200',
  delivered: 'bg-green-100 text-green-800 border-green-200',
  failed: 'bg-red-100 text-red-800 border-red-200',
  paid: 'bg-green-100 text-green-800 border-green-200',
  unpaid: 'bg-red-100 text-red-800 border-red-200',
  overdue: 'bg-orange-100 text-orange-800 border-orange-200',
  active: 'bg-green-100 text-green-800 border-green-200',
  inactive: 'bg-gray-100 text-gray-800 border-gray-200',
  available: 'bg-green-100 text-green-800 border-green-200',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const isFilePath = status && status.startsWith('/uploads/');
  const displayStatus = isFilePath ? 'Available' : status;
  const normalizedStatus = (displayStatus || '').toLowerCase();
  const colorClass = statusColors[normalizedStatus] || 'bg-gray-100 text-gray-800 border-gray-200';

  return (
    <Badge variant="outline" className={`${colorClass} border`}>
      {displayStatus}
    </Badge>
  );
}