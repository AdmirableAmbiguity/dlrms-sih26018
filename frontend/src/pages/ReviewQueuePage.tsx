import { PageTransition } from '../components/ui/PageTransition';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Link } from 'react-router-dom';
import { Search, Filter, ChevronRight } from 'lucide-react';
import { formatDate } from '../lib/utils';

const MOCK_QUEUE = [
  { id: '1', filename: 'Khasra_Meerut_23A.pdf', date: '2026-09-15T09:00:00Z', confidence: 78.5, status: 'needs_review', issues: ['Low Confidence: Area', 'Missing: Owner Signature'] },
  { id: '2', filename: 'Registry_Doc_Ghaziabad_04.jpg', date: '2026-09-15T09:30:00Z', confidence: 65.2, status: 'needs_review', issues: ['Unclear Text', 'Low Confidence: All fields'] },
  { id: '3', filename: 'SaleDeed_Noida_12.pdf', date: '2026-09-14T14:20:00Z', confidence: 82.1, status: 'needs_review', issues: ['Mismatch with Govt DB'] },
];

export default function ReviewQueuePage() {
  return (
    <PageTransition className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Review Queue</h1>
          <p className="text-gray-500">Documents requiring human-in-the-loop verification.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search queue..." className="pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none" />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 font-semibold text-gray-600">Document</th>
              <th className="px-6 py-4 font-semibold text-gray-600">Upload Date</th>
              <th className="px-6 py-4 font-semibold text-gray-600">OCR Confidence</th>
              <th className="px-6 py-4 font-semibold text-gray-600">Identified Issues</th>
              <th className="px-6 py-4 font-semibold text-gray-600">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {MOCK_QUEUE.map((doc) => (
              <tr key={doc.id} className="hover:bg-gray-50 transition-colors group">
                <td className="px-6 py-4 font-medium text-gray-900">{doc.filename}</td>
                <td className="px-6 py-4 text-gray-500">{formatDate(doc.date)}</td>
                <td className="px-6 py-4">
                  <span className={`font-bold ${doc.confidence >= 80 ? 'text-green-600' : (doc.confidence >= 60 ? 'text-yellow-600' : 'text-red-600')}`}>
                    {doc.confidence}%
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    {doc.issues.map((issue, i) => (
                      <span key={i} className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded border border-red-100 inline-block w-max">
                        {issue}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Link 
                    to={`/review/${doc.id}`}
                    className="inline-flex items-center gap-1 text-primary font-semibold hover:underline"
                  >
                    Review <ChevronRight className="w-4 h-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {MOCK_QUEUE.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No documents pending review. Great job!
          </div>
        )}
      </div>
    </PageTransition>
  );
}
