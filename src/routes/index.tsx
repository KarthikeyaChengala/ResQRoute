import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Ambulance,
  ArrowRight,
  Building2,
  ShieldCheck,
  Siren,
  Timer,
  Waypoints,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmergencyMap } from "@/components/EmergencyMap";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Emergency Route Assist — Green Corridors for Ambulances" },
      {
        name: "description",
        content:
          "AI-powered emergency routing that clears intersections with traffic police so ambulances reach the hospital faster.",
      },
      { property: "og:title", content: "Emergency Route Assist — Green Corridors for Ambulances" },
      {
        property: "og:description",
        content:
          "AI-powered emergency routing that clears intersections with traffic police so ambulances reach the hospital faster.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: Waypoints,
    title: "Smart Green Corridor",
    text: "Signals and intersections along the route are alerted before the ambulance arrives.",
  },
  {
    icon: ShieldCheck,
    title: "Traffic Police Sync",
    text: "Nearby units receive live alerts, clear traffic and confirm each intersection.",
  },
  {
    icon: Building2,
    title: "Hospital Pre-Alert",
    text: "Destination hospitals see ETA, patient level and route to prepare the trauma bay.",
  },
  {
    icon: Timer,
    title: "AI Route Analysis",
    text: "Congestion, road condition, closures and police availability scored in real time.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-navy-deep/90 backdrop-blur">
        <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:flex sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-emergency text-emergency-foreground">
              <Ambulance className="size-5" />
            </span>
            <span className="truncate font-display text-lg font-bold">Emergency Route Assist</span>
          </div>
          <Button asChild variant="secondary" className="shrink-0">
            <Link to="/app/dashboard">
              Open Console <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </header>

      <section className="grid-backdrop border-b border-border">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:py-24">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full border border-emergency/40 bg-emergency/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emergency">
              <Siren className="size-3.5" /> Every Second Matters
            </span>
            <h1 className="mt-5 font-display text-5xl font-bold leading-[1.05] sm:text-6xl lg:text-7xl">
              Clear the Road. <span className="text-siren">Save a Life.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              AI-powered emergency routing that connects ambulances with traffic police to create
              the fastest possible path to the hospital.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-16 flex-1 font-display text-xl font-bold">
                <Link to="/app/navigation">
                  <Ambulance className="size-6" /> Ambulance Driver
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="h-16 flex-1 font-display text-xl font-bold"
              >
                <Link to="/app/police">
                  <ShieldCheck className="size-6" /> Traffic Police
                </Link>
              </Button>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-4">
              {[
                ["1,248", "Emergency trips"],
                ["18%", "Avg time saved"],
                ["342", "Green corridors"],
              ].map(([v, l]) => (
                <div key={l} className="min-w-0">
                  <p className="font-display text-2xl font-bold text-emergency sm:text-3xl">{v}</p>
                  <p className="truncate text-xs uppercase tracking-widest text-muted-foreground">
                    {l}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <EmergencyMap className="h-[380px] lg:h-[480px]" showAllRoutes />
            <p className="mt-3 text-center text-xs uppercase tracking-widest text-muted-foreground">
              Live preview · ambulance, hospital, police, congestion & recommended route
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="font-display text-3xl font-bold">
          A full emergency-response command system
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-xl border border-border bg-card p-5 shadow-command">
              <span className="grid size-10 place-items-center rounded-lg bg-emergency/15 text-emergency">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-4 font-display text-lg font-bold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-navy-deep">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <h2 className="font-display text-3xl font-bold">The complete workflow</h2>
          <div className="mt-8 flex flex-wrap gap-3">
            {[
              "Ambulance driver",
              "Select emergency",
              "AI finds 3 routes",
              "Best route selected",
              "Traffic police alerted",
              "Green corridor created",
              "Hospital notified",
              "Ambulance arrives",
            ].map((s, i) => (
              <span key={s} className="rounded-lg border border-border bg-card px-4 py-2 text-sm">
                <span className="mr-2 font-display font-bold text-emergency">{i + 1}</span>
                {s}
              </span>
            ))}
          </div>
          <div className="mt-10 rounded-xl border border-emergency/40 bg-emergency/10 p-8 text-center">
            <p className="font-display text-3xl font-bold sm:text-4xl">
              Every Second Matters. Every Road Should Be Clear.
            </p>
            <Button asChild size="lg" className="mt-6 h-14 font-display text-lg font-bold">
              <Link to="/app/dashboard">Launch Demo Simulation</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        Emergency Route Assist · Hackathon prototype using simulated GPS and traffic data.
      </footer>
    </div>
  );
}
