import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router/dist/vue-router'

import App from './App.vue'
import MainPage from './pages/MainPage.vue'
import RemoteControlPage from './pages/RemoteControlPage.vue'

const routes = [
  { path: '/', component: MainPage },
  { path: '/remote/:id', component: RemoteControlPage }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

createApp(App).use(router).mount('#app')
