import { HTTP_STATUS_UNAUTHORIZED } from '../main'
import { createRouter, createWebHashHistory } from 'vue-router'
import profileRoutes from '@/profile/routes'
import passwordRoutes from '@/password/routes'
import twoStepRoutes from '@/2sv/routes'
import PageNotFound from '@/global/PageNotFound.vue'
import user from '@/plugins/user'

const routes = [
  ...profileRoutes,
  ...passwordRoutes,
  ...twoStepRoutes,
  {
    path: '/help', // old pw-ui urls might still be bookmarked.
    redirect: () => (window.location = 'https://sites.google.com/sil.org/idphelp'),
  },
  {
    path: '/:pathMatch(.*)*',
    component: PageNotFound,
    meta: {
      public: true,
    },
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach(async (to, _from, next) => {
  if (!to.meta.public) {
    try {
      await user.refresh()
    } catch (e) {
      if (e.status === HTTP_STATUS_UNAUTHORIZED) {
        user.login(to.path, to.query.invite)
      }
      throw e
    }
  }

  next()
})

export default router
