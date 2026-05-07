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
    
    const response = await fetch(sub.endpoint, {
      method: "POST",
      headers: {
        "TTL": "86400",
        "Content-Type": "application/json",
        "Authorization": `vapid t=${VAPID_PRIVATE_KEY}`
      },
      body: JSON.stringify({
        notification: {
          title: payload.title,
          body: payload.body,
          icon: payload.icon || "/favicon.ico",
          badge: "/favicon.ico",
          data: {
            url: payload.url || "/dashboard"
          }
        }
      })
    });

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