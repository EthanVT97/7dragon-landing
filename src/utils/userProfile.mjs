import { supabase } from '../supabase/index.mjs'

/**
 * Validate nickname
 * @param {string} nickname - Nickname to validate
 * @returns {Object} - Validation result
 */
const validateNickname = (nickname) => {
  if (!nickname) {
    return {
      valid: false,
      error: 'Nickname is required'
    }
  }

  if (nickname.length < 2 || nickname.length > 50) {
    return {
      valid: false,
      error: 'Nickname must be between 2 and 50 characters'
    }
  }

  // Allow letters, numbers, spaces, and common punctuation
  const nicknameRegex = /^[a-zA-Z0-9\s\-_.,'()]+$/
  if (!nicknameRegex.test(nickname)) {
    return {
      valid: false,
      error: 'Nickname can only contain letters, numbers, spaces, and basic punctuation'
    }
  }

  return {
    valid: true
  }
}

/**
 * Update user nickname
 * @param {string} userId - User ID
 * @param {string} nickname - New nickname
 * @returns {Promise<Object>} - Update result
 */
const updateUserNickname = async (userId, nickname) => {
  try {
    // Validate nickname
    const validation = validateNickname(nickname)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    // Update profile
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ 
        nickname,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error

    return {
      success: true,
      profile: data
    }
  } catch (error) {
    console.error('Error updating nickname:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Update nicknames for existing admin users
 * @param {Array<{userId: string, nickname: string}>} adminUpdates - List of admin updates
 * @returns {Promise<Object>} - Update results
 */
const updateAdminNicknames = async (adminUpdates) => {
  try {
    const results = []
    const errors = []

    for (const update of adminUpdates) {
      const { success, profile, error } = await updateUserNickname(
        update.userId, 
        update.nickname
      )

      if (success) {
        results.push(profile)
      } else {
        errors.push({ userId: update.userId, error })
      }
    }

    return {
      success: errors.length === 0,
      updated: results,
      errors
    }
  } catch (error) {
    console.error('Error updating admin nicknames:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Get user display name (nickname or username)
 * @param {Object} user - User profile object
 * @returns {string} - Display name
 */
const getUserDisplayName = (user) => {
  return user?.nickname || user?.username || 'Anonymous'
}

/**
 * Get all admin users without nicknames
 * @returns {Promise<Object>} - List of admin users
 */
const getAdminsWithoutNicknames = async () => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('role', 'admin')
      .is('nickname', null)

    if (error) throw error

    return {
      success: true,
      admins: data
    }
  } catch (error) {
    console.error('Error getting admins without nicknames:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

export { 
  validateNickname, 
  updateUserNickname, 
  updateAdminNicknames, 
  getUserDisplayName, 
  getAdminsWithoutNicknames 
}
