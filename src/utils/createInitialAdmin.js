import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VUE_APP_SUPABASE_URL
const supabaseKey = process.env.VUE_APP_SUPABASE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase configuration missing. Please check your environment variables.')
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function createInitialAdmin() {
  try {
    // Check if admin already exists
    const { data: existingUsers, error: fetchError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', 'admin@18kchat.com')
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error checking existing admin:', fetchError)
      return { error: { message: 'Failed to check existing admin user', details: fetchError } }
    }

    if (existingUsers) {
      return { error: { message: 'Admin user already exists' } }
    }

    // First, sign up the admin user
    const { data: { user }, error: signUpError } = await supabase.auth.signUp({
      email: 'admin@18kchat.com',
      password: 'Admin@18k2024',
      options: {
        data: {
          role: 'super_admin'
        }
      }
    })

    if (signUpError) {
      console.error('Error creating admin user:', signUpError)
      return { error: { message: 'Failed to create admin account', details: signUpError } }
    }

    if (!user || !user.id) {
      console.error('No user ID returned from signup')
      return { error: { message: 'Failed to get user ID after signup' } }
    }

    // Then create the admin profile
    const { error: profileError } = await supabase
      .from('admin_users')
      .insert([{
        user_id: user.id,
        username: 'admin',
        email: 'admin@18kchat.com',
        role: 'super_admin',
        created_at: new Date().toISOString()
      }])

    if (profileError) {
      console.error('Error creating admin profile:', profileError)
      // Try to clean up the auth user if profile creation fails
      await supabase.auth.admin.deleteUser(user.id).catch(err => {
        console.error('Failed to clean up auth user after profile creation error:', err)
      })
      return { error: { message: 'Failed to create admin profile', details: profileError } }
    }

    console.log('Admin user created successfully')
    return { user }
  } catch (error) {
    console.error('Unexpected error in createInitialAdmin:', error)
    return { error: { message: 'An unexpected error occurred', details: error } }
  }
}

export { createInitialAdmin }
