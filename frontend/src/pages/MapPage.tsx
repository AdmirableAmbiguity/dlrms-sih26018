import { useState } from 'react';
import { PageTransition } from '../components/ui/PageTransition';
import { CadastralMap } from '../components/map/CadastralMap';
import { CesiumMap } from '../components/map/CesiumMap';
import { SimulatedBadge } from '../components/ui/SimulatedBadge';
import { Map, Layers, Box } from 'lucide-react';

const MOCK_PARCELS = [
  { coordinates: [[28.7523, 77.4988], [28.7525, 77.4988], [28.7525, 77.4990], [28.7523, 77.4990]], ownerName: 'KIET Block A', surveyNumber: '1', khasraNumber: '1', area: 2.4, status: 'validated', blockchainLocked: true },
  { coordinates: [[28.7525, 77.4985], [28.7528, 77.4985], [28.7528, 77.4988], [28.7525, 77.4988]], ownerName: 'KIET Block B', surveyNumber: '2', khasraNumber: '2', area: 1.8, status: 'needs_review', blockchainLocked: false },
];

export default function MapPage() {
  const [mode, setMode] = useState<'gis' | '3d'>('gis');

  return (
    <PageTransition className="h-[calc(100vh-8rem)] flex flex-col space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">GIS & 3D Cadastral Mapping</h1>
          <p className="text-gray-500">Visualizing land parcels on Bhuvan satellite imagery and CesiumJS.</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <SimulatedBadge label="ISRO Bhuvan Tiles" />
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setMode('gis')}
              className={`flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${mode === 'gis' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            >
              <Map className="w-4 h-4" /> 2D Cadastral
            </button>
            <button
              onClick={() => setMode('3d')}
              className={`flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${mode === '3d' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            >
              <Box className="w-4 h-4" /> 3D Buildings
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 rounded-xl overflow-hidden shadow-sm border bg-white relative">
        <div className="absolute top-4 right-4 z-[400] bg-white p-3 rounded-lg shadow-lg border text-xs">
          <h4 className="font-bold mb-2 flex items-center gap-1"><Layers className="w-4 h-4"/> Legend</h4>
          <div className="flex items-center gap-2 mb-1"><div className="w-3 h-3 bg-green-500 opacity-60 rounded-sm border border-green-600"></div> Validated & Secured</div>
          <div className="flex items-center gap-2 mb-1"><div className="w-3 h-3 bg-yellow-500 opacity-60 rounded-sm border border-yellow-600"></div> Needs Review</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500 opacity-60 rounded-sm border border-red-600"></div> Disputed / Rejected</div>
        </div>

        {mode === 'gis' ? (
          <CadastralMap parcels={MOCK_PARCELS} />
        ) : (
          <CesiumMap />
        )}
      </div>
    </PageTransition>
  );
}
