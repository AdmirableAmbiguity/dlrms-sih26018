import { cn } from '../../lib/utils';
import { STATUS_COLORS } from '../../lib/constants';

interface StatusBadgeProps {
  status: keyof typeof STATUS_COLORS;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const label = status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border", STATUS_COLORS[status] || STATUS_COLORS.pending, className)}>
      {label}
    </span>
  );
}
