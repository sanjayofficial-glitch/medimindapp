import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") || "";

interface DoseLog {
  id: string;
  medicine_id: string;
  medicine_name: string;
  scheduled_time: string;
  status: string;
  user_id: string;
}

function sendWebPush(subscription: string, title: string, body: string): boolean {
  try {
    const sub = JSON.parse(subscription);
    
    fetch(sub.endpoint, {
      method: "POST",
      headers: {
        "TTL": "86400",
        "Content-Type": "application/json",
        "Authorization": ` vapid t=${VAPID_PRIVATE_KEY}`
      },
      body: JSON.stringify({
        notification: {
          title,
          body,
          icon: "/favicon.ico",
          data: { url: "/dashboard" }
        }
      })
    });
    return true;
  } catch {
    return false;
  }
}

const handler = async (req: Request): Promise<Response> => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    const today = now.toISOString().split("T")[0];

    const { data: dueLogs, error } = await supabase
      .from("dose_logs")
      .select("*")
      .eq("date", today)
      .eq("status", "partial")
      .lte("scheduled_time", currentTime);

    if (error || !dueLogs) {
      return new Response(JSON.stringify({ message: "No due logs or error", error }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    const results = [];

    for (const log of dueLogs as DoseLog[]) {
      const { data: subscription } = await supabase
        .from("push_subscriptions")
        .select("subscription")
        .eq("user_id", log.user_id)
        .single();

      if (subscription) {
        const sent = sendWebPush(
          subscription.subscription,
          "Time for your medicine",
          `It's time to take ${log.medicine_name}!`
        );
        results.push({ medicine: log.medicine_name, sent });
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