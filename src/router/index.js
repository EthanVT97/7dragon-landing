import { createRouter, createWebHistory } from 'vue-router';
import { supabase } from '@/supabase';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue')
  },
  {
    path: '/chat',
    name: 'Chat',
    component: () => import('@/components/ChatWindow.vue')
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('@/views/admin/AdminLayout.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: '',
        name: 'AdminDashboard',
        component: () => import('@/views/admin/Dashboard.vue')
      },
      {
        path: 'chat',
        name: 'AdminChat',
        component: () => import('@/views/admin/AdminChat.vue')
      },
      {
        path: 'chatbot',
        name: 'ChatbotResponses',
        component: () => import('@/views/admin/ChatbotResponses.vue')
      },
      {
        path: 'settings',
        name: 'AdminSettings',
        component: () => import('@/views/admin/Settings.vue')
      }
    ]
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue')
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Navigation guard
router.beforeEach(async (to, from, next) => {
  const { data: { session } } = await supabase.auth.getSession();
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin);

  if (requiresAuth && !session) {
    if (to.name === 'Chat') {
      next();
    } else {
      next('/login');
    }
  } else if (requiresAdmin) {
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (userProfile?.role !== 'admin') {
      next('/');
    } else {
      next();
    }
  } else {
    next();
  }
});

export default router;
