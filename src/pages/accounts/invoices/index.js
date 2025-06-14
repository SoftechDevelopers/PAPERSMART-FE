// ** React Imports
import { useState } from 'react'

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
import ViewServiceInvoices from './ViewServiceInvoices'

const ServiceInvoices = () => {
  // ** States
  const [value, setValue] = useState('View')

  // ** Tab change
  const handleChange = (_, activeTab) => {
    setValue(activeTab)
  }

  return (
    <Grid container>
      <Box sx={{ width: '100%' }}>
        <TabContext value={value}>
          <TabList
            variant='scrollable'
            scrollButtons='auto'
            onChange={handleChange}
            aria-label='tabs'
            sx={{ borderBottom: theme => `1px solid ${theme.palette.divider}` }}
          >
            <Tab value='View' label='View' icon={<Icon icon='majesticons:eye-line' />} />
          </TabList>
          <Box sx={{ mt: 6 }}>
            <TabPanel sx={{ p: 0 }} value='View'>
              <ViewServiceInvoices />
            </TabPanel>
          </Box>
        </TabContext>
      </Box>
    </Grid>
  )
}

ServiceInvoices.acl = {
  action: 'view',
  subject: 'service_invoices'
}

export default ServiceInvoices
