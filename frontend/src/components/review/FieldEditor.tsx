import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

interface FieldProps {
  label: string;
  value: string;
  originalValue?: string;
  confidence: number;
  onChange: (val: string) => void;
  showDiff: boolean;
}

export function FieldEditor({ label, value, originalValue, confidence, onChange, showDiff }: FieldProps) {
  const isChanged = originalValue !== undefined && value !== originalValue;
  const isLowConfidence = confidence < 85;

  if (showDiff && !isChanged && !isLowConfidence) return null;

  return (
    <motion.div 
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        "p-3 rounded-lg border transition-colors mb-3",
        isLowConfidence ? "bg-yellow-50/50 border-yellow-200" : "bg-white border-gray-200",
        isChanged && "border-blue-300 bg-blue-50/30"
      )}
    >
      <div className="flex justify-between items-center mb-1.5">
        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">{label}</label>
        <div className="flex items-center gap-2">
          {isChanged && <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded uppercase">Modified</span>}
          <span className={cn(
            "text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1",
            isLowConfidence ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"
          )}>
            {isLowConfidence && <AlertCircle className="w-3 h-3" />}
            {confidence.toFixed(0)}%
          </span>
        </div>
      </div>
      
      {isChanged && (
        <div className="text-xs text-gray-400 line-through mb-1 flex items-center gap-1">
          {originalValue || 'Empty'}
        </div>
      )}
      
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full px-3 py-2 text-sm rounded-md border bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow",
          isChanged ? "border-blue-300 font-medium" : "border-gray-300"
        )}
      />
    </motion.div>
  );
}
