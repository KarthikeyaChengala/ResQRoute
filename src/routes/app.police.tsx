import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  PhoneCall,
  Radio,
  ShieldCheck,
  Siren,
  TrafficCone,
  Waypoints,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmergencyMap } from "@/components/EmergencyMap";
import { CommsPanel } from "@/components/CommsPanel";
import { DemoButton } from "@/components/DemoButton";
import { trafficClass } from "@/lib/emergency-data";
import {
  acknowledgePoliceAlert,
  getRoute,
  pushAlert,
  pushMessage,
  selectedHospital,
  startClearingTraffic,
  toggleMessenger,
  updateIntersectionStatus,
  useSim,
} from "@/lib/sim-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/police")({
  head: () => ({
    meta: [
      { title: "Traffic Police Dashboard | ResQRoute Command" },
      {
        name: "description",
        content:
          "Traffic police console for ambulance alerts, intersection clearance and green corridor coordination.",
      },
      { property: "og:title", content: "Traffic Police Dashboard | ResQRoute Command" },
      {
        property: "og:description",
        content: "Receive ambulance alerts and clear intersections before the ambulance arrives.",
      },
    ],
  }),
  component: PolicePage,
});

function PolicePage() {
  const sim = useSim();
  const route = getRoute(sim.selectedRouteId);
  const hospital = selectedHospital();
  const eta = Math.max(0, (1 - sim.progress) * route.etaMin);
  const remainingKm = Math.max(0, (1 - sim.progress) * route.distanceKm);

  const isAlertActive = sim.running || sim.policeAlert.active;
  const isAcknowledged = sim.policeAlert.acknowledged;
  const isClearing = sim.policeAlert.clearing;

  const handleAcknowledge = () => {
    acknowledgePoliceAlert();
    toast.success(`Alert acknowledged for Trip ${sim.tripId}! Units alerted along ${route.name}.`);
  };

  const handleStartClearing = () => {
    startClearingTraffic();
    toast.success(
      "Green Corridor traffic clearance initiated! Traffic signals switching to priority green.",
    );
  };

  const handleOpenCommunication = () => {
    toggleMessenger(true);
    toast.info("Opened Real-Time Communication channel with AMB-1024.");
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate font-display text-3xl font-bold">Traffic Police Command</h1>
            <span className="rounded-full border border-blue-500/40 bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-400">
              Zone A · 6 Traffic Units
            </span>
          </div>
          <p className="truncate text-sm text-muted-foreground">
            Corridor Dispatch console · Trip: <b className="text-foreground">{sim.tripId}</b>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleOpenCommunication}
            className="gap-1.5 text-xs"
          >
            <MessageSquare className="size-3.5 text-blue-400" /> Open Comms
          </Button>
          <DemoButton />
        </div>
      </div>

      {/* Prominent Emergency Alert Banner & Action Console */}
      <div
        className={cn(
          "rounded-2xl border p-5 sm:p-6 transition-all shadow-command",
          isAlertActive && !isAcknowledged
            ? "animate-siren border-red-500 bg-red-950/40 ring-1 ring-red-500/50"
            : isAlertActive
              ? "border-blue-500/60 bg-blue-950/30"
              : "border-border bg-card",
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "grid size-12 place-items-center rounded-xl",
                isAlertActive
                  ? "bg-red-600 text-white animate-bounce"
                  : "bg-muted text-muted-foreground",
              )}
            >
              <Siren className="size-6" />
            </div>
            <div>
              <p className="flex items-center gap-2 font-display text-2xl font-bold text-red-500">
                {isAlertActive
                  ? "🚨 INCOMING EMERGENCY AMBULANCE ALERT"
                  : "ACTIVE AMBULANCE RADAR — STANDBY"}
              </p>
              <p className="text-xs text-muted-foreground">
                {isAlertActive
                  ? `High Priority Code Red · Published at ${sim.policeAlert.timestamp || "Just Now"}`
                  : "All corridors clear. Monitoring Hyderabad emergency network."}
              </p>
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex items-center gap-2">
            {isAcknowledged && (
              <span className="flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
                <CheckCircle2 className="size-3.5" /> Acknowledged
              </span>
            )}
            {isClearing && (
              <span className="flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400 animate-pulse">
                <Waypoints className="size-3.5" /> Clearing In Progress
              </span>
            )}
          </div>
        </div>

        {/* Essential Dispatch Details */}
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 border-t border-border/70 pt-4">
          <Field
            label="Ambulance & Trip ID"
            value={`AMB-1024 · ${sim.tripId}`}
            sub={`Pilot Status: ${sim.running ? "En route" : "Standby"}`}
          />
          <Field
            label="Accident Pickup"
            value={sim.accidentLocation.name.split(",")[0] || "Incident Site"}
            sub={`${sim.accidentLocation.coordinates.lat.toFixed(3)}° N, ${sim.accidentLocation.coordinates.lng.toFixed(3)}° E`}
          />
          <Field label="Target Hospital" value={hospital.shortName} sub={hospital.area} />
          <Field
            label="Live Distance / ETA"
            value={`${remainingKm.toFixed(1)} km · ~${eta.toFixed(1)} min`}
            sub={`Corridor: ${route.name}`}
            highlight
          />
        </div>

        {/* Action Buttons: Acknowledge Alert, Start Clearing Traffic, Open Communication */}
        {isAlertActive && (
          <div className="mt-5 flex flex-wrap gap-3 border-t border-border/70 pt-4">
            <Button
              size="lg"
              variant={isAcknowledged ? "secondary" : "default"}
              onClick={handleAcknowledge}
              className={cn(
                "flex-1 font-display font-bold text-base h-12 shadow",
                !isAcknowledged ? "bg-red-600 hover:bg-red-700 text-white animate-pulse" : "",
              )}
            >
              <CheckCircle2 className="mr-2 size-5" />
              {isAcknowledged ? "ALERT ACKNOWLEDGED" : "ACKNOWLEDGE ALERT"}
            </Button>

            <Button
              size="lg"
              variant={isClearing ? "secondary" : "outline"}
              onClick={handleStartClearing}
              className="flex-1 font-display font-bold text-base h-12 border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
            >
              <TrafficCone className="mr-2 size-5 text-amber-400" />
              {isClearing ? "CORRIDOR CLEARANCE ACTIVE" : "START CLEARING TRAFFIC"}
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={handleOpenCommunication}
              className="flex-1 font-display font-bold text-base h-12 border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
            >
              <MessageSquare className="mr-2 size-5 text-blue-400" />
              OPEN COMMUNICATION
            </Button>
          </div>
        )}
      </div>

      {/* Real Geographical Map & Nearby Police Units */}
      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold">Live Emergency Corridor Map</h2>
            <span className="text-xs text-muted-foreground">
              Tracking AMB-1024 along {route.name}
            </span>
          </div>
          <EmergencyMap className="h-[440px]" showAllRoutes />
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-command">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-bold">Duty Police Units</h2>
              <p className="text-[11px] text-muted-foreground">Deployed for {route.name}</p>
            </div>
            <span className="text-xs text-clear font-semibold font-mono">
              {route.intersections.length} Units Online
            </span>
          </div>
          <div className="mt-3 space-y-2 max-h-[380px] overflow-y-auto">
            {route.intersections.map((inter) => {
              const st = sim.intersectionStatus[inter.id] ?? "idle";
              return (
                <div
                  key={inter.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2.5 transition-colors hover:bg-muted/60"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-display font-bold text-sm text-foreground">
                        {inter.unit}
                      </span>
                      <span className="rounded bg-blue-500/20 px-1 text-[10px] text-blue-400 font-mono">
                        {inter.officerName || "Traffic Unit"}
                      </span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground mt-0.5">📍 {inter.name}</p>
                    <p className="text-[10px] text-muted-foreground/75 font-mono">
                      {inter.distanceKm} km · Traffic: {inter.traffic}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                        st === "cleared"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                          : st === "passing"
                            ? "bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse"
                            : st === "clearing"
                              ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                              : "bg-blue-500/20 text-blue-400 border border-blue-500/40",
                      )}
                    >
                      {st}
                    </span>
                    <ShieldCheck
                      className={cn(
                        "size-4 shrink-0",
                        st === "cleared" ? "text-emerald-400" : "text-blue-400",
                      )}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Emergency Route Intersections Clearance Panel */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-command sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold">Corridor Intersections Clearance</h2>
            <p className="text-xs text-muted-foreground">
              Direct police actions along {route.name} ({route.intersections.length} junctions)
            </p>
          </div>
          <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground">
            {Object.values(sim.intersectionStatus).filter((s) => s === "cleared").length} /{" "}
            {route.intersections.length} cleared
          </span>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {route.intersections.map((i, idx) => {
            const st = sim.intersectionStatus[i.id] ?? "idle";
            return (
              <div key={i.id} className="rounded-xl border border-border bg-muted/30 p-4">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                  <p className="truncate font-display text-lg font-bold">
                    Intersection {idx + 1} — {i.name}
                  </p>
                  <span
                    className={cn(
                      "shrink-0 rounded border px-2 py-0.5 text-[11px] font-semibold uppercase",
                      trafficClass(i.traffic),
                    )}
                  >
                    {st}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Distance: {i.distanceKm} km · Traffic: {i.traffic} · Assigned Unit:{" "}
                  <b>{i.unit}</b>
                  {i.officerName ? ` (${i.officerName})` : ""}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      updateIntersectionStatus(i.id, "clearing");
                      pushAlert(
                        "Traffic clearance ordered",
                        `${i.unit} is clearing ${i.name}.`,
                        "warn",
                      );
                      toast.success(`${i.unit} clearing ${i.name}`);
                    }}
                  >
                    CLEAR TRAFFIC
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      updateIntersectionStatus(i.id, "cleared");
                      pushAlert(
                        "Intersection ready",
                        `${i.name} marked ready by ${i.unit}.`,
                        "clear",
                      );
                      toast.success(`${i.name} marked cleared`);
                    }}
                  >
                    MARK CLEARED
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      toggleMessenger(true);
                      pushMessage("police", `Unit ${i.unit} contacting AMB-1024 near ${i.name}.`);
                      toast("📞 Connecting with AMB-1024…");
                    }}
                  >
                    <PhoneCall className="size-4" /> CONTACT DRIVER
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      pushAlert(
                        "Road block reported",
                        `${i.unit} reported a blockage at ${i.name}. Alternate route requested.`,
                        "emergency",
                      );
                      toast.error(`Road block reported at ${i.name}`);
                    }}
                  >
                    <AlertTriangle className="size-4" /> REPORT BLOCKAGE
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dedicated Police Comms Console */}
      <CommsPanel as="police" />
    </div>
  );
}

function Field({
  label,
  value,
  sub,
  highlight = false,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p
        className={cn(
          "truncate font-display text-xl font-bold",
          highlight ? "text-red-500" : "text-foreground",
        )}
      >
        {value}
      </p>
      {sub && <p className="truncate text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
