import webpush from "https://esm.sh/web-push@3.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY") || "";
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") || "";
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:notifications@medimind.app";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

interface DoseLog {
  id: string;
  medicine_id: string;
  medicine_name: string;
  scheduled_time: string;
  status: string;
  user_id: string;
}

const sendWebPush = async (subscription: string, title: string, body: string): Promise<boolean> => {
  try {
    const subscriptionObject = JSON.parse(subscription);
    const payload = JSON.stringify({
      title,
      body,
      icon: "/favicon.ico",
      url: "/dashboard"
    });

    await webpush.sendNotification(subscriptionObject, payload, {
      TTL: 86400
    });

    return true;
  } catch (error) {
    console.error("WebPush error:", error);
    return false;
  }
};

const handler = async (req: Request): Promise<Response> => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    const previousTime = new Date(now.getTime() - 5 * 60 * 1000).toTimeString().slice(0, 5);
    const today = now.toISOString().split("T")[0];

    const { data: dueLogs, error } = await supabase
      .from("dose_logs")
      .select("*")
      .eq("date", today)
      .eq("status", "partial")
      .gte("scheduled_time", previousTime)
      .lte("scheduled_time", currentTime);

    if (error) {
      return new Response(JSON.stringify({ message: "Error querying due logs", error }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (!dueLogs || dueLogs.length === 0) {
      return new Response(JSON.stringify({ message: "No due reminders" }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    const results = [];

    for (const log of dueLogs as DoseLog[]) {
      const { data: subscription, error: subError } = await supabase
        .from("push_subscriptions")
        .select("subscription")
        .eq("user_id", log.user_id)
        .single();

      if (!subError && subscription?.subscription) {
        const sent = await sendWebPush(
          subscription.subscription,
          "Time for your medicine",
          `It's time to take ${log.medicine_name}!`
        );
        results.push({ medicine: log.medicine_name, sent });
      } else {
        console.warn("No push subscription for user", log.user_id, subError);
      }
    }

    return new Response(JSON.stringify({ 
      checked: dueLogs.length, 
      notifications: results 
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

Deno.serve(handler);