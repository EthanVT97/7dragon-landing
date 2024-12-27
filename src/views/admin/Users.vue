&lt;template>
  <div class="admin-users">
    <div class="header">
      <h1>Admin Users Management</h1>
      <button @click="showCreateModal = true" class="btn-create">
        <i class="fas fa-plus"></i> Add Admin User
      </button>
    </div>

    <!-- Users List -->
    <div class="users-list">
      <div v-for="user in adminUsers" :key="user.user_id" class="user-card">
        <div class="user-info">
          <h3>{{ user.username }}</h3>
          <p>{{ user.email }}</p>
          <span class="role-badge">{{ user.role }}</span>
        </div>
        <div class="user-actions">
          <button @click="editUser(user)" class="btn-edit">
            <i class="fas fa-edit"></i>
          </button>
          <button @click="confirmDelete(user)" class="btn-delete">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showCreateModal" class="modal">
      <div class="modal-content">
        <h2>{{ isEditing ? 'Edit Admin User' : 'Create Admin User' }}</h2>
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label>Username</label>
            <input 
              v-model="formData.username" 
              type="text" 
              required
              :disabled="isEditing"
            >
          </div>
          <div class="form-group">
            <label>Email</label>
            <input 
              v-model="formData.email" 
              type="email" 
              required
              :disabled="isEditing"
            >
          </div>
          <div class="form-group">
            <label>Password</label>
            <input 
              v-model="formData.password" 
              type="password" 
              :required="!isEditing"
            >
          </div>
          <div class="form-group">
            <label>Role</label>
            <select v-model="formData.role">
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>
          <div class="modal-actions">
            <button type="button" @click="closeModal" class="btn-cancel">Cancel</button>
            <button type="submit" class="btn-submit">
              {{ isEditing ? 'Update' : 'Create' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal">
      <div class="modal-content">
        <h2>Confirm Delete</h2>
        <p>Are you sure you want to delete {{ selectedUser?.username }}?</p>
        <div class="modal-actions">
          <button @click="showDeleteModal = false" class="btn-cancel">Cancel</button>
          <button @click="deleteUser" class="btn-delete">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'AdminUsers',
  setup() {
    const store = useStore()
    const adminUsers = ref([])
    const showCreateModal = ref(false)
    const showDeleteModal = ref(false)
    const isEditing = ref(false)
    const selectedUser = ref(null)
    const formData = ref({
      username: '',
      email: '',
      password: '',
      role: 'admin'
    })

    const loadUsers = async () => {
      const { data, error } = await store.dispatch('getAdminUsers')
      if (error) {
        console.error('Failed to load admin users:', error)
        return
      }
      adminUsers.value = data
    }

    const handleSubmit = async () => {
      if (isEditing.value) {
        const { error } = await store.dispatch('updateAdminUser', {
          userId: selectedUser.value.user_id,
          updates: {
            role: formData.value.role,
            ...(formData.value.password ? { password: formData.value.password } : {})
          }
        })
        if (error) {
          console.error('Failed to update user:', error)
          return
        }
      } else {
        const { error } = await store.dispatch('createAdminUser', formData.value)
        if (error) {
          console.error('Failed to create user:', error)
          return
        }
      }
      
      await loadUsers()
      closeModal()
    }

    const editUser = (user) => {
      selectedUser.value = user
      formData.value = {
        username: user.username,
        email: user.email,
        password: '',
        role: user.role
      }
      isEditing.value = true
      showCreateModal.value = true
    }

    const confirmDelete = (user) => {
      selectedUser.value = user
      showDeleteModal.value = true
    }

    const deleteUser = async () => {
      const { error } = await store.dispatch('deleteAdminUser', selectedUser.value.user_id)
      if (error) {
        console.error('Failed to delete user:', error)
        return
      }
      showDeleteModal.value = false
      await loadUsers()
    }

    const closeModal = () => {
      showCreateModal.value = false
      showDeleteModal.value = false
      isEditing.value = false
      selectedUser.value = null
      formData.value = {
        username: '',
        email: '',
        password: '',
        role: 'admin'
      }
    }

    onMounted(loadUsers)

    return {
      adminUsers,
      showCreateModal,
      showDeleteModal,
      isEditing,
      selectedUser,
      formData,
      handleSubmit,
      editUser,
      confirmDelete,
      deleteUser,
      closeModal
    }
  }
}
</script>

<style lang="scss" scoped>
.admin-users {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  
  h1 {
    color: var(--color-text);
    margin: 0;
  }
}

.btn-create {
  background: linear-gradient(135deg, var(--color-secondary) 0%, var(--color-accent) 100%);
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(82, 215, 183, 0.3);
  }
}

.users-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.user-card {
  background: rgba(26, 42, 61, 0.9);
  border: 1px solid rgba(82, 215, 183, 0.3);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  
  .user-info {
    h3 {
      margin: 0 0 0.5rem 0;
      color: var(--color-text);
    }
    
    p {
      margin: 0 0 0.5rem 0;
      color: rgba(224, 231, 255, 0.7);
    }
  }
  
  .role-badge {
    display: inline-block;
    padding: 0.3rem 0.8rem;
    border-radius: 20px;
    font-size: 0.8rem;
    background: rgba(82, 215, 183, 0.2);
    color: var(--color-secondary);
    border: 1px solid var(--color-secondary);
  }
}

.user-actions {
  display: flex;
  gap: 0.5rem;
  
  button {
    background: transparent;
    border: 1px solid rgba(82, 215, 183, 0.3);
    color: var(--color-text);
    width: 36px;
    height: 36px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
      background: rgba(82, 215, 183, 0.1);
      transform: translateY(-2px);
    }
    
    &.btn-delete:hover {
      background: rgba(255, 99, 71, 0.1);
      border-color: tomato;
      color: tomato;
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
    background: var(--color-primary);
    border-radius: 12px;
    padding: 2rem;
    width: 100%;
    max-width: 500px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
    
    h2 {
      margin: 0 0 1.5rem 0;
      color: var(--color-text);
    }
  }
}

.form-group {
  margin-bottom: 1.5rem;
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    color: var(--color-text);
  }
  
  input, select {
    width: 100%;
    padding: 0.8rem;
    border-radius: 8px;
    border: 1px solid rgba(82, 215, 183, 0.3);
    background: rgba(15, 28, 44, 0.8);
    color: var(--color-text);
    
    &:focus {
      outline: none;
      border-color: var(--color-secondary);
    }
    
    &:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
  }
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  
  button {
    padding: 0.8rem 1.5rem;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &.btn-cancel {
      background: transparent;
      border: 1px solid rgba(82, 215, 183, 0.3);
      color: var(--color-text);
      
      &:hover {
        background: rgba(82, 215, 183, 0.1);
      }
    }
    
    &.btn-submit {
      background: linear-gradient(135deg, var(--color-secondary) 0%, var(--color-accent) 100%);
      border: none;
      color: white;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(82, 215, 183, 0.3);
      }
    }
    
    &.btn-delete {
      background: tomato;
      border: none;
      color: white;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(255, 99, 71, 0.3);
      }
    }
  }
}

@media (max-width: 768px) {
  .admin-users {
    padding: 1rem;
  }
  
  .header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .modal-content {
    margin: 1rem;
    padding: 1.5rem;
  }
}
</style>
