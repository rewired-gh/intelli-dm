import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router/dist/vue-router'

import App from './App.vue'

import 'vite/modulepreload-polyfill'
import process from 'rollup-plugin-node-polyfills/polyfills/process-es6'

window.process = process

const MainPage = () => import('./pages/MainPage.vue')
const RemoteControlPage = () => import('./pages/RemoteControlPage.vue')

const routes = [
  { path: '/', component: MainPage },
  { path: '/remote/:id', component: RemoteControlPage, props: true }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

createApp(App).use(router).mount('#app')
