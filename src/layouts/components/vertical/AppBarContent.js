import React, { useState, useContext } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Components
import ModeToggler from 'src/@core/layouts/components/shared-components/ModeToggler'
import UserDropdown from 'src/@core/layouts/components/shared-components/UserDropdown'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import { Typography, Avatar } from '@mui/material'

// ** Hook Import
import { useAuth } from 'src/hooks/useAuth'

// ** Other Imports
import { AbilityContext } from 'src/layouts/components/acl/Can'
import { AuthContext } from 'src/context/AuthContext'

// ** Next Import
import { useRouter } from 'next/router'

const AppBarContent = props => {
  // ** Props
  const { hidden, settings, saveSettings, toggleNavVisibility } = props

  // ** Hook
  const auth = useAuth()
  const [fiscal, setFiscal] = useState(auth?.user?.currentFiscal || '')
  const ability = useContext(AbilityContext)
  const { logout } = useContext(AuthContext)
  const canRead = ability.can('view', 'fiscal')
  const router = useRouter()

  const organization = auth?.user?.organization
  const logo = organization?.logo
  const organizationName = `${organization?.name}`
  const organizationAddress = `${organization?.address2}, ${organization?.district}- ${organization?.pincode} (${organization?.state})`

  const handleChange = async event => {
    const fiscalValue = event.target.value
    const response = await auth.refreshToken(fiscalValue)
    if (response) {
      setFiscal(fiscalValue)
      auth.setUser(prevUser => ({ ...prevUser, currentFiscal: fiscalValue }))
      const storedUser = window.localStorage.getItem('userData')
      const parsedUser = JSON.parse(storedUser)
      parsedUser.currentFiscal = fiscalValue
      window.localStorage.setItem('userData', JSON.stringify(parsedUser))
      router.push('/home')
    } else {
      logout()
    }
  }

  return (
    <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Box className='actions-left' sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
        {hidden && !settings.navHidden ? (
          <IconButton color='inherit' sx={{ ml: -2.75 }} onClick={toggleNavVisibility}>
            <Icon icon='mdi:menu' />
          </IconButton>
        ) : null}
        {!hidden && (
          <>
            <Avatar src={logo} sx={{ width: 52, height: 52, backgroundColor: '#DDDFFF', marginRight: 2 }} />
            <Box>
              <Typography
                variant='h6'
                sx={{
                  mb: 0,
                  fontWeight: 500,
                  letterSpacing: '0.18px',
                  fontSize: { xs: '0.7rem', sm: '0.8rem', md: '1rem', lg: '1.1rem', xl: '1.3rem' }
                }}
              >
                {organizationName}
              </Typography>
              <Typography
                sx={theme => ({
                  fontSize: '0.9rem',
                  [theme.breakpoints.between('xs', 'sm')]: {
                    display: 'none'
                  },
                  [theme.breakpoints.between('sm', 'md')]: {
                    display: 'none'
                  },
                  [theme.breakpoints.up('md')]: {
                    fontSize: '0.8rem'
                  }
                })}
              >
                {organizationAddress}
              </Typography>
            </Box>
          </>
        )}
      </Box>

      <Box className='actions-right' sx={{ display: 'flex', alignItems: 'center' }}>
        {canRead && (
          <FormControl fullWidth>
            <Select
              variant='filled'
              value={fiscal}
              label='Year'
              labelId='year-select-label'
              id='year-select'
              onChange={handleChange}
              sx={{
                backgroundColor: '',
                marginRight: '5px',
                borderRadius: '10px',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'transparent'
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'gray'
                },
                '& .MuiSelect-select': {
                  paddingY: '8px',
                  paddingX: '12px'
                },
                '& .MuiSvgIcon-root': {
                  color: 'gray'
                }
              }}
            >
              {auth?.user?.fiscal.map((fiscalYear, index) => (
                <MenuItem key={index} value={fiscalYear}>
                  {fiscalYear}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        <ModeToggler settings={settings} saveSettings={saveSettings} />
        {auth?.user && (
          <>
            <UserDropdown settings={settings} />
          </>
        )}
      </Box>
    </Box>
  )
}

export default AppBarContent
