import { createApp } from 'vue'
import App from './App.vue'
import router from './router/index.mjs'
import store from './store/index.mjs'
import i18n from './plugins/i18n.mjs'
import './assets/styles/main.scss'
import '@fortawesome/fontawesome-free/css/all.min.css'

const app = createApp(App)

app.use(store)
   .use(router)
   .use(i18n)
   .mount('#app')
