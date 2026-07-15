import axios from 'axios'
import user from '@/plugins/user'
import { HTTP_STATUS_FORBIDDEN, HTTP_STATUS_UNAUTHORIZED } from '../consts'
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}`,
  withCredentials: true,
})

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const e = error.response?.data || error

    if ([HTTP_STATUS_UNAUTHORIZED, HTTP_STATUS_FORBIDDEN].includes(e.status)) {
      user.login(location.hash)
    }

    throw e
  },
)

export default api
