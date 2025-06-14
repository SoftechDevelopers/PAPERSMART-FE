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

// ** Custom Imports
import ViewClient from './ViewClient'
import EditClient from './EditClient'

const Clients = () => {
  // ** States
  const [value, setValue] = useState('View')
  const [selectedClient, setSelectedClient] = useState(null)
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
        const data = await apiRequest('get', '/dropdowns?tables=organization_business', null, {}, signal)

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
    setSelectedClient(null)
  }

  // ** Edit
  const handleEdit = row => {
    setSelectedClient(row)
    setValue('Edit')
  }

  return (
    <>
      <Grid container>
        <Box sx={{ width: '100%' }}>
          <TabContext value={value}>
            <TabList variant='scrollable' scrollButtons='auto' onChange={handleChange} aria-label='duty tabs'>
              <Tab value='View' label='View' />
              <Tab value='Edit' label='Edit' />
            </TabList>
            <Box sx={{ mt: 6 }}>
              <TabPanel sx={{ p: 0 }} value='View'>
                <ViewClient handleEdit={handleEdit} />
              </TabPanel>
              <TabPanel sx={{ p: 0 }} value='Edit'>
                <EditClient selectedClient={selectedClient} dropdown={dropdown} />
              </TabPanel>
            </Box>
          </TabContext>
        </Box>
      </Grid>
    </>
  )
}

export default Clients
