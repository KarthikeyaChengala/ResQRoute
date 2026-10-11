import { Check, Clock, Gauge, Route as RouteIcon, ShieldCheck } from "lucide-react";
import { trafficClass } from "@/lib/emergency-data";
import { getActiveRoutes, selectRoute, useSim } from "@/lib/sim-store";
import { cn } from "@/lib/utils";

export function RouteOptions() {
  const sim = useSim();
  const routes = getActiveRoutes();

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {routes.map((r) => {
        const active = r.id === sim.selectedRouteId;
        return (
          <button
            key={r.id}
            type="button"
            onClick={() => selectRoute(r.id)}
            disabled={sim.running}
            className={cn(
              "rounded-xl border bg-card p-4 text-left transition-all disabled:cursor-not-allowed",
              active
                ? "border-emergency shadow-emergency"
                : "border-border hover:border-emergency/50",
            )}
          >
            {r.recommended && (
              <span className="mb-2 inline-block rounded-md bg-emergency px-2 py-1 font-display text-[11px] font-bold uppercase tracking-widest text-emergency-foreground">
                Best Route — Fastest Arrival
              </span>
            )}
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display text-xl font-bold">{r.name}</h3>
              {active && <Check className="size-5 shrink-0 text-emergency" />}
            </div>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{r.label}</p>

            <dl className="mt-4 space-y-2 text-sm">
              <Row icon={RouteIcon} label="Distance" value={`${r.distanceKm} km`} />
              <Row icon={Clock} label="ETA" value={`${r.etaMin} min`} />
              <div className="flex items-center justify-between gap-2">
                <dt className="flex items-center gap-2 text-muted-foreground">
                  <Gauge className="size-4" /> Traffic
                </dt>
                <dd>
                  <span
                    className={cn(
                      "rounded-md border px-2 py-0.5 text-xs font-semibold capitalize",
                      trafficClass(r.traffic),
                    )}
                  >
                    {r.traffic}
                  </span>
                </dd>
              </div>
              <Row icon={ShieldCheck} label="Police support" value={r.police} />
              <Row label="Road condition" value={r.road} />
            </dl>

            <div className="mt-4">
              <div className="flex justify-between text-[11px] uppercase tracking-widest text-muted-foreground">
                <span>AI score</span>
                <span>{r.score}/100</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full",
                    r.score > 85 ? "bg-clear" : r.score > 60 ? "bg-warn" : "bg-emergency",
                  )}
                  style={{ width: `${r.score}%` }}
                />
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon?: typeof Clock; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="flex min-w-0 items-center gap-2 text-muted-foreground">
        {Icon && <Icon className="size-4 shrink-0" />} {label}
      </dt>
      <dd className="truncate font-semibold">{value}</dd>
    </div>
  );
}
