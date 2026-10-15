-- The reminder schedule is set up by migrations/20261015000000_everyday_reminder_schedule.sql.
-- One step is left for the project owner: store the cron secret in Supabase Vault.
-- In the SQL editor, run this with the CRON_SECRET value from supabase/.env.secrets
-- (the same value given to the send-reminders function), then do not save it anywhere else.
select vault.create_secret('<CRON_SECRET>', 'everyday_cron_secret', 'Everyday: shared secret for the reminder job');
