const { validateNickname } = require('./userProfile.js')
const { createAdminProfile, supabaseAdmin } = require('../../scripts/adminUtils.js')

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

const getExistingUser = async (email) => {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers()
  if (error) throw error
  return data.users.find(user => user.email === email)
}

const waitForUser = async (userId, maxAttempts = 5) => {
  for (let i = 0; i < maxAttempts; i++) {
    const { data } = await supabaseAdmin.auth.admin.getUserById(userId)

    if (data?.user) return true
    if (i < maxAttempts - 1) {
      console.log(`Attempt ${i + 1}/${maxAttempts} - Waiting for user creation...`)
      await delay(1000) // Wait 1 second between attempts
    }
  }
  return false
}

const createInitialAdmin = async (email, password, username, nickname) => {
  try {
    // Validate nickname
    const validation = validateNickname(nickname)
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error
      }
    }

    // Check if user already exists
    console.log('Checking if user already exists...')
    const existingUser = await getExistingUser(email)
    let userId

    if (existingUser) {
      console.log('User already exists, updating metadata...')
      userId = existingUser.id

      // Update user metadata
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          username,
          nickname,
          role: 'admin'
        }
      })

      if (updateError) {
        console.error('Error updating user metadata:', updateError)
        throw updateError
      }
    } else {
      console.log('Creating new admin user...')
      // Create admin user using admin client
      const { data, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          username,
          nickname,
          role: 'admin'
        }
      })

      if (signUpError) {
        console.error('Signup error:', signUpError)
        throw signUpError
      }

      if (!data?.user?.id) {
        console.error('No user data returned:', data)
        throw new Error('Failed to create user - no user ID returned')
      }

      userId = data.user.id
      console.log('User created successfully:', userId)

      // Wait for user to be available in the database
      console.log('Waiting for user to be available in the database...')
      const userExists = await waitForUser(userId)
      
      if (!userExists) {
        throw new Error('Timeout waiting for user to be created in the database')
      }

      console.log('User is now available in the database')
    }

    // Create admin profile using service role client
    const { success, error } = await createAdminProfile(userId, username, nickname)
    
    if (!success) {
      throw error || new Error('Failed to create admin profile')
    }

    console.log('Admin profile and notification created successfully')

    return {
      success: true,
      userId,
      message: 'Admin user created/updated successfully with initial notification'
    }
  } catch (error) {
    console.error('Error creating admin:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

module.exports = { createInitialAdmin }
