import { reactive } from 'vue'
import api from '@/plugins/api' // Adjust the path as necessary

const user = reactive({
  resolveReturnTo(returnTo) {
    if (!returnTo) {
      return window.location.origin
    }

    if (returnTo.startsWith('#')) {
      return `${window.location.origin}/${returnTo}`
    }

    const path = returnTo.startsWith('/') ? returnTo : `/${returnTo}`

    return `${window.location.origin}/#${path}`
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
      params.set('ReturnToOnError', `${window.location.origin}/#/profile/invite/expired`)
    }

    window.location = `${api.defaults.baseURL}/auth/login?${params.toString()}`
  },
  logout() {
    const params = new URLSearchParams({ ReturnTo: window.location.origin })

    window.location = `${api.defaults.baseURL}/auth/logout?${params.toString()}`
  },
  isNew() {
    return !this.password_meta?.last_changed
  },
})

export default user
