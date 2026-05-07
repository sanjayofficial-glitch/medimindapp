import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") || "";

interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
}

async function sendWebPush(subscription: string, payload: PushNotificationPayload): Promise<boolean> {
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

    let body: Record<string, unknown>;
    
    if (isFcmEndpoint) {
      body = {
        to: sub.endpoint,
        notification: {
          title: payload.title,
          body: payload.body,
          icon: payload.icon || "/favicon.ico"
        },
        webpush: {
          urgency: "high",
          payload: {
            url: payload.url || "/dashboard"
          }
        }
      };
    } else {
      body = {
        notification: {
          title: payload.title,
          body: payload.body,
          icon: payload.icon || "/favicon.ico",
          badge: "/favicon.ico"
        },
        data: {
          url: payload.url || "/dashboard"
        }
      };
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(body)
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

    const { userId, title, body } = await req.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: "userId required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const { data: subscription, error } = await supabase
      .from("push_subscriptions")
      .select("subscription")
      .eq("user_id", userId)
      .single();

    if (error || !subscription) {
      return new Response(JSON.stringify({ error: "No subscription found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    const success = await sendWebPush(subscription.subscription, {
      title: title || "MediMind Reminder",
      body: body || "Time for your medication!",
      url: "/dashboard"
    });

    return new Response(JSON.stringify({ 
      success, 
      message: success ? "Notification sent" : "Failed to send" 
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