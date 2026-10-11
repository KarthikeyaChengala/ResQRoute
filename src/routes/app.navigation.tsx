import { createFileRoute } from "@tanstack/react-router";
import {
  Navigation,
  RotateCcw,
  Sparkles,
  Loader2,
  Radio,
  CheckCircle2,
  MessageSquare,
  AlertTriangle,
  Play,
  Pause,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmergencyMap } from "@/components/EmergencyMap";
import { RouteOptions } from "@/components/RouteOptions";
import { AiAnalysis } from "@/components/AiAnalysis";
import { EmergencyTypeSelect } from "@/components/EmergencyTypeSelect";
import { AccidentLocationSearch } from "@/components/AccidentLocationSearch";
import {
  calculateRealRouteForTrip,
  getRoute,
  resetSim,
  selectedHospital,
  setDemoMode,
  startTrip,
  toggleMessenger,
  useSim,
} from "@/lib/sim-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/navigation")({
  head: () => ({
    meta: [
      { title: "Emergency Navigation | ResQRoute Command" },
      {
        name: "description",
        content:
          "Real-world emergency routing with live accident search, OpenStreetMap road navigation, and two-way police synchronization.",
      },
      { property: "og:title", content: "Emergency Navigation | ResQRoute Command" },
      {
        property: "og:description",
        content: "Calculate real road routes, dispatch ambulances, and coordinate green corridors.",
      },
    ],
  }),
  component: NavigationPage,
});

function NavigationPage() {
  const sim = useSim();
  const route = getRoute(sim.selectedRouteId);
  const hospital = selectedHospital();

  const handleCalculateRoute = async () => {
    toast.promise(calculateRealRouteForTrip(), {
      loading: "Calculating street-level route via OpenStreetMap routing engine...",
      success: "Emergency road route calculated successfully!",
      error: "Routing server unreachable. Please verify network.",
    });
  };

  const handleStartNavigation = () => {
    // 1. Validation check
    if (!sim.accidentLocation.name || !sim.accidentLocation.isConfirmed) {
      toast.error("Please confirm a valid accident location before launching navigation.");
      return;
    }
    if (!hospital) {
      toast.error("Please select a valid destination hospital.");
      return;
    }
    if (!route) {
      toast.error("Please calculate an emergency route before starting navigation.");
      return;
    }

    startTrip();
    toast.success(`🚨 Navigation active for ${sim.tripId}!`, {
      description: `Ambulance AMB-1024 dispatched to ${hospital.name}. Police alert published.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate font-display text-3xl font-bold">Emergency Navigation</h1>
            <span className="rounded-full border border-red-500/40 bg-red-500/10 px-2.5 py-0.5 text-xs font-semibold text-red-500">
              Trip: {sim.tripId}
            </span>
          </div>
          <p className="truncate text-sm text-muted-foreground">
            {`Street-level routing from ${sim.accidentLocation.name.split(",")[0]} to ${hospital.name}`}
          </p>
        </div>

        {/* Demo mode indicator */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDemoMode(!sim.isDemoMode)}
            className="text-xs"
          >
            <Radio className="mr-1.5 size-3.5 text-red-500" />
            {sim.isDemoMode ? "Mode: Demo Simulation" : "Mode: Live GPS"}
          </Button>
          {sim.running && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                resetSim();
                toast.info("Navigation reset to standby.");
              }}
              className="text-xs gap-1"
            >
              <RotateCcw className="size-3.5" /> Reset Trip
            </Button>
          )}
        </div>
      </div>

      {/* Step 1: Real Accident Location Search */}
      <AccidentLocationSearch />

      {/* Step 2: Emergency Type & Suggested Hospital Selection */}
      <EmergencyTypeSelect />

      {/* Step 3: Route Calculation & Comparison Options */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold">Real Road Route Options</h2>
            <p className="text-xs text-muted-foreground">
              {sim.routeSource === "osrm_live"
                ? "Calculated using live OpenStreetMap road network geometry & turn maneuvers"
                : "Calculated via verified Hyderabad arterial corridor network"}
            </p>
          </div>

          <Button
            variant="secondary"
            disabled={sim.running || sim.isCalculatingRoute}
            onClick={handleCalculateRoute}
            className="gap-2 font-display font-semibold"
          >
            {sim.isCalculatingRoute ? (
              <>
                <Loader2 className="size-4 animate-spin text-red-500" />
                Calculating Road Route...
              </>
            ) : (
              <>
                <Sparkles className="size-4 text-emerald-400" />
                Recalculate Road Route
              </>
            )}
          </Button>
        </div>

        <RouteOptions />
      </div>

      {/* Big Action Button: Start Emergency Navigation */}
      <div className="space-y-2">
        <Button
          size="lg"
          className={cn(
            "h-16 w-full font-display text-xl font-bold tracking-wide transition-all shadow-command",
            sim.running
              ? "bg-emerald-600 hover:bg-emerald-700 animate-pulse text-white"
              : "bg-red-600 hover:bg-red-700 text-white",
          )}
          disabled={sim.running}
          onClick={handleStartNavigation}
        >
          <Navigation className="size-6 mr-2" />
          {sim.running
            ? `NAVIGATION ACTIVE · EN ROUTE TO ${hospital.shortName.toUpperCase()}`
            : "START EMERGENCY NAVIGATION"}
        </Button>

        {sim.running && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-red-500 animate-ping" />
              <span className="font-bold text-red-400 uppercase tracking-wide">
                Live Dispatch Active:
              </span>
              <span className="text-foreground">
                Speed: <b>{sim.speedKph} km/h</b> · ETA:{" "}
                <b>{Math.max(0, (1 - sim.progress) * route.etaMin).toFixed(1)} min</b> · Progress:{" "}
                <b>{Math.round(sim.progress * 100)}%</b>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => toggleMessenger(true)}
                className="h-8 gap-1.5 text-xs font-semibold"
              >
                <MessageSquare className="size-3.5 text-red-500" /> Open Real-Time Messenger
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Geographical Interactive Map & AI Analysis */}
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold">Interactive Road Map</h2>
            <span className="text-xs text-muted-foreground font-mono">
              Live Emergency Grid · AI Green Corridor
            </span>
          </div>
          <EmergencyMap className="h-[440px]" showAllRoutes allowPinAdjustment />
        </div>
        <AiAnalysis />
      </div>
    </div>
  );
}
