// ** React Imports
import { useState, useEffect, useContext, useMemo } from 'react'
import { useApi } from 'src/@core/api/useApi'

// ** MUI Imports
import { DataGrid } from '@mui/x-data-grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import IconButton from '@mui/material/IconButton'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import Button from '@mui/material/Button'
import { Chip, Box, Grid, InputLabel, Select } from '@mui/material'
import { TextField, InputAdornment, MenuItem, Typography } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import { styled } from '@mui/material/styles'
import FormControl from '@mui/material/FormControl'
import Avatar from '@mui/material/Avatar'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Other Imports
import { AbilityContext } from 'src/layouts/components/acl/Can'
import useCustomToast from 'src/@core/hooks/useCustomToast'

const TypographyStyled = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  fontSize: 14,
  cursor: 'pointer',
  textDecoration: 'none',
  color: theme.palette.text.primary,
  '&:hover': {
    color: theme.palette.primary.main
  }
}))

const columns = ({ permissions, actions }) => [
  {
    field: 'sno',
    headerName: 'S.No',
    width: 80
  },
  {
    field: 'staff',
    headerName: 'Staff',
    width: 250,
    renderCell: params => (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Avatar alt={params.row.name} src={params.row.photo_url} />
        <Box sx={{ display: 'flex', flexDirection: 'column', marginLeft: 2 }}>
          <TypographyStyled onClick={() => actions.handleAttachment(params.row)}>{params.row.name}</TypographyStyled>
          <span style={{ fontSize: 'smaller', color: '#FF69B4', fontStyle: 'italic' }}>({params.row.father})</span>
        </Box>
      </Box>
    )
  },
  {
    field: 'contact',
    headerName: 'Contact',
    width: 250,
    renderCell: params => (
      <Box sx={{ display: 'flex', flexDirection: 'column', marginLeft: 2 }}>
        <Box sx={{ display: 'flex' }}>
          <Icon icon='ic:baseline-phone' color='#4CAF50' />
          {params.row.phone}
        </Box>
        <span style={{ fontSize: 'smaller' }}>{params.row.email}</span>
      </Box>
    )
  },
  {
    field: 'designation',
    headerName: 'Designation',
    width: 250,
    renderCell: params => (
      <Box sx={{ display: 'flex', flexDirection: 'column', marginLeft: 2 }}>{params?.row?.designation?.name}</Box>
    )
  },
  {
    field: 'account',
    headerName: 'Account No',
    width: 200
  },
  {
    field: 'doj',
    headerName: 'DOJ',
    width: 150,
    renderCell: params => <Chip label={params.row.doj} color='primary' variant='outlined' />
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
            actions.handleEdit(params.row)
          }}
        >
          <Icon icon='tdesign:edit' />
        </IconButton>
        {permissions.canDelete && (
          <IconButton
            color='error'
            onClick={() => {
              actions.openDialog('delete', params.row)
            }}
          >
            <Icon icon='mdi:delete-outline' />
          </IconButton>
        )}
        {permissions.canEdit && (
          <IconButton
            color='secondary'
            onClick={() => {
              actions.openDialog('exit', params.row)
            }}
          >
            <Icon icon='ci:exit' />
          </IconButton>
        )}
      </div>
    )
  }
]

const ViewStaff = ({ handleEdit }) => {
  // ** States
  const [staffs, setStaffs] = useState([])
  const [loading, setLoading] = useState({ fetchAll: false, deleteData: false, exit: false })
  const [isDialogOpen, setDialogOpen] = useState({ delete: false, exit: false })
  const [selectedStaff, setSelectedStaff] = useState(null)
  const statuses = ['Working', 'Resigned', 'Terminated']
  const [status, setStatus] = useState(statuses[0])
  const [searchKey, setSearchKey] = useState('')

  const { apiRequest } = useApi()
  const ability = useContext(AbilityContext)
  const canDelete = ability.can('delete', 'staff')
  const canEdit = ability.can('edit', 'staff')
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const [exitDate, setExitDate] = useState(dayjs())
  const exitTypes = ['Resigned', 'Terminated']
  const [exitType, setExitType] = useState(exitTypes[0])

  // ** Abort Controller
  const controller = new AbortController()
  const signal = controller.signal

  // ** Fetch all staff
  const fetchStaff = async () => {
    try {
      setLoading(prev => ({ ...prev, fetchAll: true }))
      const data = await apiRequest('get', '/staffs', null, {}, signal)

      const staffsWithSerial = data.map((staff, index) => ({
        ...staff,
        sno: index + 1
      }))
      setStaffs(staffsWithSerial)
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
    fetchStaff()

    return () => {
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ** Filter staff array according to search key
  const filteredStaffs = useMemo(() => {
    return staffs
      ?.filter(
        s => s.status.toLowerCase() === status.toLowerCase() && s.name.toLowerCase().includes(searchKey.toLowerCase())
      )
      .map((staff, index) => ({
        ...staff,
        sno: index + 1
      }))
  }, [staffs, status, searchKey])

  // ** Download attachment
  const handleAttachment = row => {
    let pdfUrl = row.docs_url

    if (pdfUrl) {
      pdfUrl += `?t=${new Date().getTime()}`
      window.open(pdfUrl, '_blank')
    } else {
      console.error('No documents available for this staff')
    }
  }

  // ** Open dialog
  const openDialog = (dialog, row) => {
    if (dialog === 'exit') {
      setExitDate(dayjs())
      setExitType(exitTypes[0])
    }
    setSelectedStaff(row)
    setDialogOpen(prev => ({ ...prev, [dialog]: true }))
  }

  // ** Close dialog
  const closeDialog = dialog => {
    setSelectedStaff(null)
    setDialogOpen(prev => ({ ...prev, [dialog]: false }))
  }

  // ** Delete staff
  const handleDelete = async () => {
    try {
      setLoading(prev => ({ ...prev, deleteData: true }))
      const response = await apiRequest('delete', `/staff/${selectedStaff?.id}`, null, {}, signal)
      showSuccessToast(response?.message, 5000)
      fetchStaff()
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted')
      } else {
        const message = error?.response?.data?.message ?? 'Error while deleting the staff'
        showErrorToast(message, 5000)
      }
    } finally {
      setLoading(prev => ({ ...prev, deleteData: false }))
      closeDialog('delete')
    }
  }

  const handleExit = async () => {
    {
      try {
        if (exitDate && dayjs(exitDate).isValid()) {
          setLoading(prev => ({ ...prev, exit: true }))
          const dor = dayjs(exitDate)
          const payload = { id: selectedStaff?.id, date: dor.format('YYYY-MM-DD'), status: exitType, _method: 'PATCH' }
          const response = await apiRequest('post', `/staff`, payload, {}, signal)
          showSuccessToast(response?.message, 5000)
          fetchStaff()
        } else {
          showErrorToast('Invalid Date', 5000)
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log('Fetch aborted')
        } else {
          const message = error?.response?.data?.message ?? 'Error while updating the staff'
          showErrorToast(message, 5000)
        }
      } finally {
        setLoading(prev => ({ ...prev, exit: false }))
        closeDialog('exit')
      }
    }
  }

  return (
    <Card>
      <CardHeader sx={{ pb: 5 }} title='Staff' titleTypographyProps={{ variant: 'h6' }} />
      <CardContent>
        <Grid container spacing={6}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                label='Status'
                value={status}
                onChange={e => {
                  setStatus(e.target.value)
                }}
              >
                {statuses.map(item => (
                  <MenuItem key={item} value={item}>
                    {item}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              value={searchKey}
              fullWidth
              label='Search'
              onChange={e => setSearchKey(e.target.value)}
              placeholder='Search by name...'
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <Icon icon='mdi:magnify' />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
        </Grid>
        <Box sx={{ height: 'calc(60vh)', width: '100%', marginTop: 6 }}>
          <DataGrid
            rows={filteredStaffs}
            columns={columns({
              permissions: { canDelete, canEdit },
              actions: { handleAttachment, handleEdit, openDialog }
            })}
            loading={loading['fetchAll']}
            disableRowSelectionOnClick
          />
        </Box>
        <Dialog
          open={isDialogOpen['delete']}
          onClose={() => closeDialog('delete')}
          aria-labelledby='alert-dialog-title'
          aria-describedby='alert-dialog-description'
        >
          <DialogTitle id='alert-dialog-title'>{'Delete Staff'}</DialogTitle>
          <DialogContent>
            <DialogContentText id='alert-dialog-description'>
              Are you sure you want to delete this staff?
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
        <Dialog
          open={isDialogOpen['exit']}
          onClose={() => closeDialog('exit')}
          aria-labelledby='alert-dialog-title'
          aria-describedby='alert-dialog-description'
        >
          <DialogTitle id='alert-dialog-title'>{'Staff Exit'}</DialogTitle>
          <DialogContent>
            <Box sx={{ padding: 1, marginTop: 1, width: 300 }}>
              <Grid container spacing={6}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        label='Exit Date'
                        value={exitDate}
                        onChange={newValue => setExitDate(newValue)}
                        format='DD-MM-YYYY'
                      />
                    </LocalizationProvider>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Exit Type</InputLabel>
                    <Select
                      label='Exit Type'
                      value={exitType}
                      onChange={e => {
                        setExitType(e.target.value)
                      }}
                    >
                      {exitTypes.map(type => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => closeDialog('exit')} sx={{ color: 'error.main' }}>
              No
            </Button>
            <LoadingButton
              onClick={handleExit}
              autoFocus
              loading={loading['exit']}
              loadingPosition='start'
              startIcon={<Icon icon='mdi:tick' />}
            >
              Yes
            </LoadingButton>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  )
}

export default ViewStaff
