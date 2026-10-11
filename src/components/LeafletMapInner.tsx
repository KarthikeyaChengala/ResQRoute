import { useEffect, useState, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import {
  useSim,
  getRoute,
  selectedHospital,
  getActiveRoutes,
  selectHospital,
  selectRoute,
  currentAmbulanceCoords,
  updateIntersectionStatus,
  pushAlert,
  pushMessage,
  toggleMessenger,
} from "@/lib/sim-store";
import {
  AMBULANCE,
  CONGESTION,
  HAZARDS,
  HOSPITALS,
  SIGNALS,
  type Hospital,
  type IntersectionStatus,
  type TrafficLevel,
} from "@/lib/emergency-data";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Navigation,
  Compass,
  Maximize2,
  Layers,
  MapPin,
  Clock,
  Sparkles,
  Phone,
  Bed,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";

// Fix Leaflet default icon path issues in bundlers
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type Props = {
  className?: string;
  showAllRoutes?: boolean;
  compact?: boolean;
  allowPinAdjustment?: boolean;
};

// --- Custom Leaflet DivIcon factories ---

function createAmbulanceIcon(heading = 45, isRunning = false) {
  return L.divIcon({
    className: "resq-ambulance-marker",
    html: `
      <div class="relative flex items-center justify-center w-11 h-11 select-none">
        <span class="absolute w-10 h-10 rounded-full bg-red-600/30 animate-ping"></span>
        <span class="absolute w-9 h-9 rounded-full bg-red-600/40 border border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]"></span>
        <div class="relative flex items-center justify-center w-8 h-8 rounded-full bg-slate-950 border border-red-500 text-base" style="transform: rotate(${heading}deg); transition: transform 0.2s ease;">
          🚑
        </div>
        ${isRunning ? '<span class="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border-2 border-slate-950 animate-pulse"></span>' : ""}
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22],
  });
}

function createAccidentIcon(label: string) {
  return L.divIcon({
    className: "resq-accident-marker",
    html: `
      <div class="relative flex flex-col items-center select-none group cursor-pointer">
        <div class="flex items-center justify-center w-9 h-9 rounded-full bg-amber-500 border-2 border-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.8)] text-slate-950 font-bold text-sm">
          📍
        </div>
        <div class="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-amber-500 -mt-0.5"></div>
        <span class="absolute -bottom-1 w-3 h-3 rounded-full bg-amber-500/50 animate-ping"></span>
      </div>
    `,
    iconSize: [36, 42],
    iconAnchor: [18, 42],
    popupAnchor: [0, -42],
  });
}

function createHospitalIcon(hospital: Hospital, isDestination: boolean) {
  if (isDestination) {
    return L.divIcon({
      className: "resq-hospital-dest-marker",
      html: `
        <div class="relative flex items-center justify-center w-11 h-11 select-none cursor-pointer">
          <span class="absolute w-11 h-11 rounded-full bg-emerald-500/30 animate-ping"></span>
          <span class="absolute w-10 h-10 rounded-full bg-emerald-500/40 border-2 border-emerald-400 shadow-[0_0_16px_rgba(16,185,129,0.8)]"></span>
          <div class="relative flex items-center justify-center w-8 h-8 rounded-full bg-slate-950 border-2 border-emerald-400 text-base">
            🏥
          </div>
          <span class="absolute -top-2 -right-1 px-1 rounded bg-emerald-500 text-[9px] font-black text-slate-950 tracking-tighter">DEST</span>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
      popupAnchor: [0, -22],
    });
  }

  return L.divIcon({
    className: "resq-hospital-marker",
    html: `
      <div class="relative flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 border border-slate-600 hover:border-emerald-400 hover:scale-110 transition-transform shadow-md select-none cursor-pointer text-sm">
        🏥
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
}

function createRoutePoliceMarkerIcon(status: IntersectionStatus, unit: string) {
  let badgeBorder = "border-blue-400 bg-slate-950 text-blue-300";
  let pulseHtml = "";
  let statusDot = "bg-blue-400";
  let arrowColor = "text-blue-400";

  if (status === "cleared") {
    badgeBorder =
      "border-emerald-400 bg-emerald-950/90 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.7)]";
    statusDot = "bg-emerald-400";
    arrowColor = "text-emerald-400";
  } else if (status === "passing") {
    badgeBorder = "border-red-500 bg-red-950/90 text-white shadow-[0_0_16px_rgba(239,68,68,0.9)]";
    pulseHtml =
      '<span class="absolute -top-1 -left-1 w-12 h-9 rounded-full bg-red-600/40 animate-ping"></span>';
    statusDot = "bg-red-500 animate-pulse";
    arrowColor = "text-red-500";
  } else if (status === "clearing") {
    badgeBorder =
      "border-amber-400 bg-amber-950/90 text-amber-300 shadow-[0_0_14px_rgba(245,158,11,0.8)]";
    pulseHtml =
      '<span class="absolute -top-1 -left-1 w-11 h-8 rounded-full bg-amber-500/30 animate-pulse"></span>';
    statusDot = "bg-amber-400";
    arrowColor = "text-amber-400";
  }

  return L.divIcon({
    className: "resq-route-police-marker",
    html: `
      <div class="relative flex flex-col items-center select-none group cursor-pointer" title="Traffic Police ${unit} (${status})">
        ${pulseHtml}
        <div class="relative flex items-center gap-1 px-1.5 py-0.5 rounded-full border-2 ${badgeBorder} shadow-lg backdrop-blur-md">
          <span class="text-xs leading-none">👮</span>
          <span class="font-mono font-black text-[10px] tracking-tight">${unit}</span>
          <span class="size-1.5 rounded-full ${statusDot}"></span>
        </div>
        <div class="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-t-current ${arrowColor} -mt-0.5"></div>
      </div>
    `,
    iconSize: [46, 30],
    iconAnchor: [23, 30],
    popupAnchor: [0, -30],
  });
}

function createHazardIcon(label: string) {
  return L.divIcon({
    className: "resq-hazard-marker",
    html: `
      <div class="relative flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 border border-amber-400 shadow-sm select-none cursor-pointer text-xs" title="${label}">
        ⚠️
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
}

// Controller component to smoothly fit map bounds
function BoundsController({
  bounds,
  shouldFit,
  onFitComplete,
}: {
  bounds: L.LatLngBoundsExpression | null;
  shouldFit: boolean;
  onFitComplete: () => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (bounds && shouldFit) {
      try {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        onFitComplete();
      } catch (e) {
        // bounds might be invalid momentarily
      }
    }
  }, [bounds, shouldFit, map, onFitComplete]);

  return null;
}

// Custom map controls component
function MapCustomControls({
  isDarkTiles,
  onToggleDarkTiles,
  onRecenter,
}: {
  isDarkTiles: boolean;
  onToggleDarkTiles: () => void;
  onRecenter: () => void;
}) {
  const map = useMap();

  return (
    <div className="absolute bottom-3 right-3 z-[1000] flex flex-col gap-1.5 shadow-lg">
      <button
        type="button"
        onClick={onRecenter}
        title="Fit route & markers to screen"
        className="flex size-8 items-center justify-center rounded-lg border border-border bg-slate-900/90 text-slate-200 backdrop-blur transition-all hover:bg-slate-800 hover:text-white"
      >
        <Maximize2 className="size-4" />
      </button>

      <button
        type="button"
        onClick={onToggleDarkTiles}
        title={isDarkTiles ? "Switch to Standard OSM Tiles" : "Switch to Dark Tactical Mode"}
        className={cn(
          "flex size-8 items-center justify-center rounded-lg border border-border backdrop-blur transition-all",
          isDarkTiles
            ? "bg-slate-900/90 text-slate-200 hover:bg-slate-800 hover:text-white"
            : "bg-emerald-600/90 text-white hover:bg-emerald-700",
        )}
      >
        <Layers className="size-4" />
      </button>

      <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-slate-900/90 backdrop-blur">
        <button
          type="button"
          onClick={() => map.zoomIn()}
          title="Zoom in"
          className="flex size-8 items-center justify-center border-b border-border/60 text-slate-200 transition-colors hover:bg-slate-800 hover:text-white font-bold text-base"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => map.zoomOut()}
          title="Zoom out"
          className="flex size-8 items-center justify-center text-slate-200 transition-colors hover:bg-slate-800 hover:text-white font-bold text-base"
        >
          −
        </button>
      </div>
    </div>
  );
}

export function LeafletMapInner({ className, showAllRoutes = false, compact = false }: Props) {
  const sim = useSim();
  const route = getRoute(sim.selectedRouteId);
  const currentHospital = selectedHospital();
  const routes = getActiveRoutes();

  const [isDarkTiles, setIsDarkTiles] = useState(true);
  const [shouldFitBounds, setShouldFitBounds] = useState(true);

  // Derive current ambulance coordinates
  const ambPos = currentAmbulanceCoords() || sim.accidentLocation.coordinates;
  const originCoords = sim.accidentLocation.coordinates;
  const destCoords = currentHospital.coordinates;

  // Primary road polyline coordinates
  const primaryPathCoords = useMemo<[number, number][]>(() => {
    if (route.geoPath && route.geoPath.length > 0) {
      return route.geoPath;
    }
    // Minimal fallback: connection between origin and destination
    return [
      [originCoords.lat, originCoords.lng],
      [destCoords.lat, destCoords.lng],
    ];
  }, [route.geoPath, originCoords.lat, originCoords.lng, destCoords.lat, destCoords.lng]);

  // Compute bounding box covering origin, destination, and the road route
  const mapBounds = useMemo<L.LatLngBounds | null>(() => {
    try {
      const b = L.latLngBounds([
        [originCoords.lat, originCoords.lng],
        [destCoords.lat, destCoords.lng],
      ]);
      if (route.geoPath && route.geoPath.length > 0) {
        route.geoPath.forEach(([lat, lng]) => b.extend([lat, lng]));
      }
      return b;
    } catch (e) {
      return null;
    }
  }, [originCoords.lat, originCoords.lng, destCoords.lat, destCoords.lng, route.geoPath]);

  // Trigger fit bounds when route or locations change
  useEffect(() => {
    setShouldFitBounds(true);
  }, [sim.selectedRouteId, sim.hospitalId, sim.accidentLocation.name]);

  // Configurable tile URL
  const env = import.meta.env as Record<string, string | undefined>;
  const tileUrl = env["VITE_OSM_TILE_URL"] || "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-border bg-navy-deep shadow-command select-none",
        className,
      )}
    >
      <MapContainer
        center={[originCoords.lat, originCoords.lng]}
        zoom={13}
        zoomControl={false}
        scrollWheelZoom={true}
        className={cn("h-full w-full", isDarkTiles && "dark-tiles")}
        style={{ height: "100%", width: "100%", minHeight: "380px" }}
      >
        {/* OpenStreetMap Tile Layer with Required Attribution */}
        <TileLayer
          url={tileUrl}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
          maxZoom={19}
        />

        {/* Bounds controller */}
        <BoundsController
          bounds={mapBounds}
          shouldFit={shouldFitBounds}
          onFitComplete={() => setShouldFitBounds(false)}
        />

        {/* Alternate routes (rendered behind primary route) */}
        {showAllRoutes &&
          routes
            .filter((r) => r.id !== route.id)
            .map((alt) => {
              const coords = alt.geoPath || [];
              if (coords.length === 0) return null;
              return (
                <Polyline
                  key={`alt-${alt.id}`}
                  positions={coords}
                  pathOptions={{
                    color: "#38bdf8",
                    weight: 3.5,
                    dashArray: "6, 10",
                    opacity: 0.55,
                  }}
                  eventHandlers={{
                    click: () => selectRoute(alt.id),
                  }}
                />
              );
            })}

        {/* Selected route: Glowing outer halo */}
        <Polyline
          positions={primaryPathCoords}
          pathOptions={{
            color: "#ef4444",
            weight: 8,
            opacity: 0.35,
            lineCap: "round",
            lineJoin: "round",
          }}
        />

        {/* Selected route: Core vibrant road path */}
        <Polyline
          positions={primaryPathCoords}
          pathOptions={{
            color: "#dc2626",
            weight: 4.5,
            opacity: 0.95,
            lineCap: "round",
            lineJoin: "round",
          }}
        />

        {/* Accident / Pickup Location Pin */}
        <Marker
          position={[originCoords.lat, originCoords.lng]}
          icon={createAccidentIcon(sim.accidentLocation.name)}
        >
          <Popup>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-amber-400">
                <MapPin className="size-3.5" />
                <span>Accident Pickup Site</span>
              </div>
              <p className="font-semibold text-foreground">{sim.accidentLocation.name}</p>
              <p className="font-mono text-[10px] text-muted-foreground">
                Lat: {originCoords.lat.toFixed(4)}°, Lng: {originCoords.lng.toFixed(4)}°
              </p>
              <p className="text-[10px] text-muted-foreground">
                Confirmed origin for emergency corridor calculation.
              </p>
            </div>
          </Popup>
        </Marker>

        {/* Active Destination Hospital Marker */}
        <Marker
          position={[destCoords.lat, destCoords.lng]}
          icon={createHospitalIcon(currentHospital, true)}
        >
          <Popup>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-400">★ ACTIVE DESTINATION</span>
                <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-300">
                  {currentHospital.level}
                </span>
              </div>
              <h4 className="font-display font-bold text-sm text-foreground">
                {currentHospital.name}
              </h4>
              <p className="text-muted-foreground text-[11px]">{currentHospital.address}</p>
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] text-muted-foreground block">Free Beds:</span>
                  <strong className="text-emerald-400 text-sm font-display">
                    {currentHospital.bedsFree}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Emergency Line:</span>
                  <strong className="text-foreground text-[11px] font-mono">
                    {currentHospital.emergencyPhone.split("/")[0]}
                  </strong>
                </div>
              </div>
            </div>
          </Popup>
        </Marker>

        {/* All other 9 verified Hyderabad Hospitals on the Map */}
        {HOSPITALS.filter((h) => h.id !== currentHospital.id).map((h) => (
          <Marker
            key={`hosp-${h.id}`}
            position={[h.coordinates.lat, h.coordinates.lng]}
            icon={createHospitalIcon(h, false)}
          >
            <Popup>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-semibold text-slate-300">
                    {h.level}
                  </span>
                  <h4 className="font-display font-bold text-sm text-foreground mt-0.5">
                    {h.name}
                  </h4>
                  <p className="text-muted-foreground text-[11px]">{h.address}</p>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-border/60 text-[11px]">
                  <span>
                    Available Beds: <b className="text-emerald-400">{h.bedsFree}</b>
                  </span>
                  <span>
                    ICU: <b className="text-foreground">{h.icuBeds}</b>
                  </span>
                </div>
                {!sim.running && (
                  <button
                    type="button"
                    onClick={() => selectHospital(h.id)}
                    className="w-full rounded bg-emerald-600 px-2.5 py-1 text-center font-bold text-white text-[11px] hover:bg-emerald-500 transition-colors shadow-sm"
                  >
                    Select as Destination Hospital
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Dynamic Route-Deployed Police Deployment Points along the active route corridor */}
        {route.intersections.map((inter) => {
          if (!inter.coordinates) return null;
          const status = sim.intersectionStatus[inter.id] ?? "idle";
          return (
            <Marker
              key={`route-police-${inter.id}-${inter.coordinates.lat}-${inter.coordinates.lng}`}
              position={[inter.coordinates.lat, inter.coordinates.lng]}
              icon={createRoutePoliceMarkerIcon(status, inter.unit)}
            >
              <Popup>
                <div className="space-y-2 text-xs min-w-[220px]">
                  <div className="flex items-center justify-between border-b border-border/60 pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">👮</span>
                      <div>
                        <span className="font-bold text-foreground text-xs leading-tight block">
                          Traffic Police {inter.unit}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {inter.officerName || "Duty Traffic Officer"}
                        </span>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                        status === "cleared"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                          : status === "passing"
                            ? "bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse"
                            : status === "clearing"
                              ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                              : "bg-blue-500/20 text-blue-400 border border-blue-500/40",
                      )}
                    >
                      {status === "clearing"
                        ? "Clearing"
                        : status === "passing"
                          ? "Passing"
                          : status === "cleared"
                            ? "Cleared"
                            : "Preparing"}
                    </span>
                  </div>

                  <div>
                    <p className="font-semibold text-foreground text-[11px] leading-snug">
                      📍 {inter.name}
                    </p>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                      <span>Dist: {inter.distanceKm} km from origin</span>
                      <span className="capitalize">Traffic: {inter.traffic}</span>
                    </div>
                    <p className="mt-0.5 text-[10px] font-mono text-muted-foreground">
                      Coords: {inter.coordinates.lat.toFixed(4)}° N,{" "}
                      {inter.coordinates.lng.toFixed(4)}° E
                    </p>
                  </div>

                  {/* Direct interactive police actions */}
                  <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-border/50">
                    <button
                      type="button"
                      onClick={() => {
                        updateIntersectionStatus(inter.id, "clearing");
                        pushAlert(
                          "Traffic clearance ordered",
                          `${inter.unit} (${inter.officerName || "Officer"}) is clearing ${inter.name}.`,
                          "warn",
                        );
                        toast.success(`${inter.unit} clearing ${inter.name}`);
                      }}
                      className={cn(
                        "rounded px-2 py-1 text-[10px] font-bold transition-colors shadow-sm",
                        status === "clearing"
                          ? "bg-amber-500/30 text-amber-300 border border-amber-500/50"
                          : "bg-amber-600 text-slate-950 hover:bg-amber-500",
                      )}
                    >
                      Clear Traffic
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        updateIntersectionStatus(inter.id, "cleared");
                        pushAlert(
                          "Intersection cleared",
                          `${inter.name} cleared by ${inter.unit}. Emergency corridor ready.`,
                          "clear",
                        );
                        toast.success(`${inter.name} marked cleared`);
                      }}
                      className={cn(
                        "rounded px-2 py-1 text-[10px] font-bold transition-colors shadow-sm",
                        status === "cleared"
                          ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/50"
                          : "bg-emerald-600 text-white hover:bg-emerald-500",
                      )}
                    >
                      Mark Cleared
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      toggleMessenger(true);
                      pushMessage(
                        "police",
                        `Unit ${inter.unit} (${inter.officerName || "Officer"}) at ${inter.name} contacting AMB-1024.`,
                      );
                      toast.info(`Connecting ${inter.unit} with AMB-1024`);
                    }}
                    className="w-full rounded border border-blue-500/40 bg-blue-950/60 px-2 py-1 text-[10px] font-semibold text-blue-300 hover:bg-blue-900/60 transition-colors"
                  >
                    💬 Radio Ambulance Driver
                  </button>

                  <p className="text-[9px] text-muted-foreground/80 italic leading-tight pt-0.5 border-t border-border/30">
                    Simulated police deployment stationed at verified road junction on route for
                    demo.
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Monitored hazards (clearly noted as simulated for demo) */}
        {!compact &&
          HAZARDS.map((h) => {
            if (!h.coordinates) return null;
            return (
              <Marker
                key={`haz-${h.id}`}
                position={[h.coordinates.lat, h.coordinates.lng]}
                icon={createHazardIcon(h.label)}
              >
                <Popup>
                  <div className="text-xs">
                    <span className="font-bold text-amber-400">⚠️ Active Road Hazard</span>
                    <p className="text-foreground text-[11px] mt-0.5">{h.label}</p>
                    <p className="text-[9px] text-muted-foreground mt-1">Simulated advisory feed</p>
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {/* Live Moving Ambulance Marker */}
        <Marker
          position={[ambPos.lat, ambPos.lng]}
          icon={createAmbulanceIcon(sim.ambulanceHeading, sim.running)}
          zIndexOffset={1000}
        >
          <Popup>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-red-500">
                <span>Ambulance AMB-1024</span>
                <span className="rounded bg-red-500/20 px-1 text-[9px] text-red-400">
                  {sim.running ? "DISPATCHED" : sim.completed ? "ARRIVED" : "STANDBY"}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Speed: <b className="text-foreground">{sim.speedKph} km/h</b> · Heading:{" "}
                <b className="text-foreground">{sim.ambulanceHeading}°</b>
              </p>
              <p className="text-[11px] text-muted-foreground">
                Destination:{" "}
                <strong className="text-foreground">{currentHospital.shortName}</strong>
              </p>
              <p className="font-mono text-[10px] text-muted-foreground">
                Coords: {ambPos.lat.toFixed(4)}° N, {ambPos.lng.toFixed(4)}° E
              </p>
            </div>
          </Popup>
        </Marker>

        {/* Tactical interactive custom controls */}
        <MapCustomControls
          isDarkTiles={isDarkTiles}
          onToggleDarkTiles={() => setIsDarkTiles((prev) => !prev)}
          onRecenter={() => setShouldFitBounds(true)}
        />
      </MapContainer>

      {/* Traffic Legend Overlay (Top Left) */}
      <div className="pointer-events-none absolute left-3 top-3 z-[1000] flex flex-col gap-1 text-[11px]">
        <div className="flex flex-wrap gap-1.5">
          {[
            ["Low", "bg-emerald-500"],
            ["Moderate", "bg-amber-500"],
            ["Heavy", "bg-red-500"],
          ].map(([label, bg]) => (
            <span
              key={label}
              className="flex items-center gap-1.5 rounded-full border border-border bg-slate-950/85 px-2.5 py-1 text-slate-300 backdrop-blur text-[10px] font-semibold"
            >
              <i className={cn("size-2 rounded-full", bg)} /> {label}
            </span>
          ))}
        </div>
        <span className="rounded border border-border/60 bg-slate-950/75 px-2 py-0.5 text-[9px] text-slate-400 font-mono backdrop-blur max-w-fit">
          Traffic conditions simulated for corridor
        </span>
      </div>

      {/* Destination Hospital Card & Live ETA Display (Top Right) */}
      <div className="pointer-events-none absolute right-3 top-3 z-[1000] rounded-xl border border-red-500/40 bg-slate-950/90 px-3.5 py-2 text-right backdrop-blur shadow-lg">
        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
          Target: {currentHospital.shortName}
        </p>
        <p className="font-display text-2xl font-black text-red-500 leading-tight">
          {sim.completed
            ? "ARRIVED"
            : `${Math.max(0, (1 - sim.progress) * route.etaMin).toFixed(1)} min`}
        </p>
        <p className="text-[10px] font-mono text-slate-400">
          {sim.completed
            ? "Transfer Active"
            : `${(Math.max(0, 1 - sim.progress) * route.distanceKm).toFixed(1)} km remaining`}
        </p>
      </div>

      {/* Corridor Grid Status Pill (Bottom Left) */}
      <div className="pointer-events-none absolute bottom-3 left-3 z-[1000] flex items-center gap-2 rounded-lg border border-border bg-slate-950/90 px-2.5 py-1 text-[10px] text-slate-300 backdrop-blur font-mono">
        <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>
          {sim.routeSource === "osrm_live"
            ? `OpenStreetMap OSRM Road · ${route.intersections.length} Police Units Deployed`
            : `OSRM Road Corridor · ${route.intersections.length} Police Units Deployed`}
        </span>
      </div>
    </div>
  );
}
