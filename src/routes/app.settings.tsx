import { createFileRoute } from "@tanstack/react-router";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { setPatientLevel, useSim, resetSim } from "@/lib/sim-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/settings")({
  head: () => ({
    meta: [
      { title: "Settings | Emergency Route Assist" },
      {
        name: "description",
        content:
          "Configure ambulance identity, alert behaviour, patient emergency level and demo simulation options.",
      },
      { property: "og:title", content: "Settings | Emergency Route Assist" },
      {
        property: "og:description",
        content: "Control alerts, siren behaviour and demo mode for the emergency console.",
      },
    ],
  }),
  component: SettingsPage,
});

const TOGGLES = [
  ["Auto green corridor", "Automatically alert intersections along the selected route"],
  ["Voice guidance", "Speak turn-by-turn instructions to the driver"],
  ["Hospital auto-notify", "Send ETA updates to the destination hospital"],
  ["Auto reroute", "Recalculate when congestion or blockage is detected"],
] as const;

function SettingsPage() {
  const sim = useSim();

  return (
    <div className="space-y-6">
      <div className="min-w-0">
        <h1 className="font-display text-3xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Prototype configuration — demo data only</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-command">
          <h2 className="font-display text-lg font-bold">Dispatch preferences</h2>
          {TOGGLES.map(([title, desc]) => (
            <div key={title} className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <Label className="truncate">{title}</Label>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <Switch defaultChecked className="shrink-0" />
            </div>
          ))}
        </div>

        <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-command">
          <h2 className="font-display text-lg font-bold">Patient emergency level</h2>
          <div className="flex flex-wrap gap-2">
            {(["Critical", "Serious", "Stable"] as const).map((lvl) => (
              <Button
                key={lvl}
                variant={sim.patientLevel === lvl ? "default" : "secondary"}
                onClick={() => setPatientLevel(lvl)}
                className={cn(sim.patientLevel === lvl && "shadow-emergency")}
              >
                {lvl}
              </Button>
            ))}
          </div>
          <h2 className="pt-4 font-display text-lg font-bold">Demo simulation</h2>
          <p className="text-xs text-muted-foreground">
            Reset all simulation state, alerts and messages.
          </p>
          <Button variant="destructive" onClick={() => resetSim()}>
            Reset simulation data
          </Button>
        </div>
      </div>
    </div>
  );
}
