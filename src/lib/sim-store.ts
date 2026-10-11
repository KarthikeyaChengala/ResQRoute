import { useSyncExternalStore } from "react";
import {
  AMBULANCE,
  HOSPITALS,
  getEmergencyType,
  getHospital,
  getRoutesForHospital,
  rankHospitals,
  pointOnPath,
  calculateHaversineDistanceKm,
  type EmergencyRoute,
  type EmergencyTypeId,
  type IntersectionStatus,
  type TrafficLevel,
  type Hospital,
} from "./emergency-data";
import { calculateRoadRoute, type RoutingResult } from "./routing-service";
import {
  publishEmergencyAlert,
  sendTripMessage,
  subscribeEmergencyAlerts,
  subscribeTripMessages,
  type CommsMessage,
  type EmergencyTripAlert,
} from "./realtime-comms";

export type AlertItem = {
  id: number;
  time: string;
  title: string;
  body: string;
  tone: "emergency" | "clear" | "warn" | "info";
};

export type ChatMessage = {
  id: number;
  from: "driver" | "police" | "system";
  text: string;
  time: string;
};

export type AccidentLocationState = {
  name: string;
  coordinates: { lat: number; lng: number };
  isConfirmed: boolean;
};

export type PoliceAlertState = {
  active: boolean;
  acknowledged: boolean;
  clearing: boolean;
  timestamp: string;
};

export type MessengerState = {
  isOpen: boolean;
  isMinimized: boolean;
  unreadCount: number;
};

export type SimState = {
  tripId: string;
  running: boolean;
  completed: boolean;
  progress: number; // 0..1
  selectedRouteId: string;
  elapsedSec: number;
  speedKph: number;
  traffic: TrafficLevel;
  intersectionStatus: Record<string, IntersectionStatus>;
  alerts: AlertItem[];
  messages: ChatMessage[];
  rerouted: boolean;
  timeSavedMin: number;
  patientLevel: "Critical" | "Serious" | "Stable";
  emergencyTypeId: EmergencyTypeId;
  hospitalId: string;
  userSelectedHospital: boolean;
  locationAvailable: boolean;

  // Upgraded real-world attributes
  accidentLocation: AccidentLocationState;
  customRoutes: EmergencyRoute[] | null;
  isCalculatingRoute: boolean;
  routeError: string | null;
  routeSource: "osrm_live" | "arterial_fallback" | "preset";
  isDemoMode: boolean; // true = Simulated drive along geometry, false = GPS tracking
  policeAlert: PoliceAlertState;
  messenger: MessengerState;
  ambulanceHeading: number;
};

const now = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

let uid = 100;

const defaultHospitalId = HOSPITALS[0]!.id; // Gandhi Hospital, Secunderabad

const initial = (): SimState => ({
  tripId: `TRIP-HYD-${Math.floor(1000 + Math.random() * 9000)}`,
  running: false,
  completed: false,
  progress: 0,
  selectedRouteId: "r1",
  elapsedSec: 0,
  speedKph: 0,
  traffic: "low",
  intersectionStatus: {},
  alerts: [
    {
      id: uid++,
      time: now(),
      title: "ResQRoute Command Online",
      body: `Emergency Route Assist connected to 6 traffic police units and 10 verified Hyderabad hospitals. Ambulance ${AMBULANCE.id} ready at ${AMBULANCE.locationName}.`,
      tone: "info",
    },
  ],
  messages: [
    {
      id: uid++,
      from: "police",
      text: "Hyderabad Traffic Command standing by. Select destination hospital and report when trip commences.",
      time: now(),
    },
  ],
  rerouted: false,
  timeSavedMin: 0,
  patientLevel: "Critical",
  emergencyTypeId: "trauma",
  hospitalId: defaultHospitalId,
  userSelectedHospital: false,
  locationAvailable: true,

  // Real accident location (defaults to initial sector 12 location, confirmed)
  accidentLocation: {
    name: "Sector 12, Ring Road (Mehdipatnam Corridor)",
    coordinates: { lat: 17.3984, lng: 78.442 },
    isConfirmed: true,
  },
  customRoutes: null,
  isCalculatingRoute: false,
  routeError: null,
  routeSource: "preset",
  isDemoMode: true,
  policeAlert: {
    active: false,
    acknowledged: false,
    clearing: false,
    timestamp: "",
  },
  messenger: {
    isOpen: false,
    isMinimized: false,
    unreadCount: 0,
  },
  ambulanceHeading: 45,
});

let state: SimState = initial();
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

// Initialize cross-tab alert listener
if (typeof window !== "undefined") {
  subscribeEmergencyAlerts((incomingAlert) => {
    if (incomingAlert && incomingAlert.status === "active") {
      set({
        policeAlert: {
          active: true,
          acknowledged: false,
          clearing: false,
          timestamp: incomingAlert.timeStr,
        },
      });
    } else if (incomingAlert && incomingAlert.status === "acknowledged") {
      set({
        policeAlert: {
          ...state.policeAlert,
          acknowledged: true,
        },
      });
    } else if (incomingAlert && incomingAlert.status === "clearing") {
      set({
        policeAlert: {
          ...state.policeAlert,
          clearing: true,
        },
      });
    }
  });

  // Calculate real road route on application boot
  setTimeout(() => {
    calculateRealRouteForTrip().catch(() => {});
  }, 200);
}

function emit() {
  listeners.forEach((l) => l());
}

function set(patch: Partial<SimState>) {
  state = { ...state, ...patch };
  emit();
}

export function selectedHospital(): Hospital {
  return getHospital(state.hospitalId);
}

export function getActiveRoutes(): EmergencyRoute[] {
  if (state.customRoutes && state.customRoutes.length > 0) {
    return state.customRoutes;
  }
  const defaultRoutes = getRoutesForHospital(selectedHospital());
  // Augment default routes with initial geoPath if missing
  return defaultRoutes.map((r) => {
    if (!r.geoPath) {
      const hosp = selectedHospital();
      const origin = state.accidentLocation.coordinates;
      r.geoPath = [
        [origin.lat, origin.lng],
        [
          origin.lat + (hosp.coordinates.lat - origin.lat) * 0.35 + 0.003,
          origin.lng + (hosp.coordinates.lng - origin.lng) * 0.35,
        ],
        [
          origin.lat + (hosp.coordinates.lat - origin.lat) * 0.7 - 0.002,
          origin.lng + (hosp.coordinates.lng - origin.lng) * 0.7,
        ],
        [hosp.coordinates.lat, hosp.coordinates.lng],
      ];
    }
    return r;
  });
}

export function getRoute(id = state.selectedRouteId): EmergencyRoute {
  const routes = getActiveRoutes();
  return routes.find((r) => r.id === id) ?? (routes[0] as EmergencyRoute);
}

export function pushAlert(title: string, body: string, tone: AlertItem["tone"] = "info") {
  set({ alerts: [{ id: uid++, time: now(), title, body, tone }, ...state.alerts].slice(0, 40) });
}

export function pushMessage(from: ChatMessage["from"], text: string) {
  set({ messages: [...state.messages, { id: uid++, from, text, time: now() }].slice(-60) });
  // Also send to realtime broadcast channel for cross-tab sync
  sendTripMessage(state.tripId, from, text);
}

export function selectRoute(id: string) {
  if (state.running) return;
  set({ selectedRouteId: id });
}

export function selectHospital(id: string) {
  if (state.running) return;
  const hospital = getHospital(id);
  set({
    hospitalId: hospital.id,
    selectedRouteId: "r1",
    userSelectedHospital: true,
    customRoutes: null,
  });

  pushAlert(
    `Destination selected: ${hospital.name}`,
    `Emergency destination updated to ${hospital.name}. Calculating real road route from ${state.accidentLocation.name}.`,
    "info",
  );

  // Automatically recalculate road route to new destination
  calculateRealRouteForTrip(state.accidentLocation.coordinates, hospital.id);
}

export function setEmergencyType(id: EmergencyTypeId) {
  if (state.running) return;
  const type = getEmergencyType(id);
  const best = rankHospitals(id)[0]!;

  const patch: Partial<SimState> = {
    emergencyTypeId: id,
    patientLevel: type.patientLevel,
  };

  if (!state.userSelectedHospital) {
    patch.hospitalId = best.hospital.id;
    patch.customRoutes = null;
  }

  set(patch);

  pushAlert(
    `Emergency type: ${type.label}`,
    `Requirements updated (${type.needs.join(", ")}). Top recommended facility: ${best.hospital.name} (Match score: ${best.score}).`,
    "warn",
  );

  if (!state.userSelectedHospital) {
    calculateRealRouteForTrip(state.accidentLocation.coordinates, best.hospital.id);
  }
}

export function setPatientLevel(level: SimState["patientLevel"]) {
  set({ patientLevel: level });
}

export function setLocationAvailable(available: boolean) {
  set({ locationAvailable: available });
  pushAlert(
    available ? "Ambulance GPS Restored" : "Ambulance GPS Signal Lost",
    available
      ? `Real-time coordinates active at ${state.accidentLocation.coordinates.lat}° N, ${state.accidentLocation.coordinates.lng}° E.`
      : "Operating in manual coordinate mode. Distance calculations suspended.",
    available ? "clear" : "warn",
  );
}

export function setDemoMode(isDemo: boolean) {
  set({ isDemoMode: isDemo });
  pushAlert(
    isDemo ? "Demo Simulation Mode Active" : "Live GPS Mode Active",
    isDemo
      ? "Simulating ambulance driving along actual road route geometry for hackathon presentation."
      : "Tracking live browser GPS device position.",
    "info",
  );
}

/**
 * Updates the confirmed accident location coordinates & address.
 */
export function setAccidentLocation(
  name: string,
  coords: { lat: number; lng: number },
  confirmed = true,
) {
  if (state.running) return;

  set({
    accidentLocation: {
      name,
      coordinates: coords,
      isConfirmed: confirmed,
    },
  });

  if (confirmed) {
    pushAlert(
      "Accident Location Confirmed",
      `Location confirmed at ${name} (${coords.lat.toFixed(4)}° N, ${coords.lng.toFixed(4)}° E). Ready to calculate emergency road route.`,
      "clear",
    );
    // Recalculate route automatically from new accident location
    calculateRealRouteForTrip(coords, state.hospitalId);
  }
}

/**
 * Calculates genuine road routing from accident location to destination hospital.
 */
export async function calculateRealRouteForTrip(
  originCoords = state.accidentLocation.coordinates,
  hospitalId = state.hospitalId,
) {
  const hospital = getHospital(hospitalId);

  set({ isCalculatingRoute: true, routeError: null });

  try {
    const res: RoutingResult = await calculateRoadRoute(
      originCoords,
      hospital.coordinates,
      hospital.shortName,
      hospital.id,
    );

    // Guard: Only apply route if the hospital hasn't been changed while computing
    if (state.hospitalId !== hospital.id) {
      return;
    }

    set({
      customRoutes: res.routes,
      selectedRouteId: res.routes[0]?.id || "r1",
      routeSource: res.source,
      isCalculatingRoute: false,
      routeError: null,
    });

    const best = res.routes[0]!;
    pushAlert(
      "Road Route Calculated",
      `OpenStreetMap live road routing resolved: ${best.distanceKm} km · ETA ${best.etaMin} min (${best.intersections.length} corridor intersections detected).`,
      "clear",
    );
  } catch (err: unknown) {
    console.error("Routing calculation failed:", err);
    set({
      isCalculatingRoute: false,
      routeError: "Unable to calculate road route via OSRM. Please check internet connection.",
      customRoutes: null,
    });
    pushAlert(
      "Road Routing Unavailable",
      "Unable to fetch real road route from OpenStreetMap OSRM server. Please check internet connection.",
      "warn",
    );
  }
}

/**
 * Computes coordinate and heading along a geographical polyline at progress t (0..1).
 */
export function pointOnGeoPolyline(
  coords: [number, number][],
  t: number,
): { lat: number; lng: number; heading: number } {
  if (!coords || coords.length === 0) {
    return { lat: 17.3984, lng: 78.442, heading: 45 };
  }
  if (coords.length === 1 || t <= 0) {
    const next = coords[1] || coords[0]!;
    const h = calculateBearing(coords[0]![0], coords[0]![1], next[0], next[1]);
    return { lat: coords[0]![0], lng: coords[0]![1], heading: h };
  }
  if (t >= 1) {
    const prev = coords[coords.length - 2] || coords[coords.length - 1]!;
    const last = coords[coords.length - 1]!;
    const h = calculateBearing(prev[0], prev[1], last[0], last[1]);
    return { lat: last[0], lng: last[1], heading: h };
  }

  const clamped = Math.min(1, Math.max(0, t));
  const segs = coords.length - 1;
  const scaled = clamped * segs;
  const i = Math.min(segs - 1, Math.floor(scaled));
  const f = scaled - i;

  const a = coords[i]!;
  const b = coords[i + 1] || a;

  const lat = a[0] + (b[0] - a[0]) * f;
  const lng = a[1] + (b[1] - a[1]) * f;
  const heading = calculateBearing(a[0], a[1], b[0], b[1]);

  return { lat, lng, heading };
}

function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.cos(dLon);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return Math.round((brng + 360) % 360);
}

export function resetSim() {
  if (timer) clearInterval(timer);
  timer = null;
  state = initial();
  emit();
}

export function ambulancePosition() {
  if (state.progress <= 0) return AMBULANCE.origin;
  return pointOnPath(getRoute().path, state.progress);
}

/**
 * Returns current real-world geographical coordinates of the ambulance.
 */
export function currentAmbulanceCoords(): { lat: number; lng: number } | null {
  if (!state.locationAvailable) return null;
  const route = getRoute();

  if (route.geoPath && route.geoPath.length > 0) {
    const pt = pointOnGeoPolyline(route.geoPath, state.progress);
    return { lat: pt.lat, lng: pt.lng };
  }

  const origin = state.accidentLocation.coordinates;
  const hosp = selectedHospital();
  const t = state.progress;
  return {
    lat: Math.round((origin.lat + (hosp.coordinates.lat - origin.lat) * t) * 10000) / 10000,
    lng: Math.round((origin.lng + (hosp.coordinates.lng - origin.lng) * t) * 10000) / 10000,
  };
}

export function getHospitalDistanceKm(hospital: Hospital): number | null {
  if (!state.locationAvailable) return null;
  const cur = currentAmbulanceCoords();
  if (!cur) return null;
  return calculateHaversineDistanceKm(
    cur.lat,
    cur.lng,
    hospital.coordinates.lat,
    hospital.coordinates.lng,
  );
}

export function etaMinutes() {
  const route = getRoute();
  const remaining = (1 - state.progress) * route.etaMin;
  return Math.max(0, remaining);
}

/**
 * Starts emergency navigation trip:
 * - Validates location and calculated route
 * - Activates trip ID
 * - Broadcasts police alert
 * - Opens Real-Time Communication messenger
 * - Begins simulation along actual road geometry
 */
export function startTrip() {
  if (state.running) return;

  const route = getRoute();
  const hosp = selectedHospital();
  const emergencyType = getEmergencyType(state.emergencyTypeId);
  const tripId = `TRIP-HYD-${Math.floor(1000 + Math.random() * 9000)}`;

  set({
    tripId,
    running: true,
    completed: false,
    progress: 0,
    elapsedSec: 0,
    speedKph: 54,
    intersectionStatus: Object.fromEntries(route.intersections.map((i) => [i.id, "preparing"])),
    policeAlert: {
      active: true,
      acknowledged: false,
      clearing: false,
      timestamp: now(),
    },
    messenger: {
      isOpen: true, // Automatically open messenger popup
      isMinimized: false,
      unreadCount: 0,
    },
  });

  const alertPayload: EmergencyTripAlert = {
    tripId,
    ambulanceId: AMBULANCE.id,
    emergencyType: emergencyType.label,
    patientLevel: state.patientLevel,
    pickupLocation: state.accidentLocation.name,
    destinationHospital: hosp.name,
    distanceKm: route.distanceKm,
    etaMin: route.etaMin,
    timestamp: new Date().toISOString(),
    timeStr: now(),
    status: "active",
  };

  // Broadcast alert across tabs/devices to police console
  publishEmergencyAlert(alertPayload);

  pushAlert(
    "🚨 EMERGENCY TRIP INITIATED",
    `Ambulance ${AMBULANCE.id} dispatched from ${state.accidentLocation.name} to ${hosp.name}. Selected path: ${route.name} (${route.distanceKm} km · ETA ${route.etaMin} min). Traffic units alerted: ${route.intersections.length}.`,
    "emergency",
  );

  // Initialize messaging session
  sendTripMessage(
    tripId,
    "system",
    `🚨 Emergency navigation activated for ${tripId}. Ambulance ${AMBULANCE.id} en route to ${hosp.name} via ${route.name} (${route.distanceKm} km).`,
  );
  sendTripMessage(
    tripId,
    "driver",
    `Departing accident location at ${state.accidentLocation.name}. Emergency type: ${emergencyType.label}. Requesting immediate traffic clearance.`,
  );

  timer = setInterval(tick, 250);
}

export function acknowledgePoliceAlert() {
  set({
    policeAlert: {
      ...state.policeAlert,
      acknowledged: true,
    },
  });

  pushAlert(
    "Police Alert Acknowledged",
    "Traffic Police Command has acknowledged incoming emergency and assigned priority clearance.",
    "clear",
  );

  sendTripMessage(
    state.tripId,
    "police",
    `Alert acknowledged. Traffic units deployed along ${getRoute().name}. Green corridor being prepared.`,
  );
}

export function startClearingTraffic() {
  const route = getRoute();
  const nextStatuses = { ...state.intersectionStatus };
  route.intersections.forEach((i, idx) => {
    if (idx === 0) nextStatuses[i.id] = "clearing";
    else nextStatuses[i.id] = "preparing";
  });

  set({
    policeAlert: {
      ...state.policeAlert,
      clearing: true,
    },
    intersectionStatus: nextStatuses,
  });

  pushAlert(
    "Traffic Clearance Commenced",
    `Police units are clearing intersections along ${route.name} toward ${selectedHospital().name}.`,
    "warn",
  );

  sendTripMessage(
    state.tripId,
    "police",
    `Traffic clearance initiated. Signals switching to priority green corridor.`,
  );
}

export function updateIntersectionStatus(id: string, status: IntersectionStatus) {
  set({
    intersectionStatus: {
      ...state.intersectionStatus,
      [id]: status,
    },
  });
}

export function toggleMessenger(open?: boolean) {
  const nextOpen = open !== undefined ? open : !state.messenger.isOpen;
  set({
    messenger: {
      ...state.messenger,
      isOpen: nextOpen,
      unreadCount: nextOpen ? 0 : state.messenger.unreadCount,
    },
  });
}

export function toggleMessengerMinimize(minimized?: boolean) {
  const nextMin = minimized !== undefined ? minimized : !state.messenger.isMinimized;
  set({
    messenger: {
      ...state.messenger,
      isMinimized: nextMin,
      unreadCount: nextMin ? state.messenger.unreadCount : 0,
    },
  });
}

export function incrementMessengerUnread() {
  if (state.messenger.isMinimized || !state.messenger.isOpen) {
    set({
      messenger: {
        ...state.messenger,
        unreadCount: state.messenger.unreadCount + 1,
      },
    });
  }
}

function tick() {
  if (!state.running) return;
  const route = getRoute();
  // Duration calculation: ~etaMin * 1.05s in simulation
  const step = 1 / (route.etaMin * 4.2);
  const progress = Math.min(1, state.progress + step);
  const statuses = { ...state.intersectionStatus };

  for (const inter of route.intersections) {
    const gap = inter.at - progress;
    const prev = statuses[inter.id];
    let next: IntersectionStatus = prev ?? "preparing";
    if (gap > 0.22) next = "preparing";
    else if (gap > 0.03) next = "clearing";
    else if (gap > -0.04) next = "passing";
    else next = "cleared";

    if (next !== prev) {
      statuses[inter.id] = next;
      if (next === "clearing") {
        pushAlert(
          `🚨 Ambulance approaching ${inter.name}`,
          `ETA: ${Math.max(5, Math.round(gap * route.etaMin * 60))} seconds. Unit ${inter.unit} — prepare to clear traffic.`,
          "warn",
        );
      }
      if (next === "cleared") {
        pushAlert(
          `${inter.name} cleared`,
          `Unit ${inter.unit} confirms ambulance passed. Signals restored.`,
          "clear",
        );
      }
    }
  }

  let rerouted = state.rerouted;
  if (!rerouted && progress > 0.42 && progress < 0.5) {
    rerouted = true;
    pushAlert(
      "Traffic clearance update",
      "Green corridor prioritized express lane clearance. 1.8 min saved.",
      "warn",
    );
  }

  const speed = 44 + Math.round(Math.sin(progress * 12) * 8) + (progress > 0.5 ? 10 : 0);
  const traffic: TrafficLevel = progress < 0.3 ? "moderate" : "low";

  // Compute compass heading along route geometry
  let heading = state.ambulanceHeading;
  if (route.geoPath && route.geoPath.length > 1) {
    const pt = pointOnGeoPolyline(route.geoPath, progress);
    heading = pt.heading;
  }

  set({
    progress,
    elapsedSec: state.elapsedSec + 0.25,
    speedKph: speed,
    traffic,
    rerouted,
    intersectionStatus: statuses,
    ambulanceHeading: heading,
  });

  if (progress >= 1) {
    if (timer) clearInterval(timer);
    timer = null;
    const hosp = selectedHospital();
    const saved = Math.max(4, Math.round(route.etaMin * 0.45));
    set({
      running: false,
      completed: true,
      speedKph: 0,
      timeSavedMin: saved,
    });

    pushAlert(
      "Emergency Successfully Completed",
      `Ambulance ${AMBULANCE.id} arrived safely at ${hosp.name}. Total time saved: ${saved} minutes. Trauma team received patient.`,
      "clear",
    );

    sendTripMessage(
      state.tripId,
      "driver",
      `Ambulance has reached ${hosp.name}. Patient transfer underway. Thank you for corridor clearance!`,
      undefined,
      true,
    );

    sendTripMessage(
      state.tripId,
      "system",
      `Trip ${state.tripId} completed successfully. Normal traffic signal cycles restored.`,
    );
  }
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useSim(): SimState {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => state,
  );
}
