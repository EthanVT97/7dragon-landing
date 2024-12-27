import { createRouter, createWebHistory } from 'vue-router'
import { useStore } from 'vuex'

// Page Components
import Home from '@/views/Home.vue'
import Pricing from '@/views/Pricing.vue'
import About from '@/views/About.vue'
import Login from '@/views/Login.vue'
import AdminDashboard from '@/views/admin/Dashboard.vue'
import AdminContent from '@/views/admin/Content.vue'
import AdminChatbot from '@/views/admin/Chatbot.vue'
import AdminAnalytics from '@/views/admin/Analytics.vue'
import AdminUsers from '@/views/admin/Users.vue'
import AdminSetup from '@/views/AdminSetup.vue'
import NotFound from '@/views/NotFound.vue'
import AdminChat from '@/components/AdminChat.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/pricing',
    name: 'Pricing',
    component: Pricing
  },
  {
    path: '/about',
    name: 'About',
    component: About
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/admin',
    name: 'Admin',
    component: AdminDashboard,
    meta: { requiresAuth: true, adminOnly: true },
    children: [
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('@/views/admin/Dashboard.vue')
      },
      {
        path: 'content',
        name: 'AdminContent',
        component: AdminContent
      },
      {
        path: 'chatbot',
        name: 'AdminChatbot',
        component: AdminChatbot
      },
      {
        path: 'analytics',
        name: 'AdminAnalytics',
        component: AdminAnalytics
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: AdminUsers
      }
    ]
  },
  {
    path: '/admin/chat',
    name: 'AdminChat',
    component: AdminChat,
    meta: {
      requiresAuth: true,
      requiresAdmin: true
    }
  },
  {
    path: '/admin-setup',
    name: 'AdminSetup',
    component: AdminSetup
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// Navigation Guards
router.beforeEach(async (to, from, next) => {
  const store = useStore()
  const isAuthenticated = store.getters.isAuthenticated
  const isAdmin = store.getters.currentUser?.role === 'admin'

  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!isAuthenticated) {
      next('/login')
    } else if (to.matched.some(record => record.meta.requiresAdmin) && !isAdmin) {
      next('/')
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router
