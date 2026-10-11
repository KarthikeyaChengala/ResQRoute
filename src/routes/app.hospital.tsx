import { useState, useMemo } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  BadgeCheck,
  Building2,
  Check,
  Compass,
  Copy,
  ExternalLink,
  Eye,
  HeartPulse,
  MapPin,
  MapPinOff,
  Navigation,
  Phone,
  Radio,
  Search,
  ShieldAlert,
  Stethoscope,
  X,
  Bed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmergencyMap } from "@/components/EmergencyMap";
import { StatCard } from "@/components/StatCard";
import { DemoButton } from "@/components/DemoButton";
import {
  AMBULANCE,
  HOSPITALS,
  estimateEtaMinutes,
  getEmergencyType,
  type Hospital,
} from "@/lib/emergency-data";
import {
  getHospitalDistanceKm,
  getRoute,
  selectedHospital,
  selectHospital,
  setLocationAvailable,
  useSim,
} from "@/lib/sim-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/hospital")({
  head: () => ({
    meta: [
      { title: "Hyderabad Hospitals Directory | ResQRoute Command" },
      {
        name: "description",
        content:
          "10 verified emergency hospitals in Hyderabad with real-time routing, trauma facilities, contact numbers, and distance calculation.",
      },
      { property: "og:title", content: "Hyderabad Hospitals Directory | ResQRoute" },
      {
        property: "og:description",
        content:
          "Verified emergency trauma centers across Hyderabad with active navigation integration.",
      },
    ],
  }),
  component: HospitalPage,
});

function HospitalPage() {
  const navigate = useNavigate();
  const sim = useSim();
  const route = getRoute(sim.selectedRouteId);
  const activeHospital = selectedHospital();
  const emergency = getEmergencyType(sim.emergencyTypeId);
  const eta = Math.max(0, (1 - sim.progress) * route.etaMin);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [areaFilter, setAreaFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"nearest" | "beds" | "name">("nearest");

  // View Details Modal state
  const [selectedHospitalForDetails, setSelectedHospitalForDetails] = useState<Hospital | null>(
    null,
  );

  // Copy helper
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Unique areas for area filter
  const areas = useMemo(() => {
    const list = Array.from(new Set(HOSPITALS.map((h) => h.area)));
    return list.sort();
  }, []);

  // Filter and sort hospitals
  const filteredHospitals = useMemo(() => {
    return HOSPITALS.filter((hospital) => {
      // Search matching name, address, area, or specialties
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = hospital.name.toLowerCase().includes(query);
        const matchesAddress = hospital.address.toLowerCase().includes(query);
        const matchesArea = hospital.area.toLowerCase().includes(query);
        const matchesSpecialty = hospital.specialties.some((s) => s.toLowerCase().includes(query));
        if (!matchesName && !matchesAddress && !matchesArea && !matchesSpecialty) {
          return false;
        }
      }

      // Emergency availability filter
      if (availabilityFilter === "trauma-1") {
        if (!hospital.level.toLowerCase().includes("level 1")) return false;
      } else if (availabilityFilter === "cardiac") {
        if (!hospital.specialties.includes("Cardiac")) return false;
      } else if (availabilityFilter === "stroke") {
        if (!hospital.specialties.includes("Stroke") && !hospital.specialties.includes("Neuro"))
          return false;
      } else if (availabilityFilter === "24x7") {
        if (!hospital.has24x7Emergency) return false;
      }

      // Area filter
      if (areaFilter !== "all" && hospital.area !== areaFilter) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === "nearest") {
        if (!sim.locationAvailable) {
          return a.name.localeCompare(b.name);
        }
        const distA = getHospitalDistanceKm(a) ?? Infinity;
        const distB = getHospitalDistanceKm(b) ?? Infinity;
        return distA - distB;
      } else if (sortBy === "beds") {
        return b.bedsFree - a.bedsFree;
      } else if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });
  }, [searchQuery, availabilityFilter, areaFilter, sortBy, sim.locationAvailable]);

  // Navigate to Hospital handler
  const handleNavigateToHospital = (hospital: Hospital) => {
    if (sim.running && hospital.id !== sim.hospitalId) {
      toast.error(
        `Ambulance ${AMBULANCE.id} is currently en route to ${activeHospital.name}. Trip must be completed or reset before changing destination.`,
      );
      return;
    }

    selectHospital(hospital.id);
    toast.success(`Destination set to ${hospital.name}`, {
      description: `Emergency route calculated · Connecting to Green Corridor and Live Map.`,
      action: {
        label: "View Route",
        onClick: () => navigate({ to: "/app/navigation" }),
      },
    });

    // Seamlessly navigate to Emergency Navigation page
    navigate({ to: "/app/navigation" });
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setAvailabilityFilter("all");
    setAreaFilter("all");
    setSortBy("nearest");
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="truncate font-display text-3xl font-bold">Emergency Hospitals</h1>
            <span className="rounded-full border border-clear/40 bg-clear/10 px-2.5 py-0.5 text-xs font-semibold text-clear">
              10 Verified in Hyderabad
            </span>
          </div>
          <p className="mt-1 truncate text-sm text-muted-foreground">
            Ambulance {AMBULANCE.id} · Origin: {sim.accidentLocation.name} · Active Destination:{" "}
            <span className="font-semibold text-foreground">{activeHospital.name}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Location availability toggle to test graceful degradation */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocationAvailable(!sim.locationAvailable)}
            className={cn(
              "text-xs transition-colors",
              sim.locationAvailable ? "border-clear/40 text-clear" : "border-warn/40 text-warn",
            )}
            title="Toggle GPS availability to test graceful degradation"
          >
            {sim.locationAvailable ? (
              <>
                <Radio className="mr-1.5 size-3.5 animate-pulse text-clear" />
                GPS Online
              </>
            ) : (
              <>
                <MapPinOff className="mr-1.5 size-3.5 text-warn" />
                GPS Offline
              </>
            )}
          </Button>
          <DemoButton />
        </div>
      </div>

      {/* Active Destination / Incoming Ambulance Status Banner */}
      <div
        className={cn(
          "rounded-xl border p-6 transition-all",
          sim.running
            ? "border-emergency/60 bg-emergency/15 animate-siren"
            : "border-clear/30 bg-navy/60",
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 font-display text-2xl font-bold text-emergency">
            <HeartPulse className="size-7" />{" "}
            {sim.running ? "AMBULANCE INCOMING" : "ACTIVE DESTINATION CENTER"}
          </p>
          <span className="text-xs uppercase tracking-widest text-muted-foreground">
            {sim.running ? "En route · Green Corridor Clear" : "Selected Emergency Target"}
          </span>
        </div>

        <div className="mt-2 text-sm text-muted-foreground">
          <span className="font-bold text-foreground">{activeHospital.name}</span> ·{" "}
          {activeHospital.level} · {activeHospital.area}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Ambulance ID" value={AMBULANCE.id} sub={sim.accidentLocation.name} />
          <StatCard
            label="Live ETA"
            value={sim.completed ? "Arrived" : `${eta.toFixed(1)} min`}
            sub={`${route.distanceKm} km total corridor`}
            tone="emergency"
          />
          <StatCard
            label="Emergency Type"
            value={`${emergency.icon} ${emergency.label}`}
            sub={`Patient: ${sim.patientLevel}`}
            tone="warn"
          />
          <StatCard label="Corridor Route" value={route.name} sub={route.label} tone="clear" />
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Button
            size="lg"
            className="flex-1 font-display text-base font-bold sm:h-12"
            onClick={() =>
              toast.success(`Trauma Bay prepared at ${activeHospital.name} for AMB-1024.`)
            }
          >
            <Stethoscope className="mr-2 size-5" /> PREPARE EMERGENCY TEAM AT{" "}
            {activeHospital.shortName.toUpperCase()}
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="font-display font-semibold sm:h-12"
            onClick={() => navigate({ to: "/app/navigation" })}
          >
            <Compass className="mr-2 size-5" /> VIEW EMERGENCY NAVIGATION
          </Button>
        </div>
      </div>

      {/* Search, Filter and Sort Bar */}
      <div className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-command">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Search Input */}
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search hospital, area, address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* Emergency Availability Filter */}
          <div>
            <select
              aria-label="Filter hospitals by emergency availability"
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Emergency Services</option>
              <option value="trauma-1">Level 1 Trauma Care</option>
              <option value="cardiac">Cardiac Emergency (Cath Lab)</option>
              <option value="stroke">Stroke & Neuro Critical Care</option>
              <option value="24x7">24/7 Verified Emergency</option>
            </select>
          </div>

          {/* Area Filter */}
          <div>
            <select
              aria-label="Filter hospitals by Hyderabad area"
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Hyderabad Locations</option>
              {areas.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              aria-label="Sort hospitals list"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "nearest" | "beds" | "name")}
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="nearest">Sort: Nearest to Ambulance</option>
              <option value="beds">Sort: Most Free Beds</option>
              <option value="name">Sort: Hospital Name (A–Z)</option>
            </select>
          </div>
        </div>

        {/* Toolbar info row */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>
              Showing <strong className="text-foreground">{filteredHospitals.length}</strong> of{" "}
              <strong className="text-foreground">{HOSPITALS.length}</strong> verified hospitals
            </span>
            {!sim.locationAvailable && (
              <span className="flex items-center gap-1 rounded bg-warn/15 px-1.5 py-0.5 text-[11px] font-semibold text-warn">
                <MapPinOff className="size-3" /> Location service offline — Nearest sorting
                approximate
              </span>
            )}
          </div>
          {(searchQuery ||
            availabilityFilter !== "all" ||
            areaFilter !== "all" ||
            sortBy !== "nearest") && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="font-semibold text-emergency hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Empty State */}
      {filteredHospitals.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center shadow-command">
          <Building2 className="mx-auto size-12 text-muted-foreground/60" />
          <h2 className="mt-4 font-display text-xl font-bold">No Hospitals Match Your Search</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            No medical centers found matching &quot;{searchQuery}&quot; with the active filters.
          </p>
          <Button variant="outline" className="mt-4" onClick={handleResetFilters}>
            Clear Search & Filters
          </Button>
        </div>
      )}

      {/* Hospitals Cards Grid */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filteredHospitals.map((hospital) => {
          const isActive = hospital.id === activeHospital.id;
          const distanceKm = getHospitalDistanceKm(hospital);
          const etaEst = distanceKm !== null ? estimateEtaMinutes(distanceKm) : null;

          return (
            <div
              key={hospital.id}
              className={cn(
                "group relative flex flex-col justify-between rounded-xl border bg-card p-5 shadow-command transition-all hover:border-emergency/60",
                isActive
                  ? "border-clear/70 bg-navy/80 shadow-clear/15 ring-1 ring-clear/40"
                  : "border-border",
              )}
            >
              {/* Active Badge */}
              {isActive && (
                <div className="mb-3 inline-flex items-center gap-1.5 self-start rounded-full border border-clear/40 bg-clear/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-clear">
                  <Check className="size-3.5" /> Active Destination
                </div>
              )}

              <div>
                {/* Header: Name and Verified badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-emergency/15 text-emergency">
                        <Building2 className="size-4.5" />
                      </span>
                      <h2 className="truncate font-display text-lg font-bold text-foreground group-hover:text-emergency transition-colors">
                        {hospital.name}
                      </h2>
                    </div>
                  </div>
                  {hospital.isVerified && (
                    <span
                      title="Verified Hyderabad emergency facility"
                      className="flex shrink-0 items-center gap-1 rounded border border-clear/30 bg-clear/10 px-1.5 py-0.5 text-[11px] font-semibold text-clear"
                    >
                      <BadgeCheck className="size-3.5" /> Verified
                    </span>
                  )}
                </div>

                {/* Level / Trauma Tier Pill */}
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <span className="rounded-md border border-border bg-muted/60 px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                    {hospital.level}
                  </span>
                  <span className="rounded-md border border-border bg-muted/30 px-2 py-0.5 text-xs text-muted-foreground">
                    {hospital.area}
                  </span>
                </div>

                {/* Address */}
                <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-emergency" />
                  <span className="line-clamp-2 leading-relaxed">{hospital.address}</span>
                </div>

                {/* Contact Number */}
                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-2.5 text-xs">
                  <div className="flex items-center gap-2">
                    <Phone className="size-3.5 text-clear" />
                    <a
                      href={`tel:${hospital.phone.replace(/[^0-9+]/g, "")}`}
                      className="font-semibold text-foreground hover:text-clear hover:underline"
                    >
                      {hospital.phone}
                    </a>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(hospital.phone, `phone-${hospital.id}`)}
                    className="text-muted-foreground hover:text-foreground"
                    title="Copy phone"
                  >
                    {copiedId === `phone-${hospital.id}` ? (
                      <Check className="size-3 text-clear" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                  </button>
                </div>

                {/* Emergency Hotline */}
                <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-semibold text-warn">Emergency Hotline:</span>
                  <span className="font-mono font-bold text-foreground">
                    {hospital.emergencyPhone}
                  </span>
                </div>

                {/* Emergency Availability */}
                <div className="mt-3 rounded-lg border border-warn/25 bg-warn/10 p-2.5 text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-warn">
                    <ShieldAlert className="size-4 shrink-0" />
                    <span>Emergency Availability</span>
                  </div>
                  <p className="mt-1 text-muted-foreground leading-snug">
                    {hospital.emergencyAvailability}
                  </p>
                </div>

                {/* Distance and ETA from current ambulance location */}
                <div className="mt-3 flex items-center justify-between rounded-lg border border-border bg-navy/40 px-3 py-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Navigation className="size-4 shrink-0 text-clear" />
                    <span className="text-muted-foreground">From AMB-1024:</span>
                  </div>
                  {distanceKm !== null ? (
                    <span className="font-display font-bold text-clear">
                      {distanceKm.toFixed(1)} km · ETA ~{etaEst} min
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-warn">
                      <MapPinOff className="size-3" /> Location Unavailable
                    </span>
                  )}
                </div>

                {/* Bed Capacity and ICU Stats */}
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Bed className="size-3.5 text-muted-foreground" />
                    <span>Free Beds:</span>
                    <strong className="text-clear">{hospital.bedsFree}</strong> /{" "}
                    {hospital.totalEmergencyBeds}
                  </span>
                  <span>
                    ICU: <strong className="text-foreground">{hospital.icuBeds} beds</strong>
                  </span>
                </div>

                {/* Specialties tags */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {hospital.specialties.slice(0, 4).map((spec) => (
                    <span
                      key={spec}
                      className="rounded bg-muted/60 px-1.5 py-0.5 text-[11px] text-muted-foreground"
                    >
                      {spec}
                    </span>
                  ))}
                  {hospital.specialties.length > 4 && (
                    <span className="rounded bg-muted/40 px-1 py-0.5 text-[11px] text-muted-foreground">
                      +{hospital.specialties.length - 4} more
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 grid grid-cols-2 gap-2 border-t border-border pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedHospitalForDetails(hospital)}
                  className="w-full text-xs font-semibold"
                >
                  <Eye className="mr-1.5 size-3.5" /> View Details
                </Button>

                <Button
                  size="sm"
                  variant={isActive ? "secondary" : "default"}
                  onClick={() => handleNavigateToHospital(hospital)}
                  className={cn(
                    "w-full text-xs font-display font-bold tracking-wide",
                    isActive ? "border border-clear/50 text-clear" : "",
                  )}
                >
                  <Navigation className="mr-1.5 size-3.5" />
                  {isActive ? "ACTIVE ROUTE" : "NAVIGATE"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Map Preview with all 10 hospitals */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Hyderabad Live Map Overview</h2>
          <span className="text-xs text-muted-foreground">
            All 10 hospitals plotted · Click any hospital pin on the map to select destination
          </span>
        </div>
        <EmergencyMap className="h-[440px]" showAllRoutes />
      </div>

      {/* Hospital View Details Dialog */}
      <Dialog
        open={Boolean(selectedHospitalForDetails)}
        onOpenChange={(open) => !open && setSelectedHospitalForDetails(null)}
      >
        {selectedHospitalForDetails && (
          <DialogContent className="max-w-xl max-h-[88vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <span className="grid size-9 place-items-center rounded-lg bg-emergency/15 text-emergency">
                  <Building2 className="size-5" />
                </span>
                <div>
                  <DialogTitle className="font-display text-xl font-bold">
                    {selectedHospitalForDetails.name}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    {selectedHospitalForDetails.level} · {selectedHospitalForDetails.city}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="mt-4 space-y-4 text-sm">
              {/* Address and Directions */}
              <div className="rounded-lg border border-border bg-muted/30 p-3.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Verified Address
                </p>
                <p className="mt-1 font-medium text-foreground">
                  {selectedHospitalForDetails.address}
                </p>
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${selectedHospitalForDetails.coordinates.lat}&mlon=${selectedHospitalForDetails.coordinates.lng}#map=16/${selectedHospitalForDetails.coordinates.lat}/${selectedHospitalForDetails.coordinates.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emergency hover:underline"
                  >
                    <ExternalLink className="size-3.5" /> View on OpenStreetMap
                  </a>
                  <span className="text-muted-foreground">·</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    Lat: {selectedHospitalForDetails.coordinates.lat}° N, Lng:{" "}
                    {selectedHospitalForDetails.coordinates.lng}° E
                  </span>
                </div>
              </div>

              {/* Emergency Hotline & Contact */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border bg-navy/40 p-3">
                  <p className="text-xs font-semibold text-warn">24/7 Emergency Line</p>
                  <p className="mt-1 font-mono text-base font-bold text-foreground">
                    {selectedHospitalForDetails.emergencyPhone}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-navy/40 p-3">
                  <p className="text-xs font-semibold text-clear">General Enquiries</p>
                  <p className="mt-1 font-mono text-base font-bold text-foreground">
                    {selectedHospitalForDetails.phone}
                  </p>
                </div>
              </div>

              {/* Ambulance Bay Information */}
              <div className="rounded-lg border border-border bg-muted/30 p-3.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Ambulance Ingress & Bay Access
                </p>
                <p className="mt-1 text-foreground font-medium">
                  {selectedHospitalForDetails.ambulanceBay}
                </p>
              </div>

              {/* Emergency Service Availability */}
              <div className="rounded-lg border border-emergency/40 bg-emergency/10 p-3.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-emergency">
                  Emergency Service Capability
                </p>
                <p className="mt-1 text-foreground">
                  {selectedHospitalForDetails.emergencyAvailability}
                </p>
              </div>

              {/* Beds and Capacity */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg border border-border bg-card p-3">
                  <p className="text-[11px] uppercase text-muted-foreground">Available Beds</p>
                  <p className="mt-1 font-display text-2xl font-bold text-clear">
                    {selectedHospitalForDetails.bedsFree}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-card p-3">
                  <p className="text-[11px] uppercase text-muted-foreground">Emergency Capacity</p>
                  <p className="mt-1 font-display text-2xl font-bold text-foreground">
                    {selectedHospitalForDetails.totalEmergencyBeds}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-card p-3">
                  <p className="text-[11px] uppercase text-muted-foreground">ICU Beds</p>
                  <p className="mt-1 font-display text-2xl font-bold text-foreground">
                    {selectedHospitalForDetails.icuBeds}
                  </p>
                </div>
              </div>

              {/* Specialties */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Clinical Specialties
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedHospitalForDetails.specialties.map((spec) => (
                    <span
                      key={spec}
                      className="rounded-full border border-border bg-muted px-2.5 py-1 text-xs text-foreground"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>

              {/* Key Features */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Key Facilities
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedHospitalForDetails.features.map((feature) => (
                    <span
                      key={feature}
                      className="rounded-md border border-clear/30 bg-clear/10 px-2.5 py-1 text-xs text-clear"
                    >
                      ✓ {feature}
                    </span>
                  ))}
                </div>
              </div>

              {/* Distance from active ambulance */}
              <div className="flex items-center justify-between rounded-lg border border-border bg-navy/60 p-3">
                <div className="flex items-center gap-2">
                  <Navigation className="size-4 text-clear" />
                  <span className="text-xs text-muted-foreground">
                    Distance from {AMBULANCE.id}:
                  </span>
                </div>
                {getHospitalDistanceKm(selectedHospitalForDetails) !== null ? (
                  <span className="font-display font-bold text-clear">
                    {getHospitalDistanceKm(selectedHospitalForDetails)!.toFixed(1)} km · ETA ~
                    {estimateEtaMinutes(getHospitalDistanceKm(selectedHospitalForDetails)!)} min
                  </span>
                ) : (
                  <span className="text-xs text-warn">GPS Signal Pending</span>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-border pt-4">
              <Button variant="outline" onClick={() => setSelectedHospitalForDetails(null)}>
                Close
              </Button>
              <Button
                className="font-display font-bold"
                onClick={() => {
                  const hosp = selectedHospitalForDetails;
                  setSelectedHospitalForDetails(null);
                  handleNavigateToHospital(hosp);
                }}
              >
                <Navigation className="mr-1.5 size-4" />
                Set as Destination & Navigate
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
