// ** React Imports
import { useState, useEffect, useContext, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
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
import { Chip, Box, Grid, TextField, InputAdornment } from '@mui/material'
import { Autocomplete, Typography } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import { styled } from '@mui/material/styles'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Other Imports
import { AbilityContext } from 'src/layouts/components/acl/Can'
import useCustomToast from 'src/@core/hooks/useCustomToast'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'

const TypographyStyled = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  cursor: 'pointer',
  textDecoration: 'none',
  color: theme.palette.text.primary,
  '&:hover': {
    color: theme.palette.primary.main
  }
}))

const columns = ({ handleEdit, openDialog, handleAttachment, canDelete, canCreate }) => [
  {
    field: 'sno',
    headerName: 'S.No',
    width: 80
  },
  {
    field: 'date',
    headerName: 'Date',
    width: 120
  },
  {
    field: 'client_name',
    headerName: 'Client',
    width: 230,
    renderCell: params => (
      <Box>
        {canCreate ? (
          <TypographyStyled variant='body2' onClick={() => openDialog('duty', params.row)}>
            {params.value}
          </TypographyStyled>
        ) : (
          <Typography>{params.value}</Typography>
        )}
      </Box>
    )
  },
  {
    field: 'category_name',
    headerName: 'Category',
    width: 150
  },
  {
    field: 'type_name',
    headerName: 'Type',
    width: 200,
    renderCell: params =>
      params.value === 'Parts Request' ? (
        <Chip
          label='Parts Request'
          color='primary'
          variant='outlined'
          style={{ cursor: 'pointer' }}
          onClick={() => handleAttachment(params.row)}
        />
      ) : (
        <span>{params.value}</span>
      )
  },
  {
    field: 'comment',
    headerName: 'Comment',
    width: 400
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

const schema = yup.object().shape({
  date: yup.date().typeError('Invalid date'),
  staff: yup.string().required('Staff is required'),
  distance: yup.number().typeError('Distance must be a valid number')
})

const ViewTicket = ({ handleEdit, dropdown }) => {
  // ** States
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState({ fetchAll: false, deleteData: false, addDuty: false })
  const [isDialogOpen, setDialogOpen] = useState({ delete: false, duty: false })
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [searchKey, setSearchKey] = useState('')
  const technicianList = dropdown?.technician || []

  const { apiRequest } = useApi()
  const ability = useContext(AbilityContext)
  const canDelete = ability.can('delete', 'ticket')
  const canCreate = ability.can('create', 'duty')
  const { showSuccessToast, showErrorToast } = useCustomToast()

  // ** Form
  const defaultValues = {
    date: dayjs(),
    staff: null,
    distance: ''
  }

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors }
  } = useForm({ defaultValues, resolver: yupResolver(schema) })

  // ** Abort Controller
  const controller = new AbortController()
  const signal = controller.signal

  // ** Fetch all tickets
  const fetchTickets = async () => {
    try {
      setLoading(prev => ({ ...prev, fetchAll: true }))
      const data = await apiRequest('get', '/tickets', null, {}, signal)

      const ticketsWithSerial = data.map((ticket, index) => ({
        ...ticket,
        sno: index + 1
      }))
      setTickets(ticketsWithSerial)
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
    fetchTickets()

    return () => {
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ** Delete an entry
  const handleDelete = async () => {
    try {
      setLoading(prev => ({ ...prev, deleteData: true }))
      const response = await apiRequest('delete', `/ticket/${selectedTicket?.id}`, null, {}, signal)
      showSuccessToast(response?.message, 5000)
      fetchTickets()
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted')
      } else {
        const message = error?.response?.data?.message ?? 'Error while deleting the ticket'
        showErrorToast(message, 5000)
      }
    } finally {
      setLoading(prev => ({ ...prev, deleteData: false }))
      closeDialog('delete')
    }
  }

  // ** Open dialog
  const openDialog = (dialog, row) => {
    if (dialog === 'duty') {
      reset()
    }
    setSelectedTicket(row)
    setDialogOpen(prev => ({ ...prev, [dialog]: true }))
  }

  // ** Close dialog
  const closeDialog = dialog => {
    if (dialog === 'delete') {
      setSelectedTicket(null)
    }
    setDialogOpen(prev => ({ ...prev, [dialog]: false }))
  }

  // ** Download attachment
  const handleAttachment = row => {
    const pdfUrl = row.docs_url

    if (pdfUrl) {
      window.open(pdfUrl, '_blank')
    } else {
      console.error('No PDF URL available for this ticket')
    }
  }

  // ** Handle search key change
  const handleSearchChange = e => {
    setSearchKey(e.target.value)
  }

  // ** Filter tickets array according to search key
  const filteredTickets = useMemo(() => {
    return tickets
      ?.filter(t => t.client_name.toLowerCase().includes(searchKey.toLowerCase()))
      .map((ticket, index) => ({
        ...ticket,
        sno: index + 1
      }))
  }, [tickets, searchKey])

  // ** Submit
  const onSubmit = async formData => {
    const date = dayjs(formData.date)

    const payload = {
      ...formData,
      date: date.format('YYYY-MM-DD'),
      staff_id: formData.staff,
      ticket_id: selectedTicket?.id
    }

    try {
      setLoading(prev => ({ ...prev, addDuty: true }))
      const data = await apiRequest('post', '/duty', payload, {}, null)
      showSuccessToast(data?.message, 5000)
    } catch (error) {
      if (error?.status === 409) {
        showErrorToast(error?.response?.data?.message, 5000)
      } else {
        showErrorToast('Error while processing the duty', 5000)
      }
    } finally {
      setLoading(prev => ({ ...prev, addDuty: false }))
      closeDialog('duty')
    }
  }

  return (
    <Card>
      <CardHeader sx={{ pb: 5 }} title='Tickets' titleTypographyProps={{ variant: 'h6' }} />
      <CardContent>
        <Grid item xs={12}>
          <TextField
            value={searchKey}
            fullWidth
            label='Search'
            onChange={handleSearchChange}
            placeholder='Search by client...'
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
            rows={filteredTickets}
            columns={columns({
              handleEdit,
              openDialog,
              handleAttachment,
              canDelete,
              canCreate
            })}
            loading={loading['fetchAll']}
            disableRowSelectionOnClick
          />
        </Box>
      </CardContent>
      <Dialog
        open={isDialogOpen['delete']}
        onClose={() => closeDialog('delete')}
        aria-labelledby='alert-dialog-title'
        aria-describedby='alert-dialog-description'
      >
        <DialogTitle id='alert-dialog-title'>{'Delete Ticket'}</DialogTitle>
        <DialogContent>
          <DialogContentText id='alert-dialog-description'>
            Are you sure you want to delete this ticket?
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
        open={isDialogOpen['duty']}
        onClose={() => closeDialog('duty')}
        aria-labelledby='duty-dialog-title'
        aria-describedby='duty-dialog-description'
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle id='duty-dialog-title'>{'Add Duty'}</DialogTitle>
          <DialogContent>
            <Box sx={{ padding: 1, marginTop: 1, width: { sm: 300, xl: 400 } }}>
              <Grid container spacing={6}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <Controller
                        name='date'
                        control={control}
                        render={({ field: { onChange, onBlur, value } }) => (
                          <DatePicker
                            label='Date'
                            value={value}
                            onChange={onChange}
                            onBlur={onBlur}
                            minDate={dayjs()}
                            slotProps={{
                              textField: {
                                error: Boolean(errors.date)
                              }
                            }}
                            format='DD-MM-YYYY'
                          />
                        )}
                      />
                    </LocalizationProvider>
                    {errors.date && <FormHelperText sx={{ color: 'error.main' }}>{errors.date.message}</FormHelperText>}
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <Controller
                      name='staff'
                      control={control}
                      render={({ field }) => (
                        <Autocomplete
                          {...field}
                          options={technicianList}
                          getOptionLabel={option => option?.name || ''}
                          onChange={(_, data) => {
                            field.onChange(data ? data.id : null)
                          }}
                          isOptionEqualToValue={(option, value) => option && value && option.id === value.id}
                          renderInput={params => <TextField {...params} label='Staff' error={Boolean(errors.staff)} />}
                          value={technicianList.find(staff => staff.id === Number(field.value)) || null}
                          renderOption={(props, option) => (
                            <li {...props} key={option.id} style={{ display: 'flex', alignItems: 'center' }}>
                              <div>
                                <span style={{ color: '#ff4d49' }}>{`ID: ${option.id}`}</span>
                                <br />
                                <span>{`Name: ${option.name}`}</span>
                              </div>
                            </li>
                          )}
                        />
                      )}
                    />
                    {errors.staff && (
                      <FormHelperText sx={{ color: 'error.main' }}>{errors.staff.message}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <Controller
                      name='distance'
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label='Distance'
                          error={Boolean(errors.distance)}
                          type='number'
                          InputProps={{
                            inputProps: { min: 0 }
                          }}
                        />
                      )}
                    />
                    {errors.distance && (
                      <FormHelperText sx={{ color: 'error.main' }}>{errors.distance.message}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => closeDialog('duty')} sx={{ color: 'error.main' }}>
              Cancel
            </Button>
            <LoadingButton
              loading={loading['addDuty']}
              loadingPosition='start'
              startIcon={<Icon icon='mdi:tick' />}
              type='submit'
              sx={{ marginRight: 2 }}
            >
              Submit
            </LoadingButton>
          </DialogActions>
        </form>
      </Dialog>
    </Card>
  )
}

export default ViewTicket
