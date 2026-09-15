import { PageTransition } from '../components/ui/PageTransition';
import { Award, Download, Search, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function CertificatesPage() {
  const [generating, setGenerating] = useState<string | null>(null);

  const handleGenerate = (id: string) => {
    setGenerating(id);
    setTimeout(() => {
      setGenerating(null);
      toast.success('Certificate generated and digitally signed!');
    }, 1500);
  };

  return (
    <PageTransition className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Digital Land Certificates</h1>
          <p className="text-gray-500">Generate and download QR-enabled, digitally signed property certificates.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Certificate Card 1 */}
        <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col h-full">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Award className="w-8 h-8" />
            </div>
            <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Ready
            </span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Ramesh Kumar</h3>
          <p className="text-sm text-gray-500 mb-4">Khasra No. 112 • Meerut</p>
          <div className="flex gap-2 text-xs font-mono bg-gray-50 p-2 rounded border border-gray-100 mb-6 text-gray-600 break-all">
            Blockchain Hash: 0x7f23a91b4c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f
          </div>
          
          <div className="mt-auto flex gap-3">
            <button onClick={() => handleGenerate('1')} disabled={generating === '1'} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-70">
              {generating === '1' ? 'Generating...' : 'Generate PDF'}
            </button>
            <button className="p-2 border rounded-lg text-gray-600 hover:bg-gray-50">
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Card 2 (Pending Blockchain Lock) */}
        <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col h-full opacity-70">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-gray-100 text-gray-400 rounded-lg">
              <Award className="w-8 h-8" />
            </div>
            <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded">
              Needs Blockchain Lock
            </span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Suresh Singh</h3>
          <p className="text-sm text-gray-500 mb-4">Khasra No. 89 • Ghaziabad</p>
          <div className="flex gap-2 text-xs font-mono bg-gray-50 p-2 rounded border border-gray-100 mb-6 text-gray-400">
            Awaiting lock on Hyperledger...
          </div>
          
          <div className="mt-auto flex gap-3">
            <button disabled className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 text-gray-500 rounded-lg font-medium text-sm">
              Lock Record First
            </button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
