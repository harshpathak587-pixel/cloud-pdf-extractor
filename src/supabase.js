import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://mharvojnxaxhfcvjunac.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oYXJ2b2pueGF4aGZjdmp1bmFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxMTQyNTQsImV4cCI6MjA4ODY5MDI1NH0.IQhlNFSabU61iqscxGZq0gL2N8kXPnP54qn07kKdRnU'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
