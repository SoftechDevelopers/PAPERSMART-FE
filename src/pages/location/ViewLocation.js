// ** React Imports
import { useState, useEffect, useContext, useMemo } from 'react'
import { useApi } from 'src/@core/api/useApi'

// ** MUI Imports
import { DataGrid } from '@mui/x-data-grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import IconButton from '@mui/material/IconButton'
import { Box, Button, Typography, Grid, InputAdornment, TextField } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Other Imports
import { AbilityContext } from 'src/layouts/components/acl/Can'
import useCustomToast from 'src/@core/hooks/useCustomToast'

const formatTime = time => {
  if (!time) return ''
  const date = new Date(`1970-01-01T${time}`)

  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
}

const columns = ({ canDelete, handleEdit, openDialog }) => [
  {
    field: 'sno',
    headerName: 'S.No',
    width: 80
  },
  {
    field: 'name',
    headerName: 'Name',
    width: 300,
    renderCell: params => (
      <div>
        <Typography variant='body1' style={{ fontSize: '15px' }}>
          {params.row.name}
        </Typography>
        <Typography variant='body2' style={{ fontStyle: 'italic', fontSize: '13px', color: '#FF69B4' }}>
          ({params.row.address})
        </Typography>{' '}
      </div>
    )
  },
  {
    field: 'latitude',
    headerName: 'Latitude',
    width: 200
  },
  {
    field: 'longitude',
    headerName: 'Longitude',
    width: 200
  },
  {
    field: 'time_in',
    headerName: 'Time In',
    width: 150,
    renderCell: params => (
      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <Icon icon='iconoir:log-in' style={{ color: '#3CB371' }} />
        {formatTime(params.value)}
      </span>
    )
  },
  {
    field: 'time_out',
    headerName: 'Time Out',
    width: 150,
    renderCell: params => (
      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        {formatTime(params.value)}
        <Icon icon='ic:round-log-out' style={{ color: '#E74C3C' }} />
      </span>
    )
  },
  {
    field: 'actions',
    headerName: 'Actions',
    width: 150,
    sortable: false,
    filterable: false,
    renderCell: params => (
      <div>
        <IconButton color='primary' onClick={() => handleEdit(params.row)}>
          <Icon icon='tdesign:edit' />
        </IconButton>
        {canDelete && (
          <IconButton
            color='error'
            onClick={() => {
              openDialog('delete', params.row)
            }}
          >
            <Icon icon='mdi:delete-outline' />
          </IconButton>
        )}
      </div>
    )
  }
]

const ViewLocation = ({ handleEdit }) => {
  // ** States
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState({ fetchAll: false, deleteData: false })
  const [isDialogOpen, setDialogOpen] = useState({ delete: false })
  const [searchKey, setSearchKey] = useState('')

  const { apiRequest } = useApi()
  const ability = useContext(AbilityContext)
  const canDelete = ability.can('delete', 'location')
  const [selectedLocation, setSelectedLocation] = useState(null)
  const { showSuccessToast, showErrorToast } = useCustomToast()

  // ** Abort Controller
  const controller = new AbortController()
  const signal = controller.signal

  // ** Fetch all
  const fetchLocations = async () => {
    try {
      setLoading(prev => ({ ...prev, fetchAll: true }))
      const data = await apiRequest('get', '/locations', null, {}, signal)

      const locationsWithSerial = data.map((location, index) => ({
        ...location,
        sno: index + 1
      }))
      setLocations(locationsWithSerial)
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
    fetchLocations()

    return () => {
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ** Open dialog
  const openDialog = (dialog, row) => {
    setSelectedLocation(row)
    setDialogOpen(prev => ({ ...prev, [dialog]: true }))
  }

  // ** Close dialog
  const closeDialog = dialog => {
    setSelectedLocation(null)
    setDialogOpen(prev => ({ ...prev, [dialog]: false }))
  }

  // ** Delete an entry
  const handleDelete = async () => {
    try {
      setLoading(prev => ({ ...prev, deleteData: true }))
      const response = await apiRequest('delete', `/location/${selectedLocation?.id}`, null, {}, signal)
      showSuccessToast(response?.message, 5000)
      fetchLocations()
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted')
      } else {
        const message = error?.response?.data?.message ?? 'Error while deleting the location'
        showErrorToast(message, 5000)
      }
    } finally {
      setLoading(prev => ({ ...prev, deleteData: false }))
      closeDialog('delete')
    }
  }

  // ** Handle search key change
  const handleSearchChange = e => {
    setSearchKey(e.target.value)
  }

  // ** Filter locations according to search key
  const filteredLocations = useMemo(() => {
    return locations
      ?.filter(l => l.address.toLowerCase().includes(searchKey.toLowerCase()))
      .map((location, index) => ({
        ...location,
        sno: index + 1
      }))
  }, [locations, searchKey])

  return (
    <Card>
      <CardHeader sx={{ pb: 5 }} title='Locations' titleTypographyProps={{ variant: 'h6' }} />
      <CardContent>
        <Grid item xs={12}>
          <TextField
            value={searchKey}
            fullWidth
            label='Search'
            onChange={handleSearchChange}
            placeholder='Search by address...'
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <Icon icon='mdi:magnify' />
                </InputAdornment>
              )
            }}
          />
        </Grid>
        <Box sx={{ height: 'calc(60vh)', width: '100%', marginTop: 6 }}>
          <DataGrid
            rows={filteredLocations}
            columns={columns({ canDelete, handleEdit, openDialog })}
            loading={loading['fetchAll']}
          />
        </Box>
      </CardContent>
      <Dialog
        open={isDialogOpen['delete']}
        onClose={() => closeDialog('delete')}
        aria-labelledby='alert-dialog-title'
        aria-describedby='alert-dialog-description'
      >
        <DialogTitle id='alert-dialog-title'>{'Delete Location'}</DialogTitle>
        <DialogContent>
          <DialogContentText id='alert-dialog-description'>
            Are you sure you want to delete this location?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => closeDialog('delete')} sx={{ color: 'error.main' }}>
            No
          </Button>
          <LoadingButton
            onClick={handleDelete}
            autoFocus
            loading={loading['deleteData']}
            loadingPosition='start'
            startIcon={<Icon icon='mdi:tick' />}
          >
            Yes
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Card>
  )
}

export default ViewLocation
