import { createFileRoute } from "@tanstack/react-router";
import { DemoButton } from "@/components/DemoButton";
import { CommsPanel } from "@/components/CommsPanel";
import { useSim } from "@/lib/sim-store";
import { cn } from "@/lib/utils";

const STEPS = [
  "Detect ambulance location",
  "Find nearby traffic police",
  "Calculate 3 possible routes",
  "Select the fastest safe route",
  "Notify traffic police along the route",
  "Notify upcoming intersections",
  "Continuously monitor traffic",
  "Recalculate route on change",
  "Notify hospital about ETA",
];

export const Route = createFileRoute("/app/alerts")({
  head: () => ({
    meta: [
      { title: "Emergency Alerts | Emergency Route Assist" },
      {
        name: "description",
        content:
          "Real-time emergency alert feed for ambulance trips, intersection clearance and route recalculation.",
      },
      { property: "og:title", content: "Emergency Alerts | Emergency Route Assist" },
      {
        property: "og:description",
        content: "Every alert from trip start to hospital arrival, in real time.",
      },
    ],
  }),
  component: AlertsPage,
});

function AlertsPage() {
  const sim = useSim();
  const activeStep = sim.completed
    ? STEPS.length
    : sim.running
      ? Math.min(STEPS.length, 4 + Math.floor(sim.progress * 5))
      : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate font-display text-3xl font-bold">Emergency Alert System</h1>
          <p className="truncate text-sm text-muted-foreground">
            Automated 9-step emergency dispatch pipeline
          </p>
        </div>
        <DemoButton />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-command">
          <h2 className="font-display text-lg font-bold">Dispatch pipeline</h2>
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-3">
              <span
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold",
                  i < activeStep
                    ? "bg-clear text-clear-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {i + 1}
              </span>
              <span
                className={cn(
                  "min-w-0 truncate text-sm",
                  i < activeStep ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {s}
              </span>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-command">
          <h2 className="font-display text-lg font-bold">Live alert feed</h2>
          <div className="mt-3 space-y-3" style={{ maxHeight: 460, overflowY: "auto" }}>
            {sim.alerts.map((a) => (
              <div
                key={a.id}
                className={cn(
                  "rounded-lg border p-3",
                  a.tone === "emergency"
                    ? "border-emergency/50 bg-emergency/10"
                    : a.tone === "warn"
                      ? "border-warn/40 bg-warn/10"
                      : a.tone === "clear"
                        ? "border-clear/40 bg-clear/10"
                        : "border-border bg-muted/40",
                )}
              >
                <p className="flex items-center justify-between gap-2 font-display text-base font-bold">
                  <span className="min-w-0 truncate">{a.title}</span>
                  <span className="shrink-0 text-[11px] font-normal text-muted-foreground">
                    {a.time}
                  </span>
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{a.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <CommsPanel as="driver" />
    </div>
  );
}
