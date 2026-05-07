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

async function sendWebPush(subscription: string, title: string, body: string): Promise<boolean> {
  try {
    const sub = JSON.parse(subscription);
    
    if (!sub.endpoint) {
      console.error("WebPush error: No endpoint in subscription");
      return false;
    }

    const endpoint = sub.endpoint;
    const isFcmEndpoint = endpoint.includes("fcm.googleapis.com") || endpoint.includes("firebase.com");
    
    let headers: Record<string, string> = {
      "TTL": "86400",
      "Content-Type": "application/json",
    };

    if (isFcmEndpoint) {
      headers["Authorization"] = `key=${VAPID_PRIVATE_KEY}`;
    } else if (VAPID_PRIVATE_KEY) {
      headers["Authorization"] = `vapid t=${VAPID_PRIVATE_KEY}`;
    }

    let pushBody: Record<string, unknown>;
    
    if (isFcmEndpoint) {
      pushBody = {
        to: sub.endpoint,
        notification: {
          title,
          body,
          icon: "/favicon.ico"
        },
        webpush: {
          urgency: "high",
          payload: {
            url: "/dashboard"
          }
        }
      };
    } else {
      pushBody = {
        notification: {
          title,
          body,
          icon: "/favicon.ico",
          badge: "/favicon.ico"
        },
        data: {
          url: "/dashboard"
        }
      };
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(pushBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("WebPush response not OK:", response.status, errorText);
      
      if (response.status === 410 || response.status === 404) {
        console.log("Subscription expired, needs to be re-subscribed");
        return false;
      }
    }

    return response.ok;
  } catch (error) {
    console.error("WebPush error:", error);
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
        const sent = await sendWebPush(
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