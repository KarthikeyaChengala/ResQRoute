import { Ambulance, Building2 } from "lucide-react";
import { getRoute, selectedHospital, useSim } from "@/lib/sim-store";
import { trafficClass, type IntersectionStatus } from "@/lib/emergency-data";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<IntersectionStatus, string> = {
  idle: "Standby",
  preparing: "Preparing",
  clearing: "Clearing Traffic",
  passing: "Ambulance Passing",
  cleared: "Cleared",
};

function statusClass(s: IntersectionStatus) {
  return s === "cleared"
    ? "bg-clear/15 text-clear border-clear/40"
    : s === "passing"
      ? "bg-emergency/20 text-emergency border-emergency/50 animate-siren"
      : s === "clearing"
        ? "bg-warn/15 text-warn border-warn/40"
        : "bg-muted text-muted-foreground border-border";
}

export function GreenCorridor() {
  const sim = useSim();
  const route = getRoute(sim.selectedRouteId);
  const hospital = selectedHospital();

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-command sm:p-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
        <div className="min-w-0">
          <h2 className="truncate font-display text-xl font-bold">Smart Green Corridor</h2>
          <p className="truncate text-xs text-muted-foreground">
            Signals and intersections auto-detected along {route.name}
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-clear/40 bg-clear/10 px-3 py-1 text-xs font-semibold text-clear">
          {Object.values(sim.intersectionStatus).filter((s) => s === "cleared").length}/
          {route.intersections.length} cleared
        </span>
      </div>

      <div className="mt-6 overflow-x-auto pb-2">
        <div className="flex min-w-max items-stretch gap-3">
          <Node
            icon={<Ambulance className="size-5" />}
            title="Ambulance AMB-1024"
            sub={sim.accidentLocation.name.split(",")[0] || "Incident Site"}
            tone="emergency"
          />
          {route.intersections.map((i) => {
            const st = sim.intersectionStatus[i.id] ?? "idle";
            return (
              <div key={i.id} className="flex items-center gap-3">
                <Connector active={st === "cleared" || st === "passing"} />
                <div className={cn("w-52 rounded-xl border p-3", statusClass(st))}>
                  <p className="truncate font-display text-base font-bold text-foreground">
                    {i.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {i.distanceKm} km · Unit {i.unit}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "rounded border px-1.5 py-0.5 text-[11px] capitalize",
                        trafficClass(i.traffic),
                      )}
                    >
                      {i.traffic}
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-wide">
                      {STATUS_LABEL[st]}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          <div className="flex items-center gap-3">
            <Connector active={sim.completed} />
            <Node
              icon={<Building2 className="size-5" />}
              title={hospital.shortName}
              sub={hospital.area}
              tone="clear"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Connector({ active }: { active: boolean }) {
  return <div className={cn("h-1 w-10 rounded-full", active ? "bg-clear" : "bg-border")} />;
}

function Node({
  icon,
  title,
  sub,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  tone: "emergency" | "clear";
}) {
  return (
    <div
      className={cn(
        "flex w-40 flex-col justify-center rounded-xl border p-3",
        tone === "emergency"
          ? "border-emergency/50 bg-emergency/10 text-emergency"
          : "border-clear/40 bg-clear/10 text-clear",
      )}
    >
      {icon}
      <p className="mt-2 font-display text-base font-bold text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}
