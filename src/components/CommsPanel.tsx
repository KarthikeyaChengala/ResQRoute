import { useState, useEffect, useRef } from "react";
import { MapPin, Phone, Send, Radio, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QUICK_MESSAGES, detectMentionedHospital } from "@/lib/emergency-data";
import { useSim, selectHospital } from "@/lib/sim-store";
import {
  getCommsConnectionStatus,
  sendTripMessage,
  subscribeTripMessages,
  type CommsMessage,
} from "@/lib/realtime-comms";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function CommsPanel({ as = "driver" }: { as?: "driver" | "police" }) {
  const sim = useSim();
  const [messages, setMessages] = useState<CommsMessage[]>([]);
  const [text, setText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const connection = getCommsConnectionStatus();

  useEffect(() => {
    if (!sim.tripId) return;

    const unsubscribe = subscribeTripMessages(sim.tripId, (newMsgs) => {
      setMessages(newMsgs);
    });

    return () => {
      unsubscribe();
    };
  }, [sim.tripId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = (value: string) => {
    if (!value.trim()) return;
    const msgText = value.trim();
    sendTripMessage(
      sim.tripId,
      as,
      msgText,
      as === "driver" ? "Ambulance AMB-1024 Pilot" : "Traffic Police Command",
    );
    const mentioned = detectMentionedHospital(msgText);
    if (mentioned && as === "driver" && !sim.running) {
      selectHospital(mentioned.id);
      toast.success(`Destination set to ${mentioned.name}`, {
        description: `Corridor route directed to ${mentioned.shortName} as requested by driver.`,
      });
    }
    setText("");
  };

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-card shadow-command">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b border-border p-4 sm:flex sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="truncate font-display text-lg font-bold">Real-Time Communication</h2>
            <span className="flex items-center gap-1 rounded-full border border-clear/30 bg-clear/10 px-2 py-0.5 text-[10px] font-semibold text-clear">
              <span className="size-1.5 rounded-full bg-clear animate-pulse" /> Live Sync
            </span>
          </div>
          <p className="truncate text-xs text-muted-foreground">
            Trip <b className="text-foreground">{sim.tripId}</b> · Pilot (Driver) ↔ Traffic Police
            secure channel
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            size="icon"
            variant="secondary"
            aria-label="Share location"
            onClick={() => toast.success("Live GPS coordinates broadcasted to all traffic units")}
          >
            <MapPin className="size-4 text-emerald-400" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            aria-label="Voice call"
            onClick={() => toast("📞 Voice frequency connected to Hyderabad Control Room")}
          >
            <Phone className="size-4 text-sky-400" />
          </Button>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4" style={{ maxHeight: 340 }}>
        {messages.length === 0 && (
          <div className="flex h-32 flex-col items-center justify-center text-center text-muted-foreground">
            <Radio className="size-6 opacity-40 mb-1" />
            <p className="text-xs">Standing by on Trip {sim.tripId} channel.</p>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={cn("flex", m.from === as ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[80%] rounded-lg border px-3 py-2 text-sm shadow-sm",
                m.from === "system"
                  ? "border-warn/40 bg-warn/10 text-warn"
                  : m.from === as
                    ? "border-emergency/40 bg-emergency/15 text-foreground"
                    : "border-border bg-muted text-foreground",
              )}
            >
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {m.senderName} · {m.timeStr}
              </p>
              <p className="mt-0.5">{m.text}</p>
              {(() => {
                const mentioned = detectMentionedHospital(m.text);
                if (mentioned && mentioned.id !== sim.hospitalId && !sim.running) {
                  return (
                    <button
                      type="button"
                      onClick={() => {
                        selectHospital(mentioned.id);
                        toast.success(`Destination updated to ${mentioned.name}`, {
                          description: `Corridor route directed exclusively to ${mentioned.shortName}.`,
                        });
                      }}
                      className="mt-1.5 flex items-center gap-1 rounded bg-clear/20 px-2 py-0.5 text-[11px] font-semibold text-clear hover:bg-clear/30 transition-colors"
                    >
                      🏥 Route to {mentioned.shortName}
                    </button>
                  );
                }
                return null;
              })()}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="space-y-3 border-t border-border p-4 bg-muted/20">
        <div className="flex flex-wrap gap-1.5 max-h-[70px] overflow-y-auto">
          {QUICK_MESSAGES.map((q) => (
            <Button
              key={q}
              variant="secondary"
              size="sm"
              className="h-7 text-xs bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground"
              onClick={() => send(q)}
            >
              {q}
            </Button>
          ))}
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send(text);
          }}
        >
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Type message as ${as === "driver" ? "Ambulance Driver" : "Traffic Police"}...`}
            aria-label="Message"
          />
          <Button type="submit" size="icon" aria-label="Send">
            <Send className="size-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
