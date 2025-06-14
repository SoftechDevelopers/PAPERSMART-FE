// React Imports
import { useState, useContext, useEffect } from 'react'
import { useApi } from 'src/@core/api/useApi'

// ** MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import { Autocomplete, TextField, Box, Chip, LinearProgress, Button } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'

// ** Other Imports
import useCustomToast from 'src/@core/hooks/useCustomToast'
import { AbilityContext } from 'src/layouts/components/acl/Can'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

const EditWorkLocation = () => {
  // ** States
  const [workLocations, setWorkLocations] = useState([])
  const [staff, setStaff] = useState(null)
  const [location, setLocation] = useState(null)
  const [loading, setLoading] = useState({ dropdown: false, fetchAll: false, deleteData: false, addData: false })
  const [isDialogOpen, setDialogOpen] = useState({ delete: false })
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const [dropdown, setDropdown] = useState({})
  const staffList = dropdown?.staff || []
  const locationList = dropdown?.location || []
  const [selectedLocation, setSelectedLocation] = useState(null)

  const ability = useContext(AbilityContext)
  const canCreate = ability.can('create', 'work')
  const canDelete = ability.can('delete', 'work')
  const { apiRequest } = useApi()

  // ** Abort Controller
  const controller = new AbortController()
  const signal = controller.signal

  // ** Fetch dropdowns
  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        setLoading(prev => ({ ...prev, dropdown: true }))
        const data = await apiRequest('get', '/dropdowns?tables=staff,location', null, {}, signal)

        setDropdown(data)
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log('Fetch aborted')
        } else {
          console.error(error)
        }
      } finally {
        setLoading(prev => ({ ...prev, dropdown: false }))
      }
    }

    fetchDropdowns()

    return () => {
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ** Fetch all
  const fetchLocations = async () => {
    try {
      setLoading(prev => ({ ...prev, fetchAll: true }))
      const data = await apiRequest('get', '/work?id=' + staff, null, {}, signal)

      const attendancesModified = data.map(attendance => ({
        key: attendance?.id,
        label: attendance?.location
      }))

      setWorkLocations(attendancesModified)

      // setLocations(locationsWithSerial)
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
  }, [staff])

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

  // ** Delete location
  const handleDelete = async () => {
    try {
      setLoading(prev => ({ ...prev, deleteData: true }))
      const response = await apiRequest('delete', `/work/${selectedLocation?.key}`, null, {}, signal)
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

  // ** Add Location
  const handleAdd = async () => {
    if (!staff) {
      showErrorToast('No staff selected', 5000)

      return
    }

    try {
      setLoading(prev => ({ ...prev, addData: true }))

      const payload = {
        staff_id: staff,
        location_id: location
      }

      const data = await apiRequest('post', '/work', payload, {}, null)
      showSuccessToast(data?.message, 5000)
      fetchLocations()
    } catch (error) {
      if (error?.status === 409) {
        showErrorToast(error?.response?.data?.message, 5000)
      } else {
        showErrorToast('Error while processing the work location', 5000)
      }
    } finally {
      setLoading(prev => ({ ...prev, addData: false }))
    }
  }

  return (
    <Box>
      <Card>
        {loading['fetchAll'] && <LinearProgress sx={{ height: 2 }} />}
        <CardHeader sx={{ pb: 5 }} title='Staff' titleTypographyProps={{ variant: 'h6' }} />
        <CardContent>
          <Grid container spacing={6}>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                options={staffList}
                getOptionLabel={option => option?.name || ''}
                onChange={(_, data) => {
                  setStaff(data ? data.id : null)
                }}
                isOptionEqualToValue={(option, value) => option && value && option.id === value.id}
                renderInput={params => <TextField {...params} label='Staff' />}
                value={staffList.find(s => Number(s.id) === Number(staff)) || null}
                renderOption={(props, option) => (
                  <li {...props} key={option.id} style={{ display: 'flex', alignItems: 'center' }}>
                    <div>
                      <span style={{ color: '#ff4d49' }}>{`ID: ${option.id}`}</span>
                      <br />
                      <span>{`Name: ${option.name}`}</span>
                    </div>
                  </li>
                )}
                loading={loading['dropdown']}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      <Card sx={{ mt: 5 }}>
        <CardHeader sx={{ pb: 5 }} title='Work Locations' titleTypographyProps={{ variant: 'h6' }} />
        <CardContent>
          <Grid container spacing={6}>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                options={locationList}
                getOptionLabel={option => option?.name || ''}
                onChange={(_, data) => {
                  setLocation(data ? data.id : null)
                }}
                isOptionEqualToValue={(option, value) => option && value && option.id === value.id}
                renderInput={params => <TextField {...params} label='Location' />}
                value={locationList.find(s => Number(s.id) === Number(location)) || null}
                renderOption={(props, option) => (
                  <li {...props} key={option.id} style={{ display: 'flex', alignItems: 'center' }}>
                    <div>
                      <span style={{ color: '#ff4d49' }}>{`ID: ${option.id}`}</span>
                      <br />
                      <span>{`Name: ${option.name}`}</span>
                    </div>
                  </li>
                )}
                loading={loading['dropdown']}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box display='flex' justifyContent='flex-end'>
                <LoadingButton
                  onClick={handleAdd}
                  loading={loading['addData']}
                  loadingPosition='start'
                  startIcon={<Icon icon='mdi:location-add-outline' />}
                  variant='contained'
                  sx={{ mr: 2 }}
                  disabled={!canCreate || !location}
                >
                  Add Location
                </LoadingButton>
              </Box>
            </Grid>
          </Grid>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', marginTop: 5 }}>
            {workLocations?.map(data => (
              <Chip
                key={data.key}
                label={data.label}
                onDelete={canDelete ? () => openDialog('delete', data) : null}
                size='medium'
                color='primary'
              />
            ))}
          </Box>
        </CardContent>
      </Card>
      <Dialog
        open={isDialogOpen['delete']}
        onClose={() => closeDialog('delete')}
        aria-labelledby='alert-dialog-title'
        aria-describedby='alert-dialog-description'
      >
        <DialogTitle id='alert-dialog-title'>{'Delete Location'}</DialogTitle>
        <DialogContent>
          <DialogContentText id='alert-dialog-description'>
            Are you sure you want to delete this work location?
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
    </Box>
  )
}

export default EditWorkLocation
