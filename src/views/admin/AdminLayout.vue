<template>
  <div class="admin-layout">
    <nav class="admin-nav">
      <div class="nav-header">
        <img src="@/assets/18kchatlogo.jpg" alt="18K Chat" class="nav-logo">
        <h1>Admin Panel</h1>
      </div>
      
      <div class="nav-links">
        <router-link to="/admin" exact>
          <i class="fas fa-chart-line"></i>
          Dashboard
        </router-link>
        <router-link to="/admin/chat">
          <i class="fas fa-comments"></i>
          Live Chat
        </router-link>
        <router-link to="/admin/settings">
          <i class="fas fa-cog"></i>
          Settings
        </router-link>
      </div>

      <div class="nav-footer">
        <button class="logout-btn" @click="handleLogout">
          <i class="fas fa-sign-out-alt"></i>
          Logout
        </button>
      </div>
    </nav>

    <main class="admin-content">
      <router-view></router-view>
    </main>
  </div>
</template>

<script>
import { useRouter } from 'vue-router';
import { supabase } from '@/supabase';

export default {
  name: 'AdminLayout',
  
  setup() {
    const router = useRouter();

    const handleLogout = async () => {
      try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        router.push('/login');
      } catch (error) {
        console.error('Error logging out:', error);
      }
    };

    return {
      handleLogout
    };
  }
};
</script>

<style lang="scss" scoped>
.admin-layout {
  display: grid;
  grid-template-columns: 250px 1fr;
  min-height: 100vh;
  background: #1a1a1a;

  .admin-nav {
    background: #2d2d2d;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    border-right: 1px solid #444;

    .nav-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 2rem;

      .nav-logo {
        width: 40px;
        height: 40px;
        border-radius: 8px;
      }

      h1 {
        color: #fff;
        font-size: 1.2rem;
        margin: 0;
      }
    }

    .nav-links {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      a {
        display: flex;
        align-items: center;
        gap: 0.8rem;
        padding: 0.8rem 1rem;
        color: #888;
        text-decoration: none;
        border-radius: 8px;
        transition: all 0.3s ease;

        i {
          font-size: 1.2rem;
        }

        &:hover {
          background: #333;
          color: #fff;
        }

        &.router-link-active {
          background: #2196F3;
          color: #fff;
        }
      }
    }

    .nav-footer {
      margin-top: auto;
      padding-top: 1rem;
      border-top: 1px solid #444;

      .logout-btn {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.8rem;
        padding: 0.8rem;
        background: #424242;
        border: none;
        border-radius: 8px;
        color: #fff;
        cursor: pointer;
        transition: background-color 0.3s ease;

        &:hover {
          background: #f44336;
        }

        i {
          font-size: 1.2rem;
        }
      }
    }
  }

  .admin-content {
    padding: 2rem;
    overflow-y: auto;
  }
}
</style>
