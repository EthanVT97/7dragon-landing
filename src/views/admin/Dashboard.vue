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
.dashboard {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;

  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;

    h1 {
      margin: 0;
      color: var(--text-primary);
    }

    .refresh {
      display: flex;
      align-items: center;
      gap: 1rem;

      button {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 4px;
        background: var(--primary-color);
        color: white;
        cursor: pointer;
        transition: all 0.2s;

        &:hover:not(:disabled) {
          background: var(--primary-dark);
        }

        &:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
      }

      .last-updated {
        color: var(--text-secondary);
        font-size: 0.875rem;
      }
    }
  }

  .admin-nav {
    display: flex;
    gap: 1rem;
    margin-bottom: 2rem;
    background: var(--bg-secondary);
    padding: 1rem;
    border-radius: 8px;

    .nav-item {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 1rem;
      border-radius: 4px;
      color: var(--text-primary);
      text-decoration: none;
      transition: all 0.2s;

      &:hover {
        background: var(--primary-light);
        color: var(--primary-color);
      }

      &.router-link-active {
        background: var(--primary-color);
        color: white;
      }

      i {
        font-size: 1.25rem;
      }
    }

    .notification-center {
      margin-left: auto;
    }
  }

  .dashboard-grid {
    display: grid;
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;

    .stat-card {
      background: var(--bg-secondary);
      border-radius: 12px;
      padding: 1.5rem;
      display: flex;
      gap: 1rem;
      transition: all 0.2s;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .stat-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        background: var(--primary-light);
        color: var(--primary-color);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
      }

      .stat-content {
        flex: 1;

        h3 {
          margin: 0 0 0.5rem 0;
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .value {
          font-size: 1.5rem;
          font-weight: bold;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }

        .trend {
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;

          &.up {
            color: var(--success);
          }

          &.down {
            color: var(--error);
          }
        }
      }
    }
  }

  .search-section {
    margin-bottom: 2rem;
  }

  .charts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;

    .chart-card {
      background: var(--bg-secondary);
      border-radius: 12px;
      padding: 1.5rem;

      .chart-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;

        h3 {
          margin: 0;
          color: var(--text-primary);
        }

        select {
          padding: 0.5rem;
          border: 1px solid var(--border-color);
          border-radius: 4px;
          background: var(--bg-primary);
          color: var(--text-primary);
        }
      }

      canvas {
        height: 300px !important;
      }
    }
  }

  .recent-activity {
    background: var(--bg-secondary);
    border-radius: 12px;
    padding: 1.5rem;

    h3 {
      margin: 0 0 1rem 0;
      color: var(--text-primary);
    }

    .activity-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;

      .activity-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        background: var(--bg-primary);
        border-radius: 8px;

        .activity-icon {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          background: var(--primary-light);
          color: var(--primary-color);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .activity-content {
          flex: 1;

          p {
            margin: 0 0 0.25rem 0;
            color: var(--text-primary);
          }

          .activity-time {
            font-size: 0.875rem;
            color: var(--text-secondary);
          }
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .dashboard {
    padding: 1rem;

    .dashboard-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }

    .admin-nav {
      flex-wrap: wrap;

      .nav-item {
        flex: 1 1 calc(50% - 0.5rem);
      }
    }

    .charts-grid {
      grid-template-columns: 1fr;
    }
  }
}
</style>
