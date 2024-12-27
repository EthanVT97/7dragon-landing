import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VUE_APP_SUPABASE_URL
const supabaseKey = process.env.VUE_APP_SUPABASE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase configuration missing:', { supabaseUrl: !!supabaseUrl, supabaseKey: !!supabaseKey })
  throw new Error('Supabase configuration missing. Please check your environment variables.')
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

async function createInitialAdmin() {
  try {
    console.log('Starting admin user creation process...')

    // First check if we can connect to Supabase and have the right permissions
    const { data: rls, error: rlsError } = await supabase.rpc('check_admin_access')
    if (rlsError) {
      console.log('RLS check failed, proceeding anyway:', rlsError)
    } else {
      console.log('RLS check result:', rls)
    }

    // Check if admin already exists
    const { data: existingUsers, error: fetchError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', 'admin@18kchat.com')

    if (fetchError) {
      console.error('Error checking existing admin:', fetchError)
      return { error: { message: 'Failed to check existing admin user', details: fetchError } }
    }

    if (existingUsers && existingUsers.length > 0) {
      console.log('Admin user already exists')
      return { error: { message: 'Admin user already exists', type: 'ADMIN_EXISTS' } }
    }

    console.log('No existing admin found, proceeding with creation')

    // Create new auth user first
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: 'admin@18kchat.com',
      password: 'Admin@18k2024',
      options: {
        data: {
          role: 'super_admin'
        }
      }
    })

    if (signUpError) {
      console.error('Error creating admin auth user:', signUpError)
      return { error: { message: 'Failed to create admin account', details: signUpError } }
    }

    const user = signUpData?.user
    if (!user || !user.id) {
      console.error('No user ID returned from signup:', signUpData)
      return { error: { message: 'Failed to get user ID after signup' } }
    }

    console.log('Auth user created:', user)

    // Wait a bit for the auth user to be fully created
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Try to get the auth user to confirm creation
    const { data: { user: confirmedUser }, error: getUserError } = await supabase.auth.getUser(user.id)
    if (getUserError) {
      console.error('Error confirming user creation:', getUserError)
    } else {
      console.log('User creation confirmed:', confirmedUser)
    }

    console.log('Creating admin profile')

    // Create the admin profile
    const adminProfile = {
      user_id: user.id,
      username: 'admin',
      email: 'admin@18kchat.com',
      role: 'super_admin',
      created_at: new Date().toISOString()
    }

    console.log('Inserting admin profile:', adminProfile)

    const { data: profile, error: profileError } = await supabase
      .from('admin_users')
      .insert([adminProfile])
      .select()
      .single()

    if (profileError) {
      // If it's a "no rows returned" error, this actually means success for an insert
      if (profileError.message?.includes('No rows returned') || profileError.code === 'PGRST116') {
        console.log('Admin profile created successfully (no rows returned)')
        return { user, success: true }
      }

      console.error('Error creating admin profile:', profileError)
      
      // Check if it's a foreign key error
      if (profileError.code === '23503') {
        console.error('Foreign key violation - auth user might not be fully created yet')
        return { error: { message: 'Auth user not fully created. Please try again in a few seconds.', details: profileError } }
      }
      
      // Try to clean up the auth user if profile creation fails
      try {
        await supabase.auth.admin.deleteUser(user.id)
        console.log('Cleaned up auth user after profile creation error')
      } catch (err) {
        console.error('Failed to clean up auth user after profile creation error:', err)
      }
      
      return { error: { message: 'Failed to create admin profile', details: profileError } }
    }

    console.log('Admin user and profile created successfully:', { user, profile })
    return { user, success: true }
  } catch (error) {
    console.error('Unexpected error in createInitialAdmin:', error)
    return { error: { message: 'An unexpected error occurred', details: error } }
  }
}

export { createInitialAdmin }
