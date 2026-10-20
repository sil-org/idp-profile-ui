import { reactive } from 'vue'
import api from '@/plugins/api' // Adjust the path as necessary

// Where the app is served, always with a trailing slash, e.g. https://profile.example.org/ or https://example.org/profile/
// BASE_URL is built into Vite: it's the `base` set in vite.config.mjs from VITE_BASE_PATH, '/' by default.
const appRoot = () => `${window.location.origin}${import.meta.env.BASE_URL}`

// At the domain root this stays the bare origin (no trailing slash), which is what the IdP has always been sent.
const appHome = () => (import.meta.env.BASE_URL === '/' ? window.location.origin : appRoot())

const user = reactive({
  resolveReturnTo(returnTo) {
    if (!returnTo) {
      return appHome()
    }

    if (returnTo.startsWith('#')) {
      return `${appRoot()}${returnTo}`
    }

    const path = returnTo.startsWith('/') ? returnTo : `/${returnTo}`

    return `${appRoot()}#${path}`
  },
  async refresh() {
    const userData = await api.get('/user/me') // Use the API instance
    Object.assign(this, userData)
  },
  isAuthenticated() {
    return !!this.idp_username
  },
  login(returnTo, inviteCode = '') {
    const params = new URLSearchParams()

    params.set('ReturnTo', this.resolveReturnTo(returnTo))

    if (inviteCode) {
      params.set('invite', inviteCode)
      params.set('ReturnToOnError', `${appRoot()}#/profile/invite/expired`)
    }

    window.location = `${api.defaults.baseURL}/auth/login?${params.toString()}`
  },
  logout() {
    const params = new URLSearchParams({ ReturnTo: appHome() })

    window.location = `${api.defaults.baseURL}/auth/logout?${params.toString()}`
  },
  isNew() {
    return !this.password_meta?.last_changed
  },
})

export default user
