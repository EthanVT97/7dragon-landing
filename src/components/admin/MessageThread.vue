<template>
  <div class="message-thread">
    <div class="thread-header">
      <div class="user-info">
        <div class="avatar">
          {{ getInitials(message.user?.email || 'Anonymous') }}
        </div>
        <div class="details">
          <h3>{{ message.user?.email || 'Anonymous' }}</h3>
          <span class="time">{{ formatDate(message.created_at) }}</span>
        </div>
      </div>
      <div class="message-actions">
        <button @click="toggleReaction" class="action-btn">
          <i class="far fa-smile"></i>
        </button>
        <button @click="$emit('close')" class="action-btn">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>

    <div class="message-content" :class="message.message_type">
      <template v-if="message.message_type === 'text'">
        {{ message.content }}
      </template>
      <template v-else-if="message.message_type === 'image'">
        <img :src="message.content.url" :alt="message.content.filename">
      </template>
      <template v-else-if="message.message_type === 'file'">
        <div class="file-attachment">
          <i class="fas fa-file"></i>
          <span>{{ message.content.filename }}</span>
          <a :href="message.content.url" download>Download</a>
        </div>
      </template>
    </div>

    <div class="reactions-bar" v-if="message.reactions?.length">
      <div 
        v-for="reaction in groupedReactions" 
        :key="reaction.emoji"
        class="reaction"
        :class="{ active: hasUserReacted(reaction.emoji) }"
        @click="toggleReaction(reaction.emoji)"
      >
        {{ reaction.emoji }} {{ reaction.count }}
      </div>
    </div>

    <div class="emoji-picker" v-if="showEmojiPicker" @click.stop>
      <div class="emoji-list">
        <button 
          v-for="emoji in commonEmojis" 
          :key="emoji"
          @click="addReaction(emoji)"
          class="emoji-btn"
        >
          {{ emoji }}
        </button>
      </div>
    </div>

    <div class="thread-replies">
      <h4>Replies</h4>
      
      <div class="replies-list">
        <div 
          v-for="reply in sortedReplies" 
          :key="reply.id"
          class="reply-item"
        >
          <div class="reply-header">
            <div class="user-info">
              <div class="avatar small">
                {{ getInitials(reply.user?.email || 'Anonymous') }}
              </div>
              <div class="details">
                <span class="name">{{ reply.user?.email || 'Anonymous' }}</span>
                <span class="time">{{ formatTimeAgo(reply.created_at) }}</span>
              </div>
            </div>
            <div class="reply-actions">
              <button @click="toggleReplyReaction(reply)" class="action-btn small">
                <i class="far fa-smile"></i>
              </button>
            </div>
          </div>

          <div class="reply-content">
            {{ reply.content }}
          </div>

          <div class="reactions-bar small" v-if="reply.reactions?.length">
            <div 
              v-for="reaction in groupReactions(reply.reactions)" 
              :key="reaction.emoji"
              class="reaction small"
              :class="{ active: hasUserReacted(reaction.emoji, reply.id) }"
              @click="toggleReaction(reaction.emoji, reply.id)"
            >
              {{ reaction.emoji }} {{ reaction.count }}
            </div>
          </div>
        </div>
      </div>

      <div class="reply-input">
        <div class="typing-indicator" v-if="isTyping">
          Someone is typing...
        </div>
        <div class="input-wrapper">
          <textarea 
            v-model="replyText"
            placeholder="Write a reply..."
            @input="handleTyping"
            @keydown.enter.prevent="sendReply"
          ></textarea>
          <button 
            @click="sendReply"
            :disabled="!replyText.trim()"
            class="send-btn"
          >
            <i class="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { supabase } from '@/supabase'
import { format, formatDistanceToNow } from 'date-fns'
import debounce from 'lodash/debounce'

export default {
  name: 'MessageThread',

  props: {
    message: {
      type: Object,
      required: true
    }
  },

  emits: ['close'],

  setup(props) {
    const replyText = ref('')
    const replies = ref([])
    const showEmojiPicker = ref(false)
    const isTyping = ref(false)
    const typingUsers = ref(new Set())

    // Common emojis
    const commonEmojis = ['👍', '❤️', '😊', '👏', '🎉', '🤔', '👌', '🙌']

    // Sort replies by date
    const sortedReplies = computed(() => {
      return [...replies.value].sort((a, b) => 
        new Date(a.created_at) - new Date(b.created_at)
      )
    })

    // Group reactions
    const groupedReactions = computed(() => {
      return groupReactions(props.message.reactions || [])
    })

    // Fetch replies
    const fetchReplies = async () => {
      try {
        const { data, error } = await supabase
          .from('message_replies')
          .select(`
            *,
            user:user_profiles(email),
            reactions(emoji, user_id)
          `)
          .eq('message_id', props.message.id)
          .order('created_at', { ascending: true })

        if (error) throw error
        replies.value = data
      } catch (error) {
        console.error('Error fetching replies:', error)
      }
    }

    // Send reply
    const sendReply = async () => {
      if (!replyText.value.trim()) return

      try {
        const { data, error } = await supabase
          .from('message_replies')
          .insert({
            message_id: props.message.id,
            content: replyText.value.trim(),
            user_id: supabase.auth.user().id
          })

        if (error) throw error

        replyText.value = ''
        await fetchReplies()
      } catch (error) {
        console.error('Error sending reply:', error)
      }
    }

    // Handle reactions
    const addReaction = async (emoji, targetId = null) => {
      try {
        const { error } = await supabase
          .from('message_reactions')
          .insert({
            message_id: targetId || props.message.id,
            emoji,
            user_id: supabase.auth.user().id
          })

        if (error) throw error

        showEmojiPicker.value = false
        if (targetId) {
          await fetchReplies()
        } else {
          // Refresh message reactions
          props.message.reactions = [
            ...(props.message.reactions || []),
            { emoji, user_id: supabase.auth.user().id }
          ]
        }
      } catch (error) {
        console.error('Error adding reaction:', error)
      }
    }

    const removeReaction = async (emoji, targetId = null) => {
      try {
        const { error } = await supabase
          .from('message_reactions')
          .delete()
          .match({
            message_id: targetId || props.message.id,
            emoji,
            user_id: supabase.auth.user().id
          })

        if (error) throw error

        if (targetId) {
          await fetchReplies()
        } else {
          // Remove reaction locally
          props.message.reactions = props.message.reactions.filter(
            r => !(r.emoji === emoji && r.user_id === supabase.auth.user().id)
          )
        }
      } catch (error) {
        console.error('Error removing reaction:', error)
      }
    }

    const toggleReaction = (emoji, targetId = null) => {
      const reactions = targetId ? 
        replies.value.find(r => r.id === targetId)?.reactions :
        props.message.reactions

      const hasReacted = reactions?.some(
        r => r.emoji === emoji && r.user_id === supabase.auth.user().id
      )

      if (hasReacted) {
        removeReaction(emoji, targetId)
      } else {
        addReaction(emoji, targetId)
      }
    }

    // Typing indicator
    const updateTypingStatus = debounce(async (isTyping) => {
      try {
        await supabase.from('typing_indicators').upsert({
          message_id: props.message.id,
          user_id: supabase.auth.user().id,
          is_typing: isTyping
        })
      } catch (error) {
        console.error('Error updating typing status:', error)
      }
    }, 500)

    const handleTyping = () => {
      updateTypingStatus(true)
    }

    // Helper functions
    const formatDate = (date) => {
      return format(new Date(date), 'MMM d, yyyy HH:mm')
    }

    const formatTimeAgo = (date) => {
      return formatDistanceToNow(new Date(date), { addSuffix: true })
    }

    const getInitials = (email) => {
      return email
        .split('@')[0]
        .split(/[._-]/)
        .map(part => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }

    const groupReactions = (reactions) => {
      const groups = {}
      reactions.forEach(r => {
        if (!groups[r.emoji]) {
          groups[r.emoji] = { emoji: r.emoji, count: 0 }
        }
        groups[r.emoji].count++
      })
      return Object.values(groups)
    }

    const hasUserReacted = (emoji, targetId = null) => {
      const reactions = targetId ? 
        replies.value.find(r => r.id === targetId)?.reactions :
        props.message.reactions

      return reactions?.some(
        r => r.emoji === emoji && r.user_id === supabase.auth.user().id
      )
    }

    // Subscriptions
    let replySubscription, typingSubscription
    const subscribeToUpdates = () => {
      // Subscribe to new replies
      replySubscription = supabase
        .from(`message_replies:message_id=eq.${props.message.id}`)
        .on('*', () => {
          fetchReplies()
        })
        .subscribe()

      // Subscribe to typing indicators
      typingSubscription = supabase
        .from(`typing_indicators:message_id=eq.${props.message.id}`)
        .on('*', payload => {
          if (payload.new.is_typing) {
            typingUsers.value.add(payload.new.user_id)
          } else {
            typingUsers.value.delete(payload.new.user_id)
          }
          isTyping.value = typingUsers.value.size > 0
        })
        .subscribe()
    }

    // Lifecycle hooks
    onMounted(() => {
      fetchReplies()
      subscribeToUpdates()
    })

    onUnmounted(() => {
      updateTypingStatus(false)
      if (replySubscription) {
        supabase.removeSubscription(replySubscription)
      }
      if (typingSubscription) {
        supabase.removeSubscription(typingSubscription)
      }
    })

    return {
      replyText,
      replies,
      sortedReplies,
      showEmojiPicker,
      isTyping,
      commonEmojis,
      groupedReactions,
      sendReply,
      toggleReaction,
      handleTyping,
      formatDate,
      formatTimeAgo,
      getInitials,
      groupReactions,
      hasUserReacted
    }
  }
}
</script>

<style lang="scss" scoped>
.message-thread {
  background: var(--bg-primary);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;

  .thread-header {
    padding: 1rem;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;

    .user-info {
      display: flex;
      align-items: center;
      gap: 1rem;

      .avatar {
        width: 40px;
        height: 40px;
        border-radius: 20px;
        background: var(--primary-color);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 500;

        &.small {
          width: 32px;
          height: 32px;
          border-radius: 16px;
          font-size: 0.875rem;
        }
      }

      .details {
        h3 {
          margin: 0;
          color: var(--text-primary);
          font-size: 1rem;
        }

        .time {
          color: var(--text-secondary);
          font-size: 0.875rem;
        }
      }
    }

    .message-actions {
      display: flex;
      gap: 0.5rem;

      .action-btn {
        background: none;
        border: none;
        color: var(--text-secondary);
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 4px;
        transition: all 0.2s;

        &:hover {
          background: var(--bg-secondary);
          color: var(--text-primary);
        }

        &.small {
          padding: 0.25rem;
        }
      }
    }
  }

  .message-content {
    padding: 1rem;
    color: var(--text-primary);
    line-height: 1.5;

    &.image {
      img {
        max-width: 100%;
        border-radius: 8px;
      }
    }

    .file-attachment {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
      background: var(--bg-secondary);
      border-radius: 4px;

      i {
        color: var(--primary-color);
      }

      a {
        color: var(--primary-color);
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }
    }
  }

  .reactions-bar {
    padding: 0.5rem 1rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;

    .reaction {
      background: var(--bg-secondary);
      padding: 0.25rem 0.5rem;
      border-radius: 12px;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: var(--primary-light);
      }

      &.active {
        background: var(--primary-color);
        color: white;
      }

      &.small {
        font-size: 0.75rem;
        padding: 0.125rem 0.375rem;
      }
    }
  }

  .emoji-picker {
    position: absolute;
    bottom: 100%;
    right: 0;
    background: var(--bg-primary);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    padding: 0.5rem;
    margin-bottom: 0.5rem;

    .emoji-list {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.25rem;

      .emoji-btn {
        background: none;
        border: none;
        padding: 0.5rem;
        cursor: pointer;
        border-radius: 4px;
        transition: all 0.2s;

        &:hover {
          background: var(--bg-secondary);
        }
      }
    }
  }

  .thread-replies {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    background: var(--bg-secondary);

    h4 {
      margin: 0 0 1rem 0;
      color: var(--text-primary);
    }

    .replies-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;

      .reply-item {
        background: var(--bg-primary);
        border-radius: 8px;
        padding: 1rem;

        .reply-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;

          .user-info {
            display: flex;
            align-items: center;
            gap: 0.5rem;

            .name {
              color: var(--text-primary);
              font-weight: 500;
            }

            .time {
              color: var(--text-secondary);
              font-size: 0.75rem;
            }
          }
        }

        .reply-content {
          color: var(--text-primary);
          line-height: 1.5;
          margin-bottom: 0.5rem;
        }
      }
    }

    .reply-input {
      margin-top: 1rem;
      position: relative;

      .typing-indicator {
        position: absolute;
        bottom: 100%;
        left: 0;
        padding: 0.25rem 0;
        color: var(--text-secondary);
        font-size: 0.875rem;
      }

      .input-wrapper {
        display: flex;
        gap: 0.5rem;
        background: var(--bg-primary);
        border-radius: 8px;
        padding: 0.5rem;

        textarea {
          flex: 1;
          border: none;
          background: none;
          resize: none;
          padding: 0.5rem;
          color: var(--text-primary);
          font-family: inherit;
          font-size: 0.875rem;
          min-height: 20px;
          max-height: 120px;

          &:focus {
            outline: none;
          }

          &::placeholder {
            color: var(--text-secondary);
          }
        }

        .send-btn {
          background: var(--primary-color);
          border: none;
          color: white;
          padding: 0.5rem;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;

          &:hover:not(:disabled) {
            background: var(--primary-dark);
          }

          &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .message-thread {
    height: 100vh;
    border-radius: 0;
  }
}
</style>
