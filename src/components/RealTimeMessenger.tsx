import { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Minus,
  X,
  Send,
  Radio,
  Ambulance,
  ShieldCheck,
  CheckCheck,
  Sparkles,
  RefreshCw,
  Bell,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  useSim,
  selectedHospital,
  selectHospital,
  toggleMessenger,
  toggleMessengerMinimize,
} from "@/lib/sim-store";
import { getEmergencyType, QUICK_MESSAGES, detectMentionedHospital } from "@/lib/emergency-data";
import {
  getCommsConnectionStatus,
  getTripMessages,
  sendTripMessage,
  subscribeTripMessages,
  type CommsMessage,
  type MessageSenderRole,
} from "@/lib/realtime-comms";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function RealTimeMessenger({
  defaultRole = "driver",
}: {
  defaultRole?: "driver" | "police";
}) {
  const sim = useSim();
  const hospital = selectedHospital();
  const emergencyType = getEmergencyType(sim.emergencyTypeId);

  const [activeRole, setActiveRole] = useState<"driver" | "police">(defaultRole);
  const [messages, setMessages] = useState<CommsMessage[]>([]);
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const connection = getCommsConnectionStatus();

  // Subscribe to real-time messages for current trip
  useEffect(() => {
    if (!sim.tripId) return;

    const unsubscribe = subscribeTripMessages(sim.tripId, (newMsgs) => {
      setMessages(newMsgs);
    });

    return () => {
      unsubscribe();
    };
  }, [sim.tripId]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (sim.messenger.isOpen && !sim.messenger.isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, sim.messenger.isOpen, sim.messenger.isMinimized]);

  const handleSend = (content?: string, isQuick = false) => {
    const messageText = (content || text).trim();
    if (!messageText) return;

    setIsSending(true);
    try {
      sendTripMessage(
        sim.tripId,
        activeRole,
        messageText,
        activeRole === "driver" ? "Ambulance AMB-1024 (Driver)" : "Traffic Command (Police)",
        isQuick,
      );

      const mentioned = detectMentionedHospital(messageText);
      if (mentioned && activeRole === "driver" && !sim.running) {
        selectHospital(mentioned.id);
        toast.success(`Destination set to ${mentioned.name}`, {
          description: `Corridor route directed exclusively to ${mentioned.shortName} as requested by driver.`,
        });
      }

      if (!content) setText("");
    } catch (e) {
      toast.error("Failed to deliver message. Check connection.");
    } finally {
      setIsSending(false);
    }
  };

  if (!sim.messenger.isOpen) {
    return (
      <div className="fixed bottom-5 right-5 z-50">
        <Button
          size="lg"
          onClick={() => toggleMessenger(true)}
          className="relative gap-2 rounded-full border border-red-500/50 bg-slate-900 px-4 py-3 text-slate-100 shadow-2xl hover:bg-slate-800"
        >
          <MessageSquare className="size-5 text-red-500" />
          <span className="font-display font-bold">Emergency Comms</span>
          {sim.messenger.unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white animate-bounce">
              {sim.messenger.unreadCount}
            </span>
          )}
        </Button>
      </div>
    );
  }

  // Minimized state pill
  if (sim.messenger.isMinimized) {
    return (
      <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-2">
        <button
          type="button"
          onClick={() => toggleMessengerMinimize(false)}
          className="flex items-center gap-3 rounded-full border border-red-500/60 bg-slate-950/95 px-4 py-2.5 shadow-2xl backdrop-blur transition-all hover:border-red-400 hover:bg-slate-900 text-left"
        >
          <div className="relative">
            <Radio className="size-4 animate-pulse text-red-500" />
            <span className="absolute -top-1 -right-1 size-2 rounded-full bg-red-500" />
          </div>
          <div>
            <p className="font-display text-xs font-bold text-slate-100">
              Emergency Comms · {sim.tripId}
            </p>
            <p className="text-[10px] text-slate-400">
              {messages.length > 0
                ? messages[messages.length - 1]?.text.slice(0, 30) + "…"
                : "Active channel"}
            </p>
          </div>
          {sim.messenger.unreadCount > 0 ? (
            <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">
              {sim.messenger.unreadCount} new
            </span>
          ) : (
            <span className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider">
              Expand
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex h-[580px] w-full max-w-[420px] flex-col rounded-2xl border border-red-500/40 bg-slate-950/95 shadow-command backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 sm:right-6">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-4 py-3 rounded-t-2xl">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="grid size-9 place-items-center rounded-lg bg-red-600/20 text-red-500">
              <Radio className="size-5 animate-pulse" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate font-display text-base font-bold text-slate-100">
                Real-Time Communication
              </h3>
            </div>
            <p className="truncate text-[11px] font-mono text-slate-400">
              Trip: <b className="text-red-400">{sim.tripId}</b> · AMB-1024
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="size-7 text-slate-400 hover:text-slate-100"
            onClick={() => toggleMessengerMinimize(true)}
            title="Minimize"
          >
            <Minus className="size-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="size-7 text-slate-400 hover:text-slate-100"
            onClick={() => toggleMessenger(false)}
            title="Close"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>

      {/* Trip Metadata Strip */}
      <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-900/40 px-4 py-1.5 text-[11px] text-slate-300">
        <span className="truncate">
          Dest: <strong className="text-slate-100">{hospital.shortName}</strong>
        </span>
        <span className="rounded bg-red-600/20 px-1.5 py-0.5 font-semibold text-red-400">
          {emergencyType.label}
        </span>
      </div>

      {/* Role Switcher for Hackathon Demo testing */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 px-4 py-2">
        <span className="text-[11px] font-semibold text-slate-400">Messaging as:</span>
        <div className="flex rounded-lg border border-slate-700 bg-slate-900 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setActiveRole("driver")}
            className={cn(
              "flex items-center gap-1 rounded-md px-2.5 py-1 font-semibold transition-all",
              activeRole === "driver"
                ? "bg-red-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200",
            )}
          >
            <Ambulance className="size-3.5" /> Pilot (Driver)
          </button>
          <button
            type="button"
            onClick={() => setActiveRole("police")}
            className={cn(
              "flex items-center gap-1 rounded-md px-2.5 py-1 font-semibold transition-all",
              activeRole === "police"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200",
            )}
          >
            <ShieldCheck className="size-3.5" /> Control (Police)
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4 text-xs">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center text-slate-500">
            <Radio className="size-8 opacity-40 mb-2" />
            <p className="font-semibold">Secure Communication Channel Active</p>
            <p className="text-[11px] text-slate-400 max-w-[240px] mt-1">
              Live two-way exchange between Ambulance and Traffic Police Command.
            </p>
          </div>
        )}

        {messages.map((m) => {
          const isSender = m.from === activeRole;
          const isSystem = m.from === "system";
          const isDriver = m.from === "driver";

          if (isSystem) {
            return (
              <div key={m.id} className="flex justify-center my-2">
                <div className="max-w-[90%] rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-center text-[11px] text-amber-300">
                  <span className="font-semibold">⚙ SYSTEM:</span> {m.text}
                  <span className="ml-1 text-[9px] opacity-70">({m.timeStr})</span>
                </div>
              </div>
            );
          }

          return (
            <div key={m.id} className={cn("flex flex-col", isSender ? "items-end" : "items-start")}>
              <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-0.5 px-1">
                <span className="font-semibold text-slate-300">
                  {isDriver ? "🚑 " : "👮 "}
                  {m.senderName}
                </span>
                <span>·</span>
                <span>{m.timeStr}</span>
              </div>
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-sm",
                  isSender
                    ? isDriver
                      ? "rounded-tr-none bg-red-600 text-white font-medium shadow-red-900/30"
                      : "rounded-tr-none bg-blue-600 text-white font-medium shadow-blue-900/30"
                    : "rounded-tl-none border border-slate-700 bg-slate-900 text-slate-100",
                )}
              >
                {m.text}
                {(() => {
                  const mentioned = detectMentionedHospital(m.text);
                  if (mentioned && mentioned.id !== sim.hospitalId && !sim.running) {
                    return (
                      <button
                        type="button"
                        onClick={() => {
                          selectHospital(mentioned.id);
                          toast.success(`Destination set to ${mentioned.name}`, {
                            description: `Corridor route directed exclusively to ${mentioned.shortName}.`,
                          });
                        }}
                        className="mt-1.5 flex items-center gap-1 rounded bg-black/30 border border-white/20 px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-black/50 transition-colors"
                      >
                        🏥 Reroute to {mentioned.shortName}
                      </button>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Predefined Emergency Quick Messages Carousel */}
      <div className="border-t border-slate-800 bg-slate-900/50 p-2.5">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Quick Emergency Responses:
        </p>
        <div className="flex flex-wrap gap-1.5 max-h-[72px] overflow-y-auto">
          {QUICK_MESSAGES.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => handleSend(q, true)}
              className="rounded-full border border-slate-700 bg-slate-800/90 px-2.5 py-1 text-[10px] text-slate-200 transition-colors hover:border-red-500/60 hover:bg-slate-700"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input Box and Send Button */}
      <div className="border-t border-slate-800 p-3 bg-slate-950 rounded-b-2xl">
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              activeRole === "driver"
                ? "Type message to Traffic Police..."
                : "Type message to Ambulance..."
            }
            className="h-10 bg-slate-900 border-slate-700 text-xs text-slate-100 placeholder:text-slate-500 focus-visible:ring-red-500"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!text.trim() || isSending}
            className={cn(
              "size-10 shrink-0 text-white font-bold transition-all",
              activeRole === "driver"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-blue-600 hover:bg-blue-700",
            )}
          >
            <Send className="size-4" />
          </Button>
        </form>

        {/* Connection status indicator */}
        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
          <span className="flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{connection.label}</span>
          </span>
          <span className="font-mono text-slate-400">Trip: {sim.tripId}</span>
        </div>
      </div>
    </div>
  );
}
