import { useEffect, useState } from "react";
import { Brain, Sparkles, TimerReset } from "lucide-react";
import { getRoute, useSim } from "@/lib/sim-store";

const FACTORS = [
  "Traffic congestion",
  "Distance",
  "Estimated travel time",
  "Road closures",
  "Traffic-police availability",
  "Accident / road-block reports",
];

export function AiAnalysis() {
  const sim = useSim();
  const route = getRoute(sim.selectedRouteId);
  const [analyzing, setAnalyzing] = useState(true);

  useEffect(() => {
    setAnalyzing(true);
    const t = window.setTimeout(() => setAnalyzing(false), 1600);
    return () => window.clearTimeout(t);
  }, [sim.selectedRouteId]);

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-command sm:p-6">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-emergency/15 text-emergency">
          <Brain className="size-5" />
        </span>
        <div className="min-w-0">
          <h2 className="truncate font-display text-xl font-bold">AI Route Analysis</h2>
          <p className="truncate text-xs text-muted-foreground">
            Live model · updated every 5 seconds
          </p>
        </div>
      </div>

      {analyzing ? (
        <p className="mt-4 animate-pulse text-sm text-muted-foreground">
          Analyzing traffic, road conditions, police availability and estimated travel time…
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="rounded-lg border border-emergency/40 bg-emergency/10 p-4">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Recommended route
            </p>
            <p className="font-display text-2xl font-bold text-emergency">{route.name}</p>
            <p className="mt-2 text-sm">
              {route.recommended
                ? "Route 1 is recommended because it has lower congestion, better road conditions and traffic-police support at 4 upcoming intersections."
                : `${route.name} is currently selected manually. AI still ranks Route 1 higher due to lower congestion and stronger police coverage.`}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {FACTORS.map((f) => (
              <span
                key={f}
                className="flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 text-xs text-muted-foreground"
              >
                <Sparkles className="size-3 text-clear" /> {f}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-clear/40 bg-clear/10 p-3">
            <TimerReset className="size-5 shrink-0 text-clear" />
            <p className="font-display text-lg font-bold text-clear">
              Estimated time saved: {route.recommended ? 8 : Math.max(2, 8 - route.etaMin + 14)}{" "}
              minutes
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
