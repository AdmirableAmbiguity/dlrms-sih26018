import { useState, Suspense, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Shield, AlertTriangle, Layers, Search, Copy, Check, Play, Pause,
  Building2, CheckCircle2, MapPin, Eye, Compass, Hash, Sparkles
} from 'lucide-react';
import { CadastralMap } from '../components/map/CadastralMap';
import {
  CityMap3D, CITY_BUILDINGS, ALL_UNITS, DISTRICTS, STATUS_COLORS, NEON,
  type ApartmentRoomUnit, type CityBuildingComposite
} from '../components/map/CityMap3D';
import { validateULPIN, parseULPIN } from '../lib/ulpin';
import toast from 'react-hot-toast';

const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', 'Courier New', monospace" };

// ── Scanline Effect Overlay ───────────────────────────────────────────────────
const SCANLINES: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  zIndex: 10,
  backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 240, 0.014) 2px, rgba(0, 255, 240, 0.014) 4px)',
};

// ── Cyberpunk Corner Chrome Brackets ──────────────────────────────────────────
function CyberCorner({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) {
  const size = 18;
  return (
    <div
      style={{
        position: 'absolute',
        width: size,
        height: size,
        zIndex: 20,
        pointerEvents: 'none',
        top: pos.startsWith('t') ? 0 : undefined,
        bottom: pos.startsWith('b') ? 0 : undefined,
        left: pos.endsWith('l') ? 0 : undefined,
        right: pos.endsWith('r') ? 0 : undefined,
        borderTop: pos.startsWith('t') ? `2px solid ${NEON.cyan}` : undefined,
        borderBottom: pos.startsWith('b') ? `2px solid ${NEON.cyan}` : undefined,
        borderLeft: pos.endsWith('l') ? `2px solid ${NEON.cyan}` : undefined,
        borderRight: pos.endsWith('r') ? `2px solid ${NEON.cyan}` : undefined,
      }}
    />
  );
}

// ── Room / Apartment Flat Deed Side Drawer ────────────────────────────────────
function ApartmentUnitDeedPanel({
  unit,
  onClose,
}: {
  unit: ApartmentRoomUnit;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copyULPIN = () => {
    navigator.clipboard.writeText(unit.ulpin);
    setCopied(true);
    toast.success('ULPIN copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ x: 420, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 420, opacity: 0 }}
      transition={{ type: 'spring', damping: 26, stiffness: 220 }}
      style={{
        position: 'absolute',
        right: 12,
        top: 12,
        bottom: 12,
        width: 360,
        background: 'rgba(2, 6, 18, 0.97)',
        border: `1px solid ${unit.isFraud ? NEON.red : (unit.blockchainLocked ? NEON.cyan : '#334155')}`,
        borderRadius: 12,
        color: '#fff',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: `0 0 50px ${unit.isFraud ? 'rgba(255,34,85,0.25)' : 'rgba(0,255,240,0.18)'}`,
        backdropFilter: 'blur(16px)',
        ...MONO,
      }}
    >
      {/* Drawer Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(0, 255, 240, 0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ color: NEON.cyan, fontSize: 9, letterSpacing: 2, marginBottom: 3, fontWeight: 700 }}>
            ◈ APARTMENT UNIT DEED & LAND RECORD
          </div>
          <div style={{ color: '#fff', fontSize: 13, fontWeight: 700, lineHeight: 1.3 }}>
            {unit.buildingName} · {unit.unitCode}
          </div>
          <div style={{ color: '#94a3b8', fontSize: 10, marginTop: 2 }}>
            {unit.floorLabel} · {unit.village}, Ghaziabad
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4 }}
        >
          <X size={16} />
        </button>
      </div>

      {/* ULPIN Badge Box */}
      <div style={{ margin: '12px 16px 8px 16px', background: 'rgba(0, 255, 136, 0.08)', border: `1px solid ${NEON.green}44`, borderRadius: 8, padding: '10px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span style={{ color: NEON.green, fontSize: 8.5, letterSpacing: 2, fontWeight: 700 }}>
            FLAT / UNIT ULPIN
          </span>
          <span style={{ color: '#64748b', fontSize: 8.5 }}>India Land Registry Standard</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: NEON.green, fontSize: 11, fontWeight: 700, wordBreak: 'break-all', lineHeight: 1.4, flex: 1 }}>
            {unit.ulpin}
          </span>
          <button
            onClick={copyULPIN}
            title="Copy ULPIN"
            style={{
              background: 'rgba(0, 255, 136, 0.15)',
              border: `1px solid ${NEON.green}66`,
              borderRadius: 4,
              color: copied ? NEON.green : '#cbd5e1',
              cursor: 'pointer',
              padding: '4px 6px',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 9,
            }}
          >
            {copied ? <Check size={11} /> : <Copy size={11} />}
          </button>
        </div>
      </div>

      {/* Scrollable Unit Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px', fontSize: 10.5 }}>

        {/* Status Indicators */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <div
            style={{
              flex: 1,
              padding: '6px 8px',
              borderRadius: 6,
              background: `${STATUS_COLORS[unit.status]}15`,
              border: `1px solid ${STATUS_COLORS[unit.status]}44`,
              color: STATUS_COLORS[unit.status],
              fontWeight: 700,
              fontSize: 9.5,
              textAlign: 'center',
              textTransform: 'uppercase',
            }}
          >
            ● {unit.status.replace('_', ' ')}
          </div>

          {unit.blockchainLocked && (
            <div
              style={{
                flex: 1,
                padding: '6px 8px',
                borderRadius: 6,
                background: 'rgba(0, 255, 240, 0.12)',
                border: `1px solid ${NEON.cyan}55`,
                color: NEON.cyan,
                fontWeight: 700,
                fontSize: 9.5,
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
              }}
            >
              <Shield size={11} /> Blocklocked
            </div>
          )}
        </div>

        {/* 3D XYZ Vector Space & Spatial Coords */}
        <div style={{ background: 'rgba(191, 95, 255, 0.08)', border: `1px solid ${NEON.purple}33`, borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>
          <div style={{ color: NEON.purple, fontSize: 8.5, letterSpacing: 2, fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Compass size={11} /> 3D SPATIAL &amp; Z-ELEVATION COORDINATES
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '3px 6px', color: '#94a3b8' }}>
            <span>Latitude (Z):</span>
            <span style={{ color: '#f8fafc', fontWeight: 600 }}>{unit.coordinates.latitude.toFixed(6)}° N</span>

            <span>Longitude (X):</span>
            <span style={{ color: '#f8fafc', fontWeight: 600 }}>{unit.coordinates.longitude.toFixed(6)}° E</span>

            <span>Altitude (Y):</span>
            <span style={{ color: NEON.purple, fontWeight: 700 }}>
              {unit.coordinates.elevationMSL} m MSL
            </span>

            <span>Floor AGL:</span>
            <span style={{ color: '#f8fafc' }}>
              +{unit.coordinates.floorHeightAGL} m Above Ground
            </span>
          </div>

          <div style={{ marginTop: 8, paddingTop: 6, borderTop: '1px solid rgba(191, 95, 255, 0.2)', fontSize: 9.5, color: NEON.cyan }}>
            Vector3(X: {unit.coordinates.vectorSpace.x}, Y: {unit.coordinates.vectorSpace.y}, Z: {unit.coordinates.vectorSpace.z})
          </div>
        </div>

        {/* Ownership & Title Deed */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ color: NEON.cyan, fontSize: 8.5, letterSpacing: 1.5, fontWeight: 700, marginBottom: 6 }}>
            ◈ REGISTERED TITLE &amp; PROPRIETOR
          </div>
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: 8, padding: '8px 10px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ color: '#64748b' }}>Owner Name:</span>
              <span style={{ color: '#38bdf8', fontWeight: 700 }}>{unit.ownerName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ color: '#64748b' }}>Guardian:</span>
              <span style={{ color: '#cbd5e1' }}>{unit.fatherOrSpouse}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ color: '#64748b' }}>e-KYC Status:</span>
              <span style={{ color: unit.aadhaarVerified ? NEON.green : NEON.yellow, display: 'flex', alignItems: 'center', gap: 3 }}>
                {unit.aadhaarVerified ? <CheckCircle2 size={10} /> : null}
                {unit.aadhaarVerified ? 'Aadhaar Verified' : 'Pending Bio-Auth'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Holding:</span>
              <span style={{ color: '#cbd5e1' }}>{unit.ownershipShare}</span>
            </div>
          </div>
        </div>

        {/* Apartment / Room Specifications */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ color: NEON.cyan, fontSize: 8.5, letterSpacing: 1.5, fontWeight: 700, marginBottom: 6 }}>
            ◈ APARTMENT CONFIGURATION &amp; AREA
          </div>
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: 8, padding: '8px 10px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ color: '#64748b' }}>Classification:</span>
              <span style={{ color: '#f8fafc', fontWeight: 600 }}>{unit.unitType}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ color: '#64748b' }}>Layout:</span>
              <span style={{ color: '#94a3b8' }}>{unit.roomConfig}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ color: '#64748b' }}>Carpet Area:</span>
              <span style={{ color: NEON.green, fontWeight: 700 }}>
                {unit.carpetAreaSqFt} sq.ft ({unit.carpetAreaSqM} m²)
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ color: '#64748b' }}>Super Built-Up:</span>
              <span style={{ color: '#cbd5e1' }}>{unit.superBuiltUpSqFt} sq.ft</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Circle Rate Value:</span>
              <span style={{ color: NEON.gold, fontWeight: 700 }}>{unit.valuationINR}</span>
            </div>
          </div>
        </div>

        {/* Cadastral Revenue References */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ color: NEON.cyan, fontSize: 8.5, letterSpacing: 1.5, fontWeight: 700, marginBottom: 6 }}>
            ◈ REVENUE RECORD (UP DILRMP SYNC)
          </div>
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: 8, padding: '8px 10px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ color: '#64748b' }}>Khasra No:</span>
              <span style={{ color: '#f8fafc' }}>{unit.khasraNumber}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ color: '#64748b' }}>Khata No:</span>
              <span style={{ color: '#f8fafc' }}>{unit.khataNumber}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ color: '#64748b' }}>Property Tax ID:</span>
              <span style={{ color: '#f8fafc' }}>{unit.propertyTaxId}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Mutation Date:</span>
              <span style={{ color: '#cbd5e1' }}>{unit.mutationDate}</span>
            </div>
          </div>
        </div>

        {/* Fraud / Litigation Alert */}
        {unit.isFraud && (
          <div style={{ background: 'rgba(255, 34, 85, 0.12)', border: `1px solid ${NEON.red}55`, borderRadius: 8, padding: '8px 10px', color: NEON.red, marginBottom: 12 }}>
            <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
              <AlertTriangle size={13} /> RCCMS COURT LITIGATION ACTIVE
            </div>
            <div style={{ fontSize: 9.5, color: '#fca5a5' }}>
              Case Ref: {unit.litigationCaseNo} · Transfer locked pending revenue court decree.
            </div>
          </div>
        )}

        {/* Blockchain Audit Hash */}
        <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, padding: '8px 10px' }}>
          <div style={{ color: '#64748b', fontSize: 8.5, letterSpacing: 1, marginBottom: 3 }}>
            BLOCKCHAIN PROOF OF OWNERSHIP
          </div>
          <div style={{ color: NEON.cyan, fontSize: 8.5, wordBreak: 'break-all', opacity: 0.85 }}>
            {unit.txHash}
          </div>
        </div>
      </div>

      {/* Drawer Footer */}
      <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(0, 255, 240, 0.15)', fontSize: 9, color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
        <span>SIH26018 · DLRMS Cadastral</span>
        <span>Ghaziabad Tehsil, UP</span>
      </div>
    </motion.div>
  );
}

// ── Search & Filter Bar ───────────────────────────────────────────────────────
function CadastralSearchBar({
  onSelectUnit,
}: {
  onSelectUnit: (u: ApartmentRoomUnit | null) => void;
}) {
  const [query, setQuery] = useState('');
  const [matchResult, setMatchResult] = useState<string | null>(null);

  const handleSearch = () => {
    const q = query.trim().toLowerCase();
    if (!q) {
      setMatchResult(null);
      return;
    }

    const found = ALL_UNITS.find(u =>
      u.ulpin.toLowerCase().includes(q) ||
      u.ownerName.toLowerCase().includes(q) ||
      u.unitCode.toLowerCase().includes(q) ||
      u.buildingName.toLowerCase().includes(q)
    );

    if (found) {
      onSelectUnit(found);
      setMatchResult(`Found: ${found.ownerName} (${found.unitCode}, ${found.buildingName})`);
      toast.success(`Selected ${found.unitCode} (${found.ownerName})`);
    } else {
      setMatchResult('No matching unit found. Try searching e.g. "Ramesh", "302", or "UP09"');
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
      <Search size={14} color={NEON.cyan} />
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSearch()}
        placeholder="Search by Flat Unit, Owner, or ULPIN (e.g. '302', 'Sunita', 'UP09')..."
        style={{
          ...MONO,
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: NEON.cyan,
          fontSize: 11,
          flex: 1,
          caretColor: NEON.cyan,
        }}
      />
      <button
        onClick={handleSearch}
        style={{
          ...MONO,
          background: 'rgba(0, 255, 240, 0.12)',
          border: `1px solid ${NEON.cyan}55`,
          color: NEON.cyan,
          fontSize: 10,
          fontWeight: 700,
          borderRadius: 4,
          padding: '4px 10px',
          cursor: 'pointer',
        }}
      >
        SEARCH
      </button>

      {matchResult && (
        <span style={{ fontSize: 9.5, color: matchResult.startsWith('Found') ? NEON.green : NEON.yellow, marginLeft: 8 }}>
          {matchResult}
        </span>
      )}
    </div>
  );
}

// ── Main Page Component ───────────────────────────────────────────────────────
export default function MapPage() {
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'3d' | 'gis'>('3d');
  const [selectedUnit, setSelectedUnit] = useState<ApartmentRoomUnit | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);

  // Auto-focus unit if passed in URL query e.g. /map?ulpin=UP091201NIST-TWA2-F05-U501
  useEffect(() => {
    const qUlpin = searchParams.get('ulpin');
    const qBuilding = searchParams.get('building');
    if (qUlpin) {
      const match = ALL_UNITS.find(
        u =>
          u.ulpin.toLowerCase() === qUlpin.toLowerCase() ||
          u.ulpin.toLowerCase().includes(qUlpin.toLowerCase()) ||
          u.unitCode.toLowerCase().includes(qUlpin.toLowerCase())
      );
      if (match) {
        setSelectedUnit(match);
        setAutoRotate(false);
        toast.success(`Focused on 3D Voxel: ${match.unitCode} (${match.buildingName})`);
      }
    } else if (qBuilding) {
      const match = ALL_UNITS.find(u => u.buildingId === qBuilding || u.buildingName.toLowerCase().includes(qBuilding.toLowerCase()));
      if (match) {
        setSelectedUnit(match);
        setAutoRotate(false);
      }
    }
  }, [searchParams]);

  // Compute live statistics
  const stats = useMemo(() => {
    const totalBuildings = CITY_BUILDINGS.length;
    const totalFlats = ALL_UNITS.length;
    const lockedFlats = ALL_UNITS.filter(u => u.blockchainLocked).length;
    const fraudFlats = ALL_UNITS.filter(u => u.isFraud).length;
    const totalFloors = CITY_BUILDINGS.reduce((sum, b) => sum + b.totalFloors, 0);

    return { totalBuildings, totalFlats, lockedFlats, fraudFlats, totalFloors };
  }, []);

  // 2D GIS Fallback Parcels
  const GIS_PARCELS = useMemo(() => {
    return CITY_BUILDINGS.slice(0, 75).map(b => ({
      coordinates: [
        [28.7512 + b.z * 0.0001, 77.4924 + b.x * 0.0001],
        [28.7512 + b.z * 0.0001 + 0.0005, 77.4924 + b.x * 0.0001],
        [28.7512 + b.z * 0.0001 + 0.0005, 77.4924 + b.x * 0.0001 + 0.0005],
        [28.7512 + b.z * 0.0001, 77.4924 + b.x * 0.0001 + 0.0005],
      ] as [number, number][],
      ownerName: `${b.name} (${b.units.length} Units)`,
      surveyNumber: b.units[0]?.surveyNumber || '101',
      khasraNumber: b.units[0]?.khasraNumber || '542',
      area: (b.width * b.depth) / 10000,
      status: b.status,
      blockchainLocked: b.blockchainLocked,
    }));
  }, []);

  return (
    <div
      style={{
        height: 'calc(100vh - 5rem)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        background: '#000008',
        color: '#fff',
        ...MONO,
        padding: '2px 0',
      }}
    >
      {/* ── Top Bar Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, padding: '4px 2px' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: NEON.cyan, letterSpacing: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={16} color={NEON.cyan} />
            ◈ 3D CADASTRAL REGISTRY — SUBDIVIDED APARTMENT UNITS
          </div>
          <div style={{ fontSize: 9, color: '#64748b', marginTop: 2, letterSpacing: 1 }}>
            {stats.totalBuildings} BUILDINGS · {stats.totalFlats} PARTITIONED UNITS WITH SEPARATE ULPINs &amp; XYZ COORDINATES · UTTAR PRADESH
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {/* Auto-Orbit Camera Button */}
          <button
            onClick={() => setAutoRotate(r => !r)}
            style={{
              ...MONO,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              background: autoRotate ? 'rgba(0, 255, 240, 0.14)' : 'transparent',
              border: `1px solid ${NEON.cyan}44`,
              color: autoRotate ? NEON.cyan : '#64748b',
              borderRadius: 6,
              padding: '5px 11px',
              fontSize: 10,
              cursor: 'pointer',
            }}
          >
            {autoRotate ? <Pause size={11} /> : <Play size={11} />}
            {autoRotate ? 'ORBIT: ON' : 'ORBIT: OFF'}
          </button>

          {/* 3D vs 2D Toggle */}
          <div style={{ display: 'flex', background: '#08081a', border: '1px solid rgba(0, 255, 240, 0.25)', borderRadius: 8, padding: 3 }}>
            {(['3d', 'gis'] as const).map(m => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                style={{
                  ...MONO,
                  padding: '5px 14px',
                  borderRadius: 5,
                  fontSize: 10,
                  fontWeight: 700,
                  background: viewMode === m ? NEON.cyan : 'transparent',
                  color: viewMode === m ? '#000' : NEON.cyan,
                  border: 'none',
                  cursor: 'pointer',
                  letterSpacing: 1,
                }}
              >
                {m === '3d' ? '◈ 3D SUBDIVIDED' : '⬛ 2D CADASTRAL'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Key Metrics HUD Bar ── */}
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        {[
          { label: 'BUILDINGS', value: stats.totalBuildings, color: NEON.cyan },
          { label: 'TOTAL FLATS / UNITS', value: stats.totalFlats, color: NEON.green },
          { label: 'TOTAL STOREYS', value: stats.totalFloors, color: NEON.purple },
          { label: 'CHAIN LOCKED FLATS', value: stats.lockedFlats, color: NEON.blue },
          { label: 'DISPUTED / FRAUD', value: stats.fraudFlats, color: NEON.red },
        ].map(s => (
          <div
            key={s.label}
            style={{
              flex: 1,
              background: `${s.color}0c`,
              border: `1px solid ${s.color}28`,
              borderRadius: 8,
              padding: '6px 10px',
              textAlign: 'center',
            }}
          >
            <div style={{ color: s.color, fontSize: 16, fontWeight: 700 }}>{s.value}</div>
            <div style={{ color: '#64748b', fontSize: 8, letterSpacing: 1.2, marginTop: 1 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Search & Filter HUD ── */}
      <div
        style={{
          flexShrink: 0,
          background: '#040714',
          border: '1px solid rgba(0, 255, 240, 0.2)',
          borderRadius: 8,
          padding: '7px 12px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <CadastralSearchBar onSelectUnit={setSelectedUnit} />
      </div>

      {/* ── 3D Canvas Map Area ── */}
      <div style={{ flex: 1, position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(0, 255, 240, 0.2)', minHeight: 0 }}>
        <div style={SCANLINES} />
        {(['tl', 'tr', 'bl', 'br'] as const).map(p => <CyberCorner key={p} pos={p} />)}

        <AnimatePresence mode="wait">
          {viewMode === '3d' ? (
            <motion.div
              key="3d"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ position: 'absolute', inset: 0 }}
            >
              <Suspense
                fallback={
                  <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#000008' }}>
                    <div style={{ color: NEON.cyan, fontSize: 13, letterSpacing: 2 }}>INITIALIZING 3D CADASTRAL VOXELS...</div>
                  </div>
                }
              >
                <CityMap3D
                  selectedUnit={selectedUnit}
                  onSelectUnit={unit => {
                    setSelectedUnit(unit);
                    if (unit) setAutoRotate(false);
                  }}
                  autoRotate={autoRotate}
                />
              </Suspense>

              {/* Interactive Navigation Instructions */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 14,
                  left: 14,
                  ...MONO,
                  background: 'rgba(2, 6, 18, 0.88)',
                  border: '1px solid rgba(0, 255, 240, 0.2)',
                  borderRadius: 8,
                  padding: '8px 12px',
                  fontSize: 9.5,
                  color: '#94a3b8',
                  zIndex: 15,
                  lineHeight: 1.8,
                  backdropFilter: 'blur(8px)',
                }}
              >
                <div style={{ color: NEON.cyan, fontWeight: 700, marginBottom: 2 }}>◈ CADASTRAL EXPLORER CONTROLS</div>
                <div>CLICK ANY ROOM / FLAT → View Unit Deed, ULPIN &amp; XYZ Coordinates</div>
                <div>DRAG → 360° Orbit &nbsp;·&nbsp; SCROLL → Zoom &nbsp;·&nbsp; RIGHT-CLICK DRAG → Pan</div>
              </div>

              {/* District & Status Legend */}
              <div
                style={{
                  position: 'absolute',
                  top: 14,
                  left: 14,
                  ...MONO,
                  background: 'rgba(2, 6, 18, 0.9)',
                  border: '1px solid rgba(0, 255, 240, 0.22)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  fontSize: 9.5,
                  zIndex: 15,
                  minWidth: 175,
                  backdropFilter: 'blur(8px)',
                }}
              >
                <div style={{ color: NEON.cyan, fontWeight: 700, marginBottom: 6, letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Layers size={11} /> DISTRICT CLUSTERS
                </div>
                {[
                  { color: NEON.purple, label: 'Central CBD (Commercial)' },
                  { color: NEON.blue,   label: 'Vaishali / Indirapuram (Res)' },
                  { color: NEON.orange, label: 'Loni / Tronica (Industrial)' },
                  { color: NEON.pink,   label: 'Crossings Republik (Highrise)' },
                  { color: NEON.teal,   label: 'Vijay Nagar / Arthala' },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                    <div style={{ width: 8, height: 8, background: item.color, borderRadius: 2, boxShadow: `0 0 5px ${item.color}` }} />
                    <span style={{ color: '#cbd5e1' }}>{item.label}</span>
                  </div>
                ))}

                <div style={{ borderTop: '1px solid rgba(0, 255, 240, 0.15)', marginTop: 6, paddingTop: 6, color: '#64748b', lineHeight: 1.8 }}>
                  <div><span style={{ color: NEON.cyan }}>│</span> Cyan Pillar = Blockchain Locked</div>
                  <div><span style={{ color: NEON.red }}>●</span> Red Pulse = RCCMS Dispute/Fraud</div>
                </div>
              </div>

              {/* Selected Apartment Unit Deed Drawer */}
              <AnimatePresence>
                {selectedUnit && (
                  <ApartmentUnitDeedPanel
                    key={selectedUnit.ulpin}
                    unit={selectedUnit}
                    onClose={() => setSelectedUnit(null)}
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
              style={{ position: 'absolute', inset: 0 }}
            >
              <CadastralMap parcels={GIS_PARCELS} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
