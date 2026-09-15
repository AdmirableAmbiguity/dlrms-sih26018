import { CheckCircle2, AlertTriangle, XCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { SimulatedBadge } from '../ui/SimulatedBadge';

interface TriageResultProps {
  outcome: 'auto_accepted' | 'needs_review' | 'rejected' | null;
  confidence: number;
  documentId: string | null;
}

export function TriageResult({ outcome, confidence, documentId }: TriageResultProps) {
  if (!outcome) return null;

  const config = {
    auto_accepted: {
      icon: CheckCircle2,
      color: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-200',
      title: 'Document Auto-Accepted',
      desc: 'Confidence score is high enough to bypass human review.',
      action: { label: 'View Record', link: `/records/${documentId}` }
    },
    needs_review: {
      icon: AlertTriangle,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      title: 'Human Review Required',
      desc: 'Confidence score is below threshold or validation rules failed.',
      action: { label: 'Go to Review', link: `/review/${documentId}` }
    },
    rejected: {
      icon: XCircle,
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
      title: 'Document Rejected',
      desc: 'Document is illegible, fraudulent, or missing critical pages.',
      action: { label: 'Upload New', link: `/upload` }
    }
  }[outcome];

  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mt-12 p-6 rounded-xl border ${config.bg} ${config.border}`}
    >
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-full bg-white shadow-sm ${config.color}`}>
            <Icon className="w-8 h-8" />
          </div>
          <div>
            <h3 className={`text-xl font-bold mb-1 ${config.color}`}>{config.title}</h3>
            <p className="text-gray-700">{config.desc}</p>
            <div className="mt-3 flex items-center gap-4">
              <span className="text-sm font-semibold px-2.5 py-1 bg-white rounded-md border shadow-sm">
                OCR Confidence: <span className={confidence >= 85 ? 'text-green-600' : 'text-yellow-600'}>{confidence.toFixed(1)}%</span>
              </span>
              <SimulatedBadge label="Sarvam AI / PaddleOCR" />
            </div>
          </div>
        </div>
        
        {documentId && config.action.link && (
          <Link 
            to={config.action.link}
            className="flex-shrink-0 w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-900 border-2 border-gray-200 font-bold rounded-lg hover:border-primary hover:text-primary transition-colors shadow-sm"
          >
            {config.action.label}
            <ArrowRight className="w-5 h-5" />
          </Link>
        )}
      </div>
    </motion.div>
  );
}
