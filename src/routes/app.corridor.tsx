import { createFileRoute } from "@tanstack/react-router";
import { GreenCorridor } from "@/components/GreenCorridor";
import { EmergencyMap } from "@/components/EmergencyMap";
import { DemoButton } from "@/components/DemoButton";
import { getRoute, useSim } from "@/lib/sim-store";

export const Route = createFileRoute("/app/corridor")({
  head: () => ({
    meta: [
      { title: "Smart Green Corridor | Emergency Route Assist" },
      {
        name: "description",
        content:
          "Automatic green corridor: every intersection on the ambulance route is prepared, cleared and confirmed.",
      },
      { property: "og:title", content: "Smart Green Corridor | Emergency Route Assist" },
      {
        property: "og:description",
        content:
          "Intersection-by-intersection traffic clearance timeline for the active ambulance.",
      },
    ],
  }),
  component: CorridorPage,
});

function CorridorPage() {
  const sim = useSim();
  const route = getRoute(sim.selectedRouteId);
  const next = route.intersections.find(
    (i) => (sim.intersectionStatus[i.id] ?? "idle") !== "cleared",
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate font-display text-3xl font-bold">Smart Green Corridor</h1>
          <p className="truncate text-sm text-muted-foreground">
            Signals are pre-alerted before the ambulance arrives
          </p>
        </div>
        <DemoButton />
      </div>

      {sim.running && next && (
        <div className="animate-siren rounded-xl border border-emergency/50 bg-emergency/10 p-5">
          <p className="font-display text-2xl font-bold text-emergency">
            🚨 Ambulance approaching {next.name}
          </p>
          <p className="mt-1 text-sm">
            ETA: {Math.max(5, Math.round((next.at - sim.progress) * route.etaMin * 60))} seconds ·
            Unit {next.unit} — prepare to clear traffic.
          </p>
        </div>
      )}

      <GreenCorridor />
      <EmergencyMap className="h-[420px]" />
    </div>
  );
}
