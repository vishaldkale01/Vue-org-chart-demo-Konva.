// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import HelloWorld from './components/HelloWorld.vue'
import konvasDemo from './components/konvasDemo.vue'
// import controllPannel from './components/controllPannel.vue'
const routes = [
  { path: '/', name: 'Home', component: HelloWorld },
  { path: '/demo', name: 'demo', component: konvasDemo },
  // { path: '/controllPannel', name: 'demo', component: controllPannel }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
