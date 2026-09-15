import { PageTransition } from '../components/ui/PageTransition';
import { StatusBadge } from '../components/ui/StatusBadge';
import { SimulatedBadge } from '../components/ui/SimulatedBadge';
import { Link } from 'react-router-dom';
import { Search, Filter, ShieldCheck, FileText } from 'lucide-react';
import { useState } from 'react';

const MOCK_RECORDS = [
  { id: '1', owner: 'Ramesh Kumar', surveyNumber: '45/A', khasraNumber: '112', village: 'Rampur', district: 'Meerut', status: 'validated', locked: true, area: 1.25 },
  { id: '2', owner: 'Suresh Singh', surveyNumber: '22', khasraNumber: '89', village: 'Modinagar', district: 'Ghaziabad', status: 'validated', locked: false, area: 0.75 },
  { id: '3', owner: 'Amit Sharma', surveyNumber: '14/B', khasraNumber: '45', village: 'Dadri', district: 'Noida', status: 'needs_review', locked: false, area: 2.10 },
  { id: '4', owner: 'Vikash Yadav', surveyNumber: '56', khasraNumber: '210', village: 'Sikandra', district: 'Agra', status: 'validated', locked: true, area: 0.50 },
];

export default function RecordsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = MOCK_RECORDS.filter(r => 
    r.owner.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.surveyNumber.includes(searchTerm) ||
    r.khasraNumber.includes(searchTerm)
  );

  return (
    <PageTransition className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Land Records Database</h1>
          <p className="text-gray-500">Search and manage digitized property records.</p>
        </div>
        <SimulatedBadge label="NIC Land Records DB" />
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by Owner Name, Survey No, Khasra No..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary outline-none" 
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border rounded-lg font-medium hover:bg-gray-50 bg-white">
          <Filter className="w-5 h-5" /> Filters
        </button>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-600">Owner Name</th>
                <th className="px-6 py-4 font-semibold text-gray-600">Survey / Khasra No</th>
                <th className="px-6 py-4 font-semibold text-gray-600">Location</th>
                <th className="px-6 py-4 font-semibold text-gray-600">Area</th>
                <th className="px-6 py-4 font-semibold text-gray-600">Status</th>
                <th className="px-6 py-4 font-semibold text-gray-600">Blockchain</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{record.owner}</td>
                  <td className="px-6 py-4 text-gray-700 font-mono text-xs">{record.surveyNumber} / {record.khasraNumber}</td>
                  <td className="px-6 py-4 text-gray-500">{record.village}, {record.district}</td>
                  <td className="px-6 py-4 text-gray-700">{record.area} Ha</td>
                  <td className="px-6 py-4"><StatusBadge status={record.status as any} /></td>
                  <td className="px-6 py-4">
                    {record.locked ? (
                      <span className="flex items-center gap-1 text-green-700 bg-green-50 px-2 py-1 rounded border border-green-200 text-xs font-bold">
                        <ShieldCheck className="w-3.5 h-3.5" /> Secured
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs font-medium">Pending</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link 
                      to={`/records/${record.id}`}
                      className="inline-flex items-center justify-center p-2 text-primary hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                    >
                      <FileText className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              No records found matching your search.
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
