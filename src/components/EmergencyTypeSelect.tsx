import { useState, useMemo } from "react";
import { BadgeCheck, Building2, HeartPulse, Search, X } from "lucide-react";
import { EMERGENCY_TYPES, getEmergencyType, rankHospitals } from "@/lib/emergency-data";
import { selectHospital, setEmergencyType, useSim } from "@/lib/sim-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function EmergencyTypeSelect() {
  const sim = useSim();
  const [hospitalSearch, setHospitalSearch] = useState("");
  const type = getEmergencyType(sim.emergencyTypeId);
  const ranked = rankHospitals(sim.emergencyTypeId);

  const displayedHospitals = useMemo(() => {
    if (!hospitalSearch.trim()) return ranked;
    const q = hospitalSearch.toLowerCase().trim();
    return ranked.filter(
      (r) =>
        r.hospital.name.toLowerCase().includes(q) ||
        r.hospital.shortName.toLowerCase().includes(q) ||
        r.hospital.area.toLowerCase().includes(q) ||
        r.hospital.specialties.some((s) => s.toLowerCase().includes(q)),
    );
  }, [ranked, hospitalSearch]);

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <div className="rounded-xl border border-border bg-card p-4 shadow-command sm:p-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-emergency/15 text-emergency">
            <HeartPulse className="size-5" />
          </span>
          <div className="min-w-0">
            <h2 className="truncate font-display text-xl font-bold">Type of Emergency</h2>
            <p className="truncate text-xs text-muted-foreground">
              Patient level auto-set to {type.patientLevel}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {EMERGENCY_TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              disabled={sim.running}
              onClick={() => setEmergencyType(t.id)}
              className={cn(
                "rounded-lg border p-3 text-left transition disabled:opacity-60",
                t.id === sim.emergencyTypeId
                  ? "border-emergency bg-emergency/10"
                  : "border-border bg-muted/40 hover:border-emergency/50",
              )}
            >
              <span className="text-xl">{t.icon}</span>
              <span className="mt-1 block text-sm font-semibold leading-tight">{t.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {type.needs.map((n) => (
            <span
              key={n}
              className="rounded-full border border-border bg-muted px-2.5 py-1 text-xs text-muted-foreground"
            >
              Requires: {n}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-command sm:p-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-clear/15 text-clear">
            <Building2 className="size-5" />
          </span>
          <div className="min-w-0">
            <h2 className="truncate font-display text-xl font-bold">Destination Hospital</h2>
            <p className="truncate text-xs text-muted-foreground">
              Select or search any of 10 verified emergency centers in Hyderabad
            </p>
          </div>
        </div>

        {/* Search / Mention Hospital Input */}
        <div className="relative mt-3">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <input
            type="text"
            value={hospitalSearch}
            onChange={(e) => setHospitalSearch(e.target.value)}
            placeholder="Search by hospital name or area (e.g. Apollo, Medicover, Gandhi)..."
            className="w-full rounded-lg border border-border bg-muted/40 pl-9 pr-8 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-clear focus:outline-none focus:ring-1 focus:ring-clear"
          />
          {hospitalSearch && (
            <button
              type="button"
              onClick={() => setHospitalSearch("")}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <div className="mt-3 max-h-[320px] overflow-y-auto pr-1 space-y-2">
          {displayedHospitals.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground">
              No hospital found matching "{hospitalSearch}".
            </div>
          ) : (
            displayedHospitals.map((r, idx) => (
              <button
                key={r.hospital.id}
                type="button"
                disabled={sim.running}
                onClick={() => {
                  selectHospital(r.hospital.id);
                  toast.success(`Destination set to ${r.hospital.name}`, {
                    description: `Active corridor calculated exclusively to ${r.hospital.shortName}.`,
                  });
                }}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-left transition disabled:opacity-60",
                  r.hospital.id === sim.hospitalId
                    ? "border-clear bg-clear/15 ring-1 ring-clear"
                    : "border-border bg-muted/40 hover:border-clear/50",
                )}
              >
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 truncate font-display text-base font-bold">
                    {r.hospital.name}
                    {r.hospital.id === sim.hospitalId && (
                      <BadgeCheck className="size-4 shrink-0 text-clear" />
                    )}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {r.hospital.level} · {r.hospital.distanceKm} km · ETA {r.hospital.etaMin} min ·{" "}
                    {r.hospital.bedsFree} beds free
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    Match: {r.matched.length ? r.matched.join(", ") : "General trauma care"}
                  </span>
                </span>
                <span className="shrink-0 rounded-md border border-border px-2 py-1 font-display text-sm font-bold">
                  {r.score}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
