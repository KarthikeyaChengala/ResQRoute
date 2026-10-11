import { useState, useEffect, useRef } from "react";
import {
  Search,
  MapPin,
  Compass,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Building2,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  searchAddress,
  reverseGeocode,
  HYDERABAD_FALLBACK_LANDMARKS,
  type GeocodingResult,
} from "@/lib/routing-service";
import { setAccidentLocation, useSim } from "@/lib/sim-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function AccidentLocationSearch() {
  const sim = useSim();
  const [query, setQuery] = useState(sim.accidentLocation.name);
  const [localSuggestions, setLocalSuggestions] = useState<GeocodingResult[]>([]);
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Sync query when accidentLocation changes externally
  useEffect(() => {
    setQuery(sim.accidentLocation.name);
  }, [sim.accidentLocation.name]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Purely client-side local filtering as operator types (ZERO network requests to Nominatim on keystroke)
  useEffect(() => {
    const clean = query.trim().toLowerCase();
    if (!clean || clean === sim.accidentLocation.name.toLowerCase() || clean.length < 2) {
      setLocalSuggestions([]);
      return;
    }

    const matches = HYDERABAD_FALLBACK_LANDMARKS.filter(
      (l) =>
        l.name.toLowerCase().includes(clean) ||
        l.displayName.toLowerCase().includes(clean) ||
        l.area?.toLowerCase().includes(clean),
    ).slice(0, 5);

    setLocalSuggestions(matches);
    if (matches.length > 0) {
      setShowDropdown(true);
    }
  }, [query, sim.accidentLocation.name]);

  // Explicit online geocoding request using OpenStreetMap Nominatim
  const handlePerformOnlineSearch = async () => {
    const clean = query.trim();
    if (!clean) return;

    setIsSearching(true);
    setErrorMsg(null);
    setSearchResults([]);

    try {
      const results = await searchAddress(clean);
      if (results.length === 1) {
        handleSelectLocation(results[0]!);
      } else if (results.length > 1) {
        setSearchResults(results);
        setShowDropdown(true);
      } else {
        setErrorMsg(
          "No verified geographical coordinates found for this query in Hyderabad. Please refine your search.",
        );
      }
    } catch (err) {
      setErrorMsg(
        "Geocoding service temporarily unavailable. Please retry or pick a verified landmark.",
      );
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectLocation = (item: GeocodingResult) => {
    setQuery(item.displayName);
    setShowDropdown(false);
    setSearchResults([]);
    setLocalSuggestions([]);
    setErrorMsg(null);
    setAccidentLocation(item.displayName, { lat: item.lat, lng: item.lng }, true);
    toast.success(`Accident location confirmed: ${item.name}`, {
      description: `Coordinates: ${item.lat.toFixed(4)}° N, ${item.lng.toFixed(4)}° E · Calculating real road route...`,
    });
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    setErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const addr = await reverseGeocode(latitude, longitude);
          setQuery(addr);
          setAccidentLocation(addr, { lat: latitude, lng: longitude }, true);
          toast.success("Current GPS location resolved", {
            description: addr,
          });
        } catch (e) {
          const fallback = `Current Location (${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E)`;
          setQuery(fallback);
          setAccidentLocation(fallback, { lat: latitude, lng: longitude }, true);
          toast.success("Location acquired from GPS coordinates");
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        let msg = "Unable to retrieve your current location.";
        if (err.code === err.PERMISSION_DENIED) {
          msg = "GPS permission denied. Please enter an address manually.";
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = "Location information unavailable.";
        } else if (err.code === err.TIMEOUT) {
          msg = "Location request timed out. Please enter address manually.";
        }
        setErrorMsg(msg);
        toast.error(msg);
      },
      { timeout: 8000, enableHighAccuracy: true },
    );
  };

  const displayList = searchResults.length > 0 ? searchResults : localSuggestions;

  return (
    <div
      ref={containerRef}
      className="rounded-xl border border-border bg-card p-4 shadow-command sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-lg bg-emergency/15 text-emergency">
            <MapPin className="size-5" />
          </span>
          <div>
            <h2 className="font-display text-xl font-bold">Accident / Incident Location</h2>
            <p className="text-xs text-muted-foreground">
              Enter area, street, landmark or full address across Hyderabad (OpenStreetMap Geocoded)
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          disabled={sim.running || isLocating}
          onClick={handleUseCurrentLocation}
          className="h-9 gap-1.5 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
        >
          {isLocating ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Compass className="size-3.5" />
          )}
          <span>Use Current Location</span>
        </Button>
      </div>

      {/* Input row with explicit Search action */}
      <form
        className="relative mt-4"
        onSubmit={(e) => {
          e.preventDefault();
          handlePerformOnlineSearch();
        }}
      >
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 size-4 text-muted-foreground" />
          <Input
            value={query}
            disabled={sim.running}
            onChange={(e) => {
              setQuery(e.target.value);
              setSearchResults([]);
              setShowDropdown(true);
            }}
            placeholder="e.g. Kukatpally, Banjara Hills, Hitec City, Charminar, Begumpet..."
            className="h-12 pl-10 pr-32 bg-navy/60 border-border font-medium text-sm text-foreground focus-visible:ring-emergency"
          />

          <div className="absolute right-2 flex items-center gap-1.5">
            {isSearching && <Loader2 className="size-4 animate-spin text-emergency mr-1" />}
            {query && !sim.running && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setLocalSuggestions([]);
                  setSearchResults([]);
                  setShowDropdown(false);
                }}
                className="rounded p-1 text-muted-foreground hover:text-foreground"
                title="Clear input"
              >
                <X className="size-4" />
              </button>
            )}
            <Button
              type="submit"
              size="sm"
              disabled={sim.running || isSearching || !query.trim()}
              className="h-8 px-3 font-display font-bold text-xs bg-emergency text-white hover:bg-red-700"
            >
              Search OSM
            </Button>
          </div>
        </div>

        {/* Dropdown for Verified Landmarks or Search Results */}
        {showDropdown && displayList.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border border-border bg-slate-950/95 p-1.5 shadow-2xl backdrop-blur-md">
            <p className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {searchResults.length > 0
                ? "Nominatim Geocoded Results (Select to Confirm):"
                : "Verified Hyderabad Landmarks:"}
            </p>
            {displayList.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectLocation(item)}
                className="flex w-full items-start gap-2.5 rounded-lg px-3 py-2 text-left transition-colors hover:bg-slate-800/80"
              >
                <MapPin className="mt-0.5 size-4 shrink-0 text-emergency" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{item.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{item.displayName}</p>
                </div>
                <span className="shrink-0 font-mono text-[10px] text-slate-400">
                  {item.lat.toFixed(3)}°, {item.lng.toFixed(3)}°
                </span>
              </button>
            ))}
          </div>
        )}
      </form>

      {errorMsg && (
        <div className="mt-2.5 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
          <AlertCircle className="size-4 shrink-0 text-amber-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Confirmed Location Status Card */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-clear/30 bg-clear/10 p-3 text-xs text-foreground">
        <div className="flex items-center gap-2 min-w-0">
          <CheckCircle2 className="size-4 shrink-0 text-clear" />
          <div className="min-w-0">
            <span className="font-semibold text-clear uppercase tracking-wider text-[10px]">
              Confirmed Incident Site
            </span>
            <p className="truncate font-medium text-foreground">{sim.accidentLocation.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground shrink-0">
          <span>
            Lat:{" "}
            <b className="text-foreground">{sim.accidentLocation.coordinates.lat.toFixed(4)}° N</b>
          </span>
          <span>·</span>
          <span>
            Lng:{" "}
            <b className="text-foreground">{sim.accidentLocation.coordinates.lng.toFixed(4)}° E</b>
          </span>
        </div>
      </div>
    </div>
  );
}
