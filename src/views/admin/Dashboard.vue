<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h1>Admin Dashboard</h1>
      <div class="refresh">
        <button @click="fetchStats" :disabled="isLoading">
          <i class="fas" :class="isLoading ? 'fa-spinner fa-spin' : 'fa-sync'"></i>
          Refresh
        </button>
        <span class="last-updated">Last updated: {{ lastUpdated }}</span>
      </div>
    </div>

    <nav class="admin-nav">
      <router-link to="/admin/content" class="nav-item">
        <i class="fas fa-edit"></i>
        Content Management
      </router-link>
      <router-link to="/admin/chatbot" class="nav-item">
        <i class="fas fa-robot"></i>
        Chatbot Settings
      </router-link>
      <router-link to="/admin/analytics" class="nav-item">
        <i class="fas fa-chart-bar"></i>
        Analytics
      </router-link>
      <router-link to="/admin/users" class="nav-item">
        <i class="fas fa-users-cog"></i>
        Admin Users
      </router-link>
      <NotificationCenter class="notification-center" />
    </nav>

    <div class="dashboard-grid">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-comments"></i>
          </div>
          <div class="stat-content">
            <h3>Total Chats</h3>
            <div class="value">{{ formatNumber(stats.totalChats) }}</div>
            <div class="trend" :class="stats.chatsTrend > 0 ? 'up' : 'down'" v-if="stats.chatsTrend">
              <i class="fas" :class="stats.chatsTrend > 0 ? 'fa-arrow-up' : 'fa-arrow-down'"></i>
              {{ Math.abs(stats.chatsTrend) }}% from last week
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-users"></i>
          </div>
          <div class="stat-content">
            <h3>Active Users</h3>
            <div class="value">{{ formatNumber(stats.activeUsers) }}</div>
            <div class="trend" :class="stats.usersTrend > 0 ? 'up' : 'down'" v-if="stats.usersTrend">
              <i class="fas" :class="stats.usersTrend > 0 ? 'fa-arrow-up' : 'fa-arrow-down'"></i>
              {{ Math.abs(stats.usersTrend) }}% from last week
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-check-circle"></i>
          </div>
          <div class="stat-content">
            <h3>Response Rate</h3>
            <div class="value">{{ stats.responseRate }}%</div>
            <div class="trend" :class="stats.responseTrend > 0 ? 'up' : 'down'" v-if="stats.responseTrend">
              <i class="fas" :class="stats.responseTrend > 0 ? 'fa-arrow-up' : 'fa-arrow-down'"></i>
              {{ Math.abs(stats.responseTrend) }}% from last week
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-clock"></i>
          </div>
          <div class="stat-content">
            <h3>Avg. Response Time</h3>
            <div class="value">{{ formatTime(stats.avgResponseTime) }}</div>
            <div class="trend" :class="stats.timeTrend < 0 ? 'up' : 'down'" v-if="stats.timeTrend">
              <i class="fas" :class="stats.timeTrend < 0 ? 'fa-arrow-up' : 'fa-arrow-down'"></i>
              {{ Math.abs(stats.timeTrend) }}% from last week
            </div>
          </div>
        </div>
      </div>

      <div class="search-section">
        <MessageSearch @select-message="openMessageThread" />
      </div>

      <div class="charts-grid">
        <div class="chart-card">
          <div class="chart-header">
            <h3>Chat Volume</h3>
            <div class="chart-controls">
              <select v-model="chatVolumeRange">
                <option value="day">Last 24 Hours</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
              </select>
            </div>
          </div>
          <LineChart 
            :data="chatVolumeData" 
            :options="lineChartOptions"
          />
        </div>

        <div class="chart-card">
          <div class="chart-header">
            <h3>User Satisfaction</h3>
            <div class="chart-controls">
              <select v-model="satisfactionRange">
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="year">Last Year</option>
              </select>
            </div>
          </div>
          <DoughnutChart 
            :data="satisfactionData" 
            :options="doughnutChartOptions"
          />
        </div>
      </div>
    </div>

    <!-- Message Thread Modal -->
    <Modal v-if="selectedMessage" @close="selectedMessage = null">
      <MessageThread 
        :message="selectedMessage" 
        @close="selectedMessage = null"
      />
    </Modal>

    <div class="recent-activity">
      <h3>Recent Activity</h3>
      <div class="activity-list">
        <div v-for="activity in recentActivity" :key="activity.id" class="activity-item">
          <div class="activity-icon">
            <i :class="activity.icon"></i>
          </div>
          <div class="activity-content">
            <p>{{ activity.message }}</p>
            <span class="activity-time">{{ formatTimeAgo(activity.timestamp) }}</span>
          </div>
        </div>
      </div>
    </div>

    <router-view></router-view>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import { supabase } from '@/supabase'
import { Line as LineChart, Doughnut as DoughnutChart } from 'vue-chartjs'
import { format, formatDistanceToNow } from 'date-fns'
import Modal from '@/components/Modal.vue'
import MessageSearch from '@/components/admin/MessageSearch.vue'
import MessageThread from '@/components/admin/MessageThread.vue'
import NotificationCenter from '@/components/admin/NotificationCenter.vue'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

export default {
  name: 'Dashboard',
  
  components: {
    LineChart,
    DoughnutChart,
    Modal,
    MessageSearch,
    MessageThread,
    NotificationCenter
  },

  setup() {
    const stats = ref({
      totalChats: 0,
      activeUsers: 0,
      responseRate: 0,
      avgResponseTime: 0,
      chatsTrend: 0,
      usersTrend: 0,
      responseTrend: 0,
      timeTrend: 0
    })

    const isLoading = ref(false)
    const lastUpdated = ref(null)
    const chatVolumeRange = ref('week')
    const satisfactionRange = ref('month')
    const recentActivity = ref([])
    const selectedMessage = ref(null)

    // Chart data
    const chatVolumeData = ref({
      labels: [],
      datasets: [{
        label: 'Number of Chats',
        data: [],
        borderColor: '#52d7b7',
        tension: 0.4
      }]
    })

    const satisfactionData = ref({
      labels: ['Satisfied', 'Neutral', 'Unsatisfied'],
      datasets: [{
        data: [0, 0, 0],
        backgroundColor: ['#52d7b7', '#ffd666', '#ff7875']
      }]
    })

    // Chart options
    const lineChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }

    const doughnutChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }

    // Fetch dashboard stats
    const fetchStats = async () => {
      isLoading.value = true
      try {
        // Fetch chat statistics
        const { data: chatStats, error: chatError } = await supabase
          .rpc('get_chat_statistics')

        if (chatError) throw chatError

        // Fetch user statistics
        const { data: userStats, error: userError } = await supabase
          .from('user_profiles')
          .select('id')
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

        if (userError) throw userError

        // Update stats
        stats.value = {
          totalChats: chatStats.total_chats || 0,
          activeUsers: userStats.length,
          responseRate: chatStats.success_rate?.toFixed(1) || 0,
          avgResponseTime: chatStats.avg_response_time?.toFixed(1) || 0,
          chatsTrend: 5, // Calculate trend
          usersTrend: 10,
          responseTrend: -2,
          timeTrend: -8
        }

        lastUpdated.value = new Date()
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        isLoading.value = false
      }
    }

    // Fetch chart data
    const fetchChartData = async () => {
      try {
        // Fetch chat volume data
        const { data: volumeData, error: volumeError } = await supabase
          .rpc('get_chat_volume', {
            time_range: chatVolumeRange.value
          })

        if (volumeError) throw volumeError

        chatVolumeData.value = {
          labels: volumeData.map(d => format(new Date(d.date), 'MMM d')),
          datasets: [{
            label: 'Number of Chats',
            data: volumeData.map(d => d.count),
            borderColor: '#52d7b7',
            tension: 0.4
          }]
        }

        // Fetch satisfaction data
        const { data: satisfactionStats, error: satisfactionError } = await supabase
          .rpc('get_satisfaction_stats', {
            time_range: satisfactionRange.value
          })

        if (satisfactionError) throw satisfactionError

        satisfactionData.value.datasets[0].data = [
          satisfactionStats.satisfied || 0,
          satisfactionStats.neutral || 0,
          satisfactionStats.unsatisfied || 0
        ]
      } catch (error) {
        console.error('Error fetching chart data:', error)
      }
    }

    // Fetch recent activity
    const fetchRecentActivity = async () => {
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select(`
            id,
            created_at,
            message_type,
            user:user_profiles(email)
          `)
          .order('created_at', { ascending: false })
          .limit(5)

        if (error) throw error

        recentActivity.value = data.map(item => ({
          id: item.id,
          icon: getActivityIcon(item.message_type),
          message: getActivityMessage(item),
          timestamp: new Date(item.created_at)
        }))
      } catch (error) {
        console.error('Error fetching recent activity:', error)
      }
    }

    // Open message thread
    const openMessageThread = (message) => {
      selectedMessage.value = message
    }

    // Helper functions
    const formatNumber = (num) => {
      return new Intl.NumberFormat().format(num)
    }

    const formatTime = (seconds) => {
      return `${seconds}s`
    }

    const formatTimeAgo = (date) => {
      return formatDistanceToNow(date, { addSuffix: true })
    }

    const getActivityIcon = (type) => {
      const icons = {
        text: 'fas fa-comment',
        image: 'fas fa-image',
        file: 'fas fa-file',
        error: 'fas fa-exclamation-circle'
      }
      return icons[type] || 'fas fa-comment'
    }

    const getActivityMessage = (item) => {
      return `New ${item.message_type} message from ${item.user?.email || 'Anonymous'}`
    }

    // Real-time subscriptions
    let messageSubscription
    const subscribeToMessages = () => {
      messageSubscription = supabase
        .from('chat_messages')
        .on('INSERT', () => {
          fetchStats()
          fetchRecentActivity()
        })
        .subscribe()
    }

    // Lifecycle hooks
    onMounted(() => {
      fetchStats()
      fetchChartData()
      fetchRecentActivity()
      subscribeToMessages()
    })

    onUnmounted(() => {
      if (messageSubscription) {
        supabase.removeSubscription(messageSubscription)
      }
    })

    return {
      stats,
      isLoading,
      lastUpdated,
      chatVolumeRange,
      satisfactionRange,
      chatVolumeData,
      satisfactionData,
      lineChartOptions,
      doughnutChartOptions,
      recentActivity,
      selectedMessage,
      openMessageThread,
      formatNumber,
      formatTime,
      formatTimeAgo,
      fetchStats
    }
  }
}
</script>

<style lang="scss" scoped>
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(75, 0, 130, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(75, 0, 130, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(75, 0, 130, 0);
  }
}

@keyframes float {
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(0px);
  }
}

.dashboard {
  padding: 2.5rem;
  max-width: 1400px;
  margin: 0 auto;
  background: linear-gradient(135deg, #f5f7fa 0%, #f8f9fa 100%);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(75, 0, 130, 0.1) 0%, rgba(75, 0, 130, 0) 70%);
    border-radius: 50%;
    z-index: 0;
  }

  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2.5rem;
    animation: fadeInUp 0.6s ease-out;

    h1 {
      color: #2c3e50;
      font-size: 2.5rem;
      font-weight: 700;
      background: linear-gradient(120deg, #4B0082, #800080);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      position: relative;
      
      &::after {
        content: '';
        position: absolute;
        bottom: -8px;
        left: 0;
        width: 60%;
        height: 3px;
        background: linear-gradient(90deg, #4B0082, transparent);
      }
    }
  }

  .admin-nav {
    display: flex;
    gap: 1.2rem;
    margin-bottom: 2.5rem;
    padding: 1.2rem;
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
    animation: fadeInUp 0.8s ease-out;
    position: relative;
    z-index: 1;

    .nav-item {
      padding: 1rem 1.5rem;
      border-radius: 12px;
      color: #4a5568;
      text-decoration: none;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      align-items: center;
      gap: 0.8rem;
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(120deg, #4B0082, #800080);
        opacity: 0;
        transition: opacity 0.4s ease;
        z-index: -1;
      }

      &:hover {
        color: white;
        transform: translateY(-2px);
        
        &::before {
          opacity: 1;
        }
      }

      &.router-link-active {
        background: #4B0082;
        color: white;
        animation: pulse 2s infinite;
      }

      i {
        font-size: 1.2rem;
        transition: transform 0.3s ease;
      }

      &:hover i {
        transform: scale(1.2);
      }
    }
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    margin-bottom: 2.5rem;
    position: relative;
    z-index: 1;

    .stat-card {
      background: white;
      padding: 2rem;
      border-radius: 20px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
      animation: fadeInUp 1s ease-out;
      min-height: 200px;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%);
        opacity: 0;
        transition: opacity 0.4s ease;
      }

      &:hover {
        transform: translateY(-8px) scale(1.02);
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);

        &::before {
          opacity: 1;
        }

        .stat-icon {
          animation: float 3s ease-in-out infinite;
        }
      }

      &:nth-child(1) {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }

      &:nth-child(2) {
        background: linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%);
      }

      &:nth-child(3) {
        background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
      }

      &:nth-child(4) {
        background: linear-gradient(135deg, #f6d365 0%, #fda085 100%);
      }

      .stat-icon {
        position: absolute;
        top: 1.5rem;
        right: 1.5rem;
        font-size: 3rem;
        opacity: 0.15;
        color: white;
        transition: all 0.4s ease;
      }

      .stat-content {
        position: relative;
        z-index: 1;
        color: white;

        h3 {
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 1rem;
          opacity: 0.9;
          letter-spacing: 0.5px;
        }

        .value {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
          letter-spacing: -1px;
        }

        .trend {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.95rem;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(5px);
          transition: all 0.3s ease;

          &:hover {
            background: rgba(255, 255, 255, 0.25);
            transform: translateX(5px);
          }

          &.up {
            color: #dcffe4;
          }

          &.down {
            color: #ffe5e5;
          }

          i {
            font-size: 0.9rem;
          }
        }
      }
    }
  }

  .refresh {
    display: flex;
    align-items: center;
    gap: 1.2rem;
    animation: fadeInUp 0.6s ease-out;

    button {
      padding: 0.8rem 1.5rem;
      border: none;
      border-radius: 12px;
      background: linear-gradient(120deg, #4B0082, #800080);
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.8rem;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      font-weight: 500;
      letter-spacing: 0.5px;
      box-shadow: 0 4px 15px rgba(75, 0, 130, 0.2);

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(75, 0, 130, 0.3);
      }

      &:active {
        transform: translateY(0);
      }

      &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }

      i {
        font-size: 1.1rem;
        transition: transform 0.4s ease;
      }

      &:hover i {
        transform: rotate(180deg);
      }
    }

    .last-updated {
      color: #718096;
      font-size: 0.95rem;
      position: relative;
      padding-left: 1.2rem;

      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        width: 6px;
        height: 6px;
        background: #4B0082;
        border-radius: 50%;
        transform: translateY(-50%);
      }
    }
  }
}

@media (max-width: 768px) {
  .dashboard {
    padding: 1.5rem;

    .dashboard-header h1 {
      font-size: 2rem;
    }

    .stats-grid {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }

    .admin-nav {
      flex-direction: column;
      padding: 1rem;

      .nav-item {
        width: 100%;
        justify-content: center;
      }
    }

    .refresh {
      flex-direction: column;
      align-items: stretch;

      button {
        width: 100%;
        justify-content: center;
      }

      .last-updated {
        text-align: center;
        padding-left: 0;

        &::before {
          display: none;
        }
      }
    }
  }
}
</style>
