import webpush from "https://esm.sh/web-push@3.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY") || "";
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") || "";
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:notifications@medimind.app";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const handler = async (req: Request): Promise<Response> => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { userId, title, body, url } = await req.json();

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

    if (error || !subscription?.subscription) {
      return new Response(JSON.stringify({ error: "No subscription found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    const subscriptionObject = JSON.parse(subscription.subscription);
    const payload = JSON.stringify({
      title: title || "MediMind Reminder",
      body: body || "Time for your medication!",
      icon: "/favicon.ico",
      url: url || "/dashboard"
    });

    try {
      await webpush.sendNotification(subscriptionObject, payload, {
        TTL: 86400
      });
    } catch (sendError) {
      console.error("Failed to send web push notification:", sendError);
      const status = sendError?.statusCode || 500;
      return new Response(JSON.stringify({ error: "Failed to send notification", status }), {
        status: status === 410 || status === 404 ? 410 : 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Notification sent"
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