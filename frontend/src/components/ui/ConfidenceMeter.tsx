import { motion } from 'framer-motion';

interface ConfidenceMeterProps {
  score: number; // 0-100
  label?: string;
}

export function ConfidenceMeter({ score, label = "Confidence" }: ConfidenceMeterProps) {
  let color = 'bg-red-500';
  if (score >= 85) color = 'bg-green-500';
  else if (score >= 40) color = 'bg-yellow-500';

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-medium text-gray-700">{label}</span>
        <span className="text-xs font-bold text-gray-900">{score.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </div>
  );
}
