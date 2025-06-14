// ** Imports
import axios from 'axios'
import authConfig from 'src/configs/auth'

// ** Create Instance
const axiosInstance = axios.create({
  baseURL: authConfig.apiEndpoint,
  headers: {
    Accept: 'application/json'
  }
})

// ** Request Interceptor
axiosInstance.interceptors.request.use(
  config => {
    if (config.customToken) {
      config.headers.Authorization = `Bearer ${config.customToken}`
    } else {
      const token = localStorage.getItem(authConfig.storageTokenKeyName)
      if (token) config.headers.Authorization = `Bearer ${token}`
    }

    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    } else if (config.data) {
      config.headers['Content-Type'] = 'application/json'
    }

    return config
  },
  error => Promise.reject(error)
)

export default axiosInstance
