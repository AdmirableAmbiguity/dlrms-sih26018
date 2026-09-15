import { Lock, CheckCircle, ExternalLink, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function BlockchainLockButton({ isLocked, txHash, onLock }: { isLocked: boolean, txHash?: string, onLock: () => Promise<void> }) {
  const [loading, setLoading] = useState(false);

  const handleLock = async () => {
    setLoading(true);
    await onLock();
    setLoading(false);
  };

  return (
    <div className="flex items-center gap-4">
      {isLocked ? (
        <div className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-green-800">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <div>
            <div className="font-semibold text-sm">Secured on Hyperledger</div>
            {txHash && (
              <a href={`https://explorer.mock.dlrms.gov.in/tx/${txHash}`} target="_blank" rel="noreferrer" className="text-xs underline flex items-center gap-1 hover:text-green-700">
                Tx: {txHash.substring(0, 12)}... <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      ) : (
        <button
          onClick={handleLock}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-70"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
          {loading ? 'Committing to Chain...' : 'Lock on Blockchain'}
        </button>
      )}
    </div>
  );
}
