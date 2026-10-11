import { createFileRoute } from "@tanstack/react-router";
import { EmergencyMap } from "@/components/EmergencyMap";
import { DemoButton } from "@/components/DemoButton";
import { CONGESTION, HAZARDS, POLICE_UNITS, SIGNALS } from "@/lib/emergency-data";
import { StatCard } from "@/components/StatCard";
import { AlertTriangle, ShieldCheck, TrafficCone, Car } from "lucide-react";

import { useSim, getRoute } from "@/lib/sim-store";

export const Route = createFileRoute("/app/map")({
  head: () => ({
    meta: [
      { title: "Live Emergency Map | Emergency Route Assist" },
      {
        name: "description",
        content:
          "Interactive live map with ambulance, hospital, police units, signals, congestion and road blockages.",
      },
      { property: "og:title", content: "Live Emergency Map | Emergency Route Assist" },
      {
        property: "og:description",
        content: "Track the ambulance, congestion and green corridor in real time.",
      },
    ],
  }),
  component: MapPage,
});

function MapPage() {
  const sim = useSim();
  const route = getRoute(sim.selectedRouteId);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate font-display text-3xl font-bold">Live Emergency Map</h1>
          <p className="truncate text-sm text-muted-foreground">
            Ambulance, hospital, police, signals, congestion and hazards
          </p>
        </div>
        <DemoButton />
      </div>

      <EmergencyMap className="h-[520px]" showAllRoutes />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Police units online"
          value={String(route.intersections.length || POLICE_UNITS.length)}
          sub={`${route.intersections.length} deployed on route`}
          icon={ShieldCheck}
          tone="clear"
        />
        <StatCard
          label="Monitored signals"
          value={String(SIGNALS.length)}
          icon={TrafficCone}
          tone="warn"
        />
        <StatCard label="Congestion zones" value={String(CONGESTION.length)} icon={Car} />
        <StatCard
          label="Active hazards"
          value={String(HAZARDS.length)}
          sub={HAZARDS[0]?.label ?? "None"}
          icon={AlertTriangle}
          tone="emergency"
        />
      </div>
    </div>
  );
}
