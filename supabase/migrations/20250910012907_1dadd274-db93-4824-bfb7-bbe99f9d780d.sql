-- Enable cron and http extensions pour automatiser le traitement des factures
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Créer un job cron qui exécute la fonction de traitement automatique des factures tous les jours à 8h00
SELECT cron.schedule(
  'process-automatic-bills-daily',
  '0 8 * * *', -- Tous les jours à 8h00
  $$
  SELECT
    net.http_post(
        url:='https://msasycggbiwyxlczknwj.supabase.co/functions/v1/process-automatic-bills',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zYXN5Y2dnYml3eXhsY3prbndqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzczNjU5MTMsImV4cCI6MjA1Mjk0MTkxM30.Ezb5GjSg8ApUWR5iNMvVS9bSA7oxudUuYOP2g2ugB_4"}'::jsonb,
        body:='{"automated": true}'::jsonb
    ) as request_id;
  $$
);

-- Créer également un job pour vérifier les factures dues toutes les 4 heures
SELECT cron.schedule(
  'check-due-bills-frequent',
  '0 */4 * * *', -- Toutes les 4 heures
  $$
  SELECT
    net.http_post(
        url:='https://msasycggbiwyxlczknwj.supabase.co/functions/v1/process-automatic-bills',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zYXN5Y2dnYml3eXhsY3prbndqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzczNjU5MTMsImV4cCI6MjA1Mjk0MTkxM30.Ezb5GjSg8ApUWR5iNMvVS9bSA7oxudUuYOP2g2ugB_4"}'::jsonb,
        body:='{"check_only": true}'::jsonb
    ) as request_id;
  $$
);