import { PlayCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resetSim, startTrip, useSim } from "@/lib/sim-store";
import { toast } from "sonner";

export function DemoButton({ className }: { className?: string }) {
  const sim = useSim();
  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2">
        <Button
          size="lg"
          disabled={sim.running}
          onClick={() => {
            startTrip();
            toast.error("🚨 Demo simulation started — traffic units notified");
          }}
        >
          <PlayCircle className="size-5" /> {sim.completed ? "Run Demo Again" : "Demo Simulation"}
        </Button>
        <Button size="lg" variant="secondary" onClick={() => resetSim()}>
          <RotateCcw className="size-4" /> Reset
        </Button>
      </div>
    </div>
  );
}
