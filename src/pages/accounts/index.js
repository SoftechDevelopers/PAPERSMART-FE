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
import ViewLedger from './ViewLedger'
import EditLedger from './EditLedger'

const Ledger = () => {
  // ** States
  const [value, setValue] = useState('View')
  const [selectedLedger, setSelectedLedger] = useState(null)

  // ** Tab change
  const handleChange = (_, activeTab) => {
    setValue(activeTab)
    setSelectedLedger(null)
  }

  // ** Edit
  const handleEdit = row => {
    setSelectedLedger(row)
    setValue('Edit')
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
              <Tab value='View' label='View' icon={<Icon icon='majesticons:eye-line' />} />
              <Tab value='Edit' label='Edit' icon={<Icon icon='tdesign:edit' />} />
            </TabList>
            <Box sx={{ mt: 6 }}>
              <TabPanel sx={{ p: 0 }} value='View'>
                <ViewLedger handleEdit={handleEdit} />
              </TabPanel>
              <TabPanel sx={{ p: 0 }} value='Edit'>
                <EditLedger selectedLedger={selectedLedger} />
              </TabPanel>
            </Box>
          </TabContext>
        </Box>
      </Grid>
    </>
  )
}

export default Ledger
