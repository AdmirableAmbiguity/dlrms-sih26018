import { PageTransition } from '../components/ui/PageTransition';
import { FraudFlagCard } from '../components/fraud/FraudFlagCard';
import { FraudFlag } from '../types';
import { useState } from 'react';
import toast from 'react-hot-toast';

const MOCK_FLAGS: FraudFlag[] = [
  { id: '1', recordId: 'doc_1', severity: 'critical', type: 'High Velocity Mutation', description: 'Property transferred 4 times within the last 12 months. Suspicious activity.', evidence: 'Transaction history shows transfers on Jan 12, Apr 5, Aug 20, Sep 10.', createdAt: '2026-09-15', resolved: false },
  { id: '2', recordId: 'doc_2', severity: 'high', type: 'Signature Mismatch', description: 'Seller signature does not match Aadhaar/Govt DB records.', evidence: 'SSIM similarity score: 0.32 (Threshold: 0.85)', createdAt: '2026-09-14', resolved: false },
  { id: '3', recordId: 'doc_3', severity: 'medium', type: 'Deceased Owner', description: 'Seller marked as deceased in Civil Registration System.', evidence: 'Death Certificate matched via CRS API for "Shivaji Rao"', createdAt: '2026-09-10', resolved: true },
];

export default function FraudDashboardPage() {
  const [flags, setFlags] = useState(MOCK_FLAGS);

  const handleResolve = (id: string) => {
    setFlags(flags.map(f => f.id === id ? { ...f, resolved: true } : f));
    toast.success('Fraud flag marked as resolved.');
  };

  return (
    <PageTransition className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fraud & Discrepancy Analysis</h1>
          <p className="text-gray-500">AI-detected anomalies in property transfers and document validations.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-red-50 p-4 rounded-xl border border-red-200">
          <div className="text-red-900 text-sm font-bold uppercase tracking-wider mb-1">Critical Flags</div>
          <div className="text-3xl font-bold text-red-600">12</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
          <div className="text-orange-900 text-sm font-bold uppercase tracking-wider mb-1">High Severity</div>
          <div className="text-3xl font-bold text-orange-600">34</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
          <div className="text-yellow-900 text-sm font-bold uppercase tracking-wider mb-1">Medium Severity</div>
          <div className="text-3xl font-bold text-yellow-600">89</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
          <div className="text-blue-900 text-sm font-bold uppercase tracking-wider mb-1">Resolved (30d)</div>
          <div className="text-3xl font-bold text-blue-600">156</div>
        </div>
      </div>

      <h3 className="text-lg font-bold text-gray-800 mb-4">Active & Recent Alerts</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {flags.map(flag => (
          <FraudFlagCard key={flag.id} flag={flag} onResolve={handleResolve} isAdmin={true} />
        ))}
      </div>
    </PageTransition>
  );
}
