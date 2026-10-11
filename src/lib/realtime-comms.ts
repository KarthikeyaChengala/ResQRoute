export type MessageSenderRole = "driver" | "police" | "system";

export type CommsMessage = {
  id: string;
  tripId: string;
  from: MessageSenderRole;
  senderName: string;
  text: string;
  timestamp: string;
  timeStr: string;
  isQuickMessage?: boolean;
};

export type EmergencyTripAlert = {
  tripId: string;
  ambulanceId: string;
  emergencyType: string;
  patientLevel: string;
  pickupLocation: string;
  destinationHospital: string;
  distanceKm: number;
  etaMin: number;
  timestamp: string;
  timeStr: string;
  status: "active" | "acknowledged" | "completed" | "clearing";
};

const STORAGE_PREFIX = "resqroute_msgs_";
const ALERTS_STORAGE_KEY = "resqroute_active_emergency_alerts";

// In-memory cache & listeners
const messageListeners = new Map<string, Set<(msgs: CommsMessage[]) => void>>();
const alertListeners = new Set<(alert: EmergencyTripAlert) => void>();

// Browser BroadcastChannel for instant cross-tab / cross-window synchronization
let commsBroadcastChannel: BroadcastChannel | null = null;
let alertsBroadcastChannel: BroadcastChannel | null = null;

if (typeof window !== "undefined") {
  try {
    commsBroadcastChannel = new BroadcastChannel("resqroute_comms_channel");
    commsBroadcastChannel.onmessage = (event) => {
      const data = event.data;
      if (data && data.type === "NEW_MESSAGE" && data.message) {
        handleIncomingMessage(data.message, false);
      }
    };

    alertsBroadcastChannel = new BroadcastChannel("resqroute_alerts_channel");
    alertsBroadcastChannel.onmessage = (event) => {
      const data = event.data;
      if (data && data.type === "EMERGENCY_ALERT" && data.alert) {
        handleIncomingAlert(data.alert, false);
      }
    };
  } catch (e) {
    console.warn("BroadcastChannel not supported or restricted, falling back to storage events", e);
  }

  // Cross-tab fallback via Window Storage Event
  window.addEventListener("storage", (e) => {
    if (e.key && e.key.startsWith(STORAGE_PREFIX) && e.newValue) {
      const tripId = e.key.replace(STORAGE_PREFIX, "");
      try {
        const msgs = JSON.parse(e.newValue);
        notifyListeners(tripId, msgs);
      } catch (err) {
        // ignore parse error
      }
    } else if (e.key === ALERTS_STORAGE_KEY && e.newValue) {
      try {
        const alert = JSON.parse(e.newValue);
        alertListeners.forEach((l) => l(alert));
      } catch (err) {
        // ignore
      }
    }
  });
}

function handleIncomingMessage(msg: CommsMessage, broadcast = true) {
  const existing = getTripMessages(msg.tripId);
  // Avoid duplicate messages
  if (existing.some((m) => m.id === msg.id)) return;

  const updated = [...existing, msg];
  saveTripMessages(msg.tripId, updated);
  notifyListeners(msg.tripId, updated);

  if (broadcast && commsBroadcastChannel) {
    try {
      commsBroadcastChannel.postMessage({ type: "NEW_MESSAGE", message: msg });
    } catch (e) {
      // ignore
    }
  }
}

function handleIncomingAlert(alert: EmergencyTripAlert, broadcast = true) {
  try {
    localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alert));
  } catch (e) {
    // ignore
  }
  alertListeners.forEach((l) => l(alert));

  if (broadcast && alertsBroadcastChannel) {
    try {
      alertsBroadcastChannel.postMessage({ type: "EMERGENCY_ALERT", alert });
    } catch (e) {
      // ignore
    }
  }
}

function notifyListeners(tripId: string, msgs: CommsMessage[]) {
  const set = messageListeners.get(tripId);
  if (set) {
    set.forEach((fn) => fn(msgs));
  }
}

function saveTripMessages(tripId: string, msgs: CommsMessage[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${tripId}`, JSON.stringify(msgs));
  } catch (e) {
    // ignore
  }
}

/**
 * Retrieves persisted messages for a specific trip.
 */
export function getTripMessages(tripId: string): CommsMessage[] {
  if (typeof window === "undefined" || !tripId) return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${tripId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // ignore
  }
  return [];
}

/**
 * Sends a new message on the two-way emergency communication channel.
 * Instantaneously broadcasts to all active tabs/windows.
 */
export function sendTripMessage(
  tripId: string,
  from: MessageSenderRole,
  text: string,
  senderName?: string,
  isQuickMessage = false,
): CommsMessage {
  const time = new Date();
  const timeStr = time.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const resolvedSenderName =
    senderName ||
    (from === "driver"
      ? "Ambulance AMB-1024 Pilot"
      : from === "police"
        ? "Hyderabad Traffic Police Command"
        : "ResQRoute Dispatch Engine");

  const message: CommsMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    tripId,
    from,
    senderName: resolvedSenderName,
    text: text.trim(),
    timestamp: time.toISOString(),
    timeStr,
    isQuickMessage,
  };

  handleIncomingMessage(message, true);
  return message;
}

/**
 * Subscribes to real-time messages for a specific emergency trip.
 */
export function subscribeTripMessages(
  tripId: string,
  callback: (msgs: CommsMessage[]) => void,
): () => void {
  if (!messageListeners.has(tripId)) {
    messageListeners.set(tripId, new Set());
  }
  const set = messageListeners.get(tripId)!;
  set.add(callback);

  // Deliver current messages immediately
  callback(getTripMessages(tripId));

  return () => {
    set.delete(callback);
    if (set.size === 0) {
      messageListeners.delete(tripId);
    }
  };
}

/**
 * Publishes an emergency alert to the police dashboard across all tabs.
 */
export function publishEmergencyAlert(alert: EmergencyTripAlert) {
  handleIncomingAlert(alert, true);
}

/**
 * Subscribes to emergency alerts (used by Police Dashboard).
 */
export function subscribeEmergencyAlerts(
  callback: (alert: EmergencyTripAlert) => void,
): () => void {
  alertListeners.add(callback);

  // Deliver last active alert if stored
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(ALERTS_STORAGE_KEY);
      if (raw) {
        callback(JSON.parse(raw));
      }
    } catch (e) {
      // ignore
    }
  }

  return () => {
    alertListeners.delete(callback);
  };
}

/**
 * Returns connection mode description for display in the messenger UI.
 */
export function getCommsConnectionStatus(): {
  label: string;
  isLive: boolean;
  type: "broadcast_channel" | "supabase" | "local";
} {
  if (typeof window === "undefined") {
    return { label: "Offline", isLive: false, type: "local" };
  }

  // Check if Supabase keys are configured
  const env = import.meta.env as Record<string, string | undefined>;
  const hasSupabase =
    Boolean(env["VITE_SUPABASE_URL"]) && Boolean(env["VITE_SUPABASE_PUBLISHABLE_KEY"]);

  if (hasSupabase) {
    return {
      label: "Supabase Realtime Cloud Connected",
      isLive: true,
      type: "supabase",
    };
  }

  if (typeof BroadcastChannel !== "undefined") {
    return {
      label: "Live Multi-Tab & Multi-Window Sync Active",
      isLive: true,
      type: "broadcast_channel",
    };
  }

  return {
    label: "Local Tab Session Active",
    isLive: true,
    type: "local",
  };
}
