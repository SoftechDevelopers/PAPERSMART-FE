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
import ViewTicket from './ViewTicket'
import EditTicket from './EditTicket'
import TicketDetails from './TicketDetails'

const Ticket = () => {
  // ** States
  const [value, setValue] = useState('View')
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [dropdown, setDropdown] = useState({})

  // ** Custom Hooks
  const { apiRequest } = useApi()

  // ** Abort Controller
  const controller = new AbortController()
  const signal = controller.signal

  // ** Fetch dropdowns
  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const data = await apiRequest(
          'get',
          '/dropdowns?tables=client,ticket_category,ticket_type,technician',
          null,
          {},
          signal
        )

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
    setSelectedTicket(null)
  }

  // ** Edit
  const handleEdit = row => {
    setSelectedTicket(row)
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
              aria-label='ticket tabs'
              sx={{ borderBottom: theme => `1px solid ${theme.palette.divider}` }}
            >
              <Tab value='View' label='View' icon={<Icon icon='majesticons:eye-line' />} />
              <Tab value='Edit' label='Edit' icon={<Icon icon='tdesign:edit' />} />
              <Tab value='Details' label='Details' icon={<Icon icon='gg:details-more' />} />
            </TabList>
            <Box sx={{ mt: 6 }}>
              <TabPanel sx={{ p: 0 }} value='View'>
                <ViewTicket handleEdit={handleEdit} dropdown={dropdown} />
              </TabPanel>
              <TabPanel sx={{ p: 0 }} value='Edit'>
                <EditTicket selectedTicket={selectedTicket} dropdown={dropdown} />
              </TabPanel>
              <TabPanel sx={{ p: 0 }} value='Details'>
                <TicketDetails dropdown={dropdown} />
              </TabPanel>
            </Box>
          </TabContext>
        </Box>
      </Grid>
    </>
  )
}

Ticket.acl = {
  action: 'view',
  subject: 'tickets'
}

export default Ticket
