import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VUE_APP_SUPABASE_URL || 'https://xnujjoarvinvztccwrye.supabase.co'
const supabaseKey = process.env.VUE_APP_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhudWpqb2Fydmludnp0Y2N3cnllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUyNzc1OTAsImV4cCI6MjA1MDg1MzU5MH0.pyxlMZkDM53RWaPHc4GhsoKdaGDqbkn2p7b1cXF3Wgs'

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})
