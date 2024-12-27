const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')

// Load environment variables
dotenv.config()

// For admin operations, we need to use the service_role key
const supabaseAdmin = createClient(
  process.env.VUE_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VUE_APP_SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: false,
      detectSessionInUrl: false
    }
  }
)

const createAdminProfile = async (userId, username, nickname) => {
  try {
    // Create admin profile with service role client
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        user_id: userId,
        username,
        nickname,
        role: 'admin',
        created_at: new Date().toISOString()
      })

    if (profileError) throw profileError

    // Create initial notification
    const { error: notificationError } = await supabaseAdmin
      .from('admin_notifications')
      .insert({
        type: 'welcome',
        message: `Welcome ${nickname}! You can manage your chat application from here.`,
        user_id: userId,
        created_at: new Date().toISOString()
      })

    if (notificationError) throw notificationError

    return { success: true }
  } catch (error) {
    console.error('Error in admin operations:', error)
    return { success: false, error }
  }
}

module.exports = { supabaseAdmin, createAdminProfile }
