// ** React Imports
import { useState, useEffect, useContext } from 'react'
import { useApi } from 'src/@core/api/useApi'

// ** MUI Imports
import { DataGrid } from '@mui/x-data-grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import IconButton from '@mui/material/IconButton'
import { Box } from '@mui/material'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

const columns = ({ handleEdit }) => [
  {
    field: 'sno',
    headerName: 'S.No',
    width: 80
  },
  {
    field: 'name',
    headerName: 'Name',
    width: 300
  },
  {
    field: 'district',
    headerName: 'District',
    width: 250
  },
  {
    field: 'contact',
    headerName: 'Contact',
    width: 250
  },
  {
    field: 'email',
    headerName: 'email',
    width: 350
  },
  {
    field: 'actions',
    headerName: 'Actions',
    width: 150,
    sortable: false,
    filterable: false,
    renderCell: params => (
      <div>
        <IconButton
          color='primary'
          onClick={() => {
            handleEdit(params.row)
          }}
        >
          <Icon icon='tdesign:edit' />
        </IconButton>
      </div>
    )
  }
]

const ViewOrganization = ({ handleEdit }) => {
  // ** States
  const [organizations, setOrganizations] = useState([])
  const [loading, setLoading] = useState({ fetchAll: false, deleteData: false })

  const { apiRequest } = useApi()

  // ** Abort Controller
  const controller = new AbortController()
  const signal = controller.signal

  // ** Fetch all
  const fetchOrganizations = async () => {
    try {
      setLoading(prev => ({ ...prev, fetchAll: true }))

      const data = await apiRequest('get', '/organizations', null, {}, signal)

      const organizationsWithSerial = data.map((duty, index) => ({
        ...duty,
        sno: index + 1
      }))
      setOrganizations(organizationsWithSerial)
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted')
      } else {
        console.error(error)
      }
    } finally {
      setLoading(prev => ({ ...prev, fetchAll: false }))
    }
  }

  useEffect(() => {
    fetchOrganizations()

    return () => {
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Card>
      <CardHeader sx={{ pb: 5 }} title='Organizations' titleTypographyProps={{ variant: 'h6' }} />
      <CardContent>
        <Box sx={{ height: 'calc(60vh)', width: '100%', marginTop: 6 }}>
          <DataGrid
            rows={organizations}
            columns={columns({ handleEdit })}
            loading={loading['fetchAll']}
            disableRowSelectionOnClick
          />
        </Box>
      </CardContent>
    </Card>
  )
}

export default ViewOrganization
