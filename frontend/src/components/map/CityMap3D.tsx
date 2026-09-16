import { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, ThreeEvent, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Text, Html, Stars, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { generateULPIN, resolveCoordinates } from '../../lib/ulpin';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface BuildingDef {
  id: string;
  x: number; z: number;
  width: number; depth: number;
  floors: number;
  unitsPerFloor: number;
  label: string;
  village: string;
  parcelNo: number;
  district: string;
  landType: 'residential' | 'commercial' | 'government' | 'agricultural' | 'industrial';
  status: 'validated' | 'needs_review' | 'conflict' | 'pending';
  blockchainLocked: boolean;
  isFraud?: boolean;
}

export interface UnitInfo {
  ulpin: string;
  buildingId: string;
  floor: number;
  unit: number;
  owner: string;
  status: 'validated' | 'needs_review' | 'conflict' | 'pending';
  area: number;
  coords: ReturnType<typeof resolveCoordinates>;
}

// ── Neon color palette ────────────────────────────────────────────────────────
const NEON = {
  cyan:    '#00fff0',
  green:   '#00ff88',
  red:     '#ff3366',
  yellow:  '#ffcc00',
  purple:  '#bf5fff',
  orange:  '#ff8c00',
  blue:    '#0099ff',
  gray:    '#334155',
  dim:     '#1a2744',
};

const STATUS_NEON: Record<string, string> = {
  validated:   NEON.green,
  needs_review: NEON.yellow,
  conflict:    NEON.red,
  pending:     NEON.gray,
};

const LAND_NEON: Record<string, string> = {
  residential: NEON.blue,
  commercial:  NEON.purple,
  government:  NEON.orange,
  agricultural:'#33cc33',
  industrial:  NEON.gray,
};

// ── Seed owners for units ─────────────────────────────────────────────────────
const OWNERS = [
  'Ramesh C. Gupta','Sunita Devi','Anil Kumar Jain','Priya Sharma','Vikram Singh',
  'Geeta Rani','Mohan Das','Anita Kumari','Rajesh Tiwari','Kavita Verma',
  'Dev Prakash','Farhan Siddiqui','Brijesh Sharma','Chetan Verma','Esha Rani',
  'Narendra Jain','Savita Rani','Pushpa Yadav','Bharat Bhushan','Sanjay Mishra',
];

// ── Satellite ground texture ──────────────────────────────────────────────────
function createSatelliteTexture(): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Base dark terrain
  ctx.fillStyle = '#0a1628';
  ctx.fillRect(0, 0, size, size);

  // Agricultural green patches
  const patches = [
    { x: 200, y: 600, w: 200, h: 150 },
    { x: 650, y: 100, w: 180, h: 200 },
    { x: 50,  y: 200, w: 120, h: 100 },
    { x: 800, y: 700, w: 150, h: 120 },
  ];
  patches.forEach(p => {
    const grd = ctx.createRadialGradient(p.x + p.w/2, p.y + p.h/2, 0, p.x + p.w/2, p.y + p.h/2, p.w/1.5);
    grd.addColorStop(0, 'rgba(30,80,30,0.7)');
    grd.addColorStop(1, 'rgba(10,30,10,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(p.x, p.y, p.w, p.h);
  });

  // Road network
  ctx.strokeStyle = '#1a2744';
  ctx.lineWidth = 8;
  ctx.beginPath(); ctx.moveTo(512, 0); ctx.lineTo(512, size); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, 512); ctx.lineTo(size, 512); ctx.stroke();
  ctx.lineWidth = 4;
  [256, 768].forEach(v => {
    ctx.beginPath(); ctx.moveTo(v, 0); ctx.lineTo(v, size); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, v); ctx.lineTo(size, v); ctx.stroke();
  });

  // Subtle neon grid overlay
  ctx.strokeStyle = 'rgba(0,255,240,0.04)';
  ctx.lineWidth = 1;
  for (let i = 0; i < size; i += 64) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, size); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(size, i); ctx.stroke();
  }

  return new THREE.CanvasTexture(canvas);
}

// ── Animated neon grid ────────────────────────────────────────────────────────
function NeonGrid() {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (ref.current) {
      const mat = ref.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.12 + Math.sin(clock.elapsedTime * 0.5) * 0.04;
    }
  });
  return (
    <group>
      <Grid args={[200, 200]} position={[0, 0.02, 0]}
        cellSize={5} cellThickness={0.4} cellColor={NEON.cyan}
        sectionSize={20} sectionThickness={1} sectionColor={NEON.purple}
        fadeDistance={100} fadeStrength={1.5} />
    </group>
  );
}

// ── Blockchain beam ───────────────────────────────────────────────────────────
function BlockchainBeam({ x, z, height }: { x: number; z: number; height: number }) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (ref.current) {
      const mat = ref.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.15 + Math.abs(Math.sin(clock.elapsedTime * 2)) * 0.35;
      ref.current.scale.y = 1 + Math.sin(clock.elapsedTime * 1.5) * 0.05;
    }
  });
  return (
    <mesh ref={ref} position={[x, height / 2, z]}>
      <cylinderGeometry args={[0.08, 0.08, height, 8]} />
      <meshBasicMaterial color={NEON.cyan} transparent opacity={0.3} />
    </mesh>
  );
}

// ── Fraud beacon ──────────────────────────────────────────────────────────────
function FraudBeacon({ x, y, z }: { x: number; y: number; z: number }) {
  const ref = useRef<THREE.Mesh>(null!);
  const ringRef = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (ref.current) {
      ref.current.scale.setScalar(1 + Math.sin(t * 5) * 0.3);
      (ref.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 1 + Math.sin(t * 5);
    }
    if (ringRef.current) {
      ringRef.current.scale.setScalar(1 + (t % 2) * 0.8);
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.6 - (t % 2) * 0.3);
    }
  });
  return (
    <group position={[x, y, z]}>
      <mesh ref={ref}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color={NEON.red} emissive={NEON.red} emissiveIntensity={2} transparent opacity={0.9} />
      </mesh>
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.4, 0.5, 32]} />
        <meshBasicMaterial color={NEON.red} transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// ── Individual unit mesh ──────────────────────────────────────────────────────
function UnitBlock({
  unitInfo, bx, bz, floor, unitIdx, unitW, depth, floorH,
  onHover, onSelect,
}: {
  unitInfo: UnitInfo;
  bx: number; bz: number; floor: number; unitIdx: number;
  unitW: number; depth: number; floorH: number;
  onHover: (u: UnitInfo | null) => void;
  onSelect: (u: UnitInfo | null) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);
  const color = new THREE.Color(STATUS_NEON[unitInfo.status] || NEON.gray);

  useFrame(() => {
    if (!meshRef.current) return;
    const target = hovered ? 1.15 : 1.0;
    meshRef.current.scale.x += (target - meshRef.current.scale.x) * 0.15;
    meshRef.current.scale.z += (target - meshRef.current.scale.z) * 0.15;
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity += ((hovered ? 0.8 : 0.2) - mat.emissiveIntensity) * 0.1;
  });

  const xOff = (unitIdx - 0.5) * unitW;
  const yOff = floor * floorH + floorH / 2;

  return (
    <mesh
      ref={meshRef}
      position={[bx + xOff, yOff, bz]}
      castShadow
      onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(true); onHover(unitInfo); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHovered(false); onHover(null); document.body.style.cursor = 'default'; }}
      onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onSelect(unitInfo); }}
    >
      <boxGeometry args={[unitW - 0.12, floorH - 0.15, depth - 0.12]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.2}
        roughness={0.3}
        metalness={0.4}
        transparent
        opacity={0.85}
      />
    </mesh>
  );
}

// ── Floor separator line ──────────────────────────────────────────────────────
function FloorLine({ x, z, width, depth, y }: { x: number; z: number; width: number; depth: number; y: number }) {
  return (
    <mesh position={[x, y, z]}>
      <boxGeometry args={[width + 0.1, 0.06, depth + 0.1]} />
      <meshBasicMaterial color={NEON.cyan} transparent opacity={0.4} />
    </mesh>
  );
}

// ── Full multi-floor building ─────────────────────────────────────────────────
function MultiFloorBuilding({
  bld, onHover, onSelect,
}: {
  bld: BuildingDef;
  onHover: (u: UnitInfo | null) => void;
  onSelect: (u: UnitInfo | null) => void;
}) {
  const FLOOR_H = 1.1;
  const unitW = bld.width / bld.unitsPerFloor;
  const totalH = bld.floors * FLOOR_H;

  // Pre-generate unit infos
  const units: UnitInfo[] = useMemo(() => {
    const arr: UnitInfo[] = [];
    for (let f = 0; f < bld.floors; f++) {
      for (let u = 0; u < bld.unitsPerFloor; u++) {
        const ulpin = generateULPIN(bld.village, bld.parcelNo * 10 + u + 1, f, u + 1);
        const coords = resolveCoordinates(bld.x + (u - bld.unitsPerFloor / 2) * unitW, bld.z, f);
        const ownerIdx = (bld.parcelNo * bld.floors * bld.unitsPerFloor + f * bld.unitsPerFloor + u) % OWNERS.length;
        const status = f === 0 && u === 0 && bld.isFraud ? 'conflict'
          : f === bld.floors - 1 ? 'needs_review'
          : bld.status;
        arr.push({
          ulpin, buildingId: bld.id, floor: f, unit: u + 1,
          owner: OWNERS[ownerIdx],
          status,
          area: Math.round(unitW * bld.depth * 10.764), // sq ft
          coords,
        });
      }
    }
    return arr;
  }, [bld]);

  return (
    <group>
      {/* Units */}
      {units.map((ui) => (
        <UnitBlock
          key={ui.ulpin}
          unitInfo={ui}
          bx={bld.x} bz={bld.z}
          floor={ui.floor} unitIdx={ui.unit}
          unitW={unitW} depth={bld.depth}
          floorH={FLOOR_H}
          onHover={onHover}
          onSelect={onSelect}
        />
      ))}

      {/* Floor separator lines */}
      {Array.from({ length: bld.floors + 1 }, (_, f) => (
        <FloorLine key={f} x={bld.x} z={bld.z} width={bld.width} depth={bld.depth} y={f * FLOOR_H} />
      ))}

      {/* Roof glow */}
      <mesh position={[bld.x, totalH + 0.06, bld.z]}>
        <boxGeometry args={[bld.width + 0.2, 0.12, bld.depth + 0.2]} />
        <meshBasicMaterial color={bld.blockchainLocked ? NEON.cyan : NEON.gray} transparent opacity={0.6} />
      </mesh>

      {/* Neon edge frame */}
      <lineSegments position={[bld.x, totalH / 2, bld.z]}>
        <edgesGeometry args={[new THREE.BoxGeometry(bld.width + 0.05, totalH + 0.05, bld.depth + 0.05)]} />
        <lineBasicMaterial color={STATUS_NEON[bld.status] || NEON.gray} transparent opacity={0.5} />
      </lineSegments>

      {/* Blockchain beam */}
      {bld.blockchainLocked && <BlockchainBeam x={bld.x} z={bld.z} height={totalH + 12} />}

      {/* Fraud beacon */}
      {bld.isFraud && <FraudBeacon x={bld.x} y={totalH + 1} z={bld.z} />}

      {/* Building label */}
      <Text
        position={[bld.x, totalH + 1.5, bld.z]}
        fontSize={0.35}
        color={NEON.cyan}
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.02}
        outlineColor="#000"
      >
        {bld.label}
      </Text>

      {/* ULPIN label */}
      <Text
        position={[bld.x, totalH + 1.0, bld.z]}
        fontSize={0.22}
        color={NEON.green}
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.01}
        outlineColor="#000"
      >
        {generateULPIN(bld.village, bld.parcelNo)}
      </Text>

      {/* Ground footprint glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[bld.x, 0.03, bld.z]}>
        <planeGeometry args={[bld.width + 0.5, bld.depth + 0.5]} />
        <meshBasicMaterial color={STATUS_NEON[bld.status] || NEON.gray} transparent opacity={0.12} />
      </mesh>
    </group>
  );
}

// ── Building dataset ──────────────────────────────────────────────────────────
export const BUILDINGS: BuildingDef[] = [
  // KIET campus
  { id: 'kiet-main',   x: 0,    z: 0,    width: 9,  depth: 5, floors: 4, unitsPerFloor: 6, label: 'KIET — Main Block',    village: 'Muradnagar', parcelNo: 1,  district: 'Ghaziabad', landType: 'government',   status: 'validated',   blockchainLocked: true  },
  { id: 'kiet-cs',     x: 14,   z: 0,    width: 7,  depth: 4, floors: 3, unitsPerFloor: 4, label: 'KIET — CS Block',      village: 'Muradnagar', parcelNo: 2,  district: 'Ghaziabad', landType: 'government',   status: 'validated',   blockchainLocked: true  },
  { id: 'kiet-mech',   x: -14,  z: 2,    width: 8,  depth: 5, floors: 3, unitsPerFloor: 5, label: 'KIET — Mech Block',    village: 'Muradnagar', parcelNo: 3,  district: 'Ghaziabad', landType: 'government',   status: 'validated',   blockchainLocked: true  },
  { id: 'kiet-hostel', x: 4,    z: -14,  width: 5,  depth: 8, floors: 8, unitsPerFloor: 3, label: 'KIET — Hostel Tower',  village: 'Muradnagar', parcelNo: 4,  district: 'Ghaziabad', landType: 'government',   status: 'validated',   blockchainLocked: true  },
  { id: 'kiet-admin',  x: -7,   z: -11,  width: 4,  depth: 4, floors: 2, unitsPerFloor: 3, label: 'KIET — Admin Block',   village: 'Muradnagar', parcelNo: 5,  district: 'Ghaziabad', landType: 'government',   status: 'validated',   blockchainLocked: true  },
  { id: 'kiet-lib',    x: 20,   z: -8,   width: 5,  depth: 5, floors: 3, unitsPerFloor: 4, label: 'KIET — Library',       village: 'Muradnagar', parcelNo: 6,  district: 'Ghaziabad', landType: 'government',   status: 'validated',   blockchainLocked: true  },
  // Residential buildings
  { id: 'res-loni-a',  x: -30,  z: 4,    width: 5,  depth: 4, floors: 5, unitsPerFloor: 4, label: 'Loni Heights A',       village: 'Loni',       parcelNo: 7,  district: 'Ghaziabad', landType: 'residential',  status: 'validated',   blockchainLocked: true  },
  { id: 'res-loni-b',  x: -30,  z: 12,   width: 5,  depth: 4, floors: 4, unitsPerFloor: 4, label: 'Loni Heights B',       village: 'Loni',       parcelNo: 8,  district: 'Ghaziabad', landType: 'residential',  status: 'needs_review',blockchainLocked: false },
  { id: 'com-rajnagar',x: -24,  z: 5,    width: 6,  depth: 5, floors: 6, unitsPerFloor: 5, label: 'Raj Nagar Plaza',      village: 'Raj Nagar',  parcelNo: 9,  district: 'Ghaziabad', landType: 'commercial',   status: 'conflict',    blockchainLocked: false, isFraud: true },
  { id: 'res-vij',     x: -24,  z: 14,   width: 4,  depth: 3, floors: 3, unitsPerFloor: 3, label: 'Vijay Nagar Flats',    village: 'Vijay Nagar',parcelNo: 10, district: 'Ghaziabad', landType: 'residential',  status: 'validated',   blockchainLocked: true  },
  { id: 'com-kavi',    x: 30,   z: 5,    width: 7,  depth: 4, floors: 7, unitsPerFloor: 4, label: 'Kavi Nagar Tower',     village: 'Kavi Nagar', parcelNo: 11, district: 'Ghaziabad', landType: 'commercial',   status: 'validated',   blockchainLocked: true  },
  { id: 'res-indira',  x: 30,   z: 14,   width: 5,  depth: 4, floors: 4, unitsPerFloor: 3, label: 'Indirapuram Residency',village: 'Indirapuram',parcelNo: 12, district: 'Ghaziabad', landType: 'residential',  status: 'needs_review',blockchainLocked: false },
  { id: 'com-vaishali',x: 30,   z: -6,   width: 6,  depth: 4, floors: 9, unitsPerFloor: 5, label: 'Vaishali Business Hub', village: 'Vaishali',  parcelNo: 13, district: 'Ghaziabad', landType: 'commercial',   status: 'validated',   blockchainLocked: true  },
  { id: 'res-shalimar',x: -30,  z: -6,   width: 5,  depth: 4, floors: 4, unitsPerFloor: 3, label: 'Shalimar Garden Apts', village: 'Shalimar Garden', parcelNo: 14, district: 'Ghaziabad', landType: 'residential', status: 'pending', blockchainLocked: false },
  { id: 'ind-tronica', x: 0,    z: 24,   width: 12, depth: 6, floors: 3, unitsPerFloor: 6, label: 'Tronica Industrial Zone',village: 'Tronica City', parcelNo: 15, district: 'Ghaziabad', landType: 'industrial', status: 'validated', blockchainLocked: true  },
  { id: 'res-arthala', x: -20,  z: 22,   width: 4,  depth: 3, floors: 5, unitsPerFloor: 3, label: 'Arthala Residency',    village: 'Arthala',    parcelNo: 16, district: 'Ghaziabad', landType: 'residential',  status: 'needs_review',blockchainLocked: false, isFraud: true },
];

// ── Roads ─────────────────────────────────────────────────────────────────────
function Roads() {
  const roadColor = '#0a1628';
  const lineColor = NEON.cyan;
  return (
    <group position={[0, 0.01, 0]}>
      {/* Main roads */}
      {[{ pos: [0, 0, 0] as [number,number,number], size: [120, 0.02, 2.5] as [number,number,number] },
        { pos: [0, 0, 0] as [number,number,number], size: [2.5, 0.02, 120] as [number,number,number] },
        { pos: [-17, 0, 0] as [number,number,number], size: [0.02, 0.02, 120] as [number,number,number] },
        { pos: [17, 0, 0] as [number,number,number],  size: [0.02, 0.02, 120] as [number,number,number] },
      ].map((r, i) => (
        <mesh key={i} position={r.pos}>
          <boxGeometry args={r.size} />
          <meshBasicMaterial color={i < 2 ? roadColor : lineColor} transparent opacity={i < 2 ? 1 : 0.3} />
        </mesh>
      ))}
    </group>
  );
}

// ── Coordinate HUD (HTML overlay inside Canvas) ───────────────────────────────
function CoordHUD({ hovered }: { hovered: UnitInfo | null }) {
  const { camera } = useThree();
  const [camPos, setCamPos] = useState({ x: 0, y: 0, z: 0 });

  useFrame(() => {
    setCamPos({ x: +camera.position.x.toFixed(1), y: +camera.position.y.toFixed(1), z: +camera.position.z.toFixed(1) });
  });

  const coords = hovered?.coords ?? resolveCoordinates(0, 0, 0);

  return (
    <Html fullscreen zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute', bottom: 16, right: 16,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11, color: NEON.cyan, background: 'rgba(0,0,0,0.75)',
        border: `1px solid ${NEON.cyan}33`, borderRadius: 8,
        padding: '10px 14px', lineHeight: 1.8, minWidth: 260,
        backdropFilter: 'blur(8px)',
      }}>
        <div style={{ color: NEON.green, fontWeight: 700, marginBottom: 4 }}>◈ COORDINATE SYSTEM</div>
        <div>LAT &nbsp;&nbsp;{coords.lat.toFixed(6)}° N</div>
        <div>LNG &nbsp;&nbsp;{coords.lng.toFixed(6)}° E</div>
        <div>ELEV &nbsp;{coords.elevationMSL.toFixed(1)} m MSL</div>
        <div style={{ marginTop: 6, color: NEON.purple, fontWeight: 600 }}>⟨ VECTOR SPACE ⟩</div>
        <div>x: {coords.vectorSpace.x}</div>
        <div>y: {coords.vectorSpace.y}</div>
        <div>z: {coords.vectorSpace.z}</div>
        {hovered && (
          <>
            <div style={{ marginTop: 6, borderTop: `1px solid ${NEON.cyan}33`, paddingTop: 6, color: NEON.yellow }}>
              ◉ FLOOR {hovered.floor} · UNIT {hovered.unit}
            </div>
            <div style={{ color: NEON.green, fontSize: 9, wordBreak: 'break-all' }}>{hovered.ulpin}</div>
          </>
        )}
      </div>
    </Html>
  );
}

// ── Hover tooltip ─────────────────────────────────────────────────────────────
function UnitTooltip({ unit, bld }: { unit: UnitInfo; bld: BuildingDef }) {
  const floorH = 1.1;
  return (
    <Html
      position={[bld.x, (unit.floor + 1) * floorH + 1, bld.z]}
      center distanceFactor={18} zIndexRange={[100, 0]}
    >
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        background: 'rgba(0,0,0,0.92)', color: '#fff',
        border: `1px solid ${NEON.cyan}`, borderRadius: 8, padding: '10px 14px',
        fontSize: 10, minWidth: 220, pointerEvents: 'none',
        boxShadow: `0 0 20px ${NEON.cyan}44`,
      }}>
        <div style={{ color: NEON.cyan, fontWeight: 700, marginBottom: 4 }}>{bld.label}</div>
        <div style={{ color: NEON.green, fontSize: 9, marginBottom: 6, wordBreak: 'break-all' }}>{unit.ulpin}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 8px', color: '#aaa' }}>
          <span>Owner</span><span style={{ color: '#fff' }}>{unit.owner}</span>
          <span>Floor</span><span style={{ color: '#fff' }}>{unit.floor === 0 ? 'G' : `F${unit.floor}`}</span>
          <span>Unit</span><span style={{ color: '#fff' }}>U{unit.unit}</span>
          <span>Area</span><span style={{ color: '#fff' }}>{unit.area} sq ft</span>
          <span>Status</span><span style={{ color: STATUS_NEON[unit.status] }}>{unit.status.replace('_', ' ')}</span>
          <span>Lat</span><span style={{ color: '#fff' }}>{unit.coords.lat.toFixed(5)}</span>
          <span>Lng</span><span style={{ color: '#fff' }}>{unit.coords.lng.toFixed(5)}</span>
          <span>Elev</span><span style={{ color: NEON.purple }}>{unit.coords.elevationMSL.toFixed(1)}m</span>
        </div>
      </div>
    </Html>
  );
}

// ── Scene ─────────────────────────────────────────────────────────────────────
function Scene({ onSelect }: { onSelect: (u: UnitInfo | null) => void }) {
  const [hovered, setHovered] = useState<UnitInfo | null>(null);
  const hoveredBld = hovered ? BUILDINGS.find(b => b.id === hovered.buildingId) : null;

  const satTex = useMemo(() => createSatelliteTexture(), []);

  return (
    <>
      <Stars radius={300} depth={80} count={2000} factor={4} fade />

      {/* Lighting */}
      <ambientLight intensity={0.2} />
      <pointLight position={[0, 60, 0]} intensity={2} color={NEON.cyan} distance={200} />
      <pointLight position={[-40, 20, -40]} intensity={1} color={NEON.purple} distance={120} />
      <pointLight position={[40, 20, 40]} intensity={0.8} color={NEON.green} distance={120} />
      <directionalLight position={[50, 80, 50]} intensity={0.6} castShadow />

      {/* Satellite ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial map={satTex} roughness={1} />
      </mesh>

      <NeonGrid />
      <Roads />

      {/* City title */}
      <Text position={[0, 18, -30]} fontSize={2.5} color={NEON.cyan}
        anchorX="center" anchorY="middle"
        outlineWidth={0.06} outlineColor="#000">
        GHAZIABAD DLRMS
      </Text>
      <Text position={[0, 15.5, -30]} fontSize={0.9} color={NEON.green}
        anchorX="center" anchorY="middle">
        ULPIN · 3D CADASTRAL REGISTRY · UTTAR PRADESH
      </Text>

      {/* All multi-floor buildings */}
      {BUILDINGS.map(bld => (
        <MultiFloorBuilding key={bld.id} bld={bld}
          onHover={setHovered} onSelect={onSelect} />
      ))}

      {/* Tooltip */}
      {hovered && hoveredBld && <UnitTooltip unit={hovered} bld={hoveredBld} />}

      {/* Coordinate HUD */}
      <CoordHUD hovered={hovered} />

      <PerspectiveCamera makeDefault position={[50, 40, 60]} fov={50} />
      <OrbitControls enablePan enableZoom enableRotate
        minDistance={5} maxDistance={130}
        maxPolarAngle={Math.PI / 2.05}
        target={[0, 4, 0]} dampingFactor={0.07} enableDamping />
    </>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────
export function CityMap3D({ onSelect }: { onSelect?: (u: UnitInfo | null) => void }) {
  return (
    <Canvas shadows gl={{ antialias: true }} style={{ background: '#000008' }}
      onCreated={({ gl }) => {
        gl.shadowMap.enabled = true;
        gl.shadowMap.type = THREE.PCFSoftShadowMap;
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.2;
      }}
    >
      <Scene onSelect={onSelect || (() => {})} />
    </Canvas>
  );
}

export { STATUS_NEON, NEON };
