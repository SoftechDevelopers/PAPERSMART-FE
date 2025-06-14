// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Grid from '@mui/material/Grid'
import Tab from '@mui/material/Tab'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'
import { Box } from '@mui/material'

// ** Custom Imports
import ViewContract from './ViewContract'
import EditContract from './EditContract'

const Contract = () => {
  // ** States
  const [value, setValue] = useState('View')
  const [selectedContract, setSelectedContract] = useState(null)

  // ** Tab change
  const handleChange = (_, activeTab) => {
    setValue(activeTab)
    setSelectedContract(null)
  }

  // ** Edit
  const handleEdit = row => {
    setSelectedContract(row)
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
                <ViewContract handleEdit={handleEdit} />
              </TabPanel>
              <TabPanel sx={{ p: 0 }} value='Edit'>
                <EditContract selectedContract={selectedContract} />
              </TabPanel>
            </Box>
          </TabContext>
        </Box>
      </Grid>
    </>
  )
}

export default Contract
