import { Link, Outlet } from "@tanstack/react-router";
import {
  Activity,
  Ambulance,
  BarChart3,
  Bell,
  Building2,
  History,
  LayoutDashboard,
  Map,
  Menu,
  Settings,
  ShieldCheck,
  Waypoints,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSim, getRoute, toggleMessenger, selectedHospital } from "@/lib/sim-store";
import { RealTimeMessenger } from "@/components/RealTimeMessenger";
import { MessageSquare } from "lucide-react";

const NAV = [
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/navigation", label: "Emergency Navigation", icon: Ambulance },
  { to: "/app/map", label: "Live Map", icon: Map },
  { to: "/app/corridor", label: "Green Corridor", icon: Waypoints },
  { to: "/app/police", label: "Traffic Police", icon: ShieldCheck },
  { to: "/app/hospital", label: "Hospitals", icon: Building2 },
  { to: "/app/alerts", label: "Emergency Alerts", icon: Bell },
  { to: "/app/history", label: "Trip History", icon: History },
  { to: "/app/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/app/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell() {
  const [open, setOpen] = useState(false);
  const sim = useSim();
  const route = getRoute(sim.selectedRouteId);

  const nav = (
    <nav className="flex flex-col gap-1 p-3">
      {NAV.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[status=active]:bg-emergency/15 data-[status=active]:text-emergency"
        >
          <Icon className="size-4 shrink-0" />
          <span className="truncate">{label}</span>
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <Link to="/" className="flex items-center gap-3 border-b border-sidebar-border px-4 py-4">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-emergency text-emergency-foreground">
            <Ambulance className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-display text-base font-bold">
              Emergency Route Assist
            </span>
            <span className="block text-[10px] uppercase tracking-widest text-muted-foreground">
              Command System
            </span>
          </span>
        </Link>
        {nav}
        <div className="mt-auto m-3 rounded-lg border border-border bg-navy p-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Active trip
            </p>
            <span className="font-mono text-[10px] text-red-400 font-bold">{sim.tripId}</span>
          </div>
          <p className="font-display text-lg font-bold">
            {sim.running ? "AMB-1024 EN ROUTE" : sim.completed ? "COMPLETED" : "STANDBY"}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {selectedHospital().shortName} · {route.distanceKm} km
          </p>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => toggleMessenger(true)}
            className="mt-2.5 w-full h-8 gap-1.5 text-xs font-semibold bg-slate-900 border border-slate-700 hover:bg-slate-800"
          >
            <MessageSquare className="size-3.5 text-red-500" />
            <span>Emergency Comms</span>
            {sim.messenger.unreadCount > 0 && (
              <span className="ml-auto rounded-full bg-red-600 px-1.5 py-0.2 text-[10px] font-bold text-white">
                {sim.messenger.unreadCount}
              </span>
            )}
          </Button>
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 overflow-y-auto border-r border-sidebar-border bg-sidebar">
            {nav}
          </div>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-navy-deep/90 px-4 py-3 backdrop-blur sm:flex sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </Button>
            <div className="min-w-0">
              <p className="truncate font-display text-lg font-bold">Emergency Command Console</p>
              <p className="truncate text-xs text-muted-foreground">
                Every Second Matters. Every Road Should Be Clear.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleMessenger(true)}
              className="h-8 gap-1.5 text-xs border-red-500/40 text-red-400 hover:bg-red-500/10"
            >
              <MessageSquare className="size-3.5" />
              <span className="hidden sm:inline">Comms</span>
              {sim.messenger.unreadCount > 0 && (
                <span className="rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white">
                  {sim.messenger.unreadCount}
                </span>
              )}
            </Button>
            <span
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide",
                sim.running
                  ? "animate-siren border-emergency/50 bg-emergency/15 text-emergency"
                  : "border-clear/40 bg-clear/10 text-clear",
              )}
            >
              <Activity className="size-3.5" /> {sim.running ? "Live Emergency" : "All Clear"}
            </span>
          </div>
        </header>
        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>

      {/* Global Real-Time Emergency Messenger Floating Widget */}
      <RealTimeMessenger />
    </div>
  );
}
