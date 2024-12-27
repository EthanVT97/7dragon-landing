<template>
  <div class="chatbot-responses">
    <div class="controls-section">
      <!-- Search and Filter -->
      <div class="search-filter">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search responses..."
          @input="filterResponses"
          class="search-input"
        />
        <select v-model="categoryFilter" @change="filterResponses" class="category-select">
          <option value="">All Categories</option>
          <option v-for="category in categories" :key="category" :value="category">
            {{ category }}
          </option>
        </select>
      </div>

      <!-- Analytics Summary -->
      <div class="analytics-summary">
        <div class="metric-card">
          <h4>Total Responses</h4>
          <p>{{ totalResponses }}</p>
        </div>
        <div class="metric-card">
          <h4>Avg. Response Time</h4>
          <p>{{ averageResponseTime }}s</p>
        </div>
        <div class="metric-card">
          <h4>Success Rate</h4>
          <p>{{ successRate }}%</p>
        </div>
      </div>

      <!-- Export Button -->
      <button @click="exportResponses" class="export-btn">
        Export Responses
      </button>
    </div>

    <!-- Responses Table -->
    <div class="responses-table">
      <table>
        <thead>
          <tr>
            <th @click="sortBy('timestamp')">
              Timestamp
              <span class="sort-icon">{{ getSortIcon('timestamp') }}</span>
            </th>
            <th @click="sortBy('category')">
              Category
              <span class="sort-icon">{{ getSortIcon('category') }}</span>
            </th>
            <th @click="sortBy('query')">
              User Query
              <span class="sort-icon">{{ getSortIcon('query') }}</span>
            </th>
            <th>Response</th>
            <th @click="sortBy('responseTime')">
              Response Time
              <span class="sort-icon">{{ getSortIcon('responseTime') }}</span>
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="response in paginatedResponses" :key="response.id">
            <td>{{ formatDate(response.timestamp) }}</td>
            <td>
              <span class="category-badge" :class="response.category">
                {{ response.category }}
              </span>
            </td>
            <td>{{ response.query }}</td>
            <td>
              <div class="response-content" :class="{ 'expanded': expandedResponses.includes(response.id) }">
                {{ response.content }}
              </div>
              <button 
                v-if="response.content.length > 100" 
                @click="toggleExpand(response.id)"
                class="expand-btn"
              >
                {{ expandedResponses.includes(response.id) ? 'Show Less' : 'Show More' }}
              </button>
            </td>
            <td>{{ response.responseTime }}s</td>
            <td>
              <div class="action-buttons">
                <button @click="editResponse(response)" class="edit-btn">
                  Edit
                </button>
                <button @click="deleteResponse(response.id)" class="delete-btn">
                  Delete
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="pagination">
      <button 
        :disabled="currentPage === 1"
        @click="changePage(currentPage - 1)"
        class="page-btn"
      >
        Previous
      </button>
      <span class="page-info">
        Page {{ currentPage }} of {{ totalPages }}
      </span>
      <button 
        :disabled="currentPage === totalPages"
        @click="changePage(currentPage + 1)"
        class="page-btn"
      >
        Next
      </button>
    </div>

    <!-- Edit Response Modal -->
    <div v-if="showEditModal" class="modal">
      <div class="modal-content">
        <h3>Edit Response</h3>
        <div class="form-group">
          <label>Category:</label>
          <select v-model="editingResponse.category">
            <option v-for="category in categories" :key="category" :value="category">
              {{ category }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label>Response:</label>
          <textarea v-model="editingResponse.content" rows="4"></textarea>
        </div>
        <div class="modal-actions">
          <button @click="saveEdit" class="save-btn">Save</button>
          <button @click="cancelEdit" class="cancel-btn">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ChatbotResponses',
  data() {
    return {
      responses: [],
      searchQuery: '',
      categoryFilter: '',
      currentPage: 1,
      itemsPerPage: 10,
      sortKey: 'timestamp',
      sortOrder: 'desc',
      expandedResponses: [],
      showEditModal: false,
      editingResponse: null,
      categories: ['General', 'Technical', 'Support', 'Feedback', 'Other'],
    }
  },
  computed: {
    filteredResponses() {
      return this.responses.filter(response => {
        const matchesSearch = this.searchQuery === '' ||
          response.content.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          response.query.toLowerCase().includes(this.searchQuery.toLowerCase())
        
        const matchesCategory = this.categoryFilter === '' ||
          response.category === this.categoryFilter

        return matchesSearch && matchesCategory
      }).sort((a, b) => {
        const aValue = a[this.sortKey]
        const bValue = b[this.sortKey]
        return this.sortOrder === 'asc' 
          ? aValue > bValue ? 1 : -1
          : aValue < bValue ? 1 : -1
      })
    },
    paginatedResponses() {
      const start = (this.currentPage - 1) * this.itemsPerPage
      const end = start + this.itemsPerPage
      return this.filteredResponses.slice(start, end)
    },
    totalPages() {
      return Math.ceil(this.filteredResponses.length / this.itemsPerPage)
    },
    totalResponses() {
      return this.responses.length
    },
    averageResponseTime() {
      const total = this.responses.reduce((sum, response) => sum + response.responseTime, 0)
      return (total / this.responses.length || 0).toFixed(2)
    },
    successRate() {
      const successful = this.responses.filter(r => r.successful).length
      return ((successful / this.responses.length) * 100 || 0).toFixed(1)
    }
  },
  methods: {
    async fetchResponses() {
      try {
        // Replace with actual API call
        const response = await this.$axios.get('/api/chatbot/responses')
        this.responses = response.data
      } catch (error) {
        console.error('Error fetching responses:', error)
      }
    },
    filterResponses() {
      this.currentPage = 1 // Reset to first page when filtering
    },
    sortBy(key) {
      if (this.sortKey === key) {
        this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc'
      } else {
        this.sortKey = key
        this.sortOrder = 'asc'
      }
    },
    getSortIcon(key) {
      if (this.sortKey !== key) return '↕'
      return this.sortOrder === 'asc' ? '↑' : '↓'
    },
    formatDate(timestamp) {
      return new Date(timestamp).toLocaleString()
    },
    toggleExpand(id) {
      const index = this.expandedResponses.indexOf(id)
      if (index === -1) {
        this.expandedResponses.push(id)
      } else {
        this.expandedResponses.splice(index, 1)
      }
    },
    changePage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page
      }
    },
    editResponse(response) {
      this.editingResponse = { ...response }
      this.showEditModal = true
    },
    async saveEdit() {
      try {
        // Replace with actual API call
        await this.$axios.put(`/api/chatbot/responses/${this.editingResponse.id}`, this.editingResponse)
        const index = this.responses.findIndex(r => r.id === this.editingResponse.id)
        this.responses[index] = { ...this.editingResponse }
        this.showEditModal = false
      } catch (error) {
        console.error('Error updating response:', error)
      }
    },
    cancelEdit() {
      this.editingResponse = null
      this.showEditModal = false
    },
    async deleteResponse(id) {
      if (confirm('Are you sure you want to delete this response?')) {
        try {
          // Replace with actual API call
          await this.$axios.delete(`/api/chatbot/responses/${id}`)
          this.responses = this.responses.filter(r => r.id !== id)
        } catch (error) {
          console.error('Error deleting response:', error)
        }
      }
    },
    exportResponses() {
      const data = this.responses.map(r => ({
        timestamp: this.formatDate(r.timestamp),
        category: r.category,
        query: r.query,
        response: r.content,
        responseTime: r.responseTime
      }))
      
      const csv = this.convertToCSV(data)
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.setAttribute('href', url)
      a.setAttribute('download', `chatbot-responses-${new Date().toISOString().split('T')[0]}.csv`)
      a.click()
    },
    convertToCSV(data) {
      const headers = Object.keys(data[0])
      const rows = data.map(obj => headers.map(header => JSON.stringify(obj[header])).join(','))
      return [headers.join(','), ...rows].join('\n')
    }
  },
  created() {
    this.fetchResponses()
  }
}
</script>

<style lang="scss" scoped>
.chatbot-responses {
  padding: 20px;

  .controls-section {
    margin-bottom: 20px;
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    align-items: center;
  }

  .search-filter {
    display: flex;
    gap: 10px;
    flex: 1;

    .search-input,
    .category-select {
      padding: 8px;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      min-width: 200px;
    }
  }

  .analytics-summary {
    display: flex;
    gap: 15px;

    .metric-card {
      background: var(--bg-secondary);
      padding: 10px 15px;
      border-radius: 8px;
      text-align: center;

      h4 {
        margin: 0;
        font-size: 0.9em;
        color: var(--text-secondary);
      }

      p {
        margin: 5px 0 0;
        font-size: 1.2em;
        font-weight: bold;
      }
    }
  }

  .responses-table {
    overflow-x: auto;
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;

      th {
        background: var(--bg-secondary);
        padding: 12px;
        text-align: left;
        cursor: pointer;
        user-select: none;

        &:hover {
          background: var(--bg-hover);
        }
      }

      td {
        padding: 12px;
        border-bottom: 1px solid var(--border-color);
      }
    }
  }

  .category-badge {
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 0.9em;
    
    &.General { background: #e3f2fd; }
    &.Technical { background: #f3e5f5; }
    &.Support { background: #e8f5e9; }
    &.Feedback { background: #fff3e0; }
    &.Other { background: #f5f5f5; }
  }

  .response-content {
    max-height: 100px;
    overflow: hidden;
    position: relative;

    &.expanded {
      max-height: none;
    }
  }

  .action-buttons {
    display: flex;
    gap: 8px;

    button {
      padding: 4px 8px;
      border-radius: 4px;
      border: none;
      cursor: pointer;

      &.edit-btn {
        background: var(--color-primary);
        color: white;
      }

      &.delete-btn {
        background: var(--color-danger);
        color: white;
      }
    }
  }

  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 15px;
    margin-top: 20px;

    .page-btn {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      background: var(--color-primary);
      color: white;
      cursor: pointer;

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  }

  .modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;

    .modal-content {
      background: white;
      padding: 20px;
      border-radius: 8px;
      width: 500px;
      max-width: 90%;

      .form-group {
        margin-bottom: 15px;

        label {
          display: block;
          margin-bottom: 5px;
        }

        select,
        textarea {
          width: 100%;
          padding: 8px;
          border: 1px solid var(--border-color);
          border-radius: 4px;
        }
      }

      .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 20px;

        button {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;

          &.save-btn {
            background: var(--color-primary);
            color: white;
          }

          &.cancel-btn {
            background: var(--color-secondary);
            color: white;
          }
        }
      }
    }
  }
}
</style>
