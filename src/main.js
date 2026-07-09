import App from './App.vue'
import eventBus from './eventBus'
import registerComponents from '@/global/components'
import { api, i18n, returnTo, router, user, vuetify } from './plugins'
import { createApp } from 'vue'
import { browserTracingIntegration, init, replayIntegration } from '@sentry/vue'
import VueSanitize from 'vue-sanitize-directive'

export const HTTP_STATUS_NOT_FOUND = 404
export const HTTP_STATUS_UNAUTHORIZED = 401
export const HTTP_STATUS_FORBIDDEN = 403

const app = createApp(App)

async function main() {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  const release = __APP_VERSION__

  app.config.globalProperties.$idpConfig = {}
  async function loadConfig() {
    try {
      const config = await api.get('config')
      app.config.globalProperties.$idpConfig = config
    } catch (error) {
      console.info('Failed to load IDP configuration:', error)
    }
  }

  app.config.globalProperties.$API = api
  app.config.globalProperties.$user = user

  app.config.errorHandler = (err) => {
    console.info('error: ', err)
    eventBus.emit('error', err)
  }

  // catches method and async errors
  window.onunhandledrejection = (event) => {
    console.info('error: ', event.reason)
    eventBus.emit('error', event.reason)
  }

  registerComponents(app)
  app.use(i18n)
  app.use(returnTo)
  app.use(router)
  app.use(vuetify)
  app.use(VueSanitize)

  await loadConfig()

  app.mount('#app')

  if (location.hostname !== 'profile.gtis.guru') {
    console.info('Environment:', location.hostname, 'Release:', release, 'DSN:', dsn)

    init({
      app,
      dsn,
      integrations: [browserTracingIntegration({ router }), replayIntegration()],
      environment: location.hostname,
      // Preserve the pre-v10.4 default of inferring the user's info,
      // `sendDefaultPii: true` (now deprecated) would also enable.
      dataCollection: {
        userInfo: true,
      },
      // Set tracesSampleRate to 1.0 to capture 100%
      // of transactions for performance monitoring.
      // We recommend adjusting this value in production
      tracesSampleRate: 1.0,

      // Set `tracePropagationTargets` to control for which URLs distributed tracing should be enabled
      // tracePropagationTargets: ['localhost', /^https:\/\/yourserver\.io\/api/],

      // Capture Replay for 10% of all sessions,
      // plus for 100% of sessions with an error
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      beforeSend(event, hint) {
        const status = hint.originalException?.status
        if (
          status === HTTP_STATUS_NOT_FOUND ||
          status === HTTP_STATUS_UNAUTHORIZED ||
          status === HTTP_STATUS_FORBIDDEN
        ) {
          return null
        }
        return event
      },
    })
  }
}

main()

export { app }
