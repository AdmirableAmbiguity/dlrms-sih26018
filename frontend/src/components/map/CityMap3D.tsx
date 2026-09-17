import { useRef, useState, useMemo, useCallback } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stars, Html, Text } from '@react-three/drei';
import * as THREE from 'three';
import { generateULPIN, resolveCoordinates } from '../../lib/ulpin';

// ── Seeded RNG for deterministic city generation ──────────────────────────────
function mkRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ── Cyberpunk / LeetCity Neon Palette ─────────────────────────────────────────
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
  gold:    '#ffd700',
};

export const STATUS_COLORS: Record<string, string> = {
  validated:    NEON.green,
  needs_review: NEON.yellow,
  conflict:     NEON.red,
  pending:      '#64748b',
};

// ── Districts in Ghaziabad ───────────────────────────────────────────────────
export interface District {
  id: string;
  name: string;
  cx: number; cz: number; radius: number;
  type: 'commercial' | 'residential' | 'industrial' | 'civic' | 'mixed';
  color: string;
  floorRange: [number, number]; // min and max floors
  density: number;
  village: string;
}

export const DISTRICTS: District[] = [
  { id: 'cbd',     name: 'Raj Nagar Central CBD',      cx: 0,   cz: 0,   radius: 20, type: 'commercial',  color: NEON.purple, floorRange: [4, 9], density: 0.9, village: 'Raj Nagar'        },
  { id: 'vaish',   name: 'Vaishali Sky Towers',        cx: 30,  cz: -16, radius: 18, type: 'residential', color: NEON.blue,   floorRange: [3, 7], density: 0.85, village: 'Vaishali'         },
  { id: 'indira',  name: 'Indirapuram Enclave',        cx: -32, cz: -18, radius: 18, type: 'residential', color: NEON.blue,   floorRange: [3, 8], density: 0.85, village: 'Indirapuram'      },
  { id: 'kavi',    name: 'Kavi Nagar Tech Park',       cx: 32,  cz: 18,  radius: 16, type: 'commercial',  color: NEON.cyan,   floorRange: [3, 7], density: 0.75, village: 'Kavi Nagar'       },
  { id: 'cross',   name: 'Crossings Republik Heights', cx: 36,  cz: -36, radius: 16, type: 'residential', color: NEON.pink,   floorRange: [4, 9], density: 0.8,  village: 'Crossings Republik'},
  { id: 'loni',    name: 'Loni Industrial Gateway',    cx: -36, cz: 24,  radius: 16, type: 'industrial',  color: NEON.orange, floorRange: [1, 3], density: 0.65, village: 'Loni'             },
  { id: 'tronica', name: 'Tronica Logistics Hub',      cx: 0,   cz: 40,  radius: 16, type: 'industrial',  color: NEON.orange, floorRange: [1, 3], density: 0.65, village: 'Tronica City'     },
  { id: 'vijay',   name: 'Vijay Nagar Smart Sector',   cx: -20, cz: 22,  radius: 15, type: 'residential', color: NEON.teal,   floorRange: [2, 5], density: 0.75, village: 'Vijay Nagar'      },
  { id: 'shalim',  name: 'Shalimar Heights',           cx: -42, cz: -8,  radius: 14, type: 'residential', color: NEON.blue,   floorRange: [2, 6], density: 0.7,  village: 'Shalimar Garden'  },
  { id: 'arthal',  name: 'Arthala Metro Enclave',      cx: 20,  cz: 34,  radius: 14, type: 'mixed',        color: NEON.teal,   floorRange: [2, 5], density: 0.7,  village: 'Arthala'          },
];

// ── Room / Apartment Unit Land Record Interface ───────────────────────────────
export interface ApartmentRoomUnit {
  // Unique identifiers
  ulpin: string;                     // e.g. UP091201RJNR0142-F03-U02
  buildingId: string;
  buildingName: string;
  districtName: string;
  village: string;

  // Spatial floor & room partition
  floorNumber: number;              // 0 = Ground Floor, 1 = 1st, etc.
  floorLabel: string;               // e.g. "Ground Floor", "Floor 3"
  totalBuildingFloors: number;
  unitCode: string;                 // e.g. "Unit 302", "Flat 401"
  unitType: string;                 // e.g. "3BHK Deluxe Apartment", "Commercial Suite", "Studio 1BHK"
  roomConfig: string;               // "2 Bed + 2 Bath + Balcony"

  // Cadastral dimensions & areas
  carpetAreaSqFt: number;
  carpetAreaSqM: number;
  superBuiltUpSqFt: number;

  // Ownership details
  ownerName: string;
  fatherOrSpouse: string;
  aadhaarVerified: boolean;
  ownershipShare: string;           // "Sole Owner (100%)" or "Joint 50/50"

  // Land & revenue registry
  khataNumber: string;
  khasraNumber: string;
  surveyNumber: string;
  propertyTaxId: string;
  valuationINR: string;
  registrationDate: string;
  mutationDate: string;

  // Legal & blockchain state
  status: 'validated' | 'needs_review' | 'conflict' | 'pending';
  blockchainLocked: boolean;
  txHash: string;
  isFraud: boolean;
  litigationCaseNo?: string;

  // 3D XYZ Coordinates
  coordinates: {
    latitude: number;               // Z (Northing)
    longitude: number;              // X (Easting)
    elevationMSL: number;           // Y (Height above Mean Sea Level in metres)
    floorHeightAGL: number;         // Height in metres above local ground
    vectorSpace: {
      x: number;                    // X-axis (Easting)
      y: number;                    // Y-axis (Vertical altitude in meters)
      z: number;                    // Z-axis (Northing)
    };
  };

  // 3D Rendering metrics
  meshPosition: [number, number, number]; // [x, y, z] in Three.js world
  meshDimensions: [number, number, number]; // [width, height, depth]
  color: string;
}

export interface CityBuildingComposite {
  id: string;
  name: string;
  districtName: string;
  village: string;
  x: number;
  z: number;
  width: number;
  depth: number;
  totalFloors: number;
  totalUnits: number;
  units: ApartmentRoomUnit[];
  color: string;
  blockchainLocked: boolean;
  hasFraud: boolean;
  status: 'validated' | 'needs_review' | 'conflict' | 'pending';
}

// ── Realistic Data Generators ─────────────────────────────────────────────────
const FIRST_NAMES = [
  'Ramesh', 'Sunita', 'Anil', 'Priya', 'Vikram', 'Geeta', 'Mohan', 'Anita',
  'Rajesh', 'Kavita', 'Dev', 'Farhan', 'Brijesh', 'Chetan', 'Esha',
  'Narendra', 'Savita', 'Pushpa', 'Bharat', 'Sanjay', 'Rekha', 'Ajay',
  'Meera', 'Rakesh', 'Neha', 'Suresh', 'Pooja', 'Deepak', 'Ashok', 'Lata',
  'Harish', 'Vandana', 'Manish', 'Komal', 'Pradeep', 'Shalini', 'Tarun'
];

const LAST_NAMES = [
  'Gupta', 'Sharma', 'Jain', 'Verma', 'Singh', 'Rani', 'Das', 'Kumar',
  'Tiwari', 'Yadav', 'Pandey', 'Siddiqui', 'Mishra', 'Agarwal', 'Chand',
  'Rawat', 'Srivastava', 'Dubey', 'Saxena', 'Chaudhary', 'Chauhan', 'Goel'
];

const APARTMENT_TYPES = [
  { type: '1BHK Compact Studio', config: '1 Bed + 1 Bath + Kitchenette', area: [450, 620] },
  { type: '2BHK Executive Flat', config: '2 Bed + 2 Bath + Balcony', area: [850, 1150] },
  { type: '3BHK Deluxe Apartment', config: '3 Bed + 3 Bath + 2 Balconies', area: [1350, 1750] },
  { type: '4BHK Luxury Sky Penthouse', config: '4 Bed + 4 Bath + Terrace Lounge', area: [2200, 3100] },
  { type: 'Commercial Office Suite', config: 'Open Workstation + Cabin + Server Bay', area: [750, 1400] },
  { type: 'Retail Commercial Bay', config: 'Showroom Floor + Storage + Glass Facade', area: [500, 1100] },
];

const DATES = [
  '2018-04-12', '2019-08-22', '2020-02-14', '2021-06-19', '2022-10-05',
  '2023-01-30', '2023-09-18', '2024-03-04', '2024-07-21'
];

const BASE_GROUND_MSL = 234.0; // Metres MSL in Ghaziabad plains
const FLOOR_HEIGHT_M = 3.2;    // Realistic 3.2 meters per storey
const SCENE_FLOOR_H = 1.15;    // Three.js visual height per floor

function pickRandom<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

// ── FEATURED REAL DEED 1: Bharat City Phase-I (Tower A2 - Flat 501 on 5th Floor) ──
function createBharatCityTowerA2(): CityBuildingComposite {
  const bx = -6.0;
  const bz = -6.0;
  const bWidth = 3.6;
  const bDepth = 3.6;
  const totalFloors = 5;
  const buildingName = 'Bharat City Phase-I (Tower A2)';
  const village = 'Nistauli (Bharat City Phase-I)';
  const districtName = 'Loni Industrial Gateway';
  const units: ApartmentRoomUnit[] = [];

  const randomOwners = [
    { name: 'Dinesh Sharma', father: 'S/o M.L. Sharma', val: '18,50,000' },
    { name: 'Anjali Gupta', father: 'W/o P.K. Gupta', val: '18,80,000' },
    { name: 'Ramesh Verma', father: 'S/o K.C. Verma', val: '19,20,000' },
    { name: 'Meera Singh', father: 'W/o Rajesh Singh', val: '19,50,000' },
    { name: 'Sunil Kumar Saxena', father: 'S/o B.B. Saxena', val: '19,80,000' },
    { name: 'Pooja Agarwal', father: 'W/o Amit Agarwal', val: '20,10,000' },
    { name: 'Vikram Singh Rawat', father: 'S/o S.S. Rawat', val: '20,50,000' },
    { name: 'Harish Chandra Dubey', father: 'S/o N.K. Dubey', val: '20,80,000' },
  ];

  let ownerIdx = 0;

  // Floors 0 to 3: Procedural units for starting 4 floors
  for (let f = 0; f < 4; f++) {
    const floorLabel = f === 0 ? 'Ground Floor' : `Floor ${f}`;
    const floorY = f * SCENE_FLOOR_H + SCENE_FLOOR_H / 2;
    const floorMSL = BASE_GROUND_MSL + f * FLOOR_HEIGHT_M;
    const floorAGL = f * FLOOR_HEIGHT_M;

    for (let u = 1; u <= 2; u++) {
      const uOffset = u === 1 ? -0.85 : 0.85;
      const unitCode = f === 0 ? `Flat G-0${u}` : `Flat ${f}0${u}`;
      const owner = randomOwners[ownerIdx % randomOwners.length];
      ownerIdx++;

      units.push({
        ulpin: `UP091201NIST-TWA2-F0${f + 1}-U0${u}`,
        buildingId: 'bld-bharat-city-a2',
        buildingName,
        districtName,
        village,
        floorNumber: f,
        floorLabel,
        totalBuildingFloors: totalFloors,
        unitCode,
        unitType: '2BHK Standard Apartment',
        roomConfig: '2 Bed + 2 Bath + Balcony',
        carpetAreaSqFt: 750 + f * 20,
        carpetAreaSqM: +( (750 + f * 20) * 0.092903 ).toFixed(1),
        superBuiltUpSqFt: 920 + f * 20,
        ownerName: owner.name,
        fatherOrSpouse: owner.father,
        aadhaarVerified: true,
        ownershipShare: 'Sole Owner (100%)',
        khataNumber: `KH-0401`,
        khasraNumber: `501/${f + 1}`,
        surveyNumber: `SY-GZB-NIST-7287-F0${f + 1}`,
        propertyTaxId: `PT-UP-NIST-F0${f + 1}U0${u}`,
        valuationINR: `₹${owner.val}`,
        registrationDate: '2015-09-22',
        mutationDate: '2015-09-22',
        status: 'validated',
        blockchainLocked: true,
        txHash: '0x8f72a1e94c25b7e950294da18b45610ec8724b12',
        isFraud: false,
        coordinates: {
          latitude: 28.71825,
          longitude: 77.29412,
          elevationMSL: +(floorMSL).toFixed(1),
          floorHeightAGL: +(floorAGL).toFixed(1),
          vectorSpace: { x: 77.29412, y: +(floorMSL).toFixed(1), z: 28.71825 },
        },
        meshPosition: [bx + uOffset, floorY, bz],
        meshDimensions: [1.6, SCENE_FLOOR_H - 0.12, bDepth - 0.2],
        color: NEON.blue,
      });
    }
  }

  // ── Floor 4 (5th Floor / Floor 5): HIGHLIGHTED REAL FLAT NO. 501 ──
  const f5Y = 4 * SCENE_FLOOR_H + SCENE_FLOOR_H / 2;
  const f5MSL = BASE_GROUND_MSL + 4 * FLOOR_HEIGHT_M;
  const f5AGL = 4 * FLOOR_HEIGHT_M;

  // Flat 501 (Left Voxel)
  units.push({
    ulpin: 'UP091201NIST-TWA2-F05-U501',
    buildingId: 'bld-bharat-city-a2',
    buildingName,
    districtName,
    village,
    floorNumber: 4,
    floorLabel: '5th Floor (Floor 5)',
    totalBuildingFloors: totalFloors,
    unitCode: 'Flat No. 501 (5th Floor)',
    unitType: 'Residential Flat (without roof right)',
    roomConfig: 'Super Area 965 Sq. Ft. · Covered 772 Sq. Ft. · 1 Open Car Parking',
    carpetAreaSqFt: 772,
    carpetAreaSqM: 71.72,
    superBuiltUpSqFt: 965,
    ownerName: 'Saurabh Jaiswal',
    fatherOrSpouse: 'S/o Subhash Chandra Jaiswal',
    aadhaarVerified: true,
    ownershipShare: 'Sole Owner (100%)',
    khataNumber: 'KH-0401',
    khasraNumber: '501/5',
    surveyNumber: 'SY-GZB-NIST-7287-F05',
    propertyTaxId: 'PT-UP-NIST-501',
    valuationINR: '₹21,27,824 (Circle Rate: ₹22,000/sq.m)',
    registrationDate: '2015-09-22 (Deed 7287)',
    mutationDate: '2015-09-22',
    status: 'validated',
    blockchainLocked: true,
    txHash: '0x8f72a1e94c25b7e950294da18b45610ec8724b12',
    isFraud: false,
    coordinates: {
      latitude: 28.71825,
      longitude: 77.29412,
      elevationMSL: +(f5MSL).toFixed(1),
      floorHeightAGL: +(f5AGL).toFixed(1),
      vectorSpace: { x: 77.29412, y: +(f5MSL).toFixed(1), z: 28.71825 },
    },
    meshPosition: [bx - 0.85, f5Y, bz],
    meshDimensions: [1.6, SCENE_FLOOR_H - 0.12, bDepth - 0.2],
    color: NEON.green, // Glowing Green
  });

  // Flat 502 (Right Voxel)
  units.push({
    ulpin: 'UP091201NIST-TWA2-F05-U502',
    buildingId: 'bld-bharat-city-a2',
    buildingName,
    districtName,
    village,
    floorNumber: 4,
    floorLabel: '5th Floor (Floor 5)',
    totalBuildingFloors: totalFloors,
    unitCode: 'Flat No. 502 (5th Floor)',
    unitType: 'Residential Flat (without roof right)',
    roomConfig: 'Super Area 965 Sq. Ft. · Covered 772 Sq. Ft.',
    carpetAreaSqFt: 772,
    carpetAreaSqM: 71.72,
    superBuiltUpSqFt: 965,
    ownerName: 'Deepak Goel',
    fatherOrSpouse: 'S/o Ramesh Goel',
    aadhaarVerified: true,
    ownershipShare: 'Sole Owner (100%)',
    khataNumber: 'KH-0401',
    khasraNumber: '501/5',
    surveyNumber: 'SY-GZB-NIST-7287-F05-502',
    propertyTaxId: 'PT-UP-NIST-502',
    valuationINR: '₹21,27,824',
    registrationDate: '2015-09-22',
    mutationDate: '2015-09-22',
    status: 'validated',
    blockchainLocked: true,
    txHash: '0x9a8f21b7c4d3e8c950294da18b45610ec8724b77',
    isFraud: false,
    coordinates: {
      latitude: 28.71825,
      longitude: 77.29412,
      elevationMSL: +(f5MSL).toFixed(1),
      floorHeightAGL: +(f5AGL).toFixed(1),
      vectorSpace: { x: 77.29412, y: +(f5MSL).toFixed(1), z: 28.71825 },
    },
    meshPosition: [bx + 0.85, f5Y, bz],
    meshDimensions: [1.6, SCENE_FLOOR_H - 0.12, bDepth - 0.2],
    color: NEON.cyan,
  });

  return {
    id: 'bld-bharat-city-a2',
    name: buildingName,
    districtName,
    village,
    x: bx,
    z: bz,
    width: bWidth,
    depth: bDepth,
    totalFloors: 5,
    totalUnits: units.length,
    units,
    color: NEON.green,
    blockchainLocked: true,
    hasFraud: false,
    status: 'validated',
  };
}

// ── FEATURED REAL DEED 2: Shyam Park Extension (Plot D-14, Flat UG-04) ──
function createShyamParkD14(): CityBuildingComposite {
  const bx = 6.0;
  const bz = -6.0;
  const bWidth = 3.2;
  const bDepth = 3.2;
  const totalFloors = 4; // Stilt + 3
  const buildingName = 'Plot No. D-14 (Stilt + 3 Storeyed Building)';
  const village = 'Jagola (Shyam Park Extension)';
  const districtName = 'Loni Industrial Gateway';
  const units: ApartmentRoomUnit[] = [];

  const floorLabels = ['Stilt / Parking', 'Upper Ground Floor', '1st Floor', '2nd Floor'];

  for (let f = 0; f < totalFloors; f++) {
    const floorY = f * SCENE_FLOOR_H + SCENE_FLOOR_H / 2;
    const floorMSL = BASE_GROUND_MSL + f * FLOOR_HEIGHT_M;
    const floorAGL = f * FLOOR_HEIGHT_M;

    if (f === 1) {
      // Upper Ground Floor - Flat UG-04
      units.push({
        ulpin: 'UP091201JAGOD14F00U04',
        buildingId: 'bld-shyam-park-d14',
        buildingName,
        districtName,
        village,
        floorNumber: 1,
        floorLabel: 'Upper Ground Floor (Stilt + 3)',
        totalBuildingFloors: totalFloors,
        unitCode: 'Flat No. U.G-04 (Upper Ground)',
        unitType: 'Residential Flat (L.I.G) (without roof right)',
        roomConfig: 'Covered Area 400 Sq. Ft. (37.16 Sq. m) · 40ft Wide Road · Scooter Parking',
        carpetAreaSqFt: 400,
        carpetAreaSqM: 37.16,
        superBuiltUpSqFt: 400,
        ownerName: 'Smt. Kalavati Singh Yadav',
        fatherOrSpouse: 'W/o Balram Singh Yadav',
        aadhaarVerified: true,
        ownershipShare: 'Sole Owner (100%)',
        khataNumber: 'KH-D14',
        khasraNumber: 'D-14/UG04',
        surveyNumber: 'SY-GZB-JAGO-3699-UG',
        propertyTaxId: 'PT-UP-JAGO-UG04',
        valuationINR: '₹16,50,000 (Circle: ₹45,000/sq.m)',
        registrationDate: '2018-05-16 / 2026 (Deed 3699)',
        mutationDate: '2018-05-16',
        status: 'validated',
        blockchainLocked: true,
        txHash: '0x3c91e847da29b4e18f5039201485610ec8724b99',
        isFraud: false,
        coordinates: {
          latitude: 28.7241,
          longitude: 77.3112,
          elevationMSL: +(floorMSL).toFixed(1),
          floorHeightAGL: +(floorAGL).toFixed(1),
          vectorSpace: { x: 77.3112, y: +(floorMSL).toFixed(1), z: 28.7241 },
        },
        meshPosition: [bx, floorY, bz],
        meshDimensions: [bWidth - 0.2, SCENE_FLOOR_H - 0.12, bDepth - 0.2],
        color: NEON.gold,
      });
    } else {
      units.push({
        ulpin: `UP091201JAGO-D14-F0${f}`,
        buildingId: 'bld-shyam-park-d14',
        buildingName,
        districtName,
        village,
        floorNumber: f,
        floorLabel: floorLabels[f],
        totalBuildingFloors: totalFloors,
        unitCode: f === 0 ? 'Stilt Parking Bay' : `Flat ${f}01`,
        unitType: f === 0 ? 'Covered Stilt Parking' : 'Residential Floor Unit',
        roomConfig: '400 Sq. Ft. Residential Space',
        carpetAreaSqFt: 400,
        carpetAreaSqM: 37.16,
        superBuiltUpSqFt: 400,
        ownerName: f === 0 ? 'Common Society Parking' : `Rakesh Jain S/o J.S. Jain`,
        fatherOrSpouse: f === 0 ? 'Society Maintenance' : 'S/o J.S. Jain',
        aadhaarVerified: true,
        ownershipShare: 'Sole Owner (100%)',
        khataNumber: 'KH-D14',
        khasraNumber: `D-14/0${f}`,
        surveyNumber: `SY-GZB-JAGO-3699-0${f}`,
        propertyTaxId: `PT-UP-JAGO-0${f}`,
        valuationINR: '₹16,50,000',
        registrationDate: '2018-05-16',
        mutationDate: '2018-05-16',
        status: 'validated',
        blockchainLocked: true,
        txHash: '0x3c91e847da29b4e18f5039201485610ec8724b99',
        isFraud: false,
        coordinates: {
          latitude: 28.7241,
          longitude: 77.3112,
          elevationMSL: +(floorMSL).toFixed(1),
          floorHeightAGL: +(floorAGL).toFixed(1),
          vectorSpace: { x: 77.3112, y: +(floorMSL).toFixed(1), z: 28.7241 },
        },
        meshPosition: [bx, floorY, bz],
        meshDimensions: [bWidth - 0.2, SCENE_FLOOR_H - 0.12, bDepth - 0.2],
        color: NEON.orange,
      });
    }
  }

  return {
    id: 'bld-shyam-park-d14',
    name: buildingName,
    districtName,
    village,
    x: bx,
    z: bz,
    width: bWidth,
    depth: bDepth,
    totalFloors,
    totalUnits: units.length,
    units,
    color: NEON.orange,
    blockchainLocked: true,
    hasFraud: false,
    status: 'validated',
  };
}

// ── Generate Complete City with Subdivided Floors & Rooms ─────────────────────
export function generateSubdividedCity(): CityBuildingComposite[] {
  const rng = mkRng(108);
  const buildings: CityBuildingComposite[] = [
    createBharatCityTowerA2(),
    createShyamParkD14(),
  ];
  let parcelCounter = 200;

  // Grid step across city coordinates
  for (let gx = -60; gx <= 60; gx += 7) {
    for (let gz = -60; gz <= 60; gz += 7) {
      // Find matching district
      let nearestDistrict: District | null = null;
      let minDistance = Infinity;

      for (const d of DISTRICTS) {
        const dist = Math.sqrt((gx - d.cx) ** 2 + (gz - d.cz) ** 2);
        if (dist < d.radius && dist < minDistance) {
          minDistance = dist;
          nearestDistrict = d;
        }
      }

      if (!nearestDistrict || rng() > nearestDistrict.density) continue;

      const d = nearestDistrict;
      parcelCounter++;

      // Building footprint
      const bx = gx + (rng() - 0.5) * 2.6;
      const bz = gz + (rng() - 0.5) * 2.6;
      const bWidth = 2.4 + rng() * 1.8;  // scene units
      const bDepth = 2.4 + rng() * 1.8;

      const [minFloors, maxFloors] = d.floorRange;
      const totalFloors = Math.floor(minFloors + rng() * (maxFloors - minFloors + 1));

      // Each floor is partitioned into 2 or 4 apartment units/rooms
      const roomsX = bWidth > 3.2 ? 2 : (rng() > 0.4 ? 2 : 1);
      const roomsZ = bDepth > 3.2 ? 2 : (rng() > 0.4 ? 2 : 1);
      const unitsPerFloor = roomsX * roomsZ;

      const buildingStatusPool: Array<'validated' | 'needs_review' | 'conflict' | 'pending'> = [
        'validated', 'validated', 'validated', 'needs_review', 'conflict'
      ];
      const bStatus = pickRandom(buildingStatusPool, rng);
      const hasFraud = rng() < 0.05; // 5% fraud rate for SIH demo
      const bLocked = bStatus === 'validated' && rng() > 0.25;

      const buildingName = `${d.village} Block ${String.fromCharCode(65 + (parcelCounter % 26))}-${parcelCounter}`;
      const buildingUnits: ApartmentRoomUnit[] = [];

      // Calculate room sub-dimensions with visual spacing gaps
      const roomW = (bWidth - (roomsX > 1 ? 0.16 : 0)) / roomsX;
      const roomD = (bDepth - (roomsZ > 1 ? 0.16 : 0)) / roomsZ;

      for (let floorIdx = 0; floorIdx < totalFloors; floorIdx++) {
        const floorHeightAGL = floorIdx * FLOOR_HEIGHT_M;
        const floorMSL = BASE_GROUND_MSL + floorHeightAGL;
        const floorWorldY = floorIdx * SCENE_FLOOR_H + SCENE_FLOOR_H / 2;

        let roomCounterOnFloor = 1;

        for (let rx = 0; rx < roomsX; rx++) {
          for (let rz = 0; rz < roomsZ; rz++) {
            const unitRng = mkRng(parcelCounter * 1000 + floorIdx * 20 + roomCounterOnFloor);

            // Unit position offset from building center
            const xOffset = (rx - (roomsX - 1) / 2) * (roomW + 0.1);
            const zOffset = (rz - (roomsZ - 1) / 2) * (roomD + 0.1);
            const unitWorldX = bx + xOffset;
            const unitWorldZ = bz + zOffset;

            // Geographic Coordinates
            const geo = resolveCoordinates(unitWorldX, unitWorldZ, floorIdx);

            // Detailed ULPIN (India 14-digit + floor + room unit)
            const ulpin = generateULPIN(d.village, parcelCounter, floorIdx, roomCounterOnFloor);

            // Unit metadata
            const floorLabel = floorIdx === 0 ? 'Ground Floor' : `Floor ${floorIdx}`;
            const unitCode = floorIdx === 0
              ? `G-0${roomCounterOnFloor}`
              : `${floorIdx}0${roomCounterOnFloor}`;

            const aptConfig = pickRandom(APARTMENT_TYPES, unitRng);
            const carpetSqFt = Math.floor(aptConfig.area[0] + unitRng() * (aptConfig.area[1] - aptConfig.area[0]));
            const carpetSqM = +(carpetSqFt * 0.092903).toFixed(1);
            const superBuiltUp = Math.floor(carpetSqFt * 1.28);

            const ownerFirstName = pickRandom(FIRST_NAMES, unitRng);
            const ownerLastName = pickRandom(LAST_NAMES, unitRng);
            const ownerFullName = `${ownerFirstName} ${ownerLastName}`;
            const fatherName = `S/o Late ${pickRandom(FIRST_NAMES, unitRng)} ${ownerLastName}`;

            // Status determination for this specific unit
            const isThisUnitFraud = hasFraud && floorIdx === totalFloors - 1 && roomCounterOnFloor === 1;
            const unitStatus: ApartmentRoomUnit['status'] = isThisUnitFraud
              ? 'conflict'
              : (floorIdx === 0 ? bStatus : pickRandom(['validated', 'validated', 'needs_review', 'validated'], unitRng));

            const txHashPrefix = '0x' + Array.from({ length: 40 }, () => Math.floor(unitRng() * 16).toString(16)).join('');

            const valLakhs = Math.floor(35 + (carpetSqFt / 20) * (floorIdx > 0 ? 1.1 : 1.0));

            buildingUnits.push({
              ulpin,
              buildingId: `bld-${gx}-${gz}`,
              buildingName,
              districtName: d.name,
              village: d.village,
              floorNumber: floorIdx,
              floorLabel,
              totalBuildingFloors: totalFloors,
              unitCode: `Unit ${unitCode}`,
              unitType: aptConfig.type,
              roomConfig: aptConfig.config,
              carpetAreaSqFt: carpetSqFt,
              carpetAreaSqM: carpetSqM,
              superBuiltUpSqFt: superBuiltUp,
              ownerName: ownerFullName,
              fatherOrSpouse: fatherName,
              aadhaarVerified: unitRng() > 0.15,
              ownershipShare: unitRng() > 0.2 ? 'Sole Ownership (100%)' : 'Joint / Undivided (50:50)',
              khataNumber: `KH-${String(parcelCounter).padStart(5, '0')}`,
              khasraNumber: `${parcelCounter}/${floorIdx + 1}`,
              surveyNumber: `SY-GZB-${d.village.slice(0, 3).toUpperCase()}-${parcelCounter}-${unitCode}`,
              propertyTaxId: `PT-UP-${d.village.slice(0, 4).toUpperCase()}-${unitCode}`,
              valuationINR: `₹${valLakhs},50,000`,
              registrationDate: pickRandom(DATES, unitRng),
              mutationDate: pickRandom(DATES, unitRng),
              status: unitStatus,
              blockchainLocked: bLocked && unitStatus === 'validated',
              txHash: txHashPrefix,
              isFraud: isThisUnitFraud,
              litigationCaseNo: isThisUnitFraud ? `RCCMS/GZB/2024/REV-${parcelCounter}91` : undefined,
              coordinates: {
                latitude: geo.lat,
                longitude: geo.lng,
                elevationMSL: +(floorMSL).toFixed(1),
                floorHeightAGL: +(floorHeightAGL).toFixed(1),
                vectorSpace: {
                  x: +(geo.lng).toFixed(6),
                  y: +(floorMSL).toFixed(1),
                  z: +(geo.lat).toFixed(6),
                },
              },
              meshPosition: [unitWorldX, floorWorldY, unitWorldZ],
              meshDimensions: [roomW - 0.08, SCENE_FLOOR_H - 0.12, roomD - 0.08],
              color: isThisUnitFraud ? NEON.red : (bLocked ? NEON.cyan : d.color),
            });

            roomCounterOnFloor++;
          }
        }
      }

      buildings.push({
        id: `bld-${gx}-${gz}`,
        name: buildingName,
        districtName: d.name,
        village: d.village,
        x: bx,
        z: bz,
        width: bWidth,
        depth: bDepth,
        totalFloors,
        totalUnits: buildingUnits.length,
        units: buildingUnits,
        color: d.color,
        blockchainLocked: bLocked,
        hasFraud,
        status: bStatus,
      });
    }
  }

  return buildings;
}

// Single memoized instance of the entire city
export const CITY_BUILDINGS = generateSubdividedCity();
export const ALL_UNITS: ApartmentRoomUnit[] = CITY_BUILDINGS.flatMap(b => b.units);

// ── 3D Individual Room / Flat Unit Voxel ──────────────────────────────────────
function RoomVoxel({
  unit,
  isSelected,
  onHover,
  onClick,
}: {
  unit: ApartmentRoomUnit;
  isSelected: boolean;
  onHover: (u: ApartmentRoomUnit | null) => void;
  onClick: (u: ApartmentRoomUnit) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);

  const baseColor = useMemo(() => new THREE.Color(unit.color), [unit.color]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;

    if (unit.isFraud) {
      const pulse = Math.abs(Math.sin(clock.elapsedTime * 4.5));
      mat.emissiveIntensity = 0.6 + pulse * 0.9;
      mat.emissive.set(NEON.red);
    } else if (isSelected) {
      const pulse = Math.abs(Math.sin(clock.elapsedTime * 3));
      mat.emissiveIntensity = 0.8 + pulse * 0.5;
      mat.emissive.set(NEON.gold);
    } else if (hovered) {
      mat.emissiveIntensity = 1.0;
      mat.emissive.set(NEON.cyan);
    } else {
      mat.emissiveIntensity = 0.28;
      mat.emissive.set(baseColor);
    }

    const targetScale = isSelected ? 1.12 : (hovered ? 1.06 : 1.0);
    meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.15);
  });

  return (
    <group position={unit.meshPosition}>
      {/* Partitioned Flat / Room Voxel */}
      <mesh
        ref={meshRef}
        castShadow
        receiveShadow
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          setHovered(true);
          onHover(unit);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          onHover(null);
          document.body.style.cursor = 'default';
        }}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          onClick(unit);
        }}
      >
        <boxGeometry args={unit.meshDimensions} />
        <meshStandardMaterial
          color={baseColor}
          roughness={0.25}
          metalness={0.4}
          transparent
          opacity={isSelected ? 0.95 : (hovered ? 0.95 : 0.82)}
        />
      </mesh>

      {/* Wireframe border highlighting the room partition */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(...unit.meshDimensions)]} />
        <lineBasicMaterial
          color={isSelected ? NEON.gold : (unit.isFraud ? NEON.red : (hovered ? NEON.cyan : unit.color))}
          transparent
          opacity={isSelected ? 1.0 : (hovered ? 0.9 : 0.45)}
          linewidth={isSelected ? 2 : 1}
        />
      </lineSegments>

      {/* Pulsing indicator above unit if selected or fraud */}
      {unit.isFraud && (
        <mesh position={[0, unit.meshDimensions[1] / 2 + 0.2, 0]}>
          <sphereGeometry args={[0.12, 8, 8]} />
          <meshBasicMaterial color={NEON.red} />
        </mesh>
      )}

      {isSelected && (
        <mesh position={[0, unit.meshDimensions[1] / 2 + 0.25, 0]}>
          <octahedronGeometry args={[0.16]} />
          <meshBasicMaterial color={NEON.gold} wireframe />
        </mesh>
      )}
    </group>
  );
}

// ── Hover Tooltip for Focused Apartment / Room ────────────────────────────────
function RoomHoverHUD({ unit }: { unit: ApartmentRoomUnit }) {
  return (
    <Html
      position={[unit.meshPosition[0], unit.meshPosition[1] + unit.meshDimensions[1] / 2 + 1.2, unit.meshPosition[2]]}
      center
      distanceFactor={20}
      zIndexRange={[100, 0]}
    >
      <div
        style={{
          fontFamily: "'JetBrains Mono', 'Courier New', monospace",
          background: 'rgba(2, 6, 18, 0.96)',
          color: '#fff',
          border: `1px solid ${unit.isFraud ? NEON.red : NEON.cyan}`,
          borderRadius: 8,
          padding: '8px 12px',
          fontSize: 10,
          minWidth: 240,
          pointerEvents: 'none',
          boxShadow: `0 0 20px ${unit.isFraud ? 'rgba(255,34,85,0.4)' : 'rgba(0,255,240,0.3)'}`,
          backdropFilter: 'blur(8px)',
        }}
      >
        <div style={{ color: NEON.cyan, fontWeight: 700, fontSize: 11, marginBottom: 2 }}>
          {unit.buildingName} · {unit.unitCode}
        </div>
        <div style={{ color: NEON.green, fontSize: 9, wordBreak: 'break-all', marginBottom: 6 }}>
          {unit.ulpin}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '2px 6px', color: '#94a3b8' }}>
          <span>Floor:</span>
          <span style={{ color: '#f1f5f9' }}>{unit.floorLabel} (FL-{unit.floorNumber})</span>

          <span>Type:</span>
          <span style={{ color: '#f1f5f9' }}>{unit.unitType}</span>

          <span>Owner:</span>
          <span style={{ color: '#38bdf8', fontWeight: 600 }}>{unit.ownerName}</span>

          <span>Carpet Area:</span>
          <span style={{ color: '#f1f5f9' }}>{unit.carpetAreaSqFt} sq.ft ({unit.carpetAreaSqM} m²)</span>

          <span>Z-Elevation:</span>
          <span style={{ color: NEON.purple, fontWeight: 700 }}>
            {unit.coordinates.elevationMSL}m MSL (+{unit.coordinates.floorHeightAGL}m AGL)
          </span>

          <span>Vector (X,Y,Z):</span>
          <span style={{ color: NEON.yellow, fontSize: 8.5 }}>
            {unit.coordinates.vectorSpace.x}, {unit.coordinates.vectorSpace.y}, {unit.coordinates.vectorSpace.z}
          </span>
        </div>

        {unit.blockchainLocked && (
          <div style={{ marginTop: 5, color: NEON.green, fontSize: 9, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>⛓</span> Blocklocked on Polygon/Hardhat
          </div>
        )}

        {unit.isFraud && (
          <div style={{ marginTop: 5, color: NEON.red, fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>⚠</span> RCCMS Litigation Dispute Detected!
          </div>
        )}
      </div>
    </Html>
  );
}

// ── Real Satellite Ground Surface with Cadastral Vector Grid ──────────────────
function SatelliteCadastralGround() {
  const groundTexture = useMemo(() => {
    const size = 2048;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Deep slate satellite base
    ctx.fillStyle = '#020813';
    ctx.fillRect(0, 0, size, size);

    // Green agricultural and riparian zones
    const rng = mkRng(99);
    for (let i = 0; i < 28; i++) {
      const x = rng() * size;
      const y = rng() * size;
      const r = 80 + rng() * 200;
      const radGrad = ctx.createRadialGradient(x, y, 0, x, y, r);
      radGrad.addColorStop(0, `rgba(16, 78, 40, ${0.35 + rng() * 0.25})`);
      radGrad.addColorStop(1, 'rgba(2, 8, 19, 0)');
      ctx.fillStyle = radGrad;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }

    // Urban asphalt roads
    ctx.strokeStyle = '#0e1e33';
    ctx.lineWidth = 14;
    for (let c = 0; c < size; c += 256) {
      ctx.beginPath();
      ctx.moveTo(c, 0); ctx.lineTo(c, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, c); ctx.lineTo(size, c);
      ctx.stroke();
    }

    // Neon survey cadastral grid lines
    ctx.strokeStyle = 'rgba(0, 255, 240, 0.05)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < size; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 0); ctx.lineTo(i, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i); ctx.lineTo(size, i);
      ctx.stroke();
    }

    return new THREE.CanvasTexture(canvas);
  }, []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[160, 160]} />
      <meshStandardMaterial map={groundTexture} roughness={0.9} />
    </mesh>
  );
}

// ── Animated Traffic Particles along Roads ────────────────────────────────────
function RoadTrafficParticles() {
  const instancedRef = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const vehicles = useMemo(() => Array.from({ length: 90 }, (_, i) => ({
    onX: i % 2 === 0,
    pos: (Math.random() - 0.5) * 130,
    speed: 0.09 + Math.random() * 0.15,
    lane: (Math.floor(Math.random() * 5) - 2) * 4.5,
  })), []);

  useFrame(() => {
    if (!instancedRef.current) return;
    vehicles.forEach((v, i) => {
      v.pos += v.speed;
      if (v.pos > 70) v.pos = -70;
      dummy.position.set(
        v.onX ? v.pos : v.lane,
        0.18,
        v.onX ? v.lane : v.pos
      );
      dummy.scale.setScalar(0.24);
      dummy.updateMatrix();
      instancedRef.current.setMatrixAt(i, dummy.matrix);
    });
    instancedRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={instancedRef} args={[undefined, undefined, 90]}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial color={NEON.yellow} />
    </instancedMesh>
  );
}

// ── Auto-Orbit Camera Controller ──────────────────────────────────────────────
function AutoOrbitRig({ active }: { active: boolean }) {
  const orbitRef = useRef<any>(null);

  useFrame(({ clock }) => {
    if (!active || !orbitRef.current) return;
    const t = clock.elapsedTime * 0.035;
    orbitRef.current.object.position.x = Math.sin(t) * 82;
    orbitRef.current.object.position.z = Math.cos(t) * 82;
    orbitRef.current.object.position.y = 44 + Math.sin(clock.elapsedTime * 0.015) * 10;
    orbitRef.current.update();
  });

  return (
    <OrbitControls
      ref={orbitRef}
      enablePan
      enableZoom
      enableRotate
      minDistance={6}
      maxDistance={140}
      maxPolarAngle={Math.PI / 2.05}
      target={[0, 5, 0]}
      dampingFactor={0.06}
      enableDamping
    />
  );
}

// ── Building Composite (Slab base, floor dividers & room voxels) ──────────────
function BuildingBlock({
  building,
  selectedUnitUlpin,
  onHoverUnit,
  onSelectUnit,
}: {
  building: CityBuildingComposite;
  selectedUnitUlpin?: string;
  onHoverUnit: (u: ApartmentRoomUnit | null) => void;
  onSelectUnit: (u: ApartmentRoomUnit) => void;
}) {
  const totalBuildingHeight = building.totalFloors * SCENE_FLOOR_H;

  return (
    <group position={[0, 0, 0]}>
      {/* Building Concrete Foundation Footprint */}
      <mesh position={[building.x, 0.05, building.z]} receiveShadow>
        <boxGeometry args={[building.width + 0.3, 0.1, building.depth + 0.3]} />
        <meshStandardMaterial color="#0f172a" roughness={0.7} />
      </mesh>

      {/* Horizontal Structural Slabs between Floors */}
      {Array.from({ length: building.totalFloors + 1 }, (_, fIdx) => (
        <mesh key={`slab-${fIdx}`} position={[building.x, fIdx * SCENE_FLOOR_H, building.z]}>
          <boxGeometry args={[building.width + 0.15, 0.06, building.depth + 0.15]} />
          <meshBasicMaterial color={building.color} transparent opacity={0.35} />
        </mesh>
      ))}

      {/* All Subdivided Apartment / Office Room Voxels */}
      {building.units.map(unit => (
        <RoomVoxel
          key={unit.ulpin}
          unit={unit}
          isSelected={unit.ulpin === selectedUnitUlpin}
          onHover={onHoverUnit}
          onClick={onSelectUnit}
        />
      ))}

      {/* Rooftop Solar / HVAC Structure */}
      <mesh position={[building.x, totalBuildingHeight + 0.08, building.z]}>
        <boxGeometry args={[building.width * 0.7, 0.14, building.depth * 0.7]} />
        <meshBasicMaterial color={building.blockchainLocked ? NEON.cyan : building.color} transparent opacity={0.65} />
      </mesh>

      {/* Floating Building Title & Parcel ID */}
      <Text
        position={[building.x, totalBuildingHeight + 1.2, building.z]}
        fontSize={0.32}
        color={building.blockchainLocked ? NEON.cyan : '#f8fafc'}
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.03}
        outlineColor="#000"
      >
        {building.name}
      </Text>

      {/* Blockchain Beacon Pillar */}
      {building.blockchainLocked && (
        <mesh position={[building.x, totalBuildingHeight / 2 + 5, building.z]}>
          <cylinderGeometry args={[0.04, 0.04, totalBuildingHeight + 10, 6]} />
          <meshBasicMaterial color={NEON.cyan} transparent opacity={0.12} />
        </mesh>
      )}
    </group>
  );
}

// ── Main 3D Canvas Scene ──────────────────────────────────────────────────────
function SceneCanvas({
  selectedUnit,
  onSelectUnit,
  autoRotate,
}: {
  selectedUnit: ApartmentRoomUnit | null;
  onSelectUnit: (u: ApartmentRoomUnit | null) => void;
  autoRotate: boolean;
}) {
  const [hoveredUnit, setHoveredUnit] = useState<ApartmentRoomUnit | null>(null);

  const handleHover = useCallback((u: ApartmentRoomUnit | null) => setHoveredUnit(u), []);
  const handleClick = useCallback((u: ApartmentRoomUnit) => onSelectUnit(u), [onSelectUnit]);

  return (
    <>
      <color attach="background" args={['#000008']} />
      <fog attach="fog" args={['#000214', 85, 175]} />
      <Stars radius={240} depth={90} count={3500} factor={5} fade />

      {/* Lighting Rig */}
      <ambientLight intensity={0.2} />
      <pointLight position={[0, 85, 0]} intensity={3.5} color={NEON.cyan} distance={240} decay={1.4} />
      <pointLight position={[-45, 35, -45]} intensity={1.8} color={NEON.purple} distance={140} />
      <pointLight position={[45, 35, 45]} intensity={1.8} color={NEON.blue} distance={140} />
      <pointLight position={[45, 25, -45]} intensity={1.2} color={NEON.orange} distance={120} />
      <directionalLight position={[40, 90, 40]} intensity={0.45} castShadow />

      {/* Cadastral Terrain & Traffic */}
      <SatelliteCadastralGround />
      <RoadTrafficParticles />

      {/* City Sky Header */}
      <Text
        position={[0, 40, -65]}
        fontSize={4.2}
        color={NEON.cyan}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.14}
        outlineColor="#000"
      >
        GHAZIABAD 3D CADASTRAL REGISTRY
      </Text>
      <Text
        position={[0, 35, -65]}
        fontSize={1.6}
        color={NEON.green}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.06}
        outlineColor="#000"
      >
        SUBDIVIDED APARTMENT UNITS · MULTI-STOREY FLOOR REGISTRY · 3D ULPIN
      </Text>

      {/* District Floating Overlays */}
      {DISTRICTS.map(d => (
        <Text
          key={d.id}
          position={[d.cx, d.floorRange[1] * SCENE_FLOOR_H + 3.2, d.cz]}
          fontSize={1.2}
          color={d.color}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.04}
          outlineColor="#000"
        >
          {d.name.toUpperCase()}
        </Text>
      ))}

      {/* Subdivided Buildings with Partitioned Flats & Rooms */}
      {CITY_BUILDINGS.map(bld => (
        <BuildingBlock
          key={bld.id}
          building={bld}
          selectedUnitUlpin={selectedUnit?.ulpin}
          onHoverUnit={handleHover}
          onSelectUnit={handleClick}
        />
      ))}

      {/* Hover Information Tooltip */}
      {hoveredUnit && <RoomHoverHUD unit={hoveredUnit} />}

      <PerspectiveCamera makeDefault position={[65, 48, 65]} fov={52} />
      <AutoOrbitRig active={autoRotate} />
    </>
  );
}

// ── Exported 3D Map Component ─────────────────────────────────────────────────
export function CityMap3D({
  selectedUnit,
  onSelectUnit,
  autoRotate = false,
}: {
  selectedUnit?: ApartmentRoomUnit | null;
  onSelectUnit?: (u: ApartmentRoomUnit | null) => void;
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
        gl.toneMappingExposure = 1.35;
      }}
    >
      <SceneCanvas
        selectedUnit={selectedUnit || null}
        onSelectUnit={onSelectUnit || (() => {})}
        autoRotate={autoRotate}
      />
    </Canvas>
  );
}
