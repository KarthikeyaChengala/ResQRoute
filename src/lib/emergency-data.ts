export type TrafficLevel = "low" | "moderate" | "heavy";

export type Pt = { x: number; y: number };

export type IntersectionStatus = "idle" | "preparing" | "clearing" | "passing" | "cleared";

export type Intersection = {
  id: string;
  name: string;
  unit: string;
  officerName?: string;
  traffic: TrafficLevel;
  distanceKm: number;
  at: number; // 0..1 position along the route
  coordinates?: GeoPoint;
};

export type EmergencyRoute = {
  id: string;
  name: string;
  label: string;
  distanceKm: number;
  etaMin: number;
  traffic: TrafficLevel;
  police: string;
  road: string;
  score: number;
  recommended: boolean;
  path: Pt[];
  geoPath?: [number, number][]; // Real road polyline [lat, lng][]
  intersections: Intersection[];
};

export type GeoPoint = {
  lat: number;
  lng: number;
};

// Ambulance origin located at Sector 12, Ring Road, Hyderabad (Mehdipatnam junction corridor)
export const AMBULANCE = {
  id: "AMB-1024",
  origin: { x: 90, y: 500 },
  coords: { lat: 17.3984, lng: 78.442 } as GeoPoint,
  locationName: "Sector 12, Ring Road (Mehdipatnam Corridor)",
  city: "Hyderabad",
};

export type EmergencyTypeId = "trauma" | "cardiac" | "stroke" | "burns" | "maternity" | "pediatric";

export type EmergencyType = {
  id: EmergencyTypeId;
  label: string;
  icon: string;
  patientLevel: "Critical" | "Serious" | "Stable";
  needs: string[];
};

export const EMERGENCY_TYPES: EmergencyType[] = [
  {
    id: "trauma",
    label: "Accident / Trauma",
    icon: "🚑",
    patientLevel: "Critical",
    needs: ["Trauma", "Orthopedics", "Blood bank"],
  },
  {
    id: "cardiac",
    label: "Cardiac Arrest",
    icon: "🫀",
    patientLevel: "Critical",
    needs: ["Cardiac", "ICU"],
  },
  {
    id: "stroke",
    label: "Stroke",
    icon: "🧠",
    patientLevel: "Critical",
    needs: ["Neuro", "CT scan", "Stroke"],
  },
  { id: "burns", label: "Burns", icon: "🔥", patientLevel: "Serious", needs: ["Burns", "ICU"] },
  {
    id: "maternity",
    label: "Maternity",
    icon: "👶",
    patientLevel: "Serious",
    needs: ["Maternity", "Neonatal"],
  },
  {
    id: "pediatric",
    label: "Pediatric",
    icon: "🧒",
    patientLevel: "Stable",
    needs: ["Pediatric", "Neonatal"],
  },
];

export type Hospital = {
  id: string;
  name: string;
  shortName: string;
  level: string;
  address: string;
  area: string;
  city: "Hyderabad" | "Secunderabad";
  phone: string;
  emergencyPhone: string;
  emergencyAvailability: string;
  isVerified: boolean;
  has24x7Emergency: boolean;
  coordinates: GeoPoint;
  distanceKm: number;
  etaMin: number;
  bedsFree: number;
  totalEmergencyBeds: number;
  icuBeds: number;
  specialties: string[];
  at: Pt;
  ambulanceBay: string;
  features: string[];
};

/**
 * Verified great-circle Haversine formula calculation.
 * Factors typical urban arterial road network factor (~1.25x) to compute
 * realistic driving distance in kilometers.
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightLine = R * c;
  // Apply urban road geometry factor
  const roadDistance = straightLine * 1.25;
  return Math.round(roadDistance * 10) / 10;
}

export function estimateEtaMinutes(distanceKm: number, averageSpeedKph = 46): number {
  const minutes = (distanceKm / averageSpeedKph) * 60;
  return Math.max(3, Math.round(minutes));
}

// 10 Verified Emergency Hospitals in Hyderabad & Secunderabad
export const HOSPITALS: Hospital[] = [
  {
    id: "h-gandhi",
    name: "Gandhi Hospital, Secunderabad",
    shortName: "Gandhi Hospital",
    level: "Govt Level 1 Trauma Care",
    address:
      "Bhoiguda Road, M.I.G.H. Colony, Musheerabad, Padmarao Nagar, Secunderabad, Telangana 500025",
    area: "Secunderabad",
    city: "Secunderabad",
    phone: "040-27505566",
    emergencyPhone: "040-27505773 / 108",
    emergencyAvailability: "24/7 Emergency & Trauma Care · Govt Level 1 Apex Hospital",
    isVerified: true,
    has24x7Emergency: true,
    coordinates: { lat: 17.4267, lng: 78.5033 },
    at: { x: 890, y: 120 },
    distanceKm: 8.9,
    etaMin: 14,
    bedsFree: 14,
    totalEmergencyBeds: 45,
    icuBeds: 24,
    specialties: ["Trauma", "Orthopedics", "Neurosurgery", "Blood bank", "ICU", "CT scan"],
    ambulanceBay: "Casualty Ramp Gate 2 · Direct Triage Intake",
    features: [
      "Govt Tertiary Apex Center",
      "24/7 Blood Bank",
      "Mass Casualty Triage",
      "Level 1 Trauma",
    ],
  },
  {
    id: "h-osmania",
    name: "Osmania General Hospital, Hyderabad",
    shortName: "Osmania General",
    level: "Govt Level 1 Trauma Center",
    address: "5-1-876, Afzal Gunj, High Court Road, Begum Bazaar, Hyderabad, Telangana 500012",
    area: "Afzal Gunj",
    city: "Hyderabad",
    phone: "040-24600146",
    emergencyPhone: "040-23531846 / 7780288622 (24x7 Patient Helpline)",
    emergencyAvailability: "24/7 Emergency & Casualty Department · Level 1 Trauma",
    isVerified: true,
    has24x7Emergency: true,
    coordinates: { lat: 17.3766, lng: 78.4738 },
    at: { x: 790, y: 480 },
    distanceKm: 5.4,
    etaMin: 9,
    bedsFree: 11,
    totalEmergencyBeds: 50,
    icuBeds: 28,
    specialties: ["Trauma", "Emergency Medicine", "Burns", "General Surgery", "ICU", "Blood bank"],
    ambulanceBay: "Afzal Gunj Gate 1 · Dedicated Casualty Bay",
    features: ["Apex Trauma Center", "24/7 Acute Resuscitation", "Specialized Burns ICU"],
  },
  {
    id: "h-nims",
    name: "Nizam's Institute of Medical Sciences (NIMS), Punjagutta",
    shortName: "NIMS Punjagutta",
    level: "Autonomous Super Specialty & Acute Trauma",
    address:
      "Punjagutta Main Road, Punjagutta, Hyderabad, Telangana 500082 (Opp. Hyderabad Central)",
    area: "Punjagutta",
    city: "Hyderabad",
    phone: "040-23489000",
    emergencyPhone: "040-23489692 (24/7 Emergency Referral) / 040-23489999",
    emergencyAvailability: "24/7 Acute Medical Care & Super Specialty Emergency",
    isVerified: true,
    has24x7Emergency: true,
    coordinates: { lat: 17.4217, lng: 78.4526 },
    at: { x: 740, y: 220 },
    distanceKm: 3.6,
    etaMin: 6,
    bedsFree: 8,
    totalEmergencyBeds: 36,
    icuBeds: 20,
    specialties: ["Neuro", "Cardiac", "Nephrology", "Trauma", "ICU", "CT scan"],
    ambulanceBay: "Punjagutta Arterial Ramp · Emergency Block Entrance",
    features: ["Autonomous State Institute", "Comprehensive Neuro-Trauma", "Advanced Stroke Unit"],
  },
  {
    id: "h-apollo",
    name: "Apollo Hospitals, Jubilee Hills",
    shortName: "Apollo Jubilee Hills",
    level: "JCI Level 1 Trauma & Cardiac Institute",
    address:
      "Apollo Health City, Road No. 72, Film Nagar, Jubilee Hills, Hyderabad, Telangana 500033",
    area: "Jubilee Hills",
    city: "Hyderabad",
    phone: "040-23607777",
    emergencyPhone: "1066 (National Emergency) / +91 7702041414",
    emergencyAvailability: "24/7 Level 1 Trauma, Chest Pain & Stroke Care (JCI Accredited)",
    isVerified: true,
    has24x7Emergency: true,
    coordinates: { lat: 17.4156, lng: 78.4124 },
    at: { x: 620, y: 280 },
    distanceKm: 5.1,
    etaMin: 8,
    bedsFree: 9,
    totalEmergencyBeds: 40,
    icuBeds: 25,
    specialties: ["Cardiac", "Neuro", "Trauma", "Stroke", "ICU", "CT scan"],
    ambulanceBay: "Apollo Health City Gate 3 · 24/7 Emergency Concourse",
    features: ["JCI & NABH Accredited", "Dedicated ACLS Fleet", "Stroke Rapid Response Team"],
  },
  {
    id: "h-yashoda",
    name: "Yashoda Hospitals, Secunderabad",
    shortName: "Yashoda Secunderabad",
    level: "Comprehensive Trauma & Critical Care Center",
    address: "Alexander Road, Kummari Guda, Shivaji Nagar, Secunderabad, Telangana 500003",
    area: "Secunderabad",
    city: "Secunderabad",
    phone: "040-45674567",
    emergencyPhone: "105910 (Emergency Hotline) / 040-67232348",
    emergencyAvailability: "24/7 Emergency Medicine & Trauma Care",
    isVerified: true,
    has24x7Emergency: true,
    coordinates: { lat: 17.4419, lng: 78.4972 },
    at: { x: 930, y: 180 },
    distanceKm: 9.8,
    etaMin: 15,
    bedsFree: 7,
    totalEmergencyBeds: 32,
    icuBeds: 18,
    specialties: ["Trauma", "Cardiac", "Neuro", "Stroke", "ICU", "Blood bank"],
    ambulanceBay: "Alexander Road Front Entrance · Casualty Ramp",
    features: ["Rapid Triage Protocol", "Advanced Cath Lab", "Multi-Organ Critical Care"],
  },
  {
    id: "h-kims",
    name: "KIMS Hospitals, Secunderabad",
    shortName: "KIMS Secunderabad",
    level: "NABH Super Specialty & Acute Trauma Centre",
    address:
      "1-8-31/1, Minister Road, Krishna Nagar Colony, Begumpet, Secunderabad, Telangana 500003",
    area: "Begumpet",
    city: "Secunderabad",
    phone: "040-44885000",
    emergencyPhone: "040-44885184 / 040-44885100",
    emergencyAvailability: "24/7 Emergency, Comprehensive Stroke & Trauma Care",
    isVerified: true,
    has24x7Emergency: true,
    coordinates: { lat: 17.4368, lng: 78.4862 },
    at: { x: 820, y: 170 },
    distanceKm: 8.2,
    etaMin: 12,
    bedsFree: 10,
    totalEmergencyBeds: 35,
    icuBeds: 22,
    specialties: ["Cardiac", "Neuro", "Trauma", "Pulmonology", "ICU", "CT scan"],
    ambulanceBay: "Minister Road Emergency Gate · Level 0 Bay",
    features: ["Green OT Setup", "Code Blue Cardiac Unit", "Extensive ECMO Facility"],
  },
  {
    id: "h-aig",
    name: "AIG Hospitals, Gachibowli",
    shortName: "AIG Gachibowli",
    level: "JCI Quaternary Care & Level 1 Trauma Center",
    address:
      "Plot No. 2/3/4/5, Survey No. 136/1, Mindspace Road, Gachibowli, Hyderabad, Telangana 500032",
    area: "Gachibowli",
    city: "Hyderabad",
    phone: "040-42444222",
    emergencyPhone: "040-42444244 (24/7 Emergency Command) / 040-67444222",
    emergencyAvailability: "24/7 Emergency, Trauma & Critical Care (JCI Accredited)",
    isVerified: true,
    has24x7Emergency: true,
    coordinates: { lat: 17.4385, lng: 78.3678 },
    at: { x: 500, y: 410 },
    distanceKm: 11.8,
    etaMin: 18,
    bedsFree: 12,
    totalEmergencyBeds: 48,
    icuBeds: 30,
    specialties: ["Trauma", "Critical Care", "Cardiac", "ICU", "CT scan", "Gastro"],
    ambulanceBay: "Mindspace Road Dedicated Emergency Concourse",
    features: ["JCI Accredited", "800+ Bed Infrastructure", "Advanced Trauma Surgery Units"],
  },
  {
    id: "h-care",
    name: "CARE Hospitals, Banjara Hills",
    shortName: "CARE Banjara Hills",
    level: "Cardiac Emergency & Multi-Specialty Trauma Centre",
    address: "Road No. 1, Prem Nagar, Banjara Hills, Hyderabad, Telangana 500034",
    area: "Banjara Hills",
    city: "Hyderabad",
    phone: "040-61656565",
    emergencyPhone: "+91-40-68106529 / 040-67206588",
    emergencyAvailability: "24/7 Emergency & Cardiac Critical Care Centre",
    isVerified: true,
    has24x7Emergency: true,
    coordinates: { lat: 17.414, lng: 78.4482 },
    at: { x: 700, y: 330 },
    distanceKm: 2.5,
    etaMin: 5,
    bedsFree: 6,
    totalEmergencyBeds: 28,
    icuBeds: 16,
    specialties: ["Cardiac", "Trauma", "Vascular Surgery", "Neuro", "ICU"],
    ambulanceBay: "Road No. 1 Dedicated Emergency Drive-in",
    features: [
      "Pioneering Cardiac Emergency Care",
      "Code STEMI Protocol",
      "24/7 Catheterization Lab",
    ],
  },
  {
    id: "h-continental",
    name: "Continental Hospitals, Gachibowli",
    shortName: "Continental Gachibowli",
    level: "JCI Accredited Level 1 Trauma Center",
    address:
      "Plot No. 3, Road No. 2, IT & Financial District, Nanakramguda, Gachibowli, Hyderabad, Telangana 500032",
    area: "Gachibowli",
    city: "Hyderabad",
    phone: "040-67000000",
    emergencyPhone: "040-67000111 (24/7 Emergency Line)",
    emergencyAvailability: "24/7 Emergency & Level 1 Trauma Center (JCI Accredited)",
    isVerified: true,
    has24x7Emergency: true,
    coordinates: { lat: 17.417, lng: 78.343 },
    at: { x: 440, y: 470 },
    distanceKm: 13.5,
    etaMin: 20,
    bedsFree: 8,
    totalEmergencyBeds: 30,
    icuBeds: 20,
    specialties: ["Trauma", "Neuro", "Cardiac", "Orthopedics", "ICU", "CT scan"],
    ambulanceBay: "Financial District Main Highway Access · Dedicated Trauma Bay",
    features: [
      "JCI & NABH Gold Standard",
      "Green Building OT Infrastructure",
      "Direct Highway Corridors",
    ],
  },
  {
    id: "h-medicover",
    name: "Medicover Hospitals, Hitec City",
    shortName: "Medicover HITEC City",
    level: "NABH Comprehensive Trauma & Stroke Centre",
    address:
      "Behind Cyber Towers, In the Lane of IBIS Hotel, HUDA Techno Enclave, HITEC City, Madhapur, Hyderabad, Telangana 500081",
    area: "HITEC City",
    city: "Hyderabad",
    phone: "040-49404940",
    emergencyPhone: "040-68334455 (24/7 Emergency Hotline)",
    emergencyAvailability: "24/7 Emergency, Trauma, Stroke & Acute Care",
    isVerified: true,
    has24x7Emergency: true,
    coordinates: { lat: 17.4485, lng: 78.382 },
    at: { x: 550, y: 340 },
    distanceKm: 10.8,
    etaMin: 16,
    bedsFree: 9,
    totalEmergencyBeds: 34,
    icuBeds: 18,
    specialties: ["Trauma", "Stroke", "Cardiac", "Neuro", "ICU", "CT scan", "Neonatal"],
    ambulanceBay: "Cyber Towers Lane · Priority Ambulance Ingress",
    features: [
      "Certified Primary Stroke Center",
      "Pediatric & Neonatal ICU",
      "Fast-track Acute Triage",
    ],
  },
];

export const HOSPITAL = HOSPITALS[0];

export function getEmergencyType(id: EmergencyTypeId): EmergencyType {
  return EMERGENCY_TYPES.find((e) => e.id === id) ?? (EMERGENCY_TYPES[0] as EmergencyType);
}

export function scoreHospital(hospital: Hospital, type: EmergencyType) {
  const matched = type.needs.filter((n) => hospital.specialties.includes(n)).length;
  const match = (matched / type.needs.length) * 70;
  const speed = Math.max(0, 25 - (hospital.etaMin - 10) * 1.8);
  const capacity = Math.min(10, hospital.bedsFree * 1.2);
  return Math.round(Math.min(99, match + speed + capacity));
}

export function rankHospitals(typeId: EmergencyTypeId) {
  const type = getEmergencyType(typeId);
  return HOSPITALS.map((h) => ({
    hospital: h,
    score: scoreHospital(h, type),
    matched: type.needs.filter((n) => h.specialties.includes(n)),
  })).sort((a, b) => b.score - a.score);
}

const HOSPITAL_ALIASES: Record<string, string> = {
  "h-city": "h-gandhi",
  "h-apollo": "h-apollo",
  "h-neuro": "h-nims",
  "h-mother": "h-medicover",
  "h-burns": "h-osmania",
};

export function getHospital(id: string): Hospital {
  const resolvedId = HOSPITAL_ALIASES[id] ?? id;
  return HOSPITALS.find((h) => h.id === resolvedId) ?? (HOSPITALS[0] as Hospital);
}

/**
 * Detects if a message text mentions any of the 10 emergency hospitals in Hyderabad.
 */
export function detectMentionedHospital(text: string): Hospital | null {
  if (!text) return null;
  const lower = text.toLowerCase();

  // Direct name matches
  for (const h of HOSPITALS) {
    if (lower.includes(h.shortName.toLowerCase()) || lower.includes(h.name.toLowerCase())) {
      return h;
    }
  }

  // Key distinctive keywords for each Hyderabad hospital
  const keywordsMap: Record<string, string> = {
    medicover: "h-medicover",
    apollo: "h-apollo",
    gandhi: "h-gandhi",
    osmania: "h-osmania",
    nims: "h-nims",
    yashoda: "h-yashoda",
    kims: "h-kims",
    aig: "h-aig",
    continental: "h-continental",
    care: "h-care",
  };

  for (const [kw, hid] of Object.entries(keywordsMap)) {
    const regex = new RegExp(`\\b${kw}\\b`, "i");
    if (regex.test(lower)) {
      return getHospital(hid);
    }
  }

  return null;
}

/**
 * Dynamically computes 3 AI-scored emergency routes from the ambulance origin
 * to the specified destination hospital in Hyderabad.
 */
export function getRoutesForHospital(hospital: Hospital): EmergencyRoute[] {
  const dest = hospital.at;
  const start = AMBULANCE.origin; // { x: 90, y: 500 }
  const dist = hospital.distanceKm;
  const eta = hospital.etaMin;

  // Intersections determined by destination area in Hyderabad
  const isSecunderabad = hospital.city === "Secunderabad";
  const isSouth = hospital.id === "h-osmania";
  const isWest = hospital.area.includes("Gachibowli") || hospital.area.includes("HITEC");

  const intNames = isSecunderabad
    ? [
        { name: "Masab Tank Flyover", unit: "TP-21", coordinates: { lat: 17.4054, lng: 78.4481 } },
        { name: "Panjagutta Junction", unit: "TP-15", coordinates: { lat: 17.4245, lng: 78.4526 } },
        {
          name: "Begumpet Arterial Cross",
          unit: "TP-08",
          coordinates: { lat: 17.4446, lng: 78.4682 },
        },
        {
          name: `${hospital.shortName} Gate Cross`,
          unit: "TP-04",
          coordinates: {
            lat: hospital.coordinates.lat - 0.003,
            lng: hospital.coordinates.lng - 0.002,
          },
        },
      ]
    : isSouth
      ? [
          { name: "Mehdipatnam Cross", unit: "TP-21", coordinates: { lat: 17.3916, lng: 78.4398 } },
          { name: "Asif Nagar Junction", unit: "TP-15", coordinates: { lat: 17.388, lng: 78.452 } },
          { name: "City College Cross", unit: "TP-08", coordinates: { lat: 17.371, lng: 78.471 } },
          {
            name: "Afzal Gunj Bridge Cross",
            unit: "TP-04",
            coordinates: { lat: 17.374, lng: 78.4735 },
          },
        ]
      : isWest
        ? [
            {
              name: "Tolichowki Flyover",
              unit: "TP-21",
              coordinates: { lat: 17.4019, lng: 78.4117 },
            },
            {
              name: "Gachibowli ORR Junction",
              unit: "TP-15",
              coordinates: { lat: 17.4401, lng: 78.3489 },
            },
            {
              name: "Mindspace Underpass",
              unit: "TP-08",
              coordinates: { lat: 17.4385, lng: 78.38 },
            },
            {
              name: `${hospital.shortName} Access Cross`,
              unit: "TP-04",
              coordinates: {
                lat: hospital.coordinates.lat - 0.002,
                lng: hospital.coordinates.lng - 0.002,
              },
            },
          ]
        : [
            {
              name: "Masab Tank Junction",
              unit: "TP-21",
              coordinates: { lat: 17.4054, lng: 78.4481 },
            },
            {
              name: "Banjara Hills Rd 1 Cross",
              unit: "TP-15",
              coordinates: { lat: 17.4156, lng: 78.4485 },
            },
            {
              name: "Panjagutta Central Circle",
              unit: "TP-08",
              coordinates: { lat: 17.4245, lng: 78.4526 },
            },
            {
              name: `${hospital.shortName} Emergency Gate`,
              unit: "TP-04",
              coordinates: {
                lat: hospital.coordinates.lat - 0.002,
                lng: hospital.coordinates.lng - 0.002,
              },
            },
          ];

  // Path 1: Primary Flyover / Express Corridor
  const path1: Pt[] = [
    start,
    {
      x: Math.round(start.x + (dest.x - start.x) * 0.22),
      y: Math.round(start.y + (dest.y - start.y) * 0.18 - 25),
    },
    {
      x: Math.round(start.x + (dest.x - start.x) * 0.48),
      y: Math.round(start.y + (dest.y - start.y) * 0.45 - 20),
    },
    {
      x: Math.round(start.x + (dest.x - start.x) * 0.75),
      y: Math.round(start.y + (dest.y - start.y) * 0.74 - 10),
    },
    dest,
  ];

  // Path 2: Secondary Arterial Corridor
  const path2: Pt[] = [
    start,
    {
      x: Math.round(start.x + (dest.x - start.x) * 0.28 + 25),
      y: Math.round(start.y + (dest.y - start.y) * 0.25 + 35),
    },
    {
      x: Math.round(start.x + (dest.x - start.x) * 0.58 + 20),
      y: Math.round(start.y + (dest.y - start.y) * 0.6 + 30),
    },
    {
      x: Math.round(start.x + (dest.x - start.x) * 0.82 + 10),
      y: Math.round(start.y + (dest.y - start.y) * 0.85 + 15),
    },
    dest,
  ];

  // Path 3: Bypass / Outer Corridor
  const path3: Pt[] = [
    start,
    {
      x: Math.round(start.x + (dest.x - start.x) * 0.18 - 35),
      y: Math.round(start.y + (dest.y - start.y) * 0.35 - 55),
    },
    {
      x: Math.round(start.x + (dest.x - start.x) * 0.46 - 40),
      y: Math.round(start.y + (dest.y - start.y) * 0.68 - 45),
    },
    {
      x: Math.round(start.x + (dest.x - start.x) * 0.78 - 20),
      y: Math.round(start.y + (dest.y - start.y) * 0.9 - 25),
    },
    dest,
  ];

  return [
    {
      id: "r1",
      name: "Route 1",
      label: `Express Flyover Corridor → ${hospital.shortName}`,
      distanceKm: dist,
      etaMin: eta,
      traffic: "low",
      police: "Green corridor active · 4 units",
      road: "Optimal · 6-lane express",
      score: 95,
      recommended: true,
      path: path1,
      intersections: [
        {
          id: "i1",
          name: intNames[0]!.name,
          unit: intNames[0]!.unit,
          traffic: "heavy",
          distanceKm: Math.round(dist * 0.16 * 10) / 10,
          at: 0.18,
          coordinates: intNames[0]!.coordinates,
        },
        {
          id: "i2",
          name: intNames[1]!.name,
          unit: intNames[1]!.unit,
          traffic: "moderate",
          distanceKm: Math.round(dist * 0.38 * 10) / 10,
          at: 0.4,
          coordinates: intNames[1]!.coordinates,
        },
        {
          id: "i3",
          name: intNames[2]!.name,
          unit: intNames[2]!.unit,
          traffic: "low",
          distanceKm: Math.round(dist * 0.65 * 10) / 10,
          at: 0.65,
          coordinates: intNames[2]!.coordinates,
        },
        {
          id: "i4",
          name: intNames[3]!.name,
          unit: intNames[3]!.unit,
          traffic: "moderate",
          distanceKm: Math.round(dist * 0.88 * 10) / 10,
          at: 0.86,
          coordinates: intNames[3]!.coordinates,
        },
      ],
    },
    {
      id: "r2",
      name: "Route 2",
      label: `Main Arterial Road → ${hospital.shortName}`,
      distanceKm: Math.round(dist * 1.15 * 10) / 10,
      etaMin: Math.round(eta * 1.35),
      traffic: "moderate",
      police: "Partial · 2 units",
      road: "Average · urban arterial",
      score: 72,
      recommended: false,
      path: path2,
      intersections: [
        {
          id: "j1",
          name: `${intNames[0]!.name} (Surface)`,
          unit: "TP-32",
          traffic: "moderate",
          distanceKm: Math.round(dist * 0.22 * 10) / 10,
          at: 0.22,
          coordinates: {
            lat: intNames[0]!.coordinates.lat + 0.002,
            lng: intNames[0]!.coordinates.lng - 0.002,
          },
        },
        {
          id: "j2",
          name: `${intNames[1]!.name} (Inner Ring)`,
          unit: "TP-11",
          traffic: "heavy",
          distanceKm: Math.round(dist * 0.52 * 10) / 10,
          at: 0.52,
          coordinates: {
            lat: intNames[1]!.coordinates.lat - 0.003,
            lng: intNames[1]!.coordinates.lng + 0.003,
          },
        },
        {
          id: "j3",
          name: `${hospital.shortName} South Approach`,
          unit: "TP-06",
          traffic: "moderate",
          distanceKm: Math.round(dist * 0.82 * 10) / 10,
          at: 0.8,
          coordinates: {
            lat: hospital.coordinates.lat - 0.005,
            lng: hospital.coordinates.lng - 0.002,
          },
        },
      ],
    },
    {
      id: "r3",
      name: "Route 3",
      label: `Outer Ring Bypass → ${hospital.shortName}`,
      distanceKm: Math.round(dist * 1.3 * 10) / 10,
      etaMin: Math.round(eta * 1.65),
      traffic: "heavy",
      police: "Limited · Standby",
      road: "Heavy congestion · surface work",
      score: 48,
      recommended: false,
      path: path3,
      intersections: [
        {
          id: "k1",
          name: "Outer Ring Toll Gate",
          unit: "TP-27",
          traffic: "heavy",
          distanceKm: Math.round(dist * 0.25 * 10) / 10,
          at: 0.24,
          coordinates: { lat: 17.4102, lng: 78.4215 },
        },
        {
          id: "k2",
          name: "Industrial Perimeter Cross",
          unit: "TP-19",
          traffic: "heavy",
          distanceKm: Math.round(dist * 0.58 * 10) / 10,
          at: 0.56,
          coordinates: { lat: 17.4285, lng: 78.439 },
        },
        {
          id: "k3",
          name: `${hospital.shortName} North Bypass`,
          unit: "TP-02",
          traffic: "moderate",
          distanceKm: Math.round(dist * 0.85 * 10) / 10,
          at: 0.82,
          coordinates: {
            lat: hospital.coordinates.lat + 0.004,
            lng: hospital.coordinates.lng - 0.003,
          },
        },
      ],
    },
  ];
}

export const ROUTES: EmergencyRoute[] = getRoutesForHospital(HOSPITALS[0]!);

export const POLICE_UNITS = [
  {
    id: "TP-21",
    at: { x: 250, y: 462 },
    coordinates: { lat: 17.3916, lng: 78.4398 },
    area: "Mehdipatnam / Ring Road",
  },
  {
    id: "TP-15",
    at: { x: 430, y: 356 },
    coordinates: { lat: 17.4082, lng: 78.4485 },
    area: "Masab Tank / Banjara",
  },
  {
    id: "TP-08",
    at: { x: 620, y: 288 },
    coordinates: { lat: 17.426, lng: 78.4539 },
    area: "Panjagutta / Begumpet",
  },
  {
    id: "TP-04",
    at: { x: 820, y: 152 },
    coordinates: { lat: 17.4399, lng: 78.4983 },
    area: "Secunderabad / Arterial",
  },
  {
    id: "TP-32",
    at: { x: 300, y: 552 },
    coordinates: { lat: 17.4019, lng: 78.4117 },
    area: "Tolichowki / ORR",
  },
  {
    id: "TP-11",
    at: { x: 560, y: 486 },
    coordinates: { lat: 17.3753, lng: 78.4744 },
    area: "Afzal Gunj / Old City",
  },
];

export const SIGNALS = [
  {
    id: "S1",
    at: { x: 200, y: 480 },
    coordinates: { lat: 17.393, lng: 78.4385 },
    name: "Mehdipatnam Ring Signal",
  },
  {
    id: "S2",
    at: { x: 470, y: 350 },
    coordinates: { lat: 17.4065, lng: 78.4475 },
    name: "Masab Tank Express Signal",
  },
  {
    id: "S3",
    at: { x: 730, y: 210 },
    coordinates: { lat: 17.4245, lng: 78.452 },
    name: "Panjagutta Circle Signal",
  },
  {
    id: "S4",
    at: { x: 380, y: 545 },
    coordinates: { lat: 17.441, lng: 78.4735 },
    name: "Begumpet Corridor Signal",
  },
];

export const CONGESTION = [
  {
    id: "c1",
    at: { x: 330, y: 415 },
    coordinates: { lat: 17.4045, lng: 78.461 },
    level: "heavy" as TrafficLevel,
    name: "Lakdikapul Flyover Approach",
  },
  {
    id: "c2",
    at: { x: 600, y: 470 },
    coordinates: { lat: 17.374, lng: 78.476 },
    level: "heavy" as TrafficLevel,
    name: "Afzal Gunj Bridge Cross",
  },
  {
    id: "c3",
    at: { x: 520, y: 300 },
    coordinates: { lat: 17.418, lng: 78.442 },
    level: "moderate" as TrafficLevel,
    name: "Banjara Hills Road No 1",
  },
  {
    id: "c4",
    at: { x: 250, y: 250 },
    coordinates: { lat: 17.3995, lng: 78.416 },
    level: "moderate" as TrafficLevel,
    name: "Tolichowki Main Arterial",
  },
  {
    id: "c5",
    at: { x: 760, y: 300 },
    coordinates: { lat: 17.4425, lng: 78.487 },
    level: "low" as TrafficLevel,
    name: "Paradise Circle Secunderabad",
  },
];

export const HAZARDS = [
  {
    id: "h1",
    at: { x: 420, y: 170 },
    coordinates: { lat: 17.4225, lng: 78.451 },
    label: "Metro works · Panjagutta Corridor",
  },
  {
    id: "h2",
    at: { x: 660, y: 520 },
    coordinates: { lat: 17.372, lng: 78.473 },
    label: "Accident reported · Afzal Gunj South",
  },
];

export const TRIP_HISTORY = [
  {
    id: "AMB-1024",
    date: "2026-10-08",
    from: "Sector 12, Ring Road",
    hospital: "Gandhi Hospital, Secunderabad",
    km: 8.9,
    eta: 18,
    actual: 12,
    route: "Route 1 (Express Flyover)",
  },
  {
    id: "AMB-1031",
    date: "2026-10-07",
    from: "Banjara Hills Rd 1",
    hospital: "Apollo Hospitals, Jubilee Hills",
    km: 5.1,
    eta: 14,
    actual: 8,
    route: "Route 1 (Green Corridor)",
  },
  {
    id: "AMB-1008",
    date: "2026-10-07",
    from: "Mehdipatnam Junction",
    hospital: "Osmania General Hospital",
    km: 5.4,
    eta: 15,
    actual: 9,
    route: "Route 1 (Direct Express)",
  },
  {
    id: "AMB-1042",
    date: "2026-10-06",
    from: "Gachibowli ORR",
    hospital: "Continental Hospitals, Gachibowli",
    km: 13.5,
    eta: 26,
    actual: 17,
    route: "Route 1 (ORR Corridor)",
  },
  {
    id: "AMB-1017",
    date: "2026-10-05",
    from: "Panjagutta Cross",
    hospital: "NIMS, Punjagutta",
    km: 3.6,
    eta: 10,
    actual: 6,
    route: "Route 1 (Arterial)",
  },
  {
    id: "AMB-1055",
    date: "2026-10-05",
    from: "HITEC City Cyber Towers",
    hospital: "Medicover Hospitals, Hitec City",
    km: 10.8,
    eta: 22,
    actual: 14,
    route: "Route 1 (Flyover)",
  },
];

export const QUICK_MESSAGES = [
  "Ambulance approaching junction.",
  "Please clear traffic immediately.",
  "Traffic clearing in progress.",
  "Junction cleared.",
  "Ambulance passing through.",
  "Route blocked. Requesting an alternate route.",
  "Please confirm the alternate route.",
  "Ambulance has reached the hospital.",
];

export const trafficColor: Record<TrafficLevel, string> = {
  low: "var(--clear)",
  moderate: "var(--warn)",
  heavy: "var(--emergency)",
};

export function trafficClass(level: TrafficLevel) {
  return level === "low"
    ? "bg-clear/15 text-clear border-clear/30"
    : level === "moderate"
      ? "bg-warn/15 text-warn border-warn/30"
      : "bg-emergency/15 text-emergency border-emergency/30";
}

export function pointOnPath(path: Pt[], t: number): Pt {
  const clamped = Math.min(1, Math.max(0, t));
  const segs = path.length - 1;
  const scaled = clamped * segs;
  const i = Math.min(segs - 1, Math.floor(scaled));
  const f = scaled - i;
  const a = path[i] ?? { x: 0, y: 0 };
  const b = path[i + 1] ?? a;
  return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
}

export function pathD(path: Pt[]) {
  return path.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
}
