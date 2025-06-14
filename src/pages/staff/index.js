// ** React Imports
import { useState, useEffect } from 'react'
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
import ViewStaff from './ViewStaff'
import EditStaff from './EditStaff'
import MergePDF from './MergePDF'
import EditWorkLocation from './EditWorkLocation'

const Staff = () => {
  // ** States
  const [value, setValue] = useState('View')
  const [selectedStaff, setSelectedStaff] = useState(null)
  const [dropdown, setDropdown] = useState({})

  // ** Abort Controller
  const controller = new AbortController()
  const signal = controller.signal

  // ** Custom Hooks
  const { apiRequest } = useApi()

  // ** Fetch dropdowns
  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const data = await apiRequest('get', '/dropdowns?tables=designation,staff', null, {}, signal)

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
    setSelectedStaff(null)
  }

  // ** Edit
  const handleEdit = row => {
    setSelectedStaff(row)
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
              aria-label='staff tabs'
              sx={{ borderBottom: theme => `1px solid ${theme.palette.divider}` }}
            >
              <Tab value='View' label='View' icon={<Icon icon='majesticons:eye-line' />} />
              <Tab value='Edit' label='Edit' icon={<Icon icon='tdesign:edit' />} />
              <Tab value='Merge' label='Merge' icon={<Icon icon='jam:merge-f' />} />
              <Tab value='Work' label='Work Location' icon={<Icon icon='gridicons:location' />} />
            </TabList>
            <Box sx={{ mt: 6 }}>
              <TabPanel sx={{ p: 0 }} value='View'>
                <ViewStaff handleEdit={handleEdit} />
              </TabPanel>
              <TabPanel sx={{ p: 0 }} value='Edit'>
                <EditStaff selectedStaff={selectedStaff} dropdown={dropdown} />
              </TabPanel>
              <TabPanel sx={{ p: 0 }} value='Merge'>
                <MergePDF />
              </TabPanel>
              <TabPanel sx={{ p: 0 }} value='Work'>
                <EditWorkLocation />
              </TabPanel>
            </Box>
          </TabContext>
        </Box>
      </Grid>
    </>
  )
}

Staff.acl = {
  action: 'view',
  subject: 'staffs'
}

export default Staff
