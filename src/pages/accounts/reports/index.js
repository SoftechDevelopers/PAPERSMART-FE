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
import AccountStatement from './AccountStatement'
import LedgerSummary from './LedgerSummary'

const LedgerReports = () => {
  // ** States
  const [value, setValue] = useState('Statement')

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
            <Tab value='Statement' label='Statement' icon={<Icon icon='lsicon:report-outline' />} />
            <Tab value='Summary' label='Balance' icon={<Icon icon='vaadin:cash' />} />
          </TabList>
          <Box sx={{ mt: 6 }}>
            <TabPanel sx={{ p: 0 }} value='Statement'>
              <AccountStatement />
            </TabPanel>
            <TabPanel sx={{ p: 0 }} value='Summary'>
              <LedgerSummary />
            </TabPanel>
          </Box>
        </TabContext>
      </Box>
    </Grid>
  )
}

LedgerReports.acl = {
  action: 'view',
  subject: 'ledger_statement'
}

export default LedgerReports
