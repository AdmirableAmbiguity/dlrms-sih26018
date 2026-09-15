import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageTransition } from '../components/ui/PageTransition';
import { DocumentViewer } from '../components/review/DocumentViewer';
import { FieldEditor } from '../components/review/FieldEditor';
import { Check, X, AlertTriangle, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReviewDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showDiff, setShowDiff] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Mock data for ID '1'
  const [fields, setFields] = useState([
    { key: 'ownerName', label: 'Owner Name', value: 'Ram Kumar', original: 'Ram Kumar', confidence: 95 },
    { key: 'surveyNumber', label: 'Survey Number', value: '45/A', original: '45/4', confidence: 62 },
    { key: 'area', label: 'Area (Hectares)', value: '1.25', original: '1.25', confidence: 98 },
    { key: 'village', label: 'Village', value: 'Rampur', original: 'Rampur', confidence: 90 },
    { key: 'tehsil', label: 'Tehsil', value: 'Meerut', original: 'Meerut', confidence: 85 },
  ]);

  const handleFieldChange = (key: string, newValue: string) => {
    setFields(fields.map(f => f.key === key ? { ...f, value: newValue } : f));
  };

  const handleApprove = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success('Document approved and saved to records.');
      navigate('/review-queue');
    }, 1000);
  };

  return (
    <PageTransition className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Review Document</h1>
            <p className="text-sm text-gray-500">ID: {id} | Khasra_Meerut_23A.pdf</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
            <input type="checkbox" checked={showDiff} onChange={(e) => setShowDiff(e.target.checked)} className="rounded text-primary focus:ring-primary" />
            Show Only Changed / Low Confidence
          </label>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
        {/* Left Panel: Document Viewer */}
        <div className="h-full border rounded-xl overflow-hidden shadow-sm">
          {/* Placeholder image for demo */}
          <DocumentViewer url="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/A_sample_of_a_khasra.jpg/800px-A_sample_of_a_khasra.jpg" type="image" />
        </div>

        {/* Right Panel: Data Extraction Form */}
        <div className="h-full flex flex-col bg-white border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              Extracted Data Fields
            </h3>
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-bold border border-yellow-200 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Average Confidence: 86%
            </span>
          </div>
          
          <div className="flex-1 overflow-auto p-4 bg-gray-50/50">
            {fields.map(field => (
              <FieldEditor
                key={field.key}
                label={field.label}
                value={field.value}
                originalValue={field.original}
                confidence={field.confidence}
                onChange={(val) => handleFieldChange(field.key, val)}
                showDiff={showDiff}
              />
            ))}
          </div>

          <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
            <button className="px-4 py-2 border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 rounded-lg font-medium transition-colors flex items-center gap-2">
              <X className="w-4 h-4" /> Reject
            </button>
            <button 
              onClick={handleApprove}
              disabled={saving}
              className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-70"
            >
              <Check className="w-4 h-4" />
              {saving ? 'Saving...' : 'Approve & Submit'}
            </button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
