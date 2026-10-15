// Sends gentle reminders by Web Push. Called every 15 minutes by pg_cron (see supabase/cron.sql).
// It knows only an hour, a time zone and whether today is already done; habit names stay encrypted
// and are decrypted by the person's own device.
import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const env = (name: string) => Deno.env.get(name) ?? '';
const admin = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'));
let vapidReady = false;

/** A reminder may go out from its hour until two hours later, once a day. */
const WINDOW_HOURS = 2;

function localNow(timezone: string): { date: string; hour: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return { date: `${get('year')}-${get('month')}-${get('day')}`, hour: Number(get('hour')) };
}

Deno.serve(async (req) => {
  const secret = env('CRON_SECRET');
  if (!secret || req.headers.get('x-cron-secret') !== secret) return new Response('Not allowed', { status: 401 });
  if (!vapidReady) {
    const [subject, publicKey, privateKey] = ['VAPID_SUBJECT', 'VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY'].map(env);
    if (!subject || !publicKey || !privateKey) return new Response('VAPID secrets are not set', { status: 500 });
    webpush.setVapidDetails(subject, publicKey, privateKey);
    vapidReady = true;
  }

  const { data: reminders, error } = await admin.from('reminders').select('*');
  if (error) return new Response(error.message, { status: 500 });

  let sent = 0;
  for (const reminder of reminders ?? []) {
    let now;
    try {
      now = localNow(reminder.timezone);
    } catch {
      continue; // unknown time zone
    }
    const due =
      now.hour >= reminder.local_hour &&
      now.hour < reminder.local_hour + WINDOW_HOURS &&
      reminder.skip_on !== now.date &&
      reminder.last_sent_on !== now.date;
    if (!due) continue;

    const { data: subscriptions } = await admin.from('push_subscriptions').select('*').eq('user_id', reminder.user_id);
    const payload = JSON.stringify({
      kind: reminder.id === 'daily' ? 'daily' : 'habit',
      tag: reminder.id,
      label: reminder.label_ct ? { iv: reminder.label_iv, ct: reminder.label_ct } : null,
    });
    for (const sub of subscriptions ?? []) {
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload, {
          TTL: 60 * 60,
          urgency: 'low',
        });
        sent += 1;
      } catch (err) {
        // The device unsubscribed or the browser data was cleared: forget this endpoint.
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) await admin.from('push_subscriptions').delete().eq('id', sub.id);
      }
    }
    await admin
      .from('reminders')
      .update({ last_sent_on: now.date })
      .eq('user_id', reminder.user_id)
      .eq('id', reminder.id);
  }

  return Response.json({ sent });
});
