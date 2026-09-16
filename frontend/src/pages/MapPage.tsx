import { useState, Suspense, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, AlertTriangle, Layers, Search, ChevronRight, Copy, Check } from 'lucide-react';
import { CadastralMap } from '../components/map/CadastralMap';
import { CityMap3D, BUILDINGS, STATUS_NEON, NEON, type UnitInfo } from '../components/map/CityMap3D';
import { generateULPIN, parseULPIN, validateULPIN, resolveCoordinates } from '../lib/ulpin';

// ── LeetCity-style scanline overlay ──────────────────────────────────────────
const SCANLINE_STYLE: React.CSSProperties = {
  position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10,
  backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,240,0.015) 2px, rgba(0,255,240,0.015) 4px)',
};

// ── Neon font style ───────────────────────────────────────────────────────────
const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', 'Courier New', monospace" };

// ── Stats ─────────────────────────────────────────────────────────────────────
const totalUnits = BUILDINGS.reduce((s, b) => s + b.floors * b.unitsPerFloor, 0);
const totalFloors = BUILDINGS.reduce((s, b) => s + b.floors, 0);
const chainLocked = BUILDINGS.filter(b => b.blockchainLocked).length;
const fraudCount  = BUILDINGS.filter(b => b.isFraud).length;

// ── ULPIN Search bar ──────────────────────────────────────────────────────────
function ULPINSearchBar({ onResult }: { onResult: (msg: string, ok: boolean) => void }) {
  const [val, setVal] = useState('');
  const handle = () => {
    if (!val.trim()) return;
    if (validateULPIN(val.trim().toUpperCase())) {
      const parsed = parseULPIN(val.trim().toUpperCase());
      onResult(`✅ VALID — Village: ${parsed.village} · Parcel: ${parsed.parcel}${parsed.floor ? ` · Floor ${parsed.floor} Unit ${parsed.unit}` : ''}`, true);
    } else {
      onResult('❌ INVALID ULPIN — format: UP091201MRDN0001 or UP091201MRDN0001F02U003', false);
    }
  };
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <Search size={14} color={NEON.cyan} />
      <input
        value={val}
        onChange={e => setVal(e.target.value.toUpperCase())}
        onKeyDown={e => e.key === 'Enter' && handle()}
        placeholder="Search ULPIN…  e.g. UP091201MRDN0001"
        style={{
          ...MONO, background: 'transparent', border: 'none', outline: 'none',
          color: NEON.cyan, fontSize: 11, width: 280, caretColor: NEON.cyan,
        }}
      />
      <button onClick={handle} style={{
        ...MONO, background: NEON.cyan + '22', border: `1px solid ${NEON.cyan}`,
        color: NEON.cyan, fontSize: 10, borderRadius: 4, padding: '2px 8px', cursor: 'pointer',
      }}>LOOKUP</button>
    </div>
  );
}

// ── Selected unit detail panel ────────────────────────────────────────────────
function UnitDetailPanel({ unit, onClose }: { unit: UnitInfo; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(unit.ulpin); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const bld = BUILDINGS.find(b => b.id === unit.buildingId);
  const statusColor = STATUS_NEON[unit.status] || NEON.gray;

  return (
    <motion.div
      initial={{ x: 380, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 380, opacity: 0 }}
      transition={{ type: 'spring', damping: 22, stiffness: 180 }}
      style={{
        position: 'absolute', right: 12, top: 12, bottom: 12, width: 320,
        background: 'rgba(0,0,8,0.95)', border: `1px solid ${NEON.cyan}44`,
        borderRadius: 12, color: '#fff', zIndex: 50, display: 'flex', flexDirection: 'column',
        boxShadow: `0 0 40px ${NEON.cyan}22`, backdropFilter: 'blur(12px)', ...MONO,
      }}
    >
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${NEON.cyan}22`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ color: NEON.cyan, fontSize: 10, letterSpacing: 2, marginBottom: 4 }}>◈ UNIT REGISTRY</div>
          <div style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>{bld?.label}</div>
          <div style={{ color: statusColor, fontSize: 10, marginTop: 2 }}>Floor {unit.floor === 0 ? 'G (Ground)' : unit.floor} · Unit {unit.unit}</div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: 4 }}>
          <X size={14} />
        </button>
      </div>

      {/* ULPIN */}
      <div style={{ margin: '12px 16px', background: NEON.green + '11', border: `1px solid ${NEON.green}44`, borderRadius: 8, padding: '10px 12px' }}>
        <div style={{ color: NEON.green, fontSize: 9, letterSpacing: 2, marginBottom: 4 }}>ULPIN</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ color: NEON.green, fontSize: 11, wordBreak: 'break-all', lineHeight: 1.6 }}>{unit.ulpin}</div>
          <button onClick={copy} style={{ background: 'none', border: 'none', color: copied ? NEON.green : '#555', cursor: 'pointer', marginLeft: 8 }}>
            {copied ? <Check size={13} /> : <Copy size={13} />}
          </button>
        </div>
      </div>

      {/* Fields */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px' }}>
        {[
          { label: 'Owner', value: unit.owner, color: '#fff' },
          { label: 'Status', value: unit.status.replace('_', ' '), color: statusColor },
          { label: 'Area', value: `${unit.area} sq ft`, color: '#fff' },
          { label: 'Floor No.', value: unit.floor === 0 ? 'Ground Floor' : `Floor ${unit.floor}`, color: '#fff' },
          { label: 'Unit No.', value: `U-${String(unit.unit).padStart(3, '0')}`, color: '#fff' },
        ].map(f => (
          <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${NEON.cyan}11`, fontSize: 11 }}>
            <span style={{ color: '#555' }}>{f.label}</span>
            <span style={{ color: f.color }}>{f.value}</span>
          </div>
        ))}

        {/* Z-Coordinates section */}
        <div style={{ marginTop: 12, background: NEON.purple + '11', border: `1px solid ${NEON.purple}33`, borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ color: NEON.purple, fontSize: 9, letterSpacing: 2, marginBottom: 8 }}>⟨ 3D COORDINATES ⟩</div>
          {[
            { k: 'Latitude',  v: `${unit.coords.lat.toFixed(6)}° N` },
            { k: 'Longitude', v: `${unit.coords.lng.toFixed(6)}° E` },
            { k: 'Elevation', v: `${unit.coords.elevationMSL.toFixed(1)} m MSL` },
          ].map(c => (
            <div key={c.k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 3 }}>
              <span style={{ color: '#555' }}>{c.k}</span>
              <span style={{ color: '#fff' }}>{c.v}</span>
            </div>
          ))}
          <div style={{ marginTop: 8, color: NEON.cyan, fontSize: 10 }}>
            vec3({unit.coords.vectorSpace.x}, {unit.coords.vectorSpace.y}, {unit.coords.vectorSpace.z})
          </div>
        </div>

        {/* Blockchain status */}
        {bld?.blockchainLocked && (
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, color: NEON.green, fontSize: 10, background: NEON.green + '11', borderRadius: 6, padding: '6px 10px' }}>
            <Shield size={12} /> Blockchain Immutable Record
          </div>
        )}
        {unit.status === 'conflict' && (
          <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, color: NEON.red, fontSize: 10, background: NEON.red + '11', borderRadius: 6, padding: '6px 10px' }}>
            <AlertTriangle size={12} /> ⚠ FRAUD FLAG ACTIVE — RCCMS litigation detected
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '10px 16px', borderTop: `1px solid ${NEON.cyan}22`, fontSize: 9, color: '#333' }}>
        Simulated — DLRMS KIET Demo · UP Revenue Dept
      </div>
    </motion.div>
  );
}

// ── Loading ───────────────────────────────────────────────────────────────────
function Loading3D() {
  return (
    <div style={{ width: '100%', height: '100%', background: '#000008', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', ...MONO }}>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        style={{ width: 48, height: 48, border: `2px solid ${NEON.cyan}`, borderTopColor: 'transparent', borderRadius: '50%', marginBottom: 16 }} />
      <div style={{ color: NEON.cyan, fontSize: 13 }}>INITIALIZING 3D CITY...</div>
      <div style={{ color: NEON.green, fontSize: 10, marginTop: 6 }}>Loading ULPIN registry · Ghaziabad, UP</div>
    </div>
  );
}

// ── Main MapPage ──────────────────────────────────────────────────────────────
export default function MapPage() {
  const [mode, setMode] = useState<'3d' | 'gis'>('3d');
  const [selected, setSelected] = useState<UnitInfo | null>(null);
  const [searchMsg, setSearchMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const GIS_PARCELS = BUILDINGS.map(b => ({
    coordinates: [
      [28.7512 + b.z * 0.0001, 77.4924 + b.x * 0.0001],
      [28.7512 + b.z * 0.0001 + 0.0006, 77.4924 + b.x * 0.0001],
      [28.7512 + b.z * 0.0001 + 0.0006, 77.4924 + b.x * 0.0001 + 0.0006],
      [28.7512 + b.z * 0.0001, 77.4924 + b.x * 0.0001 + 0.0006],
    ] as [number, number][],
    ownerName: b.label, surveyNumber: String(b.parcelNo), khasraNumber: String(b.parcelNo * 10),
    area: (b.width * b.depth) / 10000, status: b.status, blockchainLocked: b.blockchainLocked,
  }));

  return (
    <div style={{ height: 'calc(100vh - 5rem)', display: 'flex', flexDirection: 'column', gap: 10, background: '#000008', color: '#fff', ...MONO }}>

      {/* ── Top HUD bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, padding: '8px 4px' }}>
        <div>
          <div style={{ color: NEON.cyan, fontSize: 16, fontWeight: 700, letterSpacing: 1 }}>
            ◈ DLRMS 3D CADASTRAL CITY
          </div>
          <div style={{ color: NEON.green, fontSize: 10, marginTop: 2 }}>
            GHAZIABAD, UTTAR PRADESH · ULPIN REGISTRY · Z-COORD MAPPING
          </div>
        </div>

        {/* Mode toggle */}
        <div style={{ display: 'flex', gap: 4, background: '#0a0a1a', border: `1px solid ${NEON.cyan}33`, borderRadius: 8, padding: 4 }}>
          {(['3d', 'gis'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              ...MONO, padding: '6px 14px', borderRadius: 6, fontSize: 11, fontWeight: 600,
              background: mode === m ? NEON.cyan : 'transparent',
              color: mode === m ? '#000' : NEON.cyan,
              border: 'none', cursor: 'pointer', letterSpacing: 1,
            }}>
              {m === '3d' ? '◈ 3D CITY' : '⬛ 2D GIS'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Stats strip ── */}
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        {[
          { label: 'BUILDINGS', value: BUILDINGS.length, color: NEON.cyan },
          { label: 'TOTAL UNITS', value: totalUnits, color: NEON.green },
          { label: 'TOTAL FLOORS', value: totalFloors, color: NEON.purple },
          { label: 'CHAIN LOCKED', value: chainLocked, color: NEON.blue },
          { label: 'FRAUD FLAGS', value: fraudCount, color: NEON.red },
        ].map(s => (
          <div key={s.label} style={{
            flex: 1, background: s.color + '0d', border: `1px solid ${s.color}33`,
            borderRadius: 8, padding: '8px 12px', textAlign: 'center',
          }}>
            <div style={{ color: s.color, fontSize: 18, fontWeight: 700 }}>{s.value}</div>
            <div style={{ color: '#555', fontSize: 9, letterSpacing: 1, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── ULPIN search bar ── */}
      <div style={{
        flexShrink: 0, background: '#0a0a1a', border: `1px solid ${NEON.cyan}33`,
        borderRadius: 8, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <ULPINSearchBar onResult={(text, ok) => setSearchMsg({ text, ok })} />
        {searchMsg && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ fontSize: 10, color: searchMsg.ok ? NEON.green : NEON.red }}>
            {searchMsg.text}
          </motion.div>
        )}
      </div>

      {/* ── Main map canvas ── */}
      <div style={{ flex: 1, position: 'relative', borderRadius: 12, overflow: 'hidden', border: `1px solid ${NEON.cyan}22`, minHeight: 0 }}>
        {/* Scanline overlay */}
        <div style={SCANLINE_STYLE} />

        {/* Corner decorations */}
        {[['0,0', 'borderTop,borderLeft'], ['0,auto', 'borderTop,borderRight'],
          ['auto,0', 'borderBottom,borderLeft'], ['auto,auto', 'borderBottom,borderRight']].map(([pos, borders], i) => {
          const [top, right] = i < 2 ? [0, i === 1 ? 0 : undefined] : [undefined, i === 3 ? 0 : undefined];
          return (
            <div key={i} style={{
              position: 'absolute', width: 20, height: 20, zIndex: 20,
              top: i < 2 ? 0 : undefined, bottom: i >= 2 ? 0 : undefined,
              left: i % 2 === 0 ? 0 : undefined, right: i % 2 === 1 ? 0 : undefined,
              borderTop: i < 2 ? `2px solid ${NEON.cyan}` : undefined,
              borderBottom: i >= 2 ? `2px solid ${NEON.cyan}` : undefined,
              borderLeft: i % 2 === 0 ? `2px solid ${NEON.cyan}` : undefined,
              borderRight: i % 2 === 1 ? `2px solid ${NEON.cyan}` : undefined,
            }} />
          );
        })}

        <AnimatePresence mode="wait">
          {mode === '3d' ? (
            <motion.div key="3d" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0 }}>
              <Suspense fallback={<Loading3D />}>
                <CityMap3D onSelect={setSelected} />
              </Suspense>

              {/* Controls hint */}
              <div style={{
                position: 'absolute', bottom: 16, left: 16, ...MONO,
                background: 'rgba(0,0,0,0.7)', border: `1px solid ${NEON.cyan}22`,
                borderRadius: 8, padding: '8px 12px', fontSize: 10, color: '#555', zIndex: 15,
              }}>
                <div style={{ color: NEON.cyan, marginBottom: 4 }}>◈ CONTROLS</div>
                <div>🖱 DRAG → ORBIT &nbsp;·&nbsp; SCROLL → ZOOM</div>
                <div>👆 CLICK UNIT → ULPIN DETAIL PANEL</div>
              </div>

              {/* Legend */}
              <div style={{
                position: 'absolute', top: 16, left: 16, ...MONO,
                background: 'rgba(0,0,0,0.82)', border: `1px solid ${NEON.cyan}33`,
                borderRadius: 10, padding: '12px 14px', fontSize: 10, zIndex: 15, minWidth: 180,
              }}>
                <div style={{ color: NEON.cyan, fontWeight: 700, marginBottom: 8, letterSpacing: 1 }}>
                  <Layers size={12} style={{ display: 'inline', marginRight: 4 }} />LEGEND
                </div>
                {[
                  { color: NEON.green,  label: 'Validated' },
                  { color: NEON.yellow, label: 'Needs Review' },
                  { color: NEON.red,    label: 'Conflict / Fraud' },
                  { color: NEON.gray,   label: 'Pending' },
                ].map(l => (
                  <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                    <div style={{ width: 10, height: 10, background: l.color, borderRadius: 2, boxShadow: `0 0 6px ${l.color}` }} />
                    <span style={{ color: '#aaa' }}>{l.label}</span>
                  </div>
                ))}
                <div style={{ borderTop: `1px solid ${NEON.cyan}22`, marginTop: 8, paddingTop: 8, color: '#555' }}>
                  <div style={{ color: NEON.cyan }}>— cyan beam = ⛓ locked</div>
                  <div style={{ color: NEON.red }}>● red pulse = ⚠ fraud</div>
                  <div style={{ color: NEON.green }}>─ green roof = validated</div>
                </div>
              </div>

              {/* Selected unit panel */}
              <AnimatePresence>
                {selected && <UnitDetailPanel key={selected.ulpin} unit={selected} onClose={() => setSelected(null)} />}
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
