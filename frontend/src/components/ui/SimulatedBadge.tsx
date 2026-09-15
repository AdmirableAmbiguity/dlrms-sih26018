import { ShieldAlert } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SimulatedBadgeProps {
  label: string;
  className?: string;
}

export function SimulatedBadge({ label, className }: SimulatedBadgeProps) {
  return (
    <div className={cn("inline-flex items-center gap-1.5 rounded-full bg-[#FFF0E0] px-2.5 py-0.5 text-xs font-semibold text-[#FF9933] border border-[#FF9933]/30", className)}>
      <ShieldAlert className="h-3.5 w-3.5" />
      <span>Simulated — {label}</span>
    </div>
  );
}
