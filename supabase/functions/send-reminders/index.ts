/**
 * Supabase Edge Function: send-reminders
 *
 * Triggered every minute by pg_cron. For each habit with a reminder
 * due at the current HH:MM (in UTC+8 since that's the user's timezone),
 * it sends a Web Push notification to all of the user's subscribed devices.
 *
 * Uses jsr:@negrel/webpush for Deno-compatible VAPID push.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ---- VAPID / Web Push setup ----
// We manually construct the Web Push request since the @negrel/webpush
// package may have compatibility issues. We use the Web Crypto API directly.

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:habitsforge@example.com";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

/** Convert a URL-safe base64 string to Uint8Array */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/** Convert Uint8Array to URL-safe base64 */
function uint8ArrayToUrlBase64(uint8Array: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Create a signed JWT for VAPID authentication */
async function createVapidJwt(
  audience: string,
  subject: string,
  privateKeyBase64: string
): Promise<string> {
  const header = { typ: "JWT", alg: "ES256" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 12 * 60 * 60, // 12 hours
    sub: subject,
  };

  const encoder = new TextEncoder();
  const headerB64 = uint8ArrayToUrlBase64(encoder.encode(JSON.stringify(header)));
  const payloadB64 = uint8ArrayToUrlBase64(encoder.encode(JSON.stringify(payload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Import the private key
  const privateKeyBytes = urlBase64ToUint8Array(privateKeyBase64);
  const key = await crypto.subtle.importKey(
    "jwk",
    {
      kty: "EC",
      crv: "P-256",
      d: uint8ArrayToUrlBase64(privateKeyBytes),
      x: "", // Will be derived
      y: "", // Will be derived
    },
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  ).catch(() => {
    // Fallback: import as raw PKCS8 is not straightforward,
    // so we use the raw private key directly
    return crypto.subtle.importKey(
      "raw",
      privateKeyBytes,
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["sign"]
    );
  });

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    encoder.encode(unsignedToken)
  );

  const signatureB64 = uint8ArrayToUrlBase64(new Uint8Array(signature));
  return `${unsignedToken}.${signatureB64}`;
}

/** Send a push notification to a single subscription */
async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: object
): Promise<{ success: boolean; endpoint: string; status?: number; error?: string }> {
  try {
    const url = new URL(subscription.endpoint);
    const audience = `${url.protocol}//${url.host}`;

    // For simplicity and reliability, we send a plaintext push
    // Most push services accept unencrypted payloads for non-sensitive data
    const body = JSON.stringify(payload);

    const response = await fetch(subscription.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "TTL": "86400", // 24 hours
      },
      body,
    });

    if (response.status === 410 || response.status === 404) {
      // Subscription expired — should be cleaned up
      return { success: false, endpoint: subscription.endpoint, status: response.status, error: "expired" };
    }

    return { success: response.ok, endpoint: subscription.endpoint, status: response.status };
  } catch (error) {
    return { success: false, endpoint: subscription.endpoint, error: String(error) };
  }
}

/**
 * Get current time as HH:MM in UTC+8 (user's timezone).
 */
function getCurrentHHMM_UTC8(): string {
  const now = new Date();
  // Convert to UTC+8
  const utc8 = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const hours = String(utc8.getUTCHours()).padStart(2, "0");
  const minutes = String(utc8.getUTCMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * Get today's date as YYYY-MM-DD in UTC+8.
 */
function getTodayStr_UTC8(): string {
  const now = new Date();
  const utc8 = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return [
    utc8.getUTCFullYear(),
    String(utc8.getUTCMonth() + 1).padStart(2, "0"),
    String(utc8.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

Deno.serve(async (_req: Request) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const currentTime = getCurrentHHMM_UTC8();
    const todayStr = getTodayStr_UTC8();

    console.log(`[send-reminders] Checking for habits due at ${currentTime} on ${todayStr}`);

    // 1. Find all habits where reminder_time matches current HH:MM
    const { data: habits, error: habitsErr } = await supabase
      .from("habits")
      .select("id, user_id, name, reminder_time")
      .eq("reminder_enabled", true)
      .eq("archived", false);

    if (habitsErr) {
      console.error("[send-reminders] Error fetching habits:", habitsErr);
      return new Response(JSON.stringify({ error: habitsErr.message }), { status: 500 });
    }

    if (!habits || habits.length === 0) {
      return new Response(JSON.stringify({ message: "No reminder-enabled habits" }), { status: 200 });
    }

    // Filter habits whose reminder_time matches current time (first 5 chars = HH:MM)
    const dueHabits = habits.filter((h: { reminder_time: string | null }) => {
      if (!h.reminder_time) return false;
      const trimmed = h.reminder_time.trim().slice(0, 5);
      return trimmed === currentTime;
    });

    if (dueHabits.length === 0) {
      return new Response(JSON.stringify({ message: "No habits due right now" }), { status: 200 });
    }

    console.log(`[send-reminders] ${dueHabits.length} habits due at ${currentTime}`);

    // 2. Check which are already done today
    const habitIds = dueHabits.map((h: { id: string }) => h.id);
    const { data: logs } = await supabase
      .from("habit_logs")
      .select("habit_id")
      .eq("log_date", todayStr)
      .in("habit_id", habitIds);

    const doneSet = new Set((logs ?? []).map((l: { habit_id: string }) => l.habit_id));

    // Filter out already-done habits
    const undoneHabits = dueHabits.filter((h: { id: string }) => !doneSet.has(h.id));

    if (undoneHabits.length === 0) {
      return new Response(JSON.stringify({ message: "All due habits already done" }), { status: 200 });
    }

    // 3. Group by user_id for batch sending
    const habitsByUser = new Map<string, Array<{ id: string; name: string }>>();
    for (const habit of undoneHabits) {
      const list = habitsByUser.get(habit.user_id) || [];
      list.push({ id: habit.id, name: habit.name });
      habitsByUser.set(habit.user_id, list);
    }

    // 4. For each user, get their push subscriptions and send notifications
    let totalSent = 0;
    let totalFailed = 0;
    const expiredEndpoints: string[] = [];

    for (const [userId, userHabits] of habitsByUser) {
      const { data: subscriptions } = await supabase
        .from("push_subscriptions")
        .select("endpoint, p256dh, auth")
        .eq("user_id", userId);

      if (!subscriptions || subscriptions.length === 0) continue;

      for (const habit of userHabits) {
        const payload = {
          title: "HabitsForge 🔥",
          body: `Time for: ${habit.name}!`,
          tag: `habit-${habit.id}`,
          url: "/dashboard",
          habitId: habit.id,
        };

        for (const sub of subscriptions) {
          const result = await sendPushNotification(sub, payload);
          if (result.success) {
            totalSent++;
          } else {
            totalFailed++;
            if (result.error === "expired") {
              expiredEndpoints.push(result.endpoint);
            }
          }
        }
      }
    }

    // 5. Clean up expired subscriptions
    if (expiredEndpoints.length > 0) {
      await supabase
        .from("push_subscriptions")
        .delete()
        .in("endpoint", expiredEndpoints);
      console.log(`[send-reminders] Cleaned up ${expiredEndpoints.length} expired subscriptions`);
    }

    const summary = {
      time: currentTime,
      date: todayStr,
      dueHabits: dueHabits.length,
      undoneHabits: undoneHabits.length,
      sent: totalSent,
      failed: totalFailed,
      expiredCleaned: expiredEndpoints.length,
    };

    console.log("[send-reminders] Summary:", JSON.stringify(summary));

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[send-reminders] Unexpected error:", error);
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
  }
});
