// ** Imports
import { useContext } from 'react'
import axiosInstance from 'src/@core/api/axiosInstance'
import { AuthContext } from 'src/context/AuthContext'
import authConfig from 'src/configs/auth'

// ** Refresh token logic
const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem(authConfig.refreshTokenKeyName)
  if (!refreshToken) throw new Error('No refresh token available')

  try {
    const response = await axiosInstance.post(
      '/refresh',
      { token: refreshToken },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
    const { accessToken } = response.data
    localStorage.setItem(authConfig.storageTokenKeyName, accessToken)

    return accessToken
  } catch (error) {
    console.error('Failed to refresh access token:', error)
    throw error
  }
}

// ** Custom hook to handle API calls
export const useApi = () => {
  const { logout } = useContext(AuthContext)

  const apiRequest = async (method, url, data = null, customHeaders = {}, signal) => {
    try {
      const accessToken = localStorage.getItem(authConfig.storageTokenKeyName)

      const headers = {
        ...customHeaders,
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
      }

      const response = await axiosInstance({
        method,
        url,
        data,
        headers,
        signal
      })

      return response?.data
    } catch (error) {
      if (error.response?.status === 401) {
        try {
          const newToken = await refreshAccessToken()

          const retryHeaders = {
            ...customHeaders,
            Authorization: `Bearer ${newToken}`
          }

          const retryResponse = await axiosInstance({
            method,
            url,
            data,
            headers: retryHeaders,
            signal
          })

          return retryResponse.data
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError)
          logout()
        }
      }

      throw error
    }
  }

  return { apiRequest }
}
