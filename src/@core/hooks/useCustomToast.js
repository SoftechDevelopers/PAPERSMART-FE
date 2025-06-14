import toast from 'react-hot-toast'
import { useTheme } from '@mui/material/styles'

const useCustomToast = () => {
  const theme = useTheme()

  const showSuccessToast = message => {
    return toast.success(message, {
      style: {
        padding: '16px',

        background: theme.palette.success.main,
        color: '#FFFFFF',
        boxShadow: 'none',
        border: `1px solid ${theme.palette.success.main}`
      },
      iconTheme: {
        primary: '#FFFFFF',
        secondary: theme.palette.success.main
      }
    })
  }

  const showErrorToast = message => {
    return toast.error(message, {
      style: {
        padding: '16px',

        background: theme.palette.error.main,
        color: '#FFFFFF',

        boxShadow: 'none',
        border: `1px solid ${theme.palette.error.main}`
      },
      iconTheme: {
        primary: theme.palette.error.main,
        secondary: theme.palette.error.contrastText
      }
    })
  }

  return { showSuccessToast, showErrorToast }
}

export default useCustomToast
