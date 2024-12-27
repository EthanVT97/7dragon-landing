import { supabase } from '../supabase/index.js'
import { getUserDisplayName } from './userProfile.js'

/**
 * Get all messages that need to be updated with nicknames
 * @param {number} batchSize - Number of messages to process at once
 * @param {number} offset - Starting offset for pagination
 * @returns {Promise<Object>} - Messages and count
 */
const getMessagesToUpdate = async (batchSize = 100, offset = 0) => {
  try {
    const { data, error, count } = await supabase
      .from('chat_messages')
      .select(`
        *,
        user:user_profiles(username, nickname)
      `, { count: 'exact' })
      .range(offset, offset + batchSize - 1)
      .order('created_at', { ascending: true })

    if (error) throw error

    return {
      success: true,
      messages: data,
      total: count
    }
  } catch (error) {
    console.error('Error getting messages to update:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Update message content to use nickname
 * @param {Object} message - Message object
 * @param {Object} userProfile - User profile object
 * @returns {string} - Updated content
 */
const updateMessageContent = (message, userProfile) => {
  let updatedContent = message.content

  // Replace username with display name in common patterns
  const oldName = userProfile.username
  const newName = getUserDisplayName(userProfile)
  
  // Common patterns to replace
  const patterns = [
    `@${oldName}`,
    `from ${oldName}`,
    `to ${oldName}`,
    `${oldName} said`,
    `${oldName}:`
  ]

  patterns.forEach(pattern => {
    const regex = new RegExp(pattern, 'gi')
    updatedContent = updatedContent.replace(regex, match => {
      return match.replace(oldName, newName)
    })
  })

  return updatedContent
}

/**
 * Update a batch of messages
 * @param {Array} messages - Array of messages to update
 * @returns {Promise<Object>} - Update results
 */
const updateMessageBatch = async (messages) => {
  try {
    const updates = messages.map(message => {
      const updatedContent = updateMessageContent(message, message.user)
      
      // Only update if content has changed
      if (updatedContent !== message.content) {
        return {
          id: message.id,
          content: updatedContent,
          updated_at: new Date().toISOString()
        }
      }
      return null
    }).filter(Boolean)

    if (updates.length === 0) {
      return {
        success: true,
        updated: 0
      }
    }

    const { data, error } = await supabase
      .from('chat_messages')
      .upsert(updates)
      .select()

    if (error) throw error

    return {
      success: true,
      updated: data.length
    }
  } catch (error) {
    console.error('Error updating message batch:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Migrate all messages to use nicknames
 * @param {Object} options - Migration options
 * @param {number} options.batchSize - Number of messages to process at once
 * @param {Function} options.onProgress - Progress callback
 * @returns {Promise<Object>} - Migration results
 */
export const migrateMessagesToNicknames = async ({
  batchSize = 100,
  onProgress = (progress) => console.log(`Migration progress: ${progress}%`)
} = {}) => {
  try {
    // Get total count of messages
    const { messages, total, error } = await getMessagesToUpdate(1, 0)
    if (error) throw error

    if (total === 0) {
      return {
        success: true,
        message: 'No messages to migrate'
      }
    }

    let processed = 0
    let updated = 0
    let offset = 0
    const errors = []

    while (processed < total) {
      // Get batch of messages
      const { messages, error } = await getMessagesToUpdate(batchSize, offset)
      if (error) {
        errors.push({ offset, error })
        offset += batchSize
        processed += batchSize
        continue
      }

      // Update batch
      const { success, updated: batchUpdated, error: updateError } = 
        await updateMessageBatch(messages)

      if (!success) {
        errors.push({ offset, error: updateError })
      } else {
        updated += batchUpdated
      }

      // Update progress
      processed += messages.length
      offset += batchSize
      onProgress(Math.round((processed / total) * 100))
    }

    return {
      success: errors.length === 0,
      processed,
      updated,
      errors: errors.length > 0 ? errors : null,
      message: `Successfully migrated ${updated} of ${processed} messages`
    }
  } catch (error) {
    console.error('Error migrating messages:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Validate message content after migration
 * @param {string} messageId - Message ID to validate
 * @returns {Promise<Object>} - Validation results
 */
export const validateMessageMigration = async (messageId) => {
  try {
    const { data: message, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        user:user_profiles(username, nickname)
      `)
      .eq('id', messageId)
      .single()

    if (error) throw error

    const expectedContent = updateMessageContent(message, message.user)
    const isValid = message.content === expectedContent

    return {
      success: true,
      isValid,
      message,
      expectedContent: isValid ? null : expectedContent
    }
  } catch (error) {
    console.error('Error validating message migration:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Example usage:
 * 
 * // Migrate all messages with progress updates
 * const result = await migrateMessagesToNicknames({
 *   batchSize: 100,
 *   onProgress: (progress) => {
 *     console.log(`Migration progress: ${progress}%`)
 *   }
 * })
 * 
 * // Validate specific message
 * const validation = await validateMessageMigration('message-id')
 */
