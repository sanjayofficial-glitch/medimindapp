import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
    ...init,
  })
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, { status: 405 })
  }

  let payload: any
  try {
    payload = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { user_id, title, body, url } = payload ?? {}

  if (!title || !body) {
    return jsonResponse({ error: 'Missing required fields: title, body' }, { status: 400 })
  }

  // VAPID Configuration
  const vapidSubject = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@example.com'
  const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')
  const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')

  console.log('[PUSH] VAPID keys present:', !!vapidPublicKey && !!vapidPrivateKey)

  if (!vapidPublicKey || !vapidPrivateKey) {
    return jsonResponse(
      { error: 'Missing VAPID keys. Please configure VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in Edge Function secrets' },
      { status: 500 }
    )
  }

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)

  // Fetch subscriptions
  const query = supabaseAdmin
    .from('push_subscriptions')
    .select('user_id, subscription')

  if (user_id) query.eq('user_id', user_id)

  const { data: subs, error } = await query

  if (error) {
    console.error('[PUSH] Database error:', error)
    return jsonResponse({ error: error.message }, { status: 500 })
  }
  
  if (!subs || subs.length === 0) {
    console.log('[PUSH] No subscriptions found for user:', user_id ?? 'all users')
    return jsonResponse({ sent: 0, results: [] })
  }

  console.log('[PUSH] Found', subs.length, 'subscriptions')

  const payloadToSend = {
    title,
    body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    ...(url ? { url } : {}),
    actions: [
      { action: 'taken', title: '✅ Taken' },
      { action: 'snooze', title: '⏰ Snooze 10min' }
    ]
  }

  const results: Array<{ user_id: string | null; ok: boolean; error?: string }> = []

  for (const sub of subs) {
    try {
      const subscription = sub.subscription
      await webpush.sendNotification(subscription, JSON.stringify(payloadToSend))
      results.push({ user_id: sub.user_id ?? null, ok: true })
      console.log('[PUSH] Sent to user:', sub.user_id)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error('[PUSH] Failed to send to user:', sub.user_id, msg)
      
      // Handle expired subscription - delete from DB
      if (msg.includes('410') || msg.includes('subscription no longer exists')) {
        await supabaseAdmin
          .from('push_subscriptions')
          .delete()
          .eq('user_id', sub.user_id)
        console.log('[PUSH] Removed expired subscription for user:', sub.user_id)
      }
      
      results.push({ user_id: sub.user_id ?? null, ok: false, error: msg })
    }
  }

  const okCount = results.filter((r) => r.ok).length
  console.log('[PUSH] Successfully sent:', okCount, '/', results.length)
  
  return jsonResponse({ sent: okCount, results }, { status: 200 })
})