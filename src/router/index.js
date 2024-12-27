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
router.beforeEach((to, from, next) => {
  const store = useStore()
  const isAuthenticated = store.getters.isAuthenticated
  const user = store.getters.currentUser
  
  // Check if route requires authentication
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!isAuthenticated) {
      // Redirect to login page if not authenticated
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
    } else if (to.matched.some(record => record.meta.adminOnly) && (!user || user.role !== 'admin')) {
      // Redirect to home if not admin
      next({ path: '/' })
    } else {
      next()
    }
  } else {
    // If trying to access login page while already authenticated
    if (isAuthenticated && to.path === '/login') {
      next({ path: '/admin/dashboard' })
    } else {
      next()
    }
  }
})

export default router
