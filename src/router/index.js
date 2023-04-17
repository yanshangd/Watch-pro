import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import(/* webpackChunkName: "create" */ '../views/CreateView.vue'),
    meta: {
      title: '欢迎来到Watch-pro'
    }
  },
  {
    path: '/watch',
    name: 'watch',
    component: () => import(/* webpackChunkName: "watch" */ '../views/WatchView.vue'),
    meta: {
      title: 'Watch-pro'
    }
  },
]

const router = new VueRouter({
  routes
})

export default router
