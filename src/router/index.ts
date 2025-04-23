import { createRouter, createWebHistory } from 'vue-router'
import EditorDemo from '../views/EditorDemo.vue'
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: EditorDemo,
    },
  ],
})

export default router
