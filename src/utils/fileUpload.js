import { supabase } from '@/supabase/index.mjs'

/**
 * Upload an image to Supabase storage and create a chat message
 * @param {File} imageFile - The image file to upload
 * @param {string} sessionId - Current chat session ID
 * @param {string} userId - Current user ID
 * @returns {Promise<{ data: any, error: any }>} Upload result
 */
export async function uploadChatImage(imageFile, sessionId, userId) {
  try {
    // First, upload the image to storage
    const fileName = `${Date.now()}-${imageFile.name}`
    const filePath = `${userId}/${fileName}`
    
    const { error: uploadError } = await supabase.storage
      .from('chat-images')
      .upload(filePath, imageFile, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Error uploading image:', uploadError)
      return { error: uploadError }
    }

    // Get the public URL for the uploaded image
    const { data: { publicUrl } } = supabase.storage
      .from('chat-images')
      .getPublicUrl(filePath)

    // Create a chat message with the image
    const { data: message, error: messageError } = await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        user_id: userId,
        message_type: 'image',
        image_url: publicUrl,
        file_name: imageFile.name,
        file_type: imageFile.type,
        file_size: imageFile.size,
        metadata: {
          originalName: imageFile.name,
          mimeType: imageFile.type,
          size: imageFile.size,
          uploadedAt: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (messageError) {
      console.error('Error creating message:', messageError)
      // Try to clean up the uploaded file
      await supabase.storage
        .from('chat-images')
        .remove([filePath])
      return { error: messageError }
    }

    return { data: message }
  } catch (error) {
    console.error('Unexpected error in uploadChatImage:', error)
    return { error }
  }
}

/**
 * Upload a file to Supabase storage and create a chat message
 * @param {File} file - The file to upload
 * @param {string} sessionId - Current chat session ID
 * @param {string} userId - Current user ID
 * @returns {Promise<{ data: any, error: any }>} Upload result
 */
export async function uploadChatFile(file, sessionId, userId) {
  try {
    // First, upload the file to storage
    const fileName = `${Date.now()}-${file.name}`
    const filePath = `${userId}/${fileName}`
    
    const { error: uploadError } = await supabase.storage
      .from('chat-files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Error uploading file:', uploadError)
      return { error: uploadError }
    }

    // Get the public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from('chat-files')
      .getPublicUrl(filePath)

    // Create a chat message with the file
    const { data: message, error: messageError } = await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        user_id: userId,
        message_type: 'file',
        file_url: publicUrl,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        metadata: {
          originalName: file.name,
          mimeType: file.type,
          size: file.size,
          uploadedAt: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (messageError) {
      console.error('Error creating message:', messageError)
      // Try to clean up the uploaded file
      await supabase.storage
        .from('chat-files')
        .remove([filePath])
      return { error: messageError }
    }

    return { data: message }
  } catch (error) {
    console.error('Unexpected error in uploadChatFile:', error)
    return { error }
  }
}

/**
 * Delete a chat message and its associated file/image
 * @param {string} messageId - ID of the message to delete
 * @param {string} userId - Current user ID
 * @returns {Promise<{ data: any, error: any }>} Deletion result
 */
export async function deleteChatMessage(messageId, userId) {
  try {
    // First get the message to check type and file path
    const { data: message, error: fetchError } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('id', messageId)
      .single()

    if (fetchError) {
      console.error('Error fetching message:', fetchError)
      return { error: fetchError }
    }

    // If it's an image or file message, delete from storage
    if (message.message_type === 'image' || message.message_type === 'file') {
      const bucket = message.message_type === 'image' ? 'chat-images' : 'chat-files'
      const url = message.message_type === 'image' ? message.image_url : message.file_url
      const filePath = url.split('/').pop() // Extract filename from URL

      const { error: deleteFileError } = await supabase.storage
        .from(bucket)
        .remove([`${userId}/${filePath}`])

      if (deleteFileError) {
        console.error('Error deleting file:', deleteFileError)
        // Continue anyway to delete the message
      }
    }

    // Delete the message
    const { error: deleteError } = await supabase
      .from('chat_messages')
      .delete()
      .eq('id', messageId)
      .eq('user_id', userId) // Ensure user owns the message

    if (deleteError) {
      console.error('Error deleting message:', deleteError)
      return { error: deleteError }
    }

    return { data: true }
  } catch (error) {
    console.error('Unexpected error in deleteChatMessage:', error)
    return { error }
  }
}
