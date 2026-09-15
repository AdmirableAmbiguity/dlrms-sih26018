import { useState, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, Box, Layers, AlertTriangle, Shield, X, ChevronRight, Building2, Trees } from 'lucide-react';
import { CadastralMap } from '../components/map/CadastralMap';
import { CityMap3D, ALL_PROPERTIES, STATUS_COLORS, type Property } from '../components/map/CityMap3D';
import { SimulatedBadge } from '../components/ui/SimulatedBadge';

const LEGEND = [
  { color: STATUS_COLORS.validated, label: 'Validated', count: ALL_PROPERTIES.filter(p => p.status === 'validated').length },
  { color: STATUS_COLORS.needs_review, label: 'Needs Review', count: ALL_PROPERTIES.filter(p => p.status === 'needs_review').length },
  { color: STATUS_COLORS.conflict, label: 'Conflict / Disputed', count: ALL_PROPERTIES.filter(p => p.status === 'conflict').length },
  { color: STATUS_COLORS.pending, label: 'Pending', count: ALL_PROPERTIES.filter(p => p.status === 'pending').length },
];

const GIS_PARCELS = ALL_PROPERTIES.map(p => ({
  coordinates: [
    [28.7512 + p.z * 0.0001, 77.4924 + p.x * 0.0001],
    [28.7512 + p.z * 0.0001 + 0.0005, 77.4924 + p.x * 0.0001],
    [28.7512 + p.z * 0.0001 + 0.0005, 77.4924 + p.x * 0.0001 + 0.0005],
    [28.7512 + p.z * 0.0001, 77.4924 + p.x * 0.0001 + 0.0005],
  ] as [number, number][],
  ownerName: p.owner,
  surveyNumber: p.surveyNo,
  khasraNumber: p.khasraNo,
  area: p.area / 10000,
  status: p.status,
  blockchainLocked: p.blockchainLocked,
}));

function PropertyPanel({ prop, onClose }: { prop: Property; onClose: () => void }) {
  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute right-4 top-4 bottom-4 w-80 bg-[#0f172a]/95 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl text-white z-50 overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-start justify-between">
        <div>
          <div className="text-xs text-[#FF9933] font-semibold mb-1 uppercase tracking-wider">Property Detail</div>
          <h3 className="font-bold text-sm leading-tight">{prop.owner}</h3>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors mt-0.5">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Status bar */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3">
        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: STATUS_COLORS[prop.status] }} />
        <span className="text-sm capitalize">{prop.status.replace('_', ' ')}</span>
        {prop.blockchainLocked && (
          <span className="ml-auto flex items-center gap-1 text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
            <Shield className="w-3 h-3" /> Chain Locked
          </span>
        )}
        {prop.isFraud && (
          <span className="ml-auto flex items-center gap-1 text-xs text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full animate-pulse">
            <AlertTriangle className="w-3 h-3" /> Fraud Flag
          </span>
        )}
      </div>

      {/* Fields */}
      <div className="p-4 flex-1 overflow-auto space-y-3">
        {[
          { label: 'Survey Number', value: prop.surveyNo },
          { label: 'Khasra Number', value: prop.khasraNo },
          { label: 'Village', value: prop.village },
          { label: 'Plot Area', value: `${prop.area.toLocaleString()} m²` },
          { label: 'Land Type', value: prop.landType.charAt(0).toUpperCase() + prop.landType.slice(1) },
          { label: 'Building Height', value: `${(prop.height * 3).toFixed(0)} m` },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between items-center py-2 border-b border-white/5">
            <span className="text-xs text-gray-400">{label}</span>
            <span className="text-xs font-medium">{value}</span>
          </div>
        ))}

        {/* Visual height bar */}
        <div className="mt-4">
          <div className="text-xs text-gray-400 mb-2">Building Height Relative</div>
          <div className="w-full bg-white/5 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((prop.height / 12) * 100, 100)}%` }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="h-2 rounded-full"
              style={{ background: STATUS_COLORS[prop.status] }}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <SimulatedBadge label="ISRO Bhuvan" />
        <p className="text-xs text-gray-500 mt-2">KIET, Ghaziabad, UP — Survey Demo Data</p>
      </div>
    </motion.div>
  );
}

function LoadingFallback() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#020617] rounded-xl">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        className="w-12 h-12 border-2 border-[#FF9933] border-t-transparent rounded-full mb-4"
      />
      <p className="text-white/60 text-sm">Loading 3D City...</p>
    </div>
  );
}

export default function MapPage() {
  const [mode, setMode] = useState<'3d' | 'gis'>('3d');
  const [selected, setSelected] = useState<Property | null>(null);

  const stats = {
    total: ALL_PROPERTIES.length,
    validated: ALL_PROPERTIES.filter(p => p.status === 'validated').length,
    fraud: ALL_PROPERTIES.filter(p => p.isFraud).length,
    locked: ALL_PROPERTIES.filter(p => p.blockchainLocked).length,
  };

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col gap-3">
      {/* Header row */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#1e3a5f]" />
            3D Cadastral Map — Ghaziabad, UP
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            KIET Campus · Muradnagar · Loni · Raj Nagar · Vijay Nagar
          </p>
        </div>

        <div className="flex items-center gap-3">
          <SimulatedBadge label="ISRO Bhuvan" />
          {/* Mode toggle */}
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setMode('3d')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${mode === '3d' ? 'bg-[#1e3a5f] text-white shadow' : 'text-gray-500 hover:text-gray-800'}`}
            >
              <Box className="w-3.5 h-3.5" /> 3D City
            </button>
            <button
              onClick={() => setMode('gis')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${mode === 'gis' ? 'bg-[#1e3a5f] text-white shadow' : 'text-gray-500 hover:text-gray-800'}`}
            >
              <Map className="w-3.5 h-3.5" /> 2D GIS
            </button>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="flex gap-3 flex-shrink-0">
        {[
          { label: 'Total Parcels', value: stats.total, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Validated', value: stats.validated, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Chain Locked', value: stats.locked, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Fraud Flags', value: stats.fraud, color: 'text-red-600', bg: 'bg-red-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-lg px-4 py-2 flex items-center gap-3 flex-1`}>
            <div>
              <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Map container */}
      <div className="flex-1 relative rounded-xl overflow-hidden shadow-lg border border-gray-200 min-h-0">
        <AnimatePresence mode="wait">
          {mode === '3d' ? (
            <motion.div
              key="3d"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
            >
              <Suspense fallback={<LoadingFallback />}>
                <CityMap3D onSelect={setSelected} />
              </Suspense>

              {/* Controls hint */}
              <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm text-white text-xs rounded-lg px-3 py-2 space-y-0.5 pointer-events-none">
                <div>🖱 <span className="text-gray-300">Drag</span> to rotate &nbsp;·&nbsp; <span className="text-gray-300">Scroll</span> to zoom</div>
                <div>👆 <span className="text-gray-300">Click</span> building for property info</div>
              </div>

              {/* Legend */}
              <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm text-white rounded-xl p-3 text-xs space-y-1.5 pointer-events-none">
                <div className="flex items-center gap-1.5 text-[#FF9933] font-bold mb-2">
                  <Layers className="w-3.5 h-3.5" /> Legend
                </div>
                {LEGEND.map(l => (
                  <div key={l.label} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: l.color }} />
                    <span className="text-gray-300">{l.label}</span>
                    <span className="ml-auto text-gray-500">{l.count}</span>
                  </div>
                ))}
                <div className="border-t border-white/10 pt-1.5 mt-1.5 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">—</span>
                    <span className="text-gray-300">Green roof = Chain locked</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-red-400 animate-pulse">●</span>
                    <span className="text-gray-300">Red beacon = Fraud flag</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-orange-400">■</span>
                    <span className="text-gray-300">Orange = KIET Campus</span>
                  </div>
                </div>
              </div>

              {/* Selected property panel */}
              <AnimatePresence>
                {selected && (
                  <PropertyPanel
                    key={selected.id}
                    prop={selected}
                    onClose={() => setSelected(null)}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              key="gis"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
            >
              <CadastralMap parcels={GIS_PARCELS} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
