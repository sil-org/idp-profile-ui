import { reactive } from 'vue'
import api from '@/plugins/api' // Adjust the path as necessary

const user = reactive({
  async refresh() {
    const userData = await api.get('/user/me') // Use the API instance
    Object.assign(this, userData)
  },
  isAuthenticated() {
    return !!this.idp_username
  },
  login(returnTo, inviteCode = '') {
    let loginUrl = `${api.defaults.baseURL}/auth/login`

    if (inviteCode) {
      loginUrl += `?invite=${inviteCode}&ReturnToOnError=/profile/invite/expired`
    }

    if (returnTo) {
      loginUrl += loginUrl.includes('?') ? `&ReturnTo=${returnTo}` : `?ReturnTo=${returnTo}`
    }

    window.location = loginUrl
  },
  logout() {
    const logoutUrl = `${api.defaults.baseURL}/auth/logout`

    window.location = logoutUrl
  },
  isNew() {
    return !this.password_meta?.last_changed
  },
})

export default user
