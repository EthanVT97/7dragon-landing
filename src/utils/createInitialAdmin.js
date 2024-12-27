import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VUE_APP_SUPABASE_URL
const supabaseKey = process.env.VUE_APP_SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function createInitialAdmin() {
  try {
    // First, sign up the admin user
    const { data: { user }, error: signUpError } = await supabase.auth.signUp({
      email: 'admin@18kchat.com',
      password: 'Admin@18k2024'
    })

    if (signUpError) {
      console.error('Error creating admin user:', signUpError)
      return { error: signUpError }
    }

    // Then create the admin profile
    const { error: profileError } = await supabase
      .from('admin_users')
      .insert([{
        user_id: user.id,
        username: 'admin',
        email: 'admin@18kchat.com',
        role: 'super_admin'
      }])

    if (profileError) {
      console.error('Error creating admin profile:', profileError)
      return { error: profileError }
    }

    console.log('Admin user created successfully')
    return { user }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error }
  }
}

export { createInitialAdmin }
