// ** React Imports
import { forwardRef } from 'react'

// ** MUI Imports
import MuiAvatar from '@mui/material/Avatar'
import { lighten, useTheme } from '@mui/material/styles'

// ** Hooks Imports
import useBgColor from 'src/@core/hooks/useBgColor'

const Avatar = forwardRef((props, ref) => {
  // ** Props
  const { sx, src, skin, color } = props

  // ** Hook
  const theme = useTheme()
  const bgColors = useBgColor()

  const getAvatarStyles = (skin, skinColor) => {
    let avatarStyles
    if (skinColor == 'pink') {
      avatarStyles = { color: '#F7418F', backgroundColor: 'rgba(102, 108, 255, 0.12)' }
    } else {
      if (skin === 'light') {
        avatarStyles = { ...bgColors[`${skinColor}Light`] }
      } else if (skin === 'light-static') {
        avatarStyles = {
          color: bgColors[`${skinColor}Light`].color,
          backgroundColor: lighten(theme.palette[skinColor].main, 0.88)
        }
      } else {
        avatarStyles = { ...bgColors[`${skinColor}Filled`] }
      }
    }

    return avatarStyles
  }

  const colors = {
    primary: getAvatarStyles(skin, 'primary'),
    secondary: getAvatarStyles(skin, 'secondary'),
    success: getAvatarStyles(skin, 'success'),
    error: getAvatarStyles(skin, 'error'),
    pink: getAvatarStyles(skin, 'pink'),
    warning: getAvatarStyles(skin, 'warning'),
    info: getAvatarStyles(skin, 'info')
  }

  return <MuiAvatar ref={ref} {...props} sx={!src && skin && color ? Object.assign(colors[color], sx) : sx} />
})
Avatar.defaultProps = {
  skin: 'filled',
  color: 'primary'
}

export default Avatar
