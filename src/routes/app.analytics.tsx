import { createFileRoute } from "@tanstack/react-router";
import {
  Ambulance,
  CheckCircle2,
  Percent,
  Route as RouteIcon,
  ShieldCheck,
  Timer,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { StatCard } from "@/components/StatCard";

export const Route = createFileRoute("/app/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics | Emergency Route Assist" },
      {
        name: "description",
        content:
          "Emergency response analytics: trips, response times, minutes saved, clearances and green corridors created.",
      },
      { property: "og:title", content: "Analytics | Emergency Route Assist" },
      {
        property: "og:description",
        content: "Measure the impact of green corridors on ambulance response times.",
      },
    ],
  }),
  component: AnalyticsPage,
});

const MONTHLY = [
  { m: "Mar", trips: 142, saved: 14 },
  { m: "Apr", trips: 168, saved: 15 },
  { m: "May", trips: 191, saved: 16 },
  { m: "Jun", trips: 214, saved: 17 },
  { m: "Jul", trips: 248, saved: 18 },
  { m: "Aug", trips: 285, saved: 19 },
];

const CLEARANCE = [
  { zone: "Zone A", clearances: 128 },
  { zone: "Zone B", clearances: 96 },
  { zone: "Zone C", clearances: 74 },
  { zone: "Zone D", clearances: 44 },
];

const ROUTE_MIX = [
  { name: "Route 1", value: 62, color: "var(--clear)" },
  { name: "Route 2", value: 26, color: "var(--warn)" },
  { name: "Route 3", value: 12, color: "var(--emergency)" },
];

function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="min-w-0">
        <h1 className="font-display text-3xl font-bold">Analytics</h1>
        <p className="text-sm text-muted-foreground">Network-wide emergency response performance</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard label="Emergency trips" value="1,248" icon={RouteIcon} />
        <StatCard label="Avg response time" value="12.4 min" icon={Timer} tone="emergency" />
        <StatCard label="Avg time saved" value="18%" icon={Percent} tone="clear" />
        <StatCard label="Traffic clearances" value="2,914" icon={ShieldCheck} tone="warn" />
        <StatCard label="Green corridors" value="342" icon={CheckCircle2} tone="clear" />
        <StatCard label="Ambulances active" value="17" icon={Ambulance} tone="emergency" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Emergency trips & time saved">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={MONTHLY}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--emergency)" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="var(--emergency)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="oklch(1 0 0 / 0.08)" vertical={false} />
              <XAxis dataKey="m" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                }}
              />
              <Area
                type="monotone"
                dataKey="trips"
                stroke="var(--emergency)"
                fill="url(#g1)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="saved"
                stroke="var(--clear)"
                fill="transparent"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Traffic clearances by zone">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={CLEARANCE}>
              <CartesianGrid stroke="oklch(1 0 0 / 0.08)" vertical={false} />
              <XAxis dataKey="zone" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                }}
              />
              <Bar dataKey="clearances" fill="var(--warn)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Route usage mix">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={ROUTE_MIX}
                dataKey="value"
                nameKey="name"
                innerRadius={65}
                outerRadius={100}
                paddingAngle={3}
              >
                {ROUTE_MIX.map((r) => (
                  <Cell key={r.name} fill={r.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Route clearance success">
          <div className="flex h-[280px] flex-col justify-center gap-5 px-2">
            {[
              ["Successful route clearance", 96, "bg-clear"],
              ["Green corridor completion", 91, "bg-emergency"],
              ["Police response < 60s", 88, "bg-warn"],
            ].map(([label, pct, bg]) => (
              <div key={label as string}>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{label as string}</span>
                  <span className="font-display text-lg font-bold">{pct as number}%</span>
                </div>
                <div className="mt-1 h-2.5 rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${bg as string}`}
                    style={{ width: `${pct as number}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-command">
      <h2 className="mb-3 font-display text-lg font-bold">{title}</h2>
      {children}
    </div>
  );
}
