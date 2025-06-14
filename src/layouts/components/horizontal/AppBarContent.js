// ** MUI Imports
import Box from '@mui/material/Box'

// ** Components
import Autocomplete from 'src/layouts/components/Autocomplete'
import ModeToggler from 'src/@core/layouts/components/shared-components/ModeToggler'
import UserDropdown from 'src/@core/layouts/components/shared-components/UserDropdown'
import LanguageDropdown from 'src/@core/layouts/components/shared-components/LanguageDropdown'
import NotificationDropdown from 'src/@core/layouts/components/shared-components/NotificationDropdown'
import ShortcutsDropdown from 'src/@core/layouts/components/shared-components/ShortcutsDropdown'

// ** Hook Import
import { useAuth } from 'src/hooks/useAuth'

const AppBarContent = props => {
  // ** Props
  const { hidden, settings, saveSettings } = props

  // ** Hook
  const auth = useAuth()

  return <Box sx={{ display: 'flex', alignItems: 'center' }}></Box>
}

export default AppBarContent
