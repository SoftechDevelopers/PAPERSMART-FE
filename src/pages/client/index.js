// ** React Imports
import { useState, useContext } from 'react'

// ** MUI Imports
import Grid from '@mui/material/Grid'
import Tab from '@mui/material/Tab'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'
import { Box } from '@mui/material'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Custom Imports
import Clients from './clients'
import Agreement from './agreement'
import Strength from './strength'

// ** Other Imports
import { AbilityContext } from 'src/layouts/components/acl/Can'

const Client = () => {
  // ** States
  const [value, setValue] = useState('Client')
  const ability = useContext(AbilityContext)
  const canReadAgreement = ability.can('view', 'agreements')
  const canReadStrength = ability.can('view', 'strengths')

  // ** Tab change
  const handleChange = (_, activeTab) => {
    setValue(activeTab)
  }

  return (
    <>
      <Grid container>
        <Box sx={{ width: '100%' }}>
          <TabContext value={value}>
            <TabList
              variant='scrollable'
              scrollButtons='auto'
              onChange={handleChange}
              aria-label='duty tabs'
              sx={{ borderBottom: theme => `1px solid ${theme.palette.divider}` }}
            >
              <Tab value='Client' label='Client' icon={<Icon icon='material-symbols:school-rounded' />} />
              {canReadAgreement && (
                <Tab value='Agreement' label='Agreement' icon={<Icon icon='icon-park-outline:agreement' />} />
              )}
              {canReadStrength && <Tab value='Strength' label='Strength' icon={<Icon icon='mdi:hashtag-box' />} />}
            </TabList>
            <Box sx={{ mt: 6 }}>
              <TabPanel sx={{ p: 0 }} value='Client'>
                <Clients />
              </TabPanel>
              <TabPanel sx={{ p: 0 }} value='Agreement'>
                <Agreement />
              </TabPanel>
              <TabPanel sx={{ p: 0 }} value='Strength'>
                <Strength />
              </TabPanel>
            </Box>
          </TabContext>
        </Box>
      </Grid>
    </>
  )
}

Client.acl = {
  action: 'view',
  subject: 'clients'
}

export default Client
