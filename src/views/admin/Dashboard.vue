<template>
  <div class="dashboard">
    <h1>Admin Dashboard</h1>
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
.dashboard {
  padding: $spacing-xl;

  h1 {
    margin-bottom: $spacing-xl;
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $spacing-lg;
  margin-bottom: $spacing-xl;

  @media (max-width: $tablet) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: $mobile) {
    grid-template-columns: 1fr;
  }
}

.stat-card {
  padding: $spacing-lg;
  background: rgba($primary, 0.1);
  border-radius: $border-radius-md;
  text-align: center;

  h3 {
    color: $accent;
    margin-bottom: $spacing-md;
  }

  .value {
    font-size: $font-size-xl;
    font-weight: bold;
  }
}

.charts {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-xl;
  margin-top: $spacing-xl;

  @media (max-width: $tablet) {
    grid-template-columns: 1fr;
  }

  .chart {
    padding: $spacing-lg;
    background: rgba($primary, 0.1);
    border-radius: $border-radius-md;

    h3 {
      color: $accent;
      margin-bottom: $spacing-lg;
      text-align: center;
    }
  }
}
</style>
