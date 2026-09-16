import { useRef, useState, useMemo, useCallback } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stars, Html, Text } from '@react-three/drei';
import * as THREE from 'three';
import { generateULPIN, resolveCoordinates } from '../../lib/ulpin';

// ── Seeded random (deterministic city layout) ─────────────────────────────────
function seededRng(seed: number) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
}

// ── Neon palette ──────────────────────────────────────────────────────────────
export const NEON = {
  cyan:    '#00fff0',
  green:   '#00ff88',
  red:     '#ff2255',
  yellow:  '#ffcc00',
  purple:  '#bf5fff',
  orange:  '#ff8c00',
  blue:    '#3399ff',
  pink:    '#ff66cc',
  teal:    '#00ccaa',
  grid:    '#0d2137',
};

// ── District definitions ──────────────────────────────────────────────────────
interface District {
  id: string;
  name: string;
  cx: number; cz: number;        // centre in scene units
  radius: number;
  type: 'commercial' | 'residential' | 'industrial' | 'agricultural' | 'civic';
  color: string;
  heightRange: [number, number];
  density: number;               // buildings per grid cell
  village: string;
}

const DISTRICTS: District[] = [
  { id:'cbd',    name:'Central Business District', cx:0,    cz:0,    radius:18, type:'commercial',   color:NEON.purple, heightRange:[8,28],  density:0.9, village:'Raj Nagar'       },
  { id:'vaish',  name:'Vaishali',                 cx:28,   cz:-15,  radius:16, type:'residential',  color:NEON.blue,   heightRange:[5,14],  density:0.8, village:'Vaishali'        },
  { id:'indira', name:'Indirapuram',              cx:-30,  cz:-18,  radius:18, type:'residential',  color:NEON.blue,   heightRange:[6,16],  density:0.85,village:'Indirapuram'     },
  { id:'kavi',   name:'Kavi Nagar',               cx:30,   cz:16,   radius:14, type:'commercial',   color:NEON.purple, heightRange:[7,22],  density:0.7, village:'Kavi Nagar'      },
  { id:'loni',   name:'Loni Industrial',          cx:-35,  cz:22,   radius:15, type:'industrial',   color:NEON.orange, heightRange:[3,8],   density:0.6, village:'Loni'            },
  { id:'tronica',name:'Tronica City',             cx:0,    cz:38,   radius:16, type:'industrial',   color:NEON.orange, heightRange:[4,10],  density:0.65,village:'Tronica City'    },
  { id:'vijay',  name:'Vijay Nagar',              cx:-20,  cz:20,   radius:13, type:'residential',  color:NEON.teal,   heightRange:[4,12],  density:0.75,village:'Vijay Nagar'     },
  { id:'cross',  name:'Crossings Republik',       cx:35,   cz:-35,  radius:14, type:'residential',  color:NEON.cyan,   heightRange:[8,20],  density:0.8, village:'Crossings Republik'},
  { id:'shalim', name:'Shalimar Garden',          cx:-40,  cz:-8,   radius:12, type:'residential',  color:NEON.blue,   heightRange:[4,10],  density:0.7, village:'Shalimar Garden' },
  { id:'arthal', name:'Arthala',                  cx:18,   cz:32,   radius:12, type:'residential',  color:NEON.teal,   heightRange:[3,9],   density:0.65,village:'Arthala'         },
  { id:'agri1',  name:'Masuri Farmland',          cx:-55,  cz:10,   radius:18, type:'agricultural', color:NEON.green,  heightRange:[0.5,2], density:0.3, village:'Masuri'          },
  { id:'agri2',  name:'Dasna Farmland',           cx:52,   cz:22,   radius:14, type:'agricultural', color:NEON.green,  heightRange:[0.5,2], density:0.3, village:'Dasna'           },
  { id:'civic1', name:'Municipal Zone',           cx:12,   cz:-30,  radius:10, type:'civic',        color:NEON.yellow, heightRange:[5,12],  density:0.5, village:'Raj Nagar'       },
];

// ── Building data type ────────────────────────────────────────────────────────
export interface CityBuilding {
  id: string;
  x: number; z: number;
  width: number; depth: number;
  height: number;
  floors: number;
  color: string;
  districtId: string;
  districtName: string;
  village: string;
  parcelNo: number;
  ulpin: string;
  status: 'validated' | 'needs_review' | 'conflict' | 'pending';
  blockchainLocked: boolean;
  isFraud: boolean;
  landType: string;
  owner: string;
}

// ── Owner names pool ──────────────────────────────────────────────────────────
const OWNERS = [
  'Ramesh C. Gupta','Sunita Devi Sharma','Anil Kumar Jain','Priya Verma',
  'Vikram Singh Rawat','Geeta Rani Mishra','Mohan Das Srivastava','Anita Kumari',
  'Rajesh Kumar Tiwari','Kavita Yadav','Dev Prakash Pandey','Farhan Siddiqui',
  'Brijesh Sharma','Chetan Verma','Esha Rani','Narendra Kumar Jain',
  'Savita Rani','Pushpa Yadav','Bharat Bhushan','Sanjay Mishra',
  'Rekha Devi','Ajay Pratap Singh','Meera Kumari','Rakesh Gupta',
  'Neha Agarwal','Suresh Chand','Pooja Sharma','Deepak Verma',
];

const STATUS_POOL: CityBuilding['status'][] = ['validated','validated','validated','needs_review','conflict','pending'];

// ── Procedural city generator ─────────────────────────────────────────────────
export function generateCity(): CityBuilding[] {
  const rng = seededRng(42);
  const buildings: CityBuilding[] = [];
  let parcelCounter = 100;

  const GRID_STEP = 6;
  const CITY_HALF = 65;

  for (let gx = -CITY_HALF; gx < CITY_HALF; gx += GRID_STEP) {
    for (let gz = -CITY_HALF; gz < CITY_HALF; gz += GRID_STEP) {
      // Find nearest district
      let bestDist = Infinity;
      let bestDistrict: District | null = null;
      for (const d of DISTRICTS) {
        const dist = Math.sqrt((gx - d.cx) ** 2 + (gz - d.cz) ** 2);
        if (dist < d.radius && dist < bestDist) {
          bestDist = dist;
          bestDistrict = d;
        }
      }
      if (!bestDistrict) continue;
      if (rng() > bestDistrict.density) continue;

      const d = bestDistrict;
      const jx = (rng() - 0.5) * 2.5;
      const jz = (rng() - 0.5) * 2.5;
      const x = gx + jx;
      const z = gz + jz;

      const minH = d.heightRange[0];
      const maxH = d.heightRange[1];
      const height = minH + rng() * (maxH - minH);
      const width = 1.8 + rng() * (d.type === 'industrial' ? 3.5 : 2.0);
      const depth = 1.8 + rng() * (d.type === 'industrial' ? 3.5 : 2.0);
      const floors = Math.max(1, Math.round(height / 3.2));

      const status = STATUS_POOL[Math.floor(rng() * STATUS_POOL.length)];
      const isFraud = rng() < 0.04; // 4% fraud rate
      const blockchainLocked = status === 'validated' && rng() > 0.3;

      parcelCounter++;
      const ulpin = generateULPIN(d.village, parcelCounter);

      buildings.push({
        id: `b-${gx}-${gz}`,
        x, z, width, depth, height, floors,
        color: d.color,
        districtId: d.id,
        districtName: d.name,
        village: d.village,
        parcelNo: parcelCounter,
        ulpin,
        status,
        blockchainLocked,
        isFraud,
        landType: d.type,
        owner: OWNERS[Math.floor(rng() * OWNERS.length)],
      });
    }
  }
  return buildings;
}

export const CITY_BUILDINGS = generateCity();

// ── Animated road traffic dots ────────────────────────────────────────────────
function TrafficDots() {
  const ref = useRef<THREE.InstancedMesh>(null!);
  const count = 80;
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Traffic positions along main roads
  const traffic = useMemo(() => Array.from({ length: count }, (_, i) => {
    const onX = i % 2 === 0;
    return {
      onX,
      pos: (Math.random() - 0.5) * 120,
      speed: 0.08 + Math.random() * 0.12,
      lane: (Math.floor(Math.random() * 3) - 1) * 3,
      color: Math.random() > 0.5 ? '#ff4444' : '#ffcc00',
    };
  }), []);

  useFrame(() => {
    traffic.forEach((t, i) => {
      t.pos += t.speed;
      if (t.pos > 65) t.pos = -65;
      dummy.position.set(
        t.onX ? t.pos : t.lane,
        0.15,
        t.onX ? t.lane : t.pos,
      );
      dummy.scale.setScalar(0.25);
      dummy.updateMatrix();
      ref.current?.setMatrixAt(i, dummy.matrix);
    });
    if (ref.current) ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial color="#ffcc00" />
    </instancedMesh>
  );
}

// ── Single building mesh (instanced-style but individual for click) ────────────
const STATUS_GLOW: Record<string, string> = {
  validated: '#00ff88', needs_review: '#ffcc00', conflict: '#ff2255', pending: '#334155',
};

function Building({ b, onHover, onClick }: {
  b: CityBuilding;
  onHover: (b: CityBuilding | null) => void;
  onClick: (b: CityBuilding) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);
  const color = useMemo(() => new THREE.Color(b.color), [b.color]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    const pulse = b.isFraud ? Math.abs(Math.sin(clock.elapsedTime * 4)) : 0;
    mat.emissiveIntensity = (hovered ? 0.9 : 0.25) + pulse * 0.6;
    if (hovered) {
      meshRef.current.scale.x = THREE.MathUtils.lerp(meshRef.current.scale.x, 1.06, 0.12);
      meshRef.current.scale.z = THREE.MathUtils.lerp(meshRef.current.scale.z, 1.06, 0.12);
    } else {
      meshRef.current.scale.x = THREE.MathUtils.lerp(meshRef.current.scale.x, 1, 0.1);
      meshRef.current.scale.z = THREE.MathUtils.lerp(meshRef.current.scale.z, 1, 0.1);
    }
  });

  return (
    <group position={[b.x, 0, b.z]}>
      {/* Main building */}
      <mesh
        ref={meshRef}
        position={[0, b.height / 2, 0]}
        castShadow
        onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(true); onHover(b); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHovered(false); onHover(null); document.body.style.cursor = 'default'; }}
        onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onClick(b); }}
      >
        <boxGeometry args={[b.width, b.height, b.depth]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.25}
          roughness={0.2}
          metalness={0.5}
          transparent opacity={0.9}
        />
      </mesh>

      {/* Rooftop glow slab */}
      <mesh position={[0, b.height + 0.06, 0]}>
        <boxGeometry args={[b.width + 0.1, 0.1, b.depth + 0.1]} />
        <meshBasicMaterial color={b.blockchainLocked ? NEON.cyan : b.color} transparent opacity={0.7} />
      </mesh>

      {/* Neon edge outline */}
      <lineSegments position={[0, b.height / 2, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(b.width + 0.05, b.height + 0.05, b.depth + 0.05)]} />
        <lineBasicMaterial color={b.isFraud ? NEON.red : b.color} transparent opacity={hovered ? 1 : 0.35} />
      </lineSegments>

      {/* Floor lines */}
      {b.floors > 1 && Array.from({ length: b.floors - 1 }, (_, f) => (
        <mesh key={f} position={[0, (f + 1) * (b.height / b.floors), 0]}>
          <boxGeometry args={[b.width + 0.05, 0.04, b.depth + 0.05]} />
          <meshBasicMaterial color={b.color} transparent opacity={0.2} />
        </mesh>
      ))}

      {/* Ground halo */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[b.width + 1, b.depth + 1]} />
        <meshBasicMaterial color={b.color} transparent opacity={0.07} />
      </mesh>

      {/* Fraud pulsing ring */}
      {b.isFraud && <FraudRing height={b.height} />}

      {/* Blockchain vertical beam */}
      {b.blockchainLocked && <ChainBeam height={b.height} />}
    </group>
  );
}

function FraudRing({ height }: { height: number }) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime % 1.5;
    ref.current.scale.setScalar(1 + t * 1.2);
    (ref.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.7 - t * 0.5);
  });
  return (
    <mesh ref={ref} position={[0, height + 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.6, 0.8, 32]} />
      <meshBasicMaterial color={NEON.red} transparent opacity={0.7} side={THREE.DoubleSide} />
    </mesh>
  );
}

function ChainBeam({ height }: { height: number }) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    (ref.current.material as THREE.MeshBasicMaterial).opacity =
      0.08 + Math.abs(Math.sin(clock.elapsedTime * 1.5)) * 0.18;
  });
  return (
    <mesh ref={ref} position={[0, height / 2 + 4, 0]}>
      <cylinderGeometry args={[0.05, 0.05, height + 8, 6]} />
      <meshBasicMaterial color={NEON.cyan} transparent opacity={0.15} />
    </mesh>
  );
}

// ── District label ─────────────────────────────────────────────────────────────
function DistrictLabel({ d }: { d: District }) {
  const maxH = d.heightRange[1];
  return (
    <Text
      position={[d.cx, maxH + 4, d.cz]}
      fontSize={1.4}
      color={d.color}
      anchorX="center" anchorY="middle"
      outlineWidth={0.04} outlineColor="#000000"
    >
      {d.name.toUpperCase()}
    </Text>
  );
}

// ── Road network ──────────────────────────────────────────────────────────────
function Roads() {
  const roads = useMemo(() => {
    const r: { pos: [number,number,number]; size: [number,number,number] }[] = [];
    // Main arterials
    for (const off of [-42,-21,0,21,42]) {
      r.push({ pos:[off, 0.01, 0], size:[0.8, 0.02, 150] });
      r.push({ pos:[0, 0.01, off], size:[150, 0.02, 0.8] });
    }
    return r;
  }, []);

  return (
    <>
      {roads.map((r, i) => (
        <mesh key={i} position={r.pos}>
          <boxGeometry args={r.size} />
          <meshBasicMaterial color="#050e1a" />
        </mesh>
      ))}
      {/* Road centre lines */}
      {[-42,-21,0,21,42].map(off => (
        <group key={off}>
          <mesh position={[off, 0.012, 0]}>
            <boxGeometry args={[0.08, 0.01, 150]} />
            <meshBasicMaterial color={NEON.cyan} transparent opacity={0.15} />
          </mesh>
          <mesh position={[0, 0.012, off]}>
            <boxGeometry args={[150, 0.01, 0.08]} />
            <meshBasicMaterial color={NEON.cyan} transparent opacity={0.15} />
          </mesh>
        </group>
      ))}
    </>
  );
}

// ── Satellite ground ──────────────────────────────────────────────────────────
function SatGround() {
  const tex = useMemo(() => {
    const size = 2048;
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    const ctx = c.getContext('2d')!;

    // Base dark
    ctx.fillStyle = '#010a14';
    ctx.fillRect(0, 0, size, size);

    // Agricultural patches (seeded random)
    const rng = seededRng(77);
    for (let i = 0; i < 25; i++) {
      const x = rng() * size, y = rng() * size;
      const w = 40 + rng() * 120, h = 40 + rng() * 100;
      const g = ctx.createRadialGradient(x, y, 0, x, y, Math.max(w, h));
      g.addColorStop(0, `rgba(10,50,10,${0.4 + rng() * 0.3})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - w, y - h, w * 2, h * 2);
    }

    // City block density (bright patches)
    for (let i = 0; i < 12; i++) {
      const x = rng() * size, y = rng() * size, r = 60 + rng() * 100;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(20,30,60,0.6)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }

    // Micro neon grid
    ctx.strokeStyle = 'rgba(0,255,240,0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i < size; i += 32) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, size); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(size, i); ctx.stroke();
    }

    return new THREE.CanvasTexture(c);
  }, []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[160, 160]} />
      <meshStandardMaterial map={tex} roughness={1} />
    </mesh>
  );
}

// ── Animated neon grid ─────────────────────────────────────────────────────────
function NeonGrid() {
  const ref = useRef<THREE.GridHelper>(null!);
  useFrame(({ clock }) => {
    if (ref.current) {
      (ref.current.material as THREE.Material & { opacity: number }).opacity =
        0.08 + Math.sin(clock.elapsedTime * 0.4) * 0.04;
    }
  });
  return (
    <gridHelper
      ref={ref}
      args={[160, 53, NEON.cyan, NEON.grid]}
      position={[0, 0.03, 0]}
    />
  );
}

// ── Auto-orbit camera controller ──────────────────────────────────────────────
function AutoOrbit({ active }: { active: boolean }) {
  const orbitRef = useRef<any>(null);
  useFrame(({ clock }) => {
    if (!active || !orbitRef.current) return;
    const t = clock.elapsedTime * 0.04;
    orbitRef.current.object.position.x = Math.sin(t) * 80;
    orbitRef.current.object.position.z = Math.cos(t) * 80;
    orbitRef.current.object.position.y = 40 + Math.sin(clock.elapsedTime * 0.015) * 15;
    orbitRef.current.update();
  });
  return (
    <OrbitControls
      ref={orbitRef}
      enablePan enableZoom enableRotate
      minDistance={6} maxDistance={140}
      maxPolarAngle={Math.PI / 2.05}
      target={[0, 4, 0]}
      dampingFactor={0.06} enableDamping
    />
  );
}

// ── Hover tooltip ─────────────────────────────────────────────────────────────
function BuildingTooltip({ b }: { b: CityBuilding }) {
  const coords = resolveCoordinates(b.x, b.z, 0);
  return (
    <Html position={[b.x, b.height + 1.5, b.z]} center distanceFactor={22} zIndexRange={[100, 0]}>
      <div style={{
        fontFamily: "'JetBrains Mono','Courier New',monospace",
        background: 'rgba(0,0,8,0.95)', color: '#fff',
        border: `1px solid ${b.color}`, borderRadius: 8,
        padding: '8px 12px', fontSize: 10, minWidth: 190,
        pointerEvents: 'none', boxShadow: `0 0 16px ${b.color}44`,
      }}>
        <div style={{ color: b.color, fontWeight: 700, marginBottom: 4 }}>{b.districtName}</div>
        <div style={{ color: NEON.green, fontSize: 9, marginBottom: 6, wordBreak: 'break-all' }}>{b.ulpin}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 8px', color: '#888' }}>
          <span>Owner</span><span style={{ color: '#eee' }}>{b.owner}</span>
          <span>Floors</span><span style={{ color: '#eee' }}>{b.floors}</span>
          <span>Height</span><span style={{ color: '#eee' }}>{(b.height * 3).toFixed(0)}m</span>
          <span>Type</span><span style={{ color: b.color }}>{b.landType}</span>
          <span>Status</span><span style={{ color: STATUS_GLOW[b.status] }}>{b.status.replace('_',' ')}</span>
          <span>Elev</span><span style={{ color: NEON.purple }}>{coords.elevationMSL.toFixed(0)}m MSL</span>
        </div>
        {b.isFraud && <div style={{ marginTop: 6, color: NEON.red, fontSize: 9, fontWeight: 700 }}>⚠ FRAUD FLAG ACTIVE</div>}
      </div>
    </Html>
  );
}

// ── Main scene ────────────────────────────────────────────────────────────────
function CityScene({ onSelect, autoRotate }: {
  onSelect: (b: CityBuilding | null) => void;
  autoRotate: boolean;
}) {
  const [hovered, setHovered] = useState<CityBuilding | null>(null);

  const handleHover = useCallback((b: CityBuilding | null) => setHovered(b), []);
  const handleClick = useCallback((b: CityBuilding) => onSelect(b), [onSelect]);

  return (
    <>
      <color attach="background" args={['#000008']} />
      <fog attach="fog" args={['#000212', 80, 160]} />
      <Stars radius={250} depth={100} count={3000} factor={5} fade />

      {/* Lighting */}
      <ambientLight intensity={0.15} />
      <pointLight position={[0, 80, 0]} intensity={3} color={NEON.cyan} distance={220} decay={1.5} />
      <pointLight position={[-50, 30, -50]} intensity={1.5} color={NEON.purple} distance={130} />
      <pointLight position={[50, 30, 50]} intensity={1.5} color={NEON.blue} distance={130} />
      <pointLight position={[50, 20, -50]} intensity={1} color={NEON.orange} distance={100} />
      <directionalLight position={[40, 80, 40]} intensity={0.4} castShadow />

      <SatGround />
      <NeonGrid />
      <Roads />
      <TrafficDots />

      {/* City title */}
      <Text position={[0, 38, -60]} fontSize={4} color={NEON.cyan}
        anchorX="center" anchorY="middle" outlineWidth={0.12} outlineColor="#000000">
        GHAZIABAD
      </Text>
      <Text position={[0, 33, -60]} fontSize={1.6} color={NEON.green}
        anchorX="center" anchorY="middle" outlineWidth={0.05} outlineColor="#000000">
        DLRMS · CADASTRAL REGISTRY · UTTAR PRADESH
      </Text>

      {/* District labels */}
      {DISTRICTS.filter(d => d.type !== 'agricultural').map(d => (
        <DistrictLabel key={d.id} d={d} />
      ))}

      {/* All buildings */}
      {CITY_BUILDINGS.map(b => (
        <Building key={b.id} b={b} onHover={handleHover} onClick={handleClick} />
      ))}

      {/* Hover tooltip */}
      {hovered && <BuildingTooltip b={hovered} />}

      <PerspectiveCamera makeDefault position={[70, 50, 70]} fov={52} />
      <AutoOrbit active={autoRotate} />
    </>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────
export function CityMap3D({ onSelect, autoRotate = false }: {
  onSelect?: (b: CityBuilding | null) => void;
  autoRotate?: boolean;
}) {
  return (
    <Canvas
      shadows
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.shadowMap.enabled = true;
        gl.shadowMap.type = THREE.PCFSoftShadowMap;
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.4;
      }}
    >
      <CityScene onSelect={onSelect || (() => {})} autoRotate={autoRotate} />
    </Canvas>
  );
}

export { STATUS_GLOW, DISTRICTS };
