import { Check, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

const STEPS = [
  { id: 'gate', label: 'Document Gate' },
  { id: 'ocr', label: 'OCR Processing' },
  { id: 'extraction', label: 'Field Extraction' },
  { id: 'triage', label: 'Triage & Validation' }
];

interface PipelineStatusProps {
  currentStep: string;
}

export function PipelineStatus({ currentStep }: PipelineStatusProps) {
  const currentIndex = STEPS.findIndex(s => s.id === currentStep);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 rounded-full z-0" />
        
        {STEPS.map((step, idx) => {
          const isActive = idx === currentIndex;
          const isPast = idx < currentIndex || currentStep === 'complete';
          
          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
              <motion.div
                initial={false}
                animate={{ 
                  backgroundColor: isPast || isActive ? '#1e3a5f' : '#ffffff',
                  borderColor: isPast || isActive ? '#1e3a5f' : '#e5e7eb',
                  scale: isActive ? 1.2 : 1
                }}
                className={cn(
                  "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors duration-300",
                  !isPast && !isActive && "text-gray-400"
                )}
              >
                {isPast ? (
                  <Check className="w-5 h-5 text-white" />
                ) : isActive ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <span className="text-sm font-medium">{idx + 1}</span>
                )}
              </motion.div>
              <span className={cn(
                "text-xs font-semibold absolute top-10 whitespace-nowrap",
                isActive ? "text-primary" : (isPast ? "text-gray-900" : "text-gray-500")
              )}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
