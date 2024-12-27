<template>
  <div class="analytics">
    <h1>Analytics Dashboard</h1>
    <div class="filters">
      <div class="form-group">
        <label>Date Range</label>
        <select v-model="dateRange">
          <option value="today">Today</option>
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
          <option value="custom">Custom Range</option>
        </select>
      </div>
    </div>
    <div class="charts-grid">
      <div class="chart">
        <h3>Chat Volume by Hour</h3>
        <!-- Add Chart.js component here -->
      </div>
      <div class="chart">
        <h3>User Satisfaction</h3>
        <!-- Add Chart.js component here -->
      </div>
      <div class="chart">
        <h3>Response Times</h3>
        <!-- Add Chart.js component here -->
      </div>
      <div class="chart">
        <h3>Popular Topics</h3>
        <!-- Add Chart.js component here -->
      </div>
    </div>
    <div class="metrics">
      <div class="metric-card">
        <h3>Total Conversations</h3>
        <div class="value">{{ metrics.totalConversations }}</div>
        <div class="change" :class="{ positive: metrics.conversationChange > 0 }">
          {{ metrics.conversationChange }}% from previous period
        </div>
      </div>
      <div class="metric-card">
        <h3>Average Response Time</h3>
        <div class="value">{{ metrics.avgResponseTime }}s</div>
        <div class="change" :class="{ positive: metrics.responseTimeChange < 0 }">
          {{ metrics.responseTimeChange }}% from previous period
        </div>
      </div>
      <div class="metric-card">
        <h3>User Satisfaction</h3>
        <div class="value">{{ metrics.satisfaction }}%</div>
        <div class="change" :class="{ positive: metrics.satisfactionChange > 0 }">
          {{ metrics.satisfactionChange }}% from previous period
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'

export default {
  name: 'Analytics',
  setup() {
    const dateRange = ref('week')
    const metrics = ref({
      totalConversations: 0,
      conversationChange: 0,
      avgResponseTime: 0,
      responseTimeChange: 0,
      satisfaction: 0,
      satisfactionChange: 0
    })

    const fetchMetrics = async () => {
      // Fetch metrics from Supabase
      metrics.value = {
        totalConversations: 1234,
        conversationChange: 15,
        avgResponseTime: 30,
        responseTimeChange: -10,
        satisfaction: 95,
        satisfactionChange: 5
      }
    }

    onMounted(() => {
      fetchMetrics()
    })

    return {
      dateRange,
      metrics
    }
  }
}
</script>

<style lang="scss" scoped>
.analytics {
  padding: $spacing-xl;

  h1 {
    margin-bottom: $spacing-xl;
  }
}

.filters {
  margin-bottom: $spacing-xl;
  display: flex;
  gap: $spacing-lg;

  .form-group {
    min-width: 200px;

    select {
      width: 100%;
      padding: $spacing-sm;
      border: 1px solid rgba($text, 0.2);
      border-radius: $border-radius-sm;
      background: rgba($background, 0.8);
      height: 40px;

      &:focus {
        border-color: $accent;
        outline: none;
      }
    }
  }
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-xl;
  margin-bottom: $spacing-xl;

  @media (max-width: $tablet) {
    grid-template-columns: 1fr;
  }

  .chart {
    background: rgba($primary, 0.1);
    padding: $spacing-xl;
    border-radius: $border-radius-md;
    min-height: 300px;

    h3 {
      color: $accent;
      margin-bottom: $spacing-lg;
      text-align: center;
    }
  }
}

.metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $spacing-xl;

  @media (max-width: $tablet) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: $mobile) {
    grid-template-columns: 1fr;
  }
}

.metric-card {
  background: rgba($primary, 0.1);
  padding: $spacing-xl;
  border-radius: $border-radius-md;
  text-align: center;

  h3 {
    color: $accent;
    margin-bottom: $spacing-md;
  }

  .value {
    font-size: $font-size-xl;
    font-weight: bold;
    margin-bottom: $spacing-sm;
  }

  .change {
    color: #ff4444;
    font-size: $font-size-sm;

    &.positive {
      color: #00C851;
    }
  }
}
</style>
