-- Run send-reminders every 15 minutes. The cron secret is read from Supabase Vault by name
-- ('everyday_cron_secret'), added separately by the project owner; it is never stored here.
create extension if not exists pg_cron;
create extension if not exists pg_net;

select vault.create_secret('https://raefbogputkvicevfrwa.supabase.co', 'everyday_project_url', 'Everyday: project URL for the reminder job');

select cron.schedule(
  'everyday-send-reminders',
  '*/15 * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'everyday_project_url')
           || '/functions/v1/send-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', coalesce((select decrypted_secret from vault.decrypted_secrets where name = 'everyday_cron_secret'), '')
    ),
    body := '{}'::jsonb
  );
  $$
);
