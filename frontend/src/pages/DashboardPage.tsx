import { PageTransition } from '../components/ui/PageTransition';
import { StatsCard } from '../components/dashboard/StatsCard';
import { AccuracyChart } from '../components/dashboard/AccuracyChart';
import { StatusPieChart } from '../components/dashboard/StatusPieChart';
import { DistrictBarChart } from '../components/dashboard/DistrictBarChart';
import { FileText, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

// Mock Data
const ACCURACY_DATA = [
  { date: 'Sep 1', accuracy: 82 }, { date: 'Sep 5', accuracy: 84 },
  { date: 'Sep 10', accuracy: 88 }, { date: 'Sep 15', accuracy: 94 }
];
const STATUS_DATA = [
  { name: 'Validated', value: 45000 }, { name: 'Needs Review', value: 12000 },
  { name: 'Rejected', value: 3000 }, { name: 'Processing', value: 5000 }
];
const DISTRICT_DATA = [
  { name: 'Ghaziabad', completed: 4200, pending: 800 },
  { name: 'Meerut', completed: 3100, pending: 1200 },
  { name: 'Noida', completed: 5600, pending: 400 },
  { name: 'Agra', completed: 2800, pending: 1900 },
];

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <PageTransition className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name}</h1>
          <p className="text-gray-500">Overview of digitisation progress across districts.</p>
        </div>
        <div className="text-right text-sm text-gray-500">
          Last updated: Today, 10:45 AM
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title="Total Documents Processed" value={65000} icon={FileText} trend={12.5} color="primary" />
        <StatsCard title="Auto-Accepted via AI" value={45000} icon={CheckCircle2} trend={8.2} color="green" />
        <StatsCard title="Pending Human Review" value={12000} icon={AlertTriangle} trend={-4.1} color="secondary" />
        <StatsCard title="Fraud Flags Detected" value={342} icon={ShieldAlert} trend={2.4} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="text-lg font-bold mb-4 text-gray-800">OCR & Extraction Accuracy Trend</h3>
          <AccuracyChart data={ACCURACY_DATA} />
        </div>
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="text-lg font-bold mb-4 text-gray-800">Validation Status Breakdown</h3>
          <StatusPieChart data={STATUS_DATA} />
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <h3 className="text-lg font-bold mb-4 text-gray-800">District-wise Digitisation Progress</h3>
        <DistrictBarChart data={DISTRICT_DATA} />
      </div>
    </PageTransition>
  );
}
