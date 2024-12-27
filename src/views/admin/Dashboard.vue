<template>
  <div class="admin-dashboard">
    <div class="dashboard-header">
      <h1>Admin Dashboard</h1>
      <div class="quick-stats">
        <div class="stat-card">
          <i class="fas fa-users"></i>
          <div class="stat-info">
            <span class="stat-value">{{ totalUsers }}</span>
            <span class="stat-label">Total Users</span>
          </div>
        </div>
        <div class="stat-card">
          <i class="fas fa-message"></i>
          <div class="stat-info">
            <span class="stat-value">{{ totalMessages }}</span>
            <span class="stat-label">Messages Today</span>
          </div>
        </div>
        <div class="stat-card">
          <i class="fas fa-user-clock"></i>
          <div class="stat-info">
            <span class="stat-value">{{ onlineUsers }}</span>
            <span class="stat-label">Users Online</span>
          </div>
        </div>
        <div class="stat-card">
          <i class="fas fa-clock"></i>
          <div class="stat-info">
            <span class="stat-value">{{ avgResponseTime }}</span>
            <span class="stat-label">Avg Response Time</span>
          </div>
        </div>
      </div>
    </div>

    <div class="dashboard-content">
      <div class="content-section chat-activity">
        <div class="section-header">
          <h2>Recent Chat Activity</h2>
          <button @click="$router.push('/admin/chat')" class="primary-button">
            <i class="fas fa-comments"></i>
            Open Chat Interface
          </button>
        </div>
        <div class="activity-list">
          <div v-for="activity in recentActivity" :key="activity.id" class="activity-item">
            <div class="activity-icon" :class="activity.type">
              <i :class="getActivityIcon(activity.type)"></i>
            </div>
            <div class="activity-details">
              <span class="activity-user">{{ activity.username }}</span>
              <span class="activity-action">{{ getActivityDescription(activity) }}</span>
              <span class="activity-time">{{ formatTime(activity.timestamp) }}</span>
            </div>
            <button 
              v-if="activity.type === 'message'" 
              @click="openChat(activity.userId)"
              class="action-button"
            >
              Reply
            </button>
          </div>
        </div>
      </div>

      <div class="dashboard-grid">
        <div class="content-section user-stats">
          <h2>User Statistics</h2>
          <div class="chart-container">
            <canvas ref="userChart"></canvas>
          </div>
        </div>

        <div class="content-section message-stats">
          <h2>Message Volume</h2>
          <div class="chart-container">
            <canvas ref="messageChart"></canvas>
          </div>
        </div>

        <div class="content-section active-chats">
          <h2>Active Conversations</h2>
          <div class="active-chats-list">
            <div v-for="chat in activeChats" :key="chat.id" class="chat-item">
              <div class="chat-user-info">
                <span class="user-name">{{ chat.username }}</span>
                <span class="last-active">{{ formatTime(chat.lastActive) }}</span>
              </div>
              <div class="chat-preview">{{ chat.lastMessage }}</div>
              <div class="chat-actions">
                <button @click="openChat(chat.userId)" class="action-button">
                  View Chat
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="content-section performance">
          <h2>Response Performance</h2>
          <div class="performance-metrics">
            <div class="metric">
              <span class="metric-label">Average First Response Time</span>
              <span class="metric-value">{{ metrics.avgFirstResponse }}</span>
            </div>
            <div class="metric">
              <span class="metric-label">Resolution Rate</span>
              <span class="metric-value">{{ metrics.resolutionRate }}%</span>
            </div>
            <div class="metric">
              <span class="metric-label">User Satisfaction</span>
              <div class="satisfaction-rating">
                <i v-for="n in 5" :key="n" class="fas fa-star" 
                   :class="{ active: n <= metrics.satisfaction }"></i>
                <span>{{ metrics.satisfaction }}/5</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/supabase'
import Chart from 'chart.js/auto'
import { formatDistanceToNow } from 'date-fns'

export default {
  name: 'AdminDashboard',
  
  setup() {
    const router = useRouter()
    const userChart = ref(null)
    const messageChart = ref(null)
    const totalUsers = ref(0)
    const totalMessages = ref(0)
    const onlineUsers = ref(0)
    const avgResponseTime = ref('0min')
    const recentActivity = ref([])
    const activeChats = ref([])
    const metrics = ref({
      avgFirstResponse: '0min',
      resolutionRate: 0,
      satisfaction: 0
    })

    // Chart instances
    let userChartInstance = null
    let messageChartInstance = null

    const loadDashboardData = async () => {
      try {
        // Load total users
        const { count: userCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact' })

        totalUsers.value = userCount || 0

        // Load today's messages
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        const { count: messageCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact' })
          .gte('created_at', today.toISOString())

        totalMessages.value = messageCount || 0

        // Load online users
        const fiveMinutesAgo = new Date()
        fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5)
        
        const { count: onlineCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact' })
          .gte('last_seen', fiveMinutesAgo.toISOString())

        onlineUsers.value = onlineCount || 0

        // Load recent activity
        const { data: activities } = await supabase
          .from('messages')
          .select(`
            id,
            content,
            created_at,
            user_id,
            profiles(username)
          `)
          .order('created_at', { ascending: false })
          .limit(10)

        recentActivity.value = activities?.map(activity => ({
          id: activity.id,
          type: 'message',
          username: activity.profiles?.username || 'Anonymous',
          userId: activity.user_id,
          content: activity.content,
          timestamp: activity.created_at
        })) || []

        // Load active chats
        const { data: chats } = await supabase
          .from('messages')
          .select(`
            id,
            content,
            created_at,
            user_id,
            profiles(username)
          `)
          .order('created_at', { ascending: false })
          .limit(5)

        activeChats.value = chats?.map(chat => ({
          id: chat.id,
          userId: chat.user_id,
          username: chat.profiles?.username || 'Anonymous',
          lastMessage: chat.content,
          lastActive: chat.created_at
        })) || []

        // Calculate metrics
        calculateMetrics()
        
        // Update charts
        updateCharts()
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      }
    }

    const calculateMetrics = async () => {
      try {
        const thirtyMinutes = 30 * 60 * 1000 // 30 minutes in milliseconds
        let totalResponseTime = 0
        let responseCount = 0

        const { data: messages } = await supabase
          .from('messages')
          .select('*')
          .order('created_at', { ascending: true })

        if (messages) {
          let lastUserMessage = null
          
          messages.forEach(message => {
            if (!message.from_admin && lastUserMessage === null) {
              lastUserMessage = message
            } else if (message.from_admin && lastUserMessage) {
              const responseTime = new Date(message.created_at) - new Date(lastUserMessage.created_at)
              if (responseTime < thirtyMinutes) {
                totalResponseTime += responseTime
                responseCount++
              }
              lastUserMessage = null
            }
          })
        }

        const avgResponse = responseCount > 0 
          ? Math.round(totalResponseTime / responseCount / 1000 / 60) 
          : 0

        avgResponseTime.value = `${avgResponse}min`
        metrics.value = {
          avgFirstResponse: `${avgResponse}min`,
          resolutionRate: Math.round((responseCount / (messages?.length || 1)) * 100),
          satisfaction: 4.5 // This would ideally come from user ratings
        }
      } catch (error) {
        console.error('Error calculating metrics:', error)
      }
    }

    const updateCharts = () => {
      // User growth chart
      if (userChartInstance) {
        userChartInstance.destroy()
      }

      userChartInstance = new Chart(userChart.value, {
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [{
            label: 'User Growth',
            data: [65, 78, 90, 120, 145, totalUsers.value],
            fill: false,
            borderColor: '#4CAF50',
            tension: 0.1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      })

      // Message volume chart
      if (messageChartInstance) {
        messageChartInstance.destroy()
      }

      messageChartInstance = new Chart(messageChart.value, {
        type: 'bar',
        data: {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [{
            label: 'Message Volume',
            data: [120, 190, 160, 140, 180, 150, totalMessages.value],
            backgroundColor: '#2196F3'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      })
    }

    const getActivityIcon = (type) => {
      switch (type) {
        case 'message':
          return 'fas fa-comment'
        case 'login':
          return 'fas fa-sign-in-alt'
        case 'signup':
          return 'fas fa-user-plus'
        default:
          return 'fas fa-info-circle'
      }
    }

    const getActivityDescription = (activity) => {
      switch (activity.type) {
        case 'message':
          return `sent a message: ${activity.content}`
        case 'login':
          return 'logged in'
        case 'signup':
          return 'signed up'
        default:
          return 'performed an action'
      }
    }

    const formatTime = (timestamp) => {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
    }

    const openChat = (userId) => {
      router.push({
        name: 'AdminChat',
        query: { userId }
      })
    }

    // Real-time subscriptions
    let messageSubscription
    let userSubscription

    onMounted(async () => {
      await loadDashboardData()

      // Subscribe to new messages
      messageSubscription = supabase
        .channel('public:messages')
        .on('INSERT', () => {
          loadDashboardData()
        })
        .subscribe()

      // Subscribe to user status changes
      userSubscription = supabase
        .channel('public:profiles')
        .on('UPDATE', () => {
          loadDashboardData()
        })
        .subscribe()
    })

    onUnmounted(() => {
      if (messageSubscription) messageSubscription.unsubscribe()
      if (userSubscription) userSubscription.unsubscribe()
      if (userChartInstance) userChartInstance.destroy()
      if (messageChartInstance) messageChartInstance.destroy()
    })

    return {
      totalUsers,
      totalMessages,
      onlineUsers,
      avgResponseTime,
      recentActivity,
      activeChats,
      metrics,
      userChart,
      messageChart,
      getActivityIcon,
      getActivityDescription,
      formatTime,
      openChat
    }
  }
}
</script>

<style lang="scss" scoped>
.admin-dashboard {
  padding: 24px;
  
  .dashboard-header {
    margin-bottom: 24px;
    
    h1 {
      margin-bottom: 16px;
      color: #2c3e50;
    }
  }
  
  .quick-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
    
    .stat-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      
      i {
        font-size: 24px;
        margin-right: 16px;
        color: $primary;
      }
      
      .stat-info {
        .stat-value {
          display: block;
          font-size: 24px;
          font-weight: 600;
          color: #2c3e50;
        }
        
        .stat-label {
          font-size: 14px;
          color: #666;
        }
      }
    }
  }
  
  .dashboard-content {
    .content-section {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      padding: 20px;
      margin-bottom: 24px;
      
      h2 {
        margin-bottom: 16px;
        color: #2c3e50;
      }
    }
    
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    
    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 24px;
    }
  }
  
  .activity-list {
    .activity-item {
      display: flex;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #eee;
      
      &:last-child {
        border-bottom: none;
      }
      
      .activity-icon {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba($primary, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 12px;
        
        i {
          color: $primary;
        }
      }
      
      .activity-details {
        flex: 1;
        
        .activity-user {
          font-weight: 500;
          margin-right: 8px;
        }
        
        .activity-action {
          color: #666;
        }
        
        .activity-time {
          font-size: 0.9em;
          color: #999;
          margin-left: 8px;
        }
      }
    }
  }
  
  .active-chats-list {
    .chat-item {
      padding: 12px 0;
      border-bottom: 1px solid #eee;
      
      &:last-child {
        border-bottom: none;
      }
      
      .chat-user-info {
        display: flex;
        justify-content: space-between;
        margin-bottom: 4px;
        
        .user-name {
          font-weight: 500;
        }
        
        .last-active {
          font-size: 0.9em;
          color: #666;
        }
      }
      
      .chat-preview {
        color: #666;
        margin-bottom: 8px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  }
  
  .performance-metrics {
    .metric {
      margin-bottom: 16px;
      
      .metric-label {
        display: block;
        margin-bottom: 4px;
        color: #666;
      }
      
      .metric-value {
        font-size: 24px;
        font-weight: 500;
        color: #2c3e50;
      }
      
      .satisfaction-rating {
        i {
          color: #ddd;
          margin-right: 2px;
          
          &.active {
            color: #ffd700;
          }
        }
        
        span {
          margin-left: 8px;
          color: #666;
        }
      }
    }
  }
  
  .chart-container {
    height: 300px;
  }
  
  .primary-button {
    background: $primary;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    
    i {
      margin-right: 8px;
    }
    
    &:hover {
      background: darken($primary, 5%);
    }
  }
  
  .action-button {
    background: none;
    border: 1px solid $primary;
    color: $primary;
    padding: 4px 12px;
    border-radius: 4px;
    cursor: pointer;
    
    &:hover {
      background: rgba($primary, 0.1);
    }
  }
}
</style>
