import { createFileRoute } from "@tanstack/react-router";
import { Activity, Ambulance, Clock, Gauge, MapPin, ShieldCheck, TimerReset } from "lucide-react";
import { EmergencyMap } from "@/components/EmergencyMap";
import { StatCard } from "@/components/StatCard";
import { DemoButton } from "@/components/DemoButton";
import { GreenCorridor } from "@/components/GreenCorridor";
import { getRoute, selectedHospital, useSim } from "@/lib/sim-store";
import { getEmergencyType, trafficClass } from "@/lib/emergency-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/dashboard")({
  head: () => ({
    meta: [
      { title: "Command Dashboard | Emergency Route Assist" },
      {
        name: "description",
        content:
          "Live emergency command dashboard tracking ambulances, green corridors and traffic clearance in real time.",
      },
      { property: "og:title", content: "Command Dashboard | Emergency Route Assist" },
      {
        property: "og:description",
        content:
          "Live ambulance tracking, AI routing and green corridor status in one command console.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const sim = useSim();
  const route = getRoute(sim.selectedRouteId);
  const eta = Math.max(0, (1 - sim.progress) * route.etaMin);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate font-display text-3xl font-bold">Emergency Navigation</h1>
          <p className="truncate text-sm text-muted-foreground">
            AMB-1024 · {selectedHospital().name} · {route.label}
          </p>
        </div>
        <DemoButton />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard
          label="Pickup location"
          value={
            sim.running ? "En route" : sim.accidentLocation.name.split(",")[0] || "Incident Site"
          }
          sub={
            sim.running
              ? `${route.name} (${Math.round(sim.progress * 100)}%)`
              : "Confirmed Incident Site"
          }
          icon={MapPin}
        />
        <StatCard
          label="Destination"
          value={selectedHospital().name}
          sub={selectedHospital().level}
          icon={Ambulance}
          tone="clear"
        />
        <StatCard
          label="ETA"
          value={`${eta.toFixed(1)} min`}
          sub={`${route.distanceKm} km remaining`}
          icon={Clock}
          tone="emergency"
        />
        <StatCard label="Speed" value={`${sim.speedKph} km/h`} sub="Average 48 km/h" icon={Gauge} />
        <StatCard
          label="Traffic"
          value={sim.traffic}
          sub="Live sensor feed"
          icon={Activity}
          tone={
            sim.traffic === "heavy" ? "emergency" : sim.traffic === "moderate" ? "warn" : "clear"
          }
        />
        <StatCard
          label="Emergency status"
          value={sim.completed ? "Completed" : sim.running ? "Active" : "Standby"}
          sub={`${getEmergencyType(sim.emergencyTypeId).label} · ${sim.patientLevel}`}
          icon={ShieldCheck}
          tone={sim.running ? "emergency" : "clear"}
        />
      </div>

      {sim.completed && (
        <div className="rounded-xl border border-clear/40 bg-clear/10 p-6 text-center">
          <TimerReset className="mx-auto size-8 text-clear" />
          <h2 className="mt-2 font-display text-3xl font-bold text-clear">
            Emergency Successfully Completed
          </h2>
          <p className="mt-1 text-lg font-semibold">Total Time Saved: {sim.timeSavedMin} minutes</p>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <EmergencyMap className="h-[420px]" showAllRoutes />
        <div className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-command">
          <h2 className="font-display text-lg font-bold">Trip progress</h2>
          <div className="h-2 rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-emergency transition-all"
              style={{ width: `${sim.progress * 100}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {Math.round(sim.progress * 100)}% of corridor completed
          </p>
          <div className="space-y-2 pt-2">
            {route.intersections.map((i) => (
              <div
                key={i.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{i.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {i.unit} · {i.distanceKm} km
                  </span>
                </span>
                <span
                  className={cn(
                    "shrink-0 rounded border px-2 py-0.5 text-[11px] capitalize",
                    trafficClass(i.traffic),
                  )}
                >
                  {sim.intersectionStatus[i.id] ?? "standby"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <GreenCorridor />
    </div>
  );
}
