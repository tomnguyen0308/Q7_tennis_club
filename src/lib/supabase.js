import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imppa2xsZmJwa3VsYm9nanBkZ2hnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNDU3NTksImV4cCI6MjA5MTcyMTc1OX0.BFcfuN3EpUOCbsFaMYSTqvTXQO4IXRLmk1UquADsIWs'

export const supabase = createClient(supabaseUrl, supabaseKey)
