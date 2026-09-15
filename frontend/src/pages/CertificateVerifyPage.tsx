import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ShieldCheck, XCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { SimulatedBadge } from '../components/ui/SimulatedBadge';

export default function CertificateVerifyPage() {
  const { hash } = useParams();
  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid'>('loading');

  useEffect(() => {
    // Simulate verification delay
    setTimeout(() => {
      if (hash === 'valid_hash') {
        setStatus('valid');
      } else {
        setStatus('valid'); // Default to valid for demo
      }
    }, 2000);
  }, [hash]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-secondary" />
        
        <div className="flex justify-center mb-6">
          <img src="/favicon.svg" alt="DLRMS Logo" className="w-16 h-16 bg-primary rounded-full p-2" />
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Certificate Verification</h1>
          <p className="text-gray-500 text-sm mt-1">DLRMS - Smart India Hackathon</p>
          <div className="mt-4 flex justify-center"><SimulatedBadge label="Hyperledger Fabric" /></div>
        </div>

        {status === 'loading' && (
          <div className="flex flex-col items-center py-8">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="text-gray-600 font-medium animate-pulse">Querying Blockchain Ledger...</p>
          </div>
        )}

        {status === 'valid' && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
              <ShieldCheck className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-green-700 mb-2">Authentic Record</h2>
            <p className="text-gray-600 mb-6">This digital land certificate is verified and actively maintained on the blockchain.</p>
            
            <div className="bg-gray-50 rounded-lg border p-4 text-left space-y-3 text-sm">
              <div className="grid grid-cols-3"><span className="text-gray-500">Owner</span><span className="col-span-2 font-bold text-gray-900">Ramesh Kumar</span></div>
              <div className="grid grid-cols-3"><span className="text-gray-500">Property</span><span className="col-span-2 font-medium">Khasra No 112, Meerut</span></div>
              <div className="grid grid-cols-3"><span className="text-gray-500">Issued On</span><span className="col-span-2 font-medium">15 Sep 2026</span></div>
              <div className="grid grid-cols-3"><span className="text-gray-500">Tx Hash</span><span className="col-span-2 font-mono text-xs break-all text-primary">0x7f23a91b4c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f</span></div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
