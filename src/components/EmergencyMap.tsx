import { useEffect, useState, type ComponentType } from "react";
import { Loader2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  showAllRoutes?: boolean;
  compact?: boolean;
  allowPinAdjustment?: boolean;
};

export function EmergencyMap(props: Props) {
  const [MapComponent, setMapComponent] = useState<ComponentType<Props> | null>(null);

  useEffect(() => {
    // Dynamically load the Leaflet map on client only to guarantee zero SSR issues
    import("./LeafletMapInner")
      .then((mod) => {
        setMapComponent(() => mod.LeafletMapInner);
      })
      .catch((err) => {
        console.error("Failed to load Leaflet map:", err);
      });
  }, []);

  if (MapComponent) {
    return <MapComponent {...props} />;
  }

  // Tactical skeleton while loading OpenStreetMap Leaflet Engine
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center overflow-hidden rounded-xl border border-border bg-navy-deep grid-backdrop shadow-command min-h-[380px]",
        props.className,
      )}
    >
      <div className="flex flex-col items-center gap-3 text-center px-4">
        <div className="relative flex items-center justify-center size-12 rounded-full bg-emergency/15 border border-emergency/40 text-emergency">
          <Loader2 className="size-6 animate-spin text-emergency" />
        </div>
        <div className="space-y-1">
          <h3 className="font-display text-lg font-bold text-foreground">
            Initializing OpenStreetMap & Leaflet Engine
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm">
            Loading geographical tiles, emergency hospital markers, and verified arterial road
            corridor...
          </p>
        </div>
      </div>

      <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-md border border-border bg-navy/85 px-2.5 py-1 text-[10px] text-muted-foreground font-mono">
        <span className="size-1.5 rounded-full bg-clear animate-pulse" />
        <span>OpenStreetMap · Leaflet GIS Core</span>
      </div>
    </div>
  );
}
