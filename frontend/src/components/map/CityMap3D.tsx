import { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Grid, Text, Html, Sky, Stars } from '@react-three/drei';
import * as THREE from 'three';

// ── DLRMS Property Data ────────────────────────────────────────────────────────
export interface Property {
  id: string;
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
  owner: string;
  surveyNo: string;
  khasraNo: string;
  village: string;
  area: number;
  status: 'validated' | 'needs_review' | 'conflict' | 'pending';
  blockchainLocked: boolean;
  landType: 'residential' | 'commercial' | 'agricultural' | 'government' | 'industrial';
  isFraud?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  validated: '#22c55e',
  needs_review: '#f59e0b',
  conflict: '#ef4444',
  pending: '#94a3b8',
};

const LAND_TYPE_COLORS: Record<string, string> = {
  residential: '#60a5fa',
  commercial: '#a78bfa',
  agricultural: '#4ade80',
  government: '#f97316',
  industrial: '#94a3b8',
};

// ── KIET Campus Hero Buildings ─────────────────────────────────────────────────
const KIET_BUILDINGS: Property[] = [
  { id: 'kiet-main', x: 0, z: 0, width: 8, depth: 5, height: 7, owner: 'KIET Group of Institutions', surveyNo: '70/1', khasraNo: '101', village: 'Muradnagar', area: 40000, status: 'validated', blockchainLocked: true, landType: 'government' },
  { id: 'kiet-cs', x: 12, z: 0, width: 6, depth: 4, height: 5, owner: 'KIET — CS Block', surveyNo: '70/2', khasraNo: '102', village: 'Muradnagar', area: 24000, status: 'validated', blockchainLocked: true, landType: 'government' },
  { id: 'kiet-mech', x: -12, z: 2, width: 7, depth: 5, height: 4.5, owner: 'KIET — Mech Block', surveyNo: '70/3', khasraNo: '103', village: 'Muradnagar', area: 35000, status: 'validated', blockchainLocked: true, landType: 'government' },
  { id: 'kiet-hostel', x: 4, z: -12, width: 5, depth: 8, height: 9, owner: 'KIET — Hostel Block', surveyNo: '70/4', khasraNo: '104', village: 'Muradnagar', area: 40000, status: 'validated', blockchainLocked: true, landType: 'government' },
  { id: 'kiet-admin', x: -6, z: -10, width: 4, depth: 4, height: 3, owner: 'KIET — Admin Block', surveyNo: '70/5', khasraNo: '105', village: 'Muradnagar', area: 16000, status: 'validated', blockchainLocked: true, landType: 'government' },
  { id: 'kiet-lib', x: 18, z: -8, width: 5, depth: 5, height: 4, owner: 'KIET — Library', surveyNo: '70/6', khasraNo: '106', village: 'Muradnagar', area: 25000, status: 'validated', blockchainLocked: true, landType: 'government' },
];

// ── Surrounding Ghaziabad Parcels ──────────────────────────────────────────────
const GHAZIABAD_PARCELS: Property[] = [
  { id: 'p1', x: -28, z: 5, width: 4, depth: 3, height: 2.5, owner: 'Ramesh Chandra Gupta', surveyNo: '45/7', khasraNo: '207', village: 'Loni', area: 1200, status: 'validated', blockchainLocked: true, landType: 'residential' },
  { id: 'p2', x: -28, z: 10, width: 4, depth: 3, height: 3.5, owner: 'Sunita Devi Sharma', surveyNo: '45/8', khasraNo: '208', village: 'Loni', area: 1200, status: 'needs_review', blockchainLocked: false, landType: 'residential' },
  { id: 'p3', x: -22, z: 5, width: 5, depth: 4, height: 5, owner: 'Vijay Kumar Pandey', surveyNo: '88/3', khasraNo: '303', village: 'Raj Nagar', area: 2000, status: 'conflict', blockchainLocked: false, landType: 'commercial', isFraud: true },
  { id: 'p4', x: -22, z: 12, width: 3, depth: 3, height: 1.5, owner: 'Anita Kumari', surveyNo: '61/19', khasraNo: '419', village: 'Vijay Nagar', area: 900, status: 'validated', blockchainLocked: true, landType: 'residential' },
  { id: 'p5', x: 28, z: 5, width: 6, depth: 4, height: 4, owner: 'Narendra Kumar Jain', surveyNo: '33/8', khasraNo: '208', village: 'Kavi Nagar', area: 2400, status: 'validated', blockchainLocked: true, landType: 'commercial' },
  { id: 'p6', x: 28, z: 12, width: 4, depth: 4, height: 2, owner: 'Savita Rani Tiwari', surveyNo: '55/6', khasraNo: '506', village: 'Indirapuram', area: 1600, status: 'needs_review', blockchainLocked: false, landType: 'residential' },
  { id: 'p7', x: 28, z: -5, width: 5, depth: 3, height: 6, owner: 'Rajendra Singh Rawat', surveyNo: '91/2', khasraNo: '202', village: 'Vaishali', area: 1500, status: 'validated', blockchainLocked: true, landType: 'commercial' },
  { id: 'p8', x: -28, z: -5, width: 4, depth: 4, height: 3, owner: 'Mohan Das Srivastava', surveyNo: '22/11', khasraNo: '311', village: 'Shalimar Garden', area: 1600, status: 'pending', blockchainLocked: false, landType: 'residential' },
  { id: 'p9', x: 5, z: -22, width: 8, depth: 5, height: 1, owner: 'Geeta Rani Mishra', surveyNo: '14/16', khasraNo: '616', village: 'Dasna', area: 4000, status: 'validated', blockchainLocked: false, landType: 'agricultural' },
  { id: 'p10', x: -10, z: -22, width: 6, depth: 4, height: 1, owner: 'Pushpa Rani Yadav', surveyNo: '38/10', khasraNo: '210', village: 'Masuri', area: 2400, status: 'validated', blockchainLocked: false, landType: 'agricultural' },
  { id: 'p11', x: 0, z: 20, width: 10, depth: 5, height: 6, owner: 'GDA Industrial Zone', surveyNo: '77/4', khasraNo: '404', village: 'Tronica City', area: 5000, status: 'validated', blockchainLocked: true, landType: 'industrial' },
  { id: 'p12', x: -18, z: 20, width: 4, depth: 3, height: 3, owner: 'Bharat Bhushan Sharma', surveyNo: '51/13', khasraNo: '313', village: 'Arthala', area: 1200, status: 'needs_review', blockchainLocked: false, landType: 'residential', isFraud: true },
];

const ALL_PROPERTIES = [...KIET_BUILDINGS, ...GHAZIABAD_PARCELS];

// ── Building Component ─────────────────────────────────────────────────────────
function Building({ prop, onHover, onClick }: { prop: Property; onHover: (p: Property | null) => void; onClick: (p: Property) => void }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);

  const isKiet = prop.id.startsWith('kiet-');
  const baseColor = isKiet
    ? '#f97316'
    : STATUS_COLORS[prop.status] || '#94a3b8';

  const color = hovered ? new THREE.Color(baseColor).multiplyScalar(1.4) : new THREE.Color(baseColor);

  useFrame(() => {
    if (meshRef.current) {
      const targetY = hovered ? prop.height / 2 + 0.15 : prop.height / 2;
      meshRef.current.position.y += (targetY - meshRef.current.position.y) * 0.1;
    }
  });

  return (
    <group position={[prop.x, 0, prop.z]}>
      {/* Ground footprint */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[prop.width + 0.1, prop.depth + 0.1]} />
        <meshStandardMaterial color={baseColor} transparent opacity={0.25} />
      </mesh>

      {/* Building body */}
      <mesh
        ref={meshRef}
        position={[0, prop.height / 2, 0]}
        castShadow
        receiveShadow
        onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(true); onHover(prop); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHovered(false); onHover(null); document.body.style.cursor = 'default'; }}
        onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onClick(prop); }}
      >
        <boxGeometry args={[prop.width, prop.height, prop.depth]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.1} transparent opacity={hovered ? 1 : 0.88} />
      </mesh>

      {/* Rooftop stripe */}
      <mesh position={[0, prop.height + 0.05, 0]}>
        <boxGeometry args={[prop.width, 0.12, prop.depth]} />
        <meshStandardMaterial color={prop.blockchainLocked ? '#22c55e' : '#e2e8f0'} roughness={0.2} />
      </mesh>

      {/* Fraud indicator — red beacon */}
      {prop.isFraud && (
        <FraudBeacon y={prop.height + 0.8} />
      )}

      {/* Blockchain lock glow ring */}
      {prop.blockchainLocked && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[Math.max(prop.width, prop.depth) * 0.6, Math.max(prop.width, prop.depth) * 0.65, 32]} />
          <meshStandardMaterial color="#22c55e" transparent opacity={0.5} />
        </mesh>
      )}
    </group>
  );
}

// ── Fraud Beacon ───────────────────────────────────────────────────────────────
function FraudBeacon({ y }: { y: number }) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 4) * 0.3);
      (ref.current.material as THREE.MeshStandardMaterial).opacity = 0.6 + Math.sin(clock.elapsedTime * 4) * 0.4;
    }
  });
  return (
    <mesh ref={ref} position={[0, y, 0]}>
      <sphereGeometry args={[0.25, 16, 16]} />
      <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1} transparent opacity={0.8} />
    </mesh>
  );
}

// ── Road Grid ──────────────────────────────────────────────────────────────────
function Roads() {
  return (
    <group>
      {/* Main E-W road */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <planeGeometry args={[80, 2]} />
        <meshStandardMaterial color="#1e293b" roughness={1} />
      </mesh>
      {/* Main N-S road */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <planeGeometry args={[2, 80]} />
        <meshStandardMaterial color="#1e293b" roughness={1} />
      </mesh>
      {/* Secondary roads */}
      {[-15, 15].map(offset => (
        <group key={offset}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[offset, 0.004, 0]}>
            <planeGeometry args={[1.2, 80]} />
            <meshStandardMaterial color="#334155" roughness={1} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, offset]}>
            <planeGeometry args={[80, 1.2]} />
            <meshStandardMaterial color="#334155" roughness={1} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ── Campus Label ───────────────────────────────────────────────────────────────
function CampusLabel() {
  return (
    <Text
      position={[0, 12, -8]}
      fontSize={1.2}
      color="#FF9933"
      anchorX="center"
      anchorY="middle"
      font={undefined}
    >
      KIET GROUP OF INSTITUTIONS
    </Text>
  );
}

// ── HUD Tooltip (HTML overlay) ─────────────────────────────────────────────────
function BuildingTooltip({ prop }: { prop: Property }) {
  return (
    <Html
      position={[0, prop.height + 1.5, 0]}
      center
      distanceFactor={20}
      zIndexRange={[100, 0]}
    >
      <div className="bg-[#0f172a]/95 text-white text-xs rounded-lg p-3 border border-white/10 shadow-2xl pointer-events-none w-52 backdrop-blur-sm">
        <div className="font-bold text-[#FF9933] mb-1 truncate">{prop.owner}</div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-gray-300">
          <span className="text-gray-500">Survey</span><span>{prop.surveyNo}</span>
          <span className="text-gray-500">Khasra</span><span>{prop.khasraNo}</span>
          <span className="text-gray-500">Village</span><span className="truncate">{prop.village}</span>
          <span className="text-gray-500">Area</span><span>{prop.area.toLocaleString()} m²</span>
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          <span className={`inline-block w-2 h-2 rounded-full`} style={{ background: STATUS_COLORS[prop.status] }} />
          <span className="capitalize">{prop.status.replace('_', ' ')}</span>
          {prop.blockchainLocked && <span className="ml-auto text-green-400 text-[10px]">⛓ Locked</span>}
        </div>
        {prop.isFraud && <div className="mt-1.5 text-red-400 text-[10px] font-semibold animate-pulse">⚠ FRAUD FLAG ACTIVE</div>}
      </div>
    </Html>
  );
}

// ── Scene ──────────────────────────────────────────────────────────────────────
function Scene({ onSelect }: { onSelect: (p: Property | null) => void }) {
  const [hovered, setHovered] = useState<Property | null>(null);

  return (
    <>
      <Sky sunPosition={[100, 20, 100]} turbidity={8} rayleigh={0.5} />
      <Stars radius={200} depth={60} count={800} factor={3} fade />

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[50, 80, 50]} intensity={1.2} castShadow shadow-mapSize={[2048, 2048]} />
      <directionalLight position={[-30, 20, -30]} intensity={0.3} color="#6366f1" />
      <pointLight position={[0, 30, 0]} intensity={0.5} color="#FF9933" distance={60} />

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial color="#0f172a" roughness={1} />
      </mesh>

      {/* Grid overlay */}
      <Grid
        args={[120, 120]}
        position={[0, 0.01, 0]}
        cellSize={5}
        cellThickness={0.3}
        cellColor="#1e293b"
        sectionSize={15}
        sectionThickness={0.8}
        sectionColor="#334155"
        fadeDistance={80}
        fadeStrength={1}
      />

      <Roads />
      <CampusLabel />

      {/* All buildings */}
      {ALL_PROPERTIES.map(prop => (
        <group key={prop.id}>
          <Building prop={prop} onHover={setHovered} onClick={onSelect} />
          {hovered?.id === prop.id && <BuildingTooltip prop={prop} />}
        </group>
      ))}

      {/* Camera */}
      <PerspectiveCamera makeDefault position={[35, 28, 40]} fov={55} />
      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        minDistance={8}
        maxDistance={90}
        maxPolarAngle={Math.PI / 2.05}
        target={[0, 0, 0]}
        dampingFactor={0.08}
        enableDamping
      />
    </>
  );
}

// ── Main Export ────────────────────────────────────────────────────────────────
export function CityMap3D({ onSelect }: { onSelect?: (p: Property | null) => void }) {
  return (
    <Canvas
      shadows
      gl={{ antialias: true, alpha: false }}
      style={{ background: '#020617' }}
      onCreated={({ gl }) => {
        gl.shadowMap.enabled = true;
        gl.shadowMap.type = THREE.PCFSoftShadowMap;
      }}
    >
      <Scene onSelect={onSelect || (() => {})} />
    </Canvas>
  );
}

export { ALL_PROPERTIES, STATUS_COLORS, LAND_TYPE_COLORS };
