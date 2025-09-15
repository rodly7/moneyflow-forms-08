-- Ensure unique constraint or index exists for ON CONFLICT to work
DO $$ BEGIN
  -- Create a unique index on agent_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_indexes 
    WHERE schemaname = 'public' 
      AND tablename = 'agent_locations' 
      AND indexname = 'ux_agent_locations_agent_id'
  ) THEN
    CREATE UNIQUE INDEX ux_agent_locations_agent_id 
    ON public.agent_locations (agent_id);
  END IF;
END $$;