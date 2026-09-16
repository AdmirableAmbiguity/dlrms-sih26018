import { useState, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, AlertTriangle, Layers, Search, Copy, Check, Play, Pause } from 'lucide-react';
import { CadastralMap } from '../components/map/CadastralMap';
import {
  CityMap3D, CITY_BUILDINGS, DISTRICTS, STATUS_GLOW, NEON,
  type CityBuilding,
} from '../components/map/CityMap3D';
import { validateULPIN, parseULPIN, resolveCoordinates } from '../lib/ulpin';

// ── Stats ─────────────────────────────────────────────────────────────────────
const total      = CITY_BUILDINGS.length;
const validated  = CITY_BUILDINGS.filter(b => b.status === 'validated').length;
const locked     = CITY_BUILDINGS.filter(b => b.blockchainLocked).length;
const fraud      = CITY_BUILDINGS.filter(b => b.isFraud).length;
const totalUnits = CITY_BUILDINGS.reduce((s, b) => s + b.floors, 0);

const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono','Courier New',monospace" };

// ── Scanline overlay ───────────────────────────────────────────────────────────
const SCANLINES: React.CSSProperties = {
  position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10,
  backgroundImage:
    'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,255,240,0.012) 2px,rgba(0,255,240,0.012) 4px)',
};

// ── Corner bracket decoration ─────────────────────────────────────────────────
function CornerBracket({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) {
  const size = 18;
  const style: React.CSSProperties = {
    position: 'absolute', width: size, height: size, zIndex: 20,
    top: pos.startsWith('t') ? 0 : undefined,
    bottom: pos.startsWith('b') ? 0 : undefined,
    left: pos.endsWith('l') ? 0 : undefined,
    right: pos.endsWith('r') ? 0 : undefined,
    borderTop: pos.startsWith('t') ? `2px solid ${NEON.cyan}` : undefined,
    borderBottom: pos.startsWith('b') ? `2px solid ${NEON.cyan}` : undefined,
    borderLeft: pos.endsWith('l') ? `2px solid ${NEON.cyan}` : undefined,
    borderRight: pos.endsWith('r') ? `2px solid ${NEON.cyan}` : undefined,
  };
  return <div style={style} />;
}

// ── Property detail panel ─────────────────────────────────────────────────────
function PropertyPanel({ b, onClose }: { b: CityBuilding; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const coords = resolveCoordinates(b.x, b.z, 0);
  const copy = () => { navigator.clipboard.writeText(b.ulpin); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <motion.div
      initial={{ x: 360, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 360, opacity: 0 }}
      transition={{ type: 'spring', damping: 24, stiffness: 200 }}
      style={{
        position: 'absolute', right: 12, top: 12, bottom: 12, width: 300,
        background: 'rgba(0,0,10,0.96)', border: `1px solid ${b.color}55`,
        borderRadius: 12, color: '#fff', zIndex: 50, display: 'flex', flexDirection: 'column',
        boxShadow: `0 0 40px ${b.color}22`, backdropFilter: 'blur(12px)', ...MONO,
      }}
    >
      {/* Header */}
      <div style={{ padding: '12px 14px', borderBottom: `1px solid ${NEON.cyan}15` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ color: b.color, fontSize: 9, letterSpacing: 2, marginBottom: 3 }}>◈ PROPERTY RECORD</div>
            <div style={{ color: '#fff', fontSize: 12, fontWeight: 700, lineHeight: 1.3 }}>{b.districtName}</div>
            <div style={{ color: '#555', fontSize: 10, marginTop: 2 }}>{b.village}, Ghaziabad, UP</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer' }}>
            <X size={14} />
          </button>
        </div>
      </div>

      {/* ULPIN badge */}
      <div style={{ margin: '10px 14px', background: `${NEON.green}10`, border: `1px solid ${NEON.green}33`, borderRadius: 8, padding: '8px 12px' }}>
        <div style={{ color: NEON.green, fontSize: 8, letterSpacing: 3, marginBottom: 4 }}>ULPIN</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: NEON.green, fontSize: 11, wordBreak: 'break-all', lineHeight: 1.5, flex: 1 }}>{b.ulpin}</span>
          <button onClick={copy} style={{ background: 'none', border: 'none', color: copied ? NEON.green : '#444', cursor: 'pointer', flexShrink: 0 }}>
            {copied ? <Check size={12} /> : <Copy size={12} />}
          </button>
        </div>
      </div>

      {/* Fields */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 14px' }}>
        {([
          ['Owner',       b.owner,                             '#fff'],
          ['Land Type',   b.landType,                          b.color],
          ['Floors',      `${b.floors} floors`,                '#fff'],
          ['Height',      `~${(b.height * 3.2).toFixed(0)} m`, '#fff'],
          ['Status',      b.status.replace('_', ' '),          STATUS_GLOW[b.status]],
          ['Parcel No.',  `#${b.parcelNo}`,                    '#fff'],
        ] as [string, string, string][]).map(([k, v, c]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${NEON.cyan}08`, fontSize: 11 }}>
            <span style={{ color: '#444' }}>{k}</span>
            <span style={{ color: c }}>{v}</span>
          </div>
        ))}

        {/* 3D Coordinates */}
        <div style={{ marginTop: 12, background: `${NEON.purple}0f`, border: `1px solid ${NEON.purple}30`, borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ color: NEON.purple, fontSize: 8, letterSpacing: 3, marginBottom: 8 }}>3D COORDINATES</div>
          {[
            ['Latitude',   `${coords.lat.toFixed(6)}° N`],
            ['Longitude',  `${coords.lng.toFixed(6)}° E`],
            ['Elevation',  `${coords.elevationMSL.toFixed(1)} m MSL`],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 3 }}>
              <span style={{ color: '#444' }}>{k}</span>
              <span style={{ color: '#ddd' }}>{v}</span>
            </div>
          ))}
          <div style={{ marginTop: 8, color: NEON.cyan, fontSize: 10 }}>
            vec3({coords.vectorSpace.x.toFixed(4)}, {coords.vectorSpace.y.toFixed(1)}, {coords.vectorSpace.z.toFixed(4)})
          </div>
        </div>

        {/* Flags */}
        {b.blockchainLocked && (
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, color: NEON.green, fontSize: 10, background: `${NEON.green}10`, borderRadius: 6, padding: '6px 10px' }}>
            <Shield size={11} /> Blockchain immutable record
          </div>
        )}
        {b.isFraud && (
          <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, color: NEON.red, fontSize: 10, background: `${NEON.red}10`, borderRadius: 6, padding: '6px 10px' }}>
            <AlertTriangle size={11} /> ⚠ FRAUD FLAG — RCCMS dispute detected
          </div>
        )}
      </div>

      <div style={{ padding: '8px 14px', borderTop: `1px solid ${NEON.cyan}10`, fontSize: 9, color: '#2a2a2a' }}>
        Simulated · DLRMS Demo · UP Revenue Department
      </div>
    </motion.div>
  );
}

// ── ULPIN search ───────────────────────────────────────────────────────────────
function ULPINSearch({ onResult }: { onResult: (msg: string, ok: boolean) => void }) {
  const [val, setVal] = useState('');
  const run = () => {
    const u = val.trim().toUpperCase();
    if (!u) return;
    if (validateULPIN(u)) {
      const p = parseULPIN(u);
      onResult(`✓ VALID  ·  ${p.village}  ·  Parcel ${p.parcel}${p.floor ? `  ·  F${p.floor} U${p.unit}` : ''}`, true);
    } else {
      onResult('✗ INVALID — format: UP091201MRDN0100 or UP091201MRDN0100F02U003', false);
    }
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Search size={13} color={NEON.cyan} />
      <input
        value={val}
        onChange={e => setVal(e.target.value.toUpperCase())}
        onKeyDown={e => e.key === 'Enter' && run()}
        placeholder="Search ULPIN…  UP091201MRDN0100"
        style={{ ...MONO, background: 'transparent', border: 'none', outline: 'none', color: NEON.cyan, fontSize: 11, flex: 1, caretColor: NEON.cyan }}
      />
      <button onClick={run} style={{ ...MONO, background: `${NEON.cyan}18`, border: `1px solid ${NEON.cyan}55`, color: NEON.cyan, fontSize: 10, borderRadius: 4, padding: '3px 10px', cursor: 'pointer' }}>
        LOOKUP
      </button>
    </div>
  );
}

// ── Loading screen ─────────────────────────────────────────────────────────────
function CityLoading() {
  return (
    <div style={{ width: '100%', height: '100%', background: '#000008', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', ...MONO }}>
      <motion.div
        animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        style={{ width: 44, height: 44, border: `2px solid ${NEON.cyan}`, borderTopColor: 'transparent', borderRadius: '50%', marginBottom: 16 }}
      />
      <div style={{ color: NEON.cyan, fontSize: 14, letterSpacing: 2 }}>GENERATING CITY…</div>
      <div style={{ fontSize: 10, marginTop: 6, color: '#444' }}>Ghaziabad · UP · DLRMS Registry</div>
    </div>
  );
}

// ── MapPage ────────────────────────────────────────────────────────────────────
export default function MapPage() {
  const [mode, setMode] = useState<'3d' | 'gis'>('3d');
  const [selected, setSelected] = useState<CityBuilding | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [searchResult, setSearchResult] = useState<{ text: string; ok: boolean } | null>(null);

  const GIS_PARCELS = CITY_BUILDINGS.slice(0, 80).map(b => ({
    coordinates: [
      [28.7512 + b.z * 0.0001, 77.4924 + b.x * 0.0001],
      [28.7512 + b.z * 0.0001 + 0.0005, 77.4924 + b.x * 0.0001],
      [28.7512 + b.z * 0.0001 + 0.0005, 77.4924 + b.x * 0.0001 + 0.0005],
      [28.7512 + b.z * 0.0001, 77.4924 + b.x * 0.0001 + 0.0005],
    ] as [number, number][],
    ownerName: b.owner, surveyNumber: String(b.parcelNo),
    khasraNumber: String(b.parcelNo * 10),
    area: (b.width * b.depth) / 10000,
    status: b.status, blockchainLocked: b.blockchainLocked,
  }));

  return (
    <div style={{ height: 'calc(100vh - 5rem)', display: 'flex', flexDirection: 'column', gap: 8, background: '#000008', color: '#fff', ...MONO, padding: '2px 0' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, padding: '4px 2px' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: NEON.cyan, letterSpacing: 2 }}>◈ DLRMS 3D CITY — GHAZIABAD</div>
          <div style={{ fontSize: 9, color: '#333', marginTop: 2, letterSpacing: 1 }}>
            {total} PARCELS · {DISTRICTS.length} DISTRICTS · ULPIN REGISTRY · UTTAR PRADESH
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {/* Auto-rotate toggle */}
          <button
            onClick={() => setAutoRotate(r => !r)}
            style={{ ...MONO, display: 'flex', alignItems: 'center', gap: 5, background: autoRotate ? `${NEON.cyan}18` : 'transparent', border: `1px solid ${NEON.cyan}44`, color: autoRotate ? NEON.cyan : '#333', borderRadius: 6, padding: '5px 10px', fontSize: 10, cursor: 'pointer' }}
          >
            {autoRotate ? <Pause size={11} /> : <Play size={11} />}
            {autoRotate ? 'ORBIT ON' : 'ORBIT OFF'}
          </button>
          {/* Mode toggle */}
          <div style={{ display: 'flex', background: '#080820', border: `1px solid ${NEON.cyan}22`, borderRadius: 8, padding: 3 }}>
            {(['3d', 'gis'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                ...MONO, padding: '5px 14px', borderRadius: 5, fontSize: 10, fontWeight: 700,
                background: mode === m ? NEON.cyan : 'transparent',
                color: mode === m ? '#000' : NEON.cyan,
                border: 'none', cursor: 'pointer', letterSpacing: 1,
              }}>
                {m === '3d' ? '◈ 3D CITY' : '⬛ 2D GIS'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Stats bar ── */}
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        {[
          { label: 'PARCELS',     value: total,      color: NEON.cyan   },
          { label: 'VALIDATED',   value: validated,  color: NEON.green  },
          { label: 'FLOORS REG.', value: totalUnits, color: NEON.purple },
          { label: 'CHAIN LOCK',  value: locked,     color: NEON.blue   },
          { label: 'FRAUD FLAGS', value: fraud,      color: NEON.red    },
        ].map(s => (
          <div key={s.label} style={{ flex: 1, background: `${s.color}0a`, border: `1px solid ${s.color}25`, borderRadius: 8, padding: '7px 10px', textAlign: 'center' }}>
            <div style={{ color: s.color, fontSize: 17, fontWeight: 700 }}>{s.value}</div>
            <div style={{ color: '#2a2a2a', fontSize: 8, letterSpacing: 1.5, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── ULPIN search ── */}
      <div style={{ flexShrink: 0, background: '#05050f', border: `1px solid ${NEON.cyan}20`, borderRadius: 8, padding: '7px 12px' }}>
        <ULPINSearch onResult={(text, ok) => setSearchResult({ text, ok })} />
        {searchResult && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: 4, fontSize: 10, color: searchResult.ok ? NEON.green : NEON.red }}>
            {searchResult.text}
          </motion.div>
        )}
      </div>

      {/* ── Map canvas ── */}
      <div style={{ flex: 1, position: 'relative', borderRadius: 12, overflow: 'hidden', border: `1px solid ${NEON.cyan}18`, minHeight: 0 }}>
        <div style={SCANLINES} />
        {(['tl','tr','bl','br'] as const).map(p => <CornerBracket key={p} pos={p} />)}

        <AnimatePresence mode="wait">
          {mode === '3d' ? (
            <motion.div key="3d" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0 }}>
              <Suspense fallback={<CityLoading />}>
                <CityMap3D
                  onSelect={b => { setSelected(b); if (b) setAutoRotate(false); }}
                  autoRotate={autoRotate}
                />
              </Suspense>

              {/* Controls hint */}
              <div style={{ position: 'absolute', bottom: 14, left: 14, ...MONO, background: 'rgba(0,0,6,0.8)', border: `1px solid ${NEON.cyan}18`, borderRadius: 8, padding: '7px 12px', fontSize: 10, color: '#2c2c3c', zIndex: 15, lineHeight: 1.8 }}>
                <div style={{ color: NEON.cyan, marginBottom: 3 }}>◈ CONTROLS</div>
                <div>DRAG → ORBIT &nbsp;·&nbsp; SCROLL → ZOOM &nbsp;·&nbsp; CLICK → SELECT</div>
              </div>

              {/* Legend */}
              <div style={{ position: 'absolute', top: 14, left: 14, ...MONO, background: 'rgba(0,0,6,0.85)', border: `1px solid ${NEON.cyan}22`, borderRadius: 10, padding: '11px 13px', fontSize: 10, zIndex: 15, minWidth: 165 }}>
                <div style={{ color: NEON.cyan, fontWeight: 700, marginBottom: 8, letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Layers size={11} /> LEGEND
                </div>
                {[
                  { color: NEON.purple, label: 'Commercial' },
                  { color: NEON.blue,   label: 'Residential' },
                  { color: NEON.orange, label: 'Industrial' },
                  { color: NEON.green,  label: 'Agricultural' },
                  { color: NEON.yellow, label: 'Civic / Govt' },
                ].map(l => (
                  <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                    <div style={{ width: 9, height: 9, background: l.color, borderRadius: 2, boxShadow: `0 0 5px ${l.color}` }} />
                    <span style={{ color: '#888' }}>{l.label}</span>
                  </div>
                ))}
                <div style={{ borderTop: `1px solid ${NEON.cyan}15`, marginTop: 7, paddingTop: 7, lineHeight: 1.9, color: '#333' }}>
                  <div><span style={{ color: NEON.cyan }}>│</span> cyan beam = ⛓ locked</div>
                  <div><span style={{ color: NEON.red }}>◉</span> red ring = ⚠ fraud</div>
                </div>
              </div>

              {/* Property panel */}
              <AnimatePresence>
                {selected && <PropertyPanel key={selected.ulpin} b={selected} onClose={() => setSelected(null)} />}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div key="gis" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0 }}>
              <CadastralMap parcels={GIS_PARCELS} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
