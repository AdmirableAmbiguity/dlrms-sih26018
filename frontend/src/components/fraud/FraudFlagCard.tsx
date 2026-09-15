import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { FraudFlag } from '../../types';

interface FraudFlagCardProps {
  flag: FraudFlag;
  onResolve?: (id: string) => void;
  isAdmin: boolean;
}

export function FraudFlagCard({ flag, onResolve, isAdmin }: FraudFlagCardProps) {
  const colors = {
    critical: 'bg-red-50 border-red-200 text-red-900',
    high: 'bg-orange-50 border-orange-200 text-orange-900',
    medium: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    low: 'bg-blue-50 border-blue-200 text-blue-900'
  };

  const badgeColors = {
    critical: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-blue-100 text-blue-800'
  };

  return (
    <div className={cn("p-4 rounded-xl border relative overflow-hidden", colors[flag.severity], flag.resolved && "opacity-60 bg-gray-50 border-gray-200 text-gray-700")}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className={cn("w-5 h-5", flag.resolved ? "text-gray-400" : "text-red-500")} />
          <h4 className="font-bold text-sm">{flag.type}</h4>
        </div>
        <div className="flex gap-2 items-center">
          {flag.resolved && <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-green-600 bg-green-100 px-2 py-0.5 rounded"><CheckCircle2 className="w-3 h-3"/> Resolved</span>}
          <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded", badgeColors[flag.severity])}>
            {flag.severity}
          </span>
        </div>
      </div>
      <p className="text-sm mt-2 font-medium">{flag.description}</p>
      <div className="mt-3 p-2 bg-white/50 rounded text-xs font-mono border border-black/5">
        <strong>Evidence:</strong> {flag.evidence}
      </div>
      
      {!flag.resolved && isAdmin && (
        <button 
          onClick={() => onResolve?.(flag.id)}
          className="mt-4 text-xs font-semibold bg-white px-3 py-1.5 rounded border shadow-sm hover:bg-gray-50 transition-colors"
        >
          Mark as Resolved
        </button>
      )}
    </div>
  );
}
