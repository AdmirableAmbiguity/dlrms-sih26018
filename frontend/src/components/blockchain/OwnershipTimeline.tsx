import { motion } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import { OwnershipHistory } from '../../types';
import { formatDate } from '../../lib/utils';

export function OwnershipTimeline({ history }: { history: OwnershipHistory[] }) {
  if (!history || history.length === 0) return <div className="text-gray-500 py-4 text-sm text-center">No history available</div>;

  return (
    <div className="space-y-4 py-4 relative">
      <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gray-200" />
      {history.map((event, idx) => (
        <motion.div 
          key={event.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.1 }}
          className="relative pl-14 pr-4 py-3 bg-white border rounded-xl shadow-sm z-10"
        >
          <div className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-4 border-white bg-secondary shadow-sm" />
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{formatDate(event.transferDate)}</span>
            <span className="text-[10px] font-mono bg-gray-100 px-2 py-1 rounded text-gray-600 flex items-center gap-1">
              🔗 {event.txHash.substring(0, 8)}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm font-medium">
            <div className="flex-1 p-2 bg-gray-50 rounded text-gray-600 line-through decoration-red-400">
              {event.previousOwner}
            </div>
            <ArrowDown className="w-4 h-4 text-gray-400 sm:-rotate-90 hidden sm:block" />
            <div className="flex-1 p-2 bg-green-50 text-green-900 rounded border border-green-100">
              {event.newOwner}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
