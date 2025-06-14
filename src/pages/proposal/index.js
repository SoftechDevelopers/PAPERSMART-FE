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
import ViewProposal from './ViewProposal'
import EditProposal from './EditProposal'
import ManageProposalTemplate from './ManageProposalTemplate'

const ProposalTemplate = () => {
  // ** States
  const [value, setValue] = useState('View')
  const [selectedProposal, setSelectedProposal] = useState(null)
  const [dropdown, setDropdown] = useState({})

  // ** Abort Controller
  const controller = new AbortController()
  const signal = controller.signal

  // ** Custom Hooks
  const { apiRequest } = useApi()

  // ** Fetch dropdowns
  useEffect(() => {
    fetchDropdowns()

    return () => {
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchDropdowns = async () => {
    try {
      const data = await apiRequest('get', '/dropdowns?tables=proposal_type,item,client,note,bank', null, {}, signal)
      setDropdown(data)
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted')
      } else {
        console.error(error)
      }
    }
  }

  // ** Tab change
  const handleChange = (_, activeTab) => {
    setValue(activeTab)
    setSelectedProposal(null)
  }

  // ** Edit
  const handleEdit = row => {
    setSelectedProposal(row)
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
              <Tab value='Template' label='Template' icon={<Icon icon='material-symbols:settings-outline' />} />
            </TabList>
            <Box sx={{ mt: 6 }}>
              <TabPanel sx={{ p: 0 }} value='View'>
                <ViewProposal dropdown={dropdown} handleEdit={handleEdit} />
              </TabPanel>
              <TabPanel sx={{ p: 0 }} value='Edit'>
                <EditProposal dropdown={dropdown} selectedProposal={selectedProposal} />
              </TabPanel>
              <TabPanel sx={{ p: 0 }} value='Template'>
                <ManageProposalTemplate dropdownData={{ dropdown, fetchDropdowns }} />
              </TabPanel>
            </Box>
          </TabContext>
        </Box>
      </Grid>
    </>
  )
}

ProposalTemplate.acl = {
  action: 'view',
  subject: 'proposal_templates'
}

export default ProposalTemplate
