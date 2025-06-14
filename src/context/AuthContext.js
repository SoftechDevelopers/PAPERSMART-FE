// ** React Imports
import { createContext, useEffect, useState } from 'react'

// ** Next Import
import { useRouter } from 'next/router'

// ** Axios
import axios from 'axios'

// ** Config
import authConfig from 'src/configs/auth'

// ** Loader Import
import NProgress from 'nprogress'

// ** Defaults
const defaultProvider = {
  user: null,
  loading: true,
  setUser: () => null,
  setLoading: () => Boolean,
  login: () => Promise.resolve(),
  logout: () => Promise.resolve()
}

const AuthContext = createContext(defaultProvider)

const AuthProvider = ({ children }) => {
  // ** States
  const [user, setUser] = useState(defaultProvider.user)
  const [loading, setLoading] = useState(defaultProvider.loading)

  // ** Hooks
  const router = useRouter()

  // Validate
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = window.localStorage.getItem(authConfig.storageTokenKeyName)
      const userData = window.localStorage.getItem('userData')

      if (storedToken) {
        setLoading(true)
        try {
          const isValid = await validateToken(storedToken)

          if (isValid) {
            setUser(JSON.parse(userData))
          } else if (authConfig.onTokenExpiration === 'refreshToken') {
            const isRefreshed = await refreshToken()

            if (isRefreshed) {
              setUser(JSON.parse(userData))
            } else {
              await handleLogout()
            }
          } else {
            await handleLogout()
          }
        } catch (error) {
          console.error('An error occurred during authentication:', error)
        } finally {
          setLoading(false)
        }
      } else {
        setLoading(false)
      }
    }

    initAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ** Helper function to make authorized requests
  const makeAuthorizedRequest = async (url, token) => {
    return await axios.get(url, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    })
  }

  // ** Helper function to validate access token
  const validateToken = async storedToken => {
    try {
      await makeAuthorizedRequest(authConfig.apiEndpoint + '/validate', storedToken)

      return true
    } catch (error) {
      if (error?.response?.status === 401) {
        return false
      }
      throw error
    }
  }

  // ** Helper function to refresh token
  const refreshToken = async fiscal => {
    const refreshToken = window.localStorage.getItem(authConfig.refreshTokenKeyName)
    if (!refreshToken) return false

    try {
      let response
      fiscal
        ? (response = await makeAuthorizedRequest(authConfig.apiEndpoint + '/refresh?fiscal=' + fiscal, refreshToken))
        : (response = await makeAuthorizedRequest(authConfig.apiEndpoint + '/refresh', refreshToken))

      window.localStorage.setItem(authConfig.storageTokenKeyName, response?.data?.accessToken)

      return true
    } catch (refreshError) {
      return false
    }
  }

  // ** Login
  const handleLogin = async (params, errorCallback) => {
    axios
      .post(authConfig.apiEndpoint + '/login', params, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then(async response => {
        params.rememberMe
          ? window.localStorage.setItem(authConfig.storageTokenKeyName, response?.data?.accessToken)
          : null

        window.localStorage.setItem(authConfig.refreshTokenKeyName, response?.data?.refreshToken)

        const returnUrl = router.query.returnUrl

        setUser({ ...response.data.userData })
        params.rememberMe ? window.localStorage.setItem('userData', JSON.stringify(response.data.userData)) : null
        const redirectURL = returnUrl && returnUrl !== '/' ? returnUrl : '/'

        router.replace(redirectURL)
      })
      .catch(err => {
        if (errorCallback) errorCallback(err)
      })
  }

  // ** Logout
  const handleLogout = () => {
    NProgress.start()
    axios
      .post(
        authConfig.apiEndpoint + '/logout',
        {},
        {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${window.localStorage.getItem(authConfig.storageTokenKeyName)}`
          }
        }
      )
      .then(async () => {
        setUser(null)
        window.localStorage.removeItem('userData')
        window.localStorage.removeItem(authConfig.storageTokenKeyName)
        router.push('/login')
      })
      .catch(err => {
        console.log(err)
      })
      .finally(() => {
        NProgress.done()
      })
  }

  const values = {
    user,
    loading,
    setUser,
    setLoading,
    refreshToken,
    login: handleLogin,
    logout: handleLogout
  }

  return <AuthContext.Provider value={values}>{children}</AuthContext.Provider>
}

export { AuthContext, AuthProvider }
