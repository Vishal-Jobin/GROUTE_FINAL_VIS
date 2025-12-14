


import { createClient } from "https://esm.sh/@supabase/supabase-js@2.87.1";

const SUPABASE_URL = "https://pavlewurtqaygkgiasvc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhdmxld3VydHFheWdrZ2lhc3ZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2ODMxMDIsImV4cCI6MjA4MTI1OTEwMn0.-43h317TJQkoXpq3Lo1pt4DW6wyrGdTSrfu1f1qVuAo";

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);