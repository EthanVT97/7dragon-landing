import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xnujjoarvinvztccwrye.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhudWpqb2Fydmludnp0Y2N3cnllIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTI3NzU5MCwiZXhwIjoyMDUwODUzNTkwfQ.05VwSiLqDWmOeT7akK-T0JrG65VIYz3doTurOYtjxgs'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

async function createInitialAdmin(email, password, username, nickname) {
  try {
    // Validate nickname
    if (!nickname || nickname.length < 2 || nickname.length > 30) {
      throw new Error('Nickname must be between 2 and 30 characters')
    }

    // Create admin user
    const { data: { user }, error: signUpError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })

    if (signUpError) throw signUpError

    // Create admin profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: user.id,
        username,
        nickname,
        role: 'admin',
        created_at: new Date().toISOString()
      })

    if (profileError) throw profileError

    // Create initial notification for admin
    const { error: notificationError } = await supabase
      .from('admin_notifications')
      .insert({
        type: 'welcome',
        message: `Welcome ${nickname}! You can manage your chat application from here.`,
        user_id: user.id,
        created_at: new Date().toISOString()
      })

    if (notificationError) throw notificationError

    return {
      success: true,
      user,
      message: 'Admin user created successfully with initial notification'
    }
  } catch (error) {
    console.error('Error creating admin:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Create admin user
async function main() {
  try {
    const result = await createInitialAdmin(
      'admin.user456@gmail.com',
      'admin123',
      'admin',
      'Super Admin'
    )
    console.log('Admin creation result:', result)
  } catch (error) {
    console.error('Error in main:', error)
  }
}

main()
