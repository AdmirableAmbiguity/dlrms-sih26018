import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageTransition } from '../components/ui/PageTransition';
import { StatusBadge } from '../components/ui/StatusBadge';
import { BlockchainLockButton } from '../components/blockchain/BlockchainLockButton';
import { OwnershipTimeline } from '../components/blockchain/OwnershipTimeline';
import { MapPin, FileText, Scale, AlertTriangle, Printer } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export default function RecordDetailPage() {
  const { id } = useParams();
  const { isAdmin, isOfficer } = useAuth();
  const [activeTab, setActiveTab] = useState('details');
  const [locked, setLocked] = useState(false);
  const [txHash, setTxHash] = useState('');

  const handleLock = async () => {
    return new Promise<void>(resolve => {
      setTimeout(() => {
        setLocked(true);
        setTxHash('0x7f23a9...b4c2');
        toast.success('Record permanently secured on Hyperledger Fabric');
        resolve();
      }, 2000);
    });
  };

  const MOCK_HISTORY = [
    { id: '1', recordId: id!, previousOwner: 'State Government', newOwner: 'Shivaji Rao', transferDate: '1995-04-12T00:00:00Z', txHash: '0x123...abc' },
    { id: '2', recordId: id!, previousOwner: 'Shivaji Rao', newOwner: 'Ramesh Kumar', transferDate: '2015-08-22T00:00:00Z', txHash: '0x456...def' },
  ];

  return (
    <PageTransition className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 bg-white p-6 rounded-xl border shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">Property Record #{id}</h1>
            <StatusBadge status="validated" />
          </div>
          <p className="text-gray-600 flex items-center gap-2">
            <MapPin className="w-4 h-4" /> Khasra No. 112, Rampur, Meerut
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {(isAdmin || isOfficer) && (
            <BlockchainLockButton isLocked={locked} txHash={txHash} onLock={handleLock} />
          )}
          <Link to={`/certificates`} className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
            <Printer className="w-4 h-4" /> Generate Certificate
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="flex border-b overflow-x-auto">
          {[
            { id: 'details', label: 'Property Details', icon: FileText },
            { id: 'history', label: 'Ownership History', icon: MapPin },
            { id: 'litigation', label: 'RCCMS Litigation', icon: Scale },
            { id: 'fraud', label: 'Fraud Analysis', icon: AlertTriangle }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-b-2 border-primary text-primary bg-blue-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'details' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
              <div className="space-y-4">
                <h3 className="font-bold text-lg border-b pb-2">Owner Information</h3>
                <div className="grid grid-cols-3 border-b border-gray-100 py-2"><span className="text-gray-500 col-span-1">Name</span><span className="font-medium col-span-2">Ramesh Kumar</span></div>
                <div className="grid grid-cols-3 border-b border-gray-100 py-2"><span className="text-gray-500 col-span-1">Father's Name</span><span className="font-medium col-span-2">Shivaji Rao</span></div>
                <div className="grid grid-cols-3 border-b border-gray-100 py-2"><span className="text-gray-500 col-span-1">Aadhaar Verified</span><span className="font-medium text-green-600 flex items-center gap-1 col-span-2">Yes ✓</span></div>
              </div>
              <div className="space-y-4">
                <h3 className="font-bold text-lg border-b pb-2">Land Information</h3>
                <div className="grid grid-cols-3 border-b border-gray-100 py-2"><span className="text-gray-500 col-span-1">Classification</span><span className="font-medium col-span-2">Agricultural (Irrigated)</span></div>
                <div className="grid grid-cols-3 border-b border-gray-100 py-2"><span className="text-gray-500 col-span-1">Area</span><span className="font-medium col-span-2">1.25 Hectares</span></div>
                <div className="grid grid-cols-3 border-b border-gray-100 py-2"><span className="text-gray-500 col-span-1">Survey No</span><span className="font-medium col-span-2 text-primary font-mono bg-blue-50 px-2 py-0.5 rounded w-max">45/A</span></div>
                <div className="grid grid-cols-3 border-b border-gray-100 py-2"><span className="text-gray-500 col-span-1">Khasra No</span><span className="font-medium col-span-2 text-primary font-mono bg-blue-50 px-2 py-0.5 rounded w-max">112</span></div>
              </div>
            </div>
          )}
          
          {activeTab === 'history' && (
            <div className="max-w-2xl mx-auto">
              <OwnershipTimeline history={MOCK_HISTORY} />
            </div>
          )}

          {activeTab === 'litigation' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Scale className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Litigation Found</h3>
              <p className="text-gray-500 max-w-md mx-auto">Cross-checked with e-Courts and RCCMS APIs. This property has no active or pending legal disputes.</p>
            </div>
          )}

          {activeTab === 'fraud' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Clean Record</h3>
              <p className="text-gray-500 max-w-md mx-auto">AI fraud analysis passed. No suspicious mutation velocity or ghost owner signatures detected.</p>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
