import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://pjpjuprktknrgnvycqcq.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqcGp1cHJrdGtucmdudnljcWNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExMTkyNDMsImV4cCI6MjA5NjY5NTI0M30.egKHvEU9MywUZsUfsDEm7y5wpuC4eSHZ1jX_gn4yUkI'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
