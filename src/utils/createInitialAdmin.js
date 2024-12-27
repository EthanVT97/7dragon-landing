import { supabase } from '../supabase/index.js'
import { validateNickname } from './userProfile.js'

export const createInitialAdmin = async (email, password, username, nickname) => {
  try {
    // Validate nickname
    const validation = validateNickname(nickname)
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error
      }
    }

    // Create admin user
    const { user, error: signUpError } = await supabase.auth.signUp({
      email,
      password
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
    console.error('Error creating initial admin:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Example usage:
 * 
 * // Create admin with nickname
 * const result = await createInitialAdmin(
 *   'admin@example.com',
 *   'password123',
 *   'admin',
 *   'Super Admin'
 * )
 * 
 * // Update existing admin nickname
 * import { updateUserNickname } from './userProfile'
 * const updateResult = await updateUserNickname(userId, 'New Nickname')
 * 
 * // Get admins without nicknames
 * import { getAdminsWithoutNicknames } from './userProfile'
 * const { admins } = await getAdminsWithoutNicknames()
 * 
 * // Update multiple admin nicknames
 * import { updateAdminNicknames } from './userProfile'
 * const updates = [
 *   { userId: 'id1', nickname: 'Admin 1' },
 *   { userId: 'id2', nickname: 'Admin 2' }
 * ]
 * const result = await updateAdminNicknames(updates)
 */
