import { supabase } from '@/supabase';

/**
 * Upload a file to Supabase storage and return its public URL
 * @param {File} file - The file to upload
 * @param {string} sessionId - Current chat session ID
 * @returns {Promise<{ fileUrl: string|null, error: any }>} Upload result
 */
export async function uploadFile(file, sessionId) {
  try {
    // Generate unique file path
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = `chat-files/${sessionId}/${fileName}`;
    
    // Upload file to storage
    const { error: uploadError } = await supabase.storage
      .from('chat-files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return { fileUrl: null, error: uploadError };
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('chat-files')
      .getPublicUrl(filePath);

    return { fileUrl: publicUrl, error: null };
  } catch (error) {
    console.error('File upload error:', error);
    return { fileUrl: null, error };
  }
}

/**
 * Delete a file from storage
 * @param {string} fileUrl - Public URL of the file to delete
 * @returns {Promise<{ error: any }>} Deletion result
 */
export async function deleteFile(fileUrl) {
  try {
    // Extract file path from URL
    const url = new URL(fileUrl);
    const pathParts = url.pathname.split('/');
    const filePath = pathParts.slice(pathParts.indexOf('chat-files')).join('/');
    
    const { error } = await supabase.storage
      .from('chat-files')
      .remove([filePath]);
      
    return { error };
  } catch (error) {
    console.error('File deletion error:', error);
    return { error };
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
