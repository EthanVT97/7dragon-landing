<template>
  <div class="dashboard">
    <h1>Admin Dashboard</h1>
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
    </nav>
    <div class="stats-grid">
      <div class="stat-card">
        <h3>Total Chats</h3>
        <div class="value">{{ stats.totalChats }}</div>
      </div>
      <div class="stat-card">
        <h3>Active Users</h3>
        <div class="value">{{ stats.activeUsers }}</div>
      </div>
      <div class="stat-card">
        <h3>Response Rate</h3>
        <div class="value">{{ stats.responseRate }}%</div>
      </div>
      <div class="stat-card">
        <h3>Avg. Response Time</h3>
        <div class="value">{{ stats.avgResponseTime }}s</div>
      </div>
    </div>
    <div class="charts">
      <div class="chart">
        <h3>Chat Volume</h3>
        <!-- Add Chart.js component here -->
      </div>
      <div class="chart">
        <h3>User Satisfaction</h3>
        <!-- Add Chart.js component here -->
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'

export default {
  name: 'Dashboard',
  setup() {
    const stats = ref({
      totalChats: 0,
      activeUsers: 0,
      responseRate: 0,
      avgResponseTime: 0
    })

    const fetchStats = async () => {
      // Fetch stats from Supabase
      stats.value = {
        totalChats: 1234,
        activeUsers: 56,
        responseRate: 95,
        avgResponseTime: 30
      }
    }

    onMounted(() => {
      fetchStats()
    })

    return {
      stats
    }
  }
}
</script>

<style lang="scss" scoped>
.admin-nav {
  display: flex;
  justify-content: space-between;
  margin-bottom: 2rem;

  .nav-item {
    margin-right: 1rem;
    text-decoration: none;
    color: var(--color-text);
    display: flex;
    align-items: center;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    transition: all 0.3s ease;

    &:hover {
      color: var(--color-secondary);
      background: rgba(82, 215, 183, 0.1);
    }

    &.router-link-active {
      color: var(--color-secondary);
      background: rgba(82, 215, 183, 0.15);
    }

    i {
      margin-right: 0.5rem;
    }
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.stat-card {
  background: rgba(26, 42, 61, 0.9);
  border: 1px solid rgba(82, 215, 183, 0.3);
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(82, 215, 183, 0.2);
  }

  h3 {
    color: var(--color-text);
    margin: 0 0 1rem 0;
    font-size: 1.1rem;
    opacity: 0.8;
  }

  .value {
    color: var(--color-secondary);
    font-size: 2rem;
    font-weight: bold;
  }
}

.dashboard {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;

  h1 {
    color: var(--color-text);
    margin: 0 0 2rem 0;
  }
}

@media (max-width: 768px) {
  .dashboard {
    padding: 1rem;
  }

  .admin-nav {
    flex-wrap: wrap;
    gap: 0.5rem;

    .nav-item {
      margin-right: 0;
      width: calc(50% - 0.25rem);
      justify-content: center;
    }
  }
}
</style>
