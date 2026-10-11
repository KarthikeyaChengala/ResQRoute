import { createFileRoute } from "@tanstack/react-router";
import { TRIP_HISTORY } from "@/lib/emergency-data";
import { StatCard } from "@/components/StatCard";
import { Clock, Route as RouteIcon, TimerReset } from "lucide-react";

export const Route = createFileRoute("/app/history")({
  head: () => ({
    meta: [
      { title: "Emergency Trip History | Emergency Route Assist" },
      {
        name: "description",
        content:
          "Log of previous ambulance emergency trips with distance, original ETA, actual time and minutes saved.",
      },
      { property: "og:title", content: "Emergency Trip History | Emergency Route Assist" },
      {
        property: "og:description",
        content: "Every completed emergency trip and the time the green corridor saved.",
      },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const totalSaved = TRIP_HISTORY.reduce((a, t) => a + (t.eta - t.actual), 0);
  const avgSaved = (totalSaved / TRIP_HISTORY.length).toFixed(1);

  return (
    <div className="space-y-6">
      <div className="min-w-0">
        <h1 className="font-display text-3xl font-bold">Emergency Trip History</h1>
        <p className="text-sm text-muted-foreground">Recent completed emergency trips</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Trips logged" value={String(TRIP_HISTORY.length)} icon={RouteIcon} />
        <StatCard
          label="Total time saved"
          value={`${totalSaved} min`}
          icon={TimerReset}
          tone="clear"
        />
        <StatCard
          label="Average saved / trip"
          value={`${avgSaved} min`}
          icon={Clock}
          tone="emergency"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-command">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-muted/50 text-left text-[11px] uppercase tracking-widest text-muted-foreground">
            <tr>
              {[
                "Ambulance",
                "Date",
                "Starting location",
                "Hospital",
                "Distance",
                "Original ETA",
                "Actual",
                "Time saved",
                "Route",
              ].map((h) => (
                <th key={h} className="px-4 py-3 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TRIP_HISTORY.map((t) => (
              <tr key={`${t.id}-${t.date}`} className="border-t border-border">
                <td className="px-4 py-3 font-semibold text-emergency">{t.id}</td>
                <td className="px-4 py-3 text-muted-foreground">{t.date}</td>
                <td className="px-4 py-3">{t.from}</td>
                <td className="px-4 py-3">{t.hospital}</td>
                <td className="px-4 py-3">{t.km} km</td>
                <td className="px-4 py-3">{t.eta} min</td>
                <td className="px-4 py-3">{t.actual} min</td>
                <td className="px-4 py-3 font-semibold text-clear">{t.eta - t.actual} min</td>
                <td className="px-4 py-3 text-muted-foreground">{t.route}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
