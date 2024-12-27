<template>
  <div class="notification-center">
    <div class="notification-header" @click="toggleNotifications">
      <div class="icon-badge">
        <i class="fas fa-bell"></i>
        <span v-if="unreadCount" class="badge">{{ unreadCount }}</span>
      </div>
    </div>

    <div class="notification-panel" v-if="isOpen">
      <div class="panel-header">
        <h3>Notifications</h3>
        <div class="actions">
          <button 
            v-if="unreadCount"
            @click="markAllAsRead"
            class="mark-read"
          >
            Mark all as read
          </button>
          <button @click="toggleNotifications" class="close">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>

      <div class="notifications-list" ref="notificationsList">
        <div v-if="loading" class="loading">
          <i class="fas fa-spinner fa-spin"></i>
        </div>

        <template v-else>
          <div 
            v-for="notification in sortedNotifications" 
            :key="notification.id"
            class="notification-item"
            :class="{ unread: !notification.read }"
            @click="handleNotificationClick(notification)"
          >
            <div class="notification-icon">
              <i :class="getNotificationIcon(notification)"></i>
            </div>
            <div class="notification-content">
              <p class="message">{{ notification.message }}</p>
              <span class="time">{{ formatTimeAgo(notification.created_at) }}</span>
            </div>
            <button 
              v-if="!notification.read"
              @click.stop="markAsRead(notification.id)"
              class="mark-read"
            >
              <i class="fas fa-check"></i>
            </button>
          </div>

          <div v-if="notifications.length === 0" class="empty-state">
            No notifications
          </div>
        </template>
      </div>

      <div class="panel-footer">
        <button 
          v-if="hasMore"
          @click="loadMore"
          :disabled="loadingMore"
          class="load-more"
        >
          {{ loadingMore ? 'Loading...' : 'Load more' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/supabase'
import { formatDistanceToNow } from 'date-fns'

export default {
  name: 'NotificationCenter',

  setup() {
    const router = useRouter()
    const isOpen = ref(false)
    const notifications = ref([])
    const loading = ref(true)
    const loadingMore = ref(false)
    const hasMore = ref(true)
    const currentPage = ref(1)
    const itemsPerPage = 10

    // Sort notifications by date and unread status
    const sortedNotifications = computed(() => {
      return [...notifications.value].sort((a, b) => {
        if (!a.read && b.read) return -1
        if (a.read && !b.read) return 1
        return new Date(b.created_at) - new Date(a.created_at)
      })
    })

    // Count unread notifications
    const unreadCount = computed(() => {
      return notifications.value.filter(n => !n.read).length
    })

    // Toggle notification panel
    const toggleNotifications = () => {
      isOpen.value = !isOpen.value
      if (isOpen.value) {
        fetchNotifications()
      }
    }

    // Fetch notifications
    const fetchNotifications = async (loadMore = false) => {
      if (!loadMore) {
        loading.value = true
        currentPage.value = 1
      } else {
        loadingMore.value = true
      }

      try {
        const from = (currentPage.value - 1) * itemsPerPage
        const to = from + itemsPerPage - 1

        const { data, error } = await supabase
          .from('admin_notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .range(from, to)

        if (error) throw error

        if (loadMore) {
          notifications.value = [...notifications.value, ...data]
        } else {
          notifications.value = data
        }

        hasMore.value = data.length === itemsPerPage
      } catch (error) {
        console.error('Error fetching notifications:', error)
      } finally {
        loading.value = false
        loadingMore.value = false
      }
    }

    // Load more notifications
    const loadMore = () => {
      currentPage.value++
      fetchNotifications(true)
    }

    // Mark notification as read
    const markAsRead = async (notificationId) => {
      try {
        const { error } = await supabase
          .from('admin_notifications')
          .update({ read: true })
          .eq('id', notificationId)

        if (error) throw error

        const notification = notifications.value.find(n => n.id === notificationId)
        if (notification) {
          notification.read = true
        }
      } catch (error) {
        console.error('Error marking notification as read:', error)
      }
    }

    // Mark all notifications as read
    const markAllAsRead = async () => {
      try {
        const { error } = await supabase
          .from('admin_notifications')
          .update({ read: true })
          .eq('read', false)

        if (error) throw error

        notifications.value = notifications.value.map(n => ({ ...n, read: true }))
      } catch (error) {
        console.error('Error marking all notifications as read:', error)
      }
    }

    // Handle notification click
    const handleNotificationClick = (notification) => {
      if (!notification.read) {
        markAsRead(notification.id)
      }

      if (notification.action_url) {
        router.push(notification.action_url)
      }

      isOpen.value = false
    }

    // Helper functions
    const formatTimeAgo = (date) => {
      return formatDistanceToNow(new Date(date), { addSuffix: true })
    }

    const getNotificationIcon = (notification) => {
      const icons = {
        message: 'fas fa-comment',
        user: 'fas fa-user',
        alert: 'fas fa-exclamation-circle',
        success: 'fas fa-check-circle'
      }
      return icons[notification.type] || 'fas fa-bell'
    }

    // Subscribe to new notifications
    let notificationSubscription
    const subscribeToNotifications = () => {
      notificationSubscription = supabase
        .from('admin_notifications')
        .on('INSERT', payload => {
          notifications.value = [payload.new, ...notifications.value]
        })
        .subscribe()
    }

    // Lifecycle hooks
    onMounted(() => {
      fetchNotifications()
      subscribeToNotifications()
    })

    onUnmounted(() => {
      if (notificationSubscription) {
        supabase.removeSubscription(notificationSubscription)
      }
    })

    return {
      isOpen,
      notifications,
      sortedNotifications,
      unreadCount,
      loading,
      loadingMore,
      hasMore,
      toggleNotifications,
      loadMore,
      markAsRead,
      markAllAsRead,
      handleNotificationClick,
      formatTimeAgo,
      getNotificationIcon
    }
  }
}
</script>

<style lang="scss" scoped>
.notification-center {
  position: relative;

  .notification-header {
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 8px;
    transition: all 0.2s;

    &:hover {
      background: var(--bg-secondary);
    }

    .icon-badge {
      position: relative;
      width: 24px;
      height: 24px;

      i {
        font-size: 1.25rem;
        color: var(--text-primary);
      }

      .badge {
        position: absolute;
        top: -4px;
        right: -4px;
        background: var(--error);
        color: white;
        font-size: 0.75rem;
        min-width: 18px;
        height: 18px;
        border-radius: 9px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 4px;
      }
    }
  }

  .notification-panel {
    position: absolute;
    top: 100%;
    right: 0;
    width: 360px;
    max-height: 480px;
    background: var(--bg-primary);
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    margin-top: 0.5rem;
    display: flex;
    flex-direction: column;
    z-index: 1000;

    .panel-header {
      padding: 1rem;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;

      h3 {
        margin: 0;
        color: var(--text-primary);
      }

      .actions {
        display: flex;
        gap: 0.5rem;

        button {
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 0.25rem;
          font-size: 0.875rem;

          &.mark-read {
            color: var(--primary-color);
          }

          &:hover {
            color: var(--text-primary);
          }
        }
      }
    }

    .notifications-list {
      flex: 1;
      overflow-y: auto;
      padding: 0.5rem;

      .loading, .empty-state {
        padding: 2rem;
        text-align: center;
        color: var(--text-secondary);
      }

      .notification-item {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
        padding: 1rem;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          background: var(--bg-secondary);
        }

        &.unread {
          background: var(--primary-light);

          &:hover {
            background: var(--primary-light-hover);
          }
        }

        .notification-icon {
          width: 32px;
          height: 32px;
          border-radius: 16px;
          background: var(--bg-secondary);
          display: flex;
          align-items: center;
          justify-content: center;

          i {
            color: var(--primary-color);
          }
        }

        .notification-content {
          flex: 1;

          .message {
            margin: 0 0 0.25rem 0;
            color: var(--text-primary);
            font-size: 0.875rem;
          }

          .time {
            color: var(--text-secondary);
            font-size: 0.75rem;
          }
        }

        .mark-read {
          background: none;
          border: none;
          color: var(--primary-color);
          cursor: pointer;
          padding: 0.25rem;
          opacity: 0;
          transition: opacity 0.2s;

          &:hover {
            color: var(--primary-dark);
          }
        }

        &:hover .mark-read {
          opacity: 1;
        }
      }
    }

    .panel-footer {
      padding: 1rem;
      border-top: 1px solid var(--border-color);
      text-align: center;

      .load-more {
        background: none;
        border: none;
        color: var(--primary-color);
        cursor: pointer;
        padding: 0.5rem 1rem;
        font-size: 0.875rem;

        &:hover:not(:disabled) {
          text-decoration: underline;
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .notification-center {
    .notification-panel {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      width: 100%;
      max-height: none;
      margin: 0;
      border-radius: 0;
    }
  }
}
</style>
