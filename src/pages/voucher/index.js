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
import ViewVoucher from './ViewVoucher'
import EditVoucher from './EditVoucher'
import EditRecipient from './EditRecipient'
import EditExpenseHead from './EditExpenseHead'

const Voucher = () => {
  // ** States
  const [value, setValue] = useState('View')
  const [selectedVoucher, setSelectedVoucher] = useState(null)

  // ** Tab change
  const handleChange = (_, activeTab) => {
    setValue(activeTab)
    setSelectedVoucher(null)
  }

  // ** Edit
  const handleEdit = row => {
    setSelectedVoucher(row)
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
              aria-label='tabs'
              sx={{ borderBottom: theme => `1px solid ${theme.palette.divider}` }}
            >
              <Tab value='View' label='View' icon={<Icon icon='majesticons:eye-line' />} />
              <Tab value='Edit' label='Edit' icon={<Icon icon='tdesign:edit' />} />
              <Tab value='Recipient' label='Recipient' icon={<Icon icon='material-symbols:person-add-outline' />} />
              <Tab value='Head' label='Expense Head' icon={<Icon icon='ri:money-rupee-circle-line' />} />
            </TabList>
            <Box sx={{ mt: 6 }}>
              <TabPanel sx={{ p: 0 }} value='View'>
                <ViewVoucher handleEdit={handleEdit} />
              </TabPanel>
              <TabPanel sx={{ p: 0 }} value='Edit'>
                <EditVoucher selectedVoucher={selectedVoucher} />
              </TabPanel>
              <TabPanel sx={{ p: 0 }} value='Recipient'>
                <EditRecipient />
              </TabPanel>
              <TabPanel sx={{ p: 0 }} value='Head'>
                <EditExpenseHead />
              </TabPanel>
            </Box>
          </TabContext>
        </Box>
      </Grid>
    </>
  )
}

Voucher.acl = {
  action: 'view',
  subject: 'expenses'
}

export default Voucher
