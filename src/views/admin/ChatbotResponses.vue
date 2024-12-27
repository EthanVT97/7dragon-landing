<template>
  <div class="chatbot-responses">
    <div class="header">
      <h2>Manage Chatbot Responses</h2>
      <button class="btn-primary" @click="showAddForm = true">
        <i class="fas fa-plus"></i> Add Response
      </button>
    </div>

    <!-- Response List -->
    <div class="responses-list">
      <div v-for="response in responses" :key="response.id" class="response-card">
        <div class="response-header">
          <span class="type">{{ response.type }}</span>
          <div class="actions">
            <button class="btn-icon" @click="editResponse(response)">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-icon" @click="toggleResponse(response)">
              <i :class="response.is_active ? 'fas fa-toggle-on' : 'fas fa-toggle-off'"></i>
            </button>
            <button class="btn-icon delete" @click="confirmDelete(response)">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>

        <div class="response-content">
          <div class="keywords">
            <strong>Keywords:</strong>
            <div class="keyword-tags">
              <span v-for="keyword in response.keywords" :key="keyword" class="tag">
                {{ keyword }}
              </span>
            </div>
          </div>
          <div class="response-text">
            <strong>Response:</strong>
            <p>{{ response.response }}</p>
          </div>
          <div class="meta">
            <span class="priority">Priority: {{ response.priority }}</span>
            <span class="updated">Updated: {{ formatDate(response.updated_at) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Response Modal -->
    <div v-if="showAddForm || editingResponse" class="modal">
      <div class="modal-content">
        <h3>{{ editingResponse ? 'Edit Response' : 'Add New Response' }}</h3>
        <form @submit.prevent="saveResponse">
          <div class="form-group">
            <label for="type">Type</label>
            <input 
              id="type"
              v-model="formData.type"
              type="text"
              required
              placeholder="e.g., greeting, deposit, withdraw"
            >
          </div>

          <div class="form-group">
            <label for="keywords">Keywords (comma-separated)</label>
            <input 
              id="keywords"
              v-model="keywordsInput"
              type="text"
              required
              placeholder="hello, hi, hey"
            >
          </div>

          <div class="form-group">
            <label for="response">Response</label>
            <textarea 
              id="response"
              v-model="formData.response"
              required
              rows="4"
              placeholder="Enter the chatbot's response..."
            ></textarea>
          </div>

          <div class="form-group">
            <label for="priority">Priority</label>
            <input 
              id="priority"
              v-model.number="formData.priority"
              type="number"
              required
              min="0"
              max="100"
            >
          </div>

          <div class="form-actions">
            <button type="button" class="btn-secondary" @click="closeForm">
              Cancel
            </button>
            <button type="submit" class="btn-primary">
              {{ editingResponse ? 'Update' : 'Add' }} Response
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteConfirm" class="modal">
      <div class="modal-content">
        <h3>Confirm Delete</h3>
        <p>Are you sure you want to delete this response?</p>
        <div class="form-actions">
          <button class="btn-secondary" @click="showDeleteConfirm = false">
            Cancel
          </button>
          <button class="btn-danger" @click="deleteResponse">
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { supabase } from '@/supabase';
import { format } from 'date-fns';

export default {
  name: 'ChatbotResponses',

  setup() {
    const responses = ref([]);
    const showAddForm = ref(false);
    const showDeleteConfirm = ref(false);
    const editingResponse = ref(null);
    const deleteTarget = ref(null);
    
    const formData = ref({
      type: '',
      keywords: [],
      response: '',
      priority: 0,
      is_active: true
    });

    const keywordsInput = computed({
      get: () => formData.value.keywords.join(', '),
      set: (val) => {
        formData.value.keywords = val.split(',').map(k => k.trim()).filter(k => k);
      }
    });

    // Load responses
    const loadResponses = async () => {
      try {
        const { data, error } = await supabase
          .from('chatbot_responses')
          .select('*')
          .order('priority', { ascending: false });

        if (error) throw error;
        responses.value = data;
      } catch (error) {
        console.error('Error loading responses:', error);
      }
    };

    // Save response
    const saveResponse = async () => {
      try {
        const responseData = {
          ...formData.value,
          updated_at: new Date().toISOString()
        };

        if (editingResponse.value) {
          const { error } = await supabase
            .from('chatbot_responses')
            .update(responseData)
            .eq('id', editingResponse.value.id);

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('chatbot_responses')
            .insert(responseData);

          if (error) throw error;
        }

        await loadResponses();
        closeForm();
      } catch (error) {
        console.error('Error saving response:', error);
      }
    };

    // Edit response
    const editResponse = (response) => {
      editingResponse.value = response;
      formData.value = {
        type: response.type,
        keywords: [...response.keywords],
        response: response.response,
        priority: response.priority,
        is_active: response.is_active
      };
      showAddForm.value = true;
    };

    // Toggle response active state
    const toggleResponse = async (response) => {
      try {
        const { error } = await supabase
          .from('chatbot_responses')
          .update({ 
            is_active: !response.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', response.id);

        if (error) throw error;
        await loadResponses();
      } catch (error) {
        console.error('Error toggling response:', error);
      }
    };

    // Delete response
    const confirmDelete = (response) => {
      deleteTarget.value = response;
      showDeleteConfirm.value = true;
    };

    const deleteResponse = async () => {
      try {
        const { error } = await supabase
          .from('chatbot_responses')
          .delete()
          .eq('id', deleteTarget.value.id);

        if (error) throw error;
        await loadResponses();
        showDeleteConfirm.value = false;
        deleteTarget.value = null;
      } catch (error) {
        console.error('Error deleting response:', error);
      }
    };

    // Close form
    const closeForm = () => {
      showAddForm.value = false;
      editingResponse.value = null;
      formData.value = {
        type: '',
        keywords: [],
        response: '',
        priority: 0,
        is_active: true
      };
    };

    // Format date
    const formatDate = (date) => {
      return format(new Date(date), 'MMM d, yyyy HH:mm');
    };

    onMounted(() => {
      loadResponses();
    });

    return {
      responses,
      showAddForm,
      showDeleteConfirm,
      editingResponse,
      formData,
      keywordsInput,
      saveResponse,
      editResponse,
      toggleResponse,
      confirmDelete,
      deleteResponse,
      closeForm,
      formatDate
    };
  }
};
</script>

<style lang="scss" scoped>
.chatbot-responses {
  padding: 2rem;

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;

    h2 {
      margin: 0;
      color: #fff;
    }
  }

  .responses-list {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }

  .response-card {
    background: #2d2d2d;
    border-radius: 8px;
    padding: 1rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    .response-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;

      .type {
        font-weight: bold;
        color: #2196F3;
      }

      .actions {
        display: flex;
        gap: 0.5rem;

        .btn-icon {
          background: none;
          border: none;
          color: #fff;
          cursor: pointer;
          padding: 0.5rem;
          font-size: 1rem;
          transition: color 0.2s;

          &:hover {
            color: #2196F3;
          }

          &.delete:hover {
            color: #ff4444;
          }
        }
      }
    }

    .response-content {
      .keywords {
        margin-bottom: 1rem;

        .keyword-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 0.5rem;

          .tag {
            background: #1a1a1a;
            color: #fff;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.9rem;
          }
        }
      }

      .response-text {
        margin-bottom: 1rem;

        p {
          margin: 0.5rem 0 0;
          color: #fff;
        }
      }

      .meta {
        display: flex;
        justify-content: space-between;
        font-size: 0.9rem;
        color: #888;
      }
    }
  }

  .modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;

    .modal-content {
      background: #2d2d2d;
      padding: 2rem;
      border-radius: 8px;
      width: 100%;
      max-width: 500px;

      h3 {
        margin: 0 0 1.5rem;
        color: #fff;
      }

      .form-group {
        margin-bottom: 1rem;

        label {
          display: block;
          margin-bottom: 0.5rem;
          color: #fff;
        }

        input, textarea {
          width: 100%;
          padding: 0.8rem;
          border: 1px solid #444;
          border-radius: 4px;
          background: #1a1a1a;
          color: #fff;
          font-size: 1rem;

          &:focus {
            outline: none;
            border-color: #2196F3;
          }
        }
      }

      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        margin-top: 1.5rem;

        button {
          padding: 0.8rem 1.5rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
          transition: background-color 0.2s;

          &.btn-primary {
            background: #2196F3;
            color: #fff;

            &:hover {
              background: #1976D2;
            }
          }

          &.btn-secondary {
            background: #424242;
            color: #fff;

            &:hover {
              background: #323232;
            }
          }

          &.btn-danger {
            background: #ff4444;
            color: #fff;

            &:hover {
              background: #cc0000;
            }
          }
        }
      }
    }
  }
}
</style>
