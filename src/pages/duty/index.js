// ** React Imports
import { useState, useEffect, useContext } from 'react'
import { useApi } from 'src/@core/api/useApi'

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
import ViewDuty from './ViewDuty'
import EditDuty from './EditDuty'
import DutySummary from '../duty/DutySummary'

// ** Other Imports
import { AbilityContext } from 'src/layouts/components/acl/Can'

const Duty = () => {
  // ** States
  const [value, setValue] = useState('View')
  const [selectedDuty, setSelectedDuty] = useState(null)
  const [dropdown, setDropdown] = useState({})
  const ability = useContext(AbilityContext)
  const canRead = ability.can('view', 'duty_summary')

  // ** Abort Controller
  const controller = new AbortController()
  const signal = controller.signal

  // ** Custom Hooks
  const { apiRequest } = useApi()

  // ** Fetch dropdowns
  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const data = await apiRequest('get', '/dropdowns?tables=technician', null, {}, signal)
        setDropdown(data)
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log('Fetch aborted')
        } else {
          console.error(error)
        }
      }
    }

    fetchDropdowns()

    return () => {
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ** Tab change
  const handleChange = (_, activeTab) => {
    setValue(activeTab)
    setSelectedDuty(null)
  }

  // ** Edit
  const handleEdit = row => {
    setSelectedDuty(row)
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
              {value === 'Edit' && <Tab value='Edit' label='Edit' icon={<Icon icon='tdesign:edit' />} />}
              {canRead && <Tab value='Summary' label='Summary' icon={<Icon icon='solar:bill-list-linear' />} />}
            </TabList>
            <Box sx={{ mt: 6 }}>
              <TabPanel sx={{ p: 0 }} value='View'>
                <ViewDuty handleEdit={handleEdit} dropdown={dropdown} />
              </TabPanel>
              <TabPanel sx={{ p: 0 }} value='Edit'>
                <EditDuty selectedDuty={selectedDuty} dropdown={dropdown} />
              </TabPanel>
              <TabPanel sx={{ p: 0 }} value='Summary'>
                <DutySummary />
              </TabPanel>
            </Box>
          </TabContext>
        </Box>
      </Grid>
    </>
  )
}

Duty.acl = {
  action: 'view',
  subject: 'duties'
}

export default Duty
