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
import Vendors from './vendors'
import Contract from './contract'

// ** Other Imports
import { AbilityContext } from 'src/layouts/components/acl/Can'

const Vendor = () => {
  // ** States
  const [value, setValue] = useState('Vendor')
  const ability = useContext(AbilityContext)
  const canReadContract = ability.can('view', 'contracts')

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
              <Tab value='Vendor' label='Vendor' icon={<Icon icon='majesticons:suitcase' />} />
              {canReadContract && (
                <Tab
                  value='Contract'
                  label='Contract'
                  icon={<Icon icon='material-symbols:contract-outline-rounded' />}
                />
              )}
            </TabList>
            <Box sx={{ mt: 6 }}>
              <TabPanel sx={{ p: 0 }} value='Vendor'>
                <Vendors />
              </TabPanel>
              <TabPanel sx={{ p: 0 }} value='Contract'>
                <Contract />
              </TabPanel>
            </Box>
          </TabContext>
        </Box>
      </Grid>
    </>
  )
}

Vendor.acl = {
  action: 'view',
  subject: 'vendors'
}

export default Vendor
