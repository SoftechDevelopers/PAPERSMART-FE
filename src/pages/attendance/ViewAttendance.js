// ** React Imports
import { useState, useEffect, useContext, useMemo } from 'react'
import { useApi } from 'src/@core/api/useApi'
import { useForm, Controller } from 'react-hook-form'

// ** MUI Imports
import { DataGrid } from '@mui/x-data-grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import IconButton from '@mui/material/IconButton'
import { Box, Button, Typography, Grid, TextField, Avatar, Autocomplete } from '@mui/material'
import { MenuItem, Select, InputLabel, InputAdornment, LinearProgress } from '@mui/material'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import FormControl from '@mui/material/FormControl'
import { LoadingButton } from '@mui/lab'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import { styled } from '@mui/material/styles'
import CustomChip from 'src/@core/components/mui/chip'
import FormHelperText from '@mui/material/FormHelperText'
import { TimePicker } from '@mui/x-date-pickers/TimePicker'
import { renderTimeViewClock } from '@mui/x-date-pickers/timeViewRenderers'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import CloseIcon from '@mui/icons-material/Close'

// ** Other Imports
import { AbilityContext } from 'src/layouts/components/acl/Can'
import useCustomToast from 'src/@core/hooks/useCustomToast'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useAuth } from 'src/hooks/useAuth'

const TypographyStyled = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  cursor: 'pointer',
  textDecoration: 'none',
  color: theme.palette.text.primary,
  '&:hover': {
    color: theme.palette.primary.main
  }
}))

const columns = ({ actions }) => [
  {
    field: 'sno',
    headerName: 'S.No',
    width: 80
  },
  {
    field: 'staff_name',
    headerName: 'Staff',
    width: 250,
    renderCell: params => (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Avatar alt={params?.row?.staff.name} src={params?.row?.staff?.photo} />
        <Box sx={{ display: 'flex', flexDirection: 'column', marginLeft: 2 }}>
          <TypographyStyled
            variant='body2'
            onClick={() => {
              actions.handleAttendance(params.row)
            }}
          >
            {params?.row?.staff?.name}
          </TypographyStyled>
          <span style={{ fontSize: 'smaller', color: '#FF69B4', fontStyle: 'italic' }}>({params?.row?.staff?.id})</span>
        </Box>
      </Box>
    )
  },
  {
    field: 'type',
    headerName: 'Type',
    width: 150,
    renderCell: params => (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <CustomChip
          skin='light'
          label={params?.row?.type || 'No Info'}
          color={
            params.row.type === 'Present'
              ? 'success'
              : params.row.type === 'Leave'
              ? 'error'
              : params.row.type === 'Half Day'
              ? 'warning'
              : params.row.type === 'Special'
              ? 'primary'
              : 'secondary'
          }
        />
      </Box>
    )
  },
  {
    field: 'location',
    headerName: 'Location',
    width: 150,
    renderCell: params => (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <span>{params?.row?.location?.address || ''}</span>
      </Box>
    )
  },
  {
    field: 'signin',
    headerName: 'In',
    width: 100
  },
  {
    field: 'signout',
    headerName: 'Out',
    width: 100
  },
  {
    field: 'reason',
    headerName: 'Comment',
    width: 250
  },
  {
    field: 'actions',
    headerName: 'Actions',
    width: 150,
    renderCell: params => (
      <div>
        <Button
          variant='outlined'
          size='small'
          disabled={params?.row?.status === null || Number(params?.row?.status) === 1}
          onClick={() => actions?.handleApprove(params.row)}
        >
          Approve
        </Button>
      </div>
    )
  }
]

const timeToDate = timeStr => {
  const [hour, minute] = timeStr.split(':').map(Number)

  return dayjs().set('hour', hour).set('minute', minute).set('second', 0)
}

// ** Parsing date
const parseDateString = dateString => {
  const [day, month, year] = dateString.split('-')

  return new Date(`${year}-${month}-${day}`)
}

const ViewAttendance = ({ dropdown }) => {
  // ** States
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState({ fetchAll: false, addAttendance: false, approve: false })
  const [isDialogOpen, setDialogOpen] = useState({ addAttendance: false })
  const [searchKey, setSearchKey] = useState('')
  const [date, setDate] = useState(null)
  const types = ['Present', 'Leave', 'Half Day', 'Special']
  const locationList = dropdown?.location || []
  const [selectedAttendance, setSelectedAttendance] = useState(null)
  const [type, setType] = useState(null)
  const filterTypes = ['All', 'Present', 'Leave', 'Half Day', 'Special', 'No Information']
  const [filterType, setFilterType] = useState('')

  const { apiRequest } = useApi()
  const ability = useContext(AbilityContext)
  const canEdit = ability.can('edit', 'attendance')
  const canCreate = ability.can('create', 'attendance')

  const { showSuccessToast, showErrorToast } = useCustomToast()
  const { user } = useAuth()
  const fiscalData = user?.fiscalRange.find(item => item.fiscal === user?.currentFiscal)

  // ** Abort Controller
  const controller = new AbortController()
  const signal = controller.signal

  // ** Schema
  let schema

  if (type === 'Present') {
    schema = yup.object().shape({
      type: yup.string().required('Type is required'),
      location: yup.string().required('Location is required'),
      signin: yup.date().typeError('Invalid time format')
    })
  } else if (type === 'Leave') {
    schema = yup.object().shape({
      type: yup.string().required('Type is required'),
      reason: yup.string().required('Reason is required')
    })
  } else if (type === 'Half Day') {
    schema = yup.object().shape({
      type: yup.string().required('Type is required'),
      location: yup.string().required('Location is required'),
      reason: yup.string().required('Reason is required')
    })
  } else if (type === 'Special') {
    schema = yup.object().shape({
      type: yup.string().required('Type is required'),
      reason: yup.string().required('Reason is required')
    })
  }

  // ** Form
  const defaultValues = {
    staff_id: selectedAttendance?.staff?.id,
    type: selectedAttendance?.type || '',
    location: selectedAttendance?.location?.id || null,
    signin: selectedAttendance?.signin ? timeToDate(selectedAttendance?.signin) : null,
    signout: selectedAttendance?.signout ? timeToDate(selectedAttendance?.signout) : null,
    reason: selectedAttendance?.reason || ''
  }

  const {
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors }
  } = useForm({ defaultValues, resolver: yupResolver(schema) })

  const signin = watch('signin')

  // ** Fetch all
  const fetchAttendances = async () => {
    try {
      const formattedDate = dayjs(date).format('YYYY-MM-DD')
      setLoading(prev => ({ ...prev, fetchAll: true }))
      const data = await apiRequest('get', '/attendances?date=' + formattedDate, null, {}, signal)

      const attendancesWithSerial = data.map((attendance, index) => ({
        ...attendance,
        sno: index + 1,
        id: attendance?.id === null ? 'id' + index : attendance?.id
      }))

      setAttendance(attendancesWithSerial)
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
    if (date) {
      fetchAttendances()
    }

    return () => {
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date])

  // ** Open dialog
  const openDialog = dialog => {
    setDialogOpen(prev => ({ ...prev, [dialog]: true }))
  }

  // ** Close dialog
  const closeDialog = dialog => {
    setDialogOpen(prev => ({ ...prev, [dialog]: false }))
    reset()
  }

  // ** Edit attendance
  const handleAttendance = row => {
    setSelectedAttendance(row)
    openDialog('addAttendance')
  }

  // ** Filter location array according to type
  const filteredLocations = useMemo(() => {
    let filtered = []

    if (selectedAttendance?.isTechnician && Array.isArray(selectedAttendance.duty)) {
      const dutyLocationIds = selectedAttendance.duty.map(duty => Number(duty.id))
      filtered = locationList.filter(location => dutyLocationIds.includes(Number(location.id)))
    } else if (Array.isArray(selectedAttendance?.work)) {
      const workLocationIds = selectedAttendance.work.map(work => Number(work.location_id))
      filtered = locationList.filter(location => workLocationIds.includes(Number(location.id)))
    } else {
      filtered = [...locationList]
    }

    return filtered
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, selectedAttendance])

  // ** Reset values for update
  useEffect(() => {
    if (selectedAttendance) {
      reset({
        staff_id: selectedAttendance?.staff?.id,
        type: selectedAttendance?.type || '',
        location: selectedAttendance?.location?.id || null,
        signin: selectedAttendance?.signin ? timeToDate(selectedAttendance?.signin) : null,
        signout: selectedAttendance?.signout ? timeToDate(selectedAttendance?.signout) : null,
        reason: selectedAttendance?.reason || ''
      })

      setType(selectedAttendance?.type)
    }
  }, [selectedAttendance, reset])

  // ** Submit
  const onSubmit = async formData => {
    try {
      setLoading(prev => ({ ...prev, addAttendance: true }))
      const dateObject = dayjs(date)

      const payload = {
        id: selectedAttendance?.id,
        date: dateObject.format('YYYY-MM-DD'),
        staff_id: formData.staff_id,
        type: type,
        location_id: type === 'Present' || type === 'Half Day' ? formData.location : null,
        signin: type === 'Present' && formData.signin ? dayjs(formData.signin).format('HH:mm') : null,
        signout: type === 'Present' && formData.signout ? dayjs(formData.signout).format('HH:mm') : null,
        reason: type === 'Leave' || type === 'Half Day' || type === 'Special' ? formData.reason : null
      }

      const data = await apiRequest('post', '/attendance', payload, {}, null)
      showSuccessToast(data?.message, 5000)
      fetchAttendances()
    } catch (error) {
      console.log(error)
      showErrorToast('Error while processing the attendance', 5000)
    } finally {
      setLoading(prev => ({ ...prev, addAttendance: false }))
      closeDialog('addAttendance')
    }
  }

  // ** Check for numeric id
  const isNumeric = value => !isNaN(value) && value !== null && value !== ''

  // ** Approve attendance
  const handleApprove = async row => {
    try {
      setLoading(prev => ({ ...prev, approve: true }))

      const payload = {
        _method: 'PATCH'
      }

      const data = await apiRequest('post', '/attendance?id=' + row?.id, payload, {}, null)
      showSuccessToast(data?.message, 5000)
      fetchAttendances()
    } catch (error) {
      console.log(error)
      showErrorToast('Error while processing the attendance', 5000)
    } finally {
      setLoading(prev => ({ ...prev, approve: false }))
    }
  }

  // ** Filter array according to type
  const filteredAttendance = useMemo(() => {
    const filterKey = filterType === 'All' ? '' : filterType

    return attendance
      ?.filter(
        a =>
          (a.type ?? 'No Information').includes(filterKey) &&
          a.staff.name.toLowerCase().includes(searchKey.toLocaleLowerCase())
      )
      .map((item, index) => ({
        ...item,
        sno: index + 1
      }))
  }, [attendance, filterType, searchKey])

  return (
    <Card>
      <CardHeader sx={{ pb: 5 }} title='Staff Attendance' titleTypographyProps={{ variant: 'h6' }} />
      <CardContent>
        <Grid container spacing={6}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label='Date'
                  value={date}
                  onChange={value => {
                    setDate(value)
                  }}
                  format='DD-MM-YYYY'
                  minDate={dayjs(parseDateString(fiscalData?.start_date))}
                  maxDate={dayjs(parseDateString(fiscalData?.end_date))}
                />
              </LocalizationProvider>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel id='type-select-label'>Type</InputLabel>
              <Select
                labelId='type-select-label'
                label='Type'
                value={filterType}
                onChange={e => {
                  setFilterType(e.target.value)
                }}
              >
                {filterTypes.map(item => (
                  <MenuItem key={item} value={item}>
                    {item}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
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
          {loading['approve'] && <LinearProgress sx={{ height: 2 }} />}
          <DataGrid
            rows={filteredAttendance}
            columns={columns({
              actions: { handleAttendance, handleApprove }
            })}
            loading={loading['fetchAll']}
          />
        </Box>
      </CardContent>
      <Dialog
        open={isDialogOpen['addAttendance']}
        onClose={() => closeDialog('addAttendance')}
        aria-labelledby='dialog-title'
        aria-describedby='dialog-description'
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle id='duty-dialog-title'>
            {'Attendance Details '}
            <span style={{ fontSize: '0.8em', fontStyle: 'italic', color: '#FF69B4' }}>
              ({selectedAttendance?.staff?.name})
            </span>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ padding: 1, marginTop: 1, width: { sm: 300, xl: 400 } }}>
              <Grid container spacing={6}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel id='type-select-label' error={Boolean(errors.type)}>
                      Type
                    </InputLabel>
                    <Controller
                      name='type'
                      control={control}
                      render={({ field }) => (
                        <Select
                          labelId='type-select-label'
                          {...field}
                          label='Type'
                          error={Boolean(errors.type)}
                          value={field.value}
                          onChange={e => {
                            field.onChange(e)
                            setType(e.target.value)
                          }}
                        >
                          {types.map(item => (
                            <MenuItem key={item} value={item}>
                              {item}
                            </MenuItem>
                          ))}
                        </Select>
                      )}
                    />
                    {errors.type && <FormHelperText sx={{ color: 'error.main' }}>{errors.type.message}</FormHelperText>}
                  </FormControl>
                </Grid>

                {(type === 'Present' || type === 'Half Day') && (
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <Controller
                        name='location'
                        control={control}
                        render={({ field }) => (
                          <Autocomplete
                            {...field}
                            options={filteredLocations}
                            getOptionLabel={option => option?.name || ''}
                            onChange={(_, data) => {
                              field.onChange(data ? data.id : null)
                            }}
                            isOptionEqualToValue={(option, value) => option && value && option.id === value.id}
                            renderInput={params => (
                              <TextField {...params} label='Location' error={Boolean(errors.location)} />
                            )}
                            value={filteredLocations.find(location => location.id === Number(field.value)) || null}
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
                      {errors.location && (
                        <FormHelperText sx={{ color: 'error.main' }}>{errors.location.message}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                )}

                {type === 'Present' && (
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <Controller
                          name='signin'
                          control={control}
                          render={({ field: { onChange, value } }) => (
                            <TimePicker
                              label='Sign In'
                              value={value}
                              onChange={onChange}
                              viewRenderers={{
                                hours: renderTimeViewClock,
                                minutes: renderTimeViewClock,
                                seconds: renderTimeViewClock
                              }}
                              slotProps={{
                                textField: {
                                  error: Boolean(errors.signin),
                                  InputProps: {
                                    startAdornment: (
                                      <InputAdornment position='start'>
                                        <IconButton onClick={() => onChange(null)} edge='end' size='small'>
                                          <CloseIcon />
                                        </IconButton>
                                      </InputAdornment>
                                    )
                                  }
                                }
                              }}
                            />
                          )}
                        />
                      </LocalizationProvider>
                      {errors.signin && (
                        <FormHelperText sx={{ color: 'error.main' }}>{errors.signin.message}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                )}

                {type === 'Present' && signin && isNumeric(selectedAttendance?.id) && (
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <Controller
                          name='signout'
                          control={control}
                          render={({ field: { onChange, value } }) => (
                            <TimePicker
                              label='Sign Out'
                              value={value}
                              onChange={onChange}
                              viewRenderers={{
                                hours: renderTimeViewClock,
                                minutes: renderTimeViewClock,
                                seconds: renderTimeViewClock
                              }}
                              slotProps={{
                                textField: {
                                  error: Boolean(errors.signout),
                                  InputProps: {
                                    startAdornment: (
                                      <InputAdornment position='start'>
                                        <IconButton onClick={() => onChange(null)} edge='end' size='small'>
                                          <CloseIcon />
                                        </IconButton>
                                      </InputAdornment>
                                    )
                                  }
                                }
                              }}
                            />
                          )}
                        />
                      </LocalizationProvider>
                      {errors.signout && (
                        <FormHelperText sx={{ color: 'error.main' }}>{errors.signout.message}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                )}

                {(type === 'Half Day' || type === 'Special' || type === 'Leave') && (
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <Controller
                        name='reason'
                        control={control}
                        render={({ field }) => <TextField {...field} label='Comment' error={Boolean(errors.reason)} />}
                      />
                      {errors.reason && (
                        <FormHelperText sx={{ color: 'error.main' }}>{errors.reason.message}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                )}
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => closeDialog('addAttendance')} sx={{ color: 'error.main' }}>
              Cancel
            </Button>
            {canCreate && canEdit && (
              <LoadingButton
                loading={loading['addAttendance']}
                loadingPosition='start'
                startIcon={<Icon icon='mdi:tick' />}
                type='submit'
                sx={{ marginRight: 2 }}
                disabled={!type}
              >
                Submit
              </LoadingButton>
            )}
          </DialogActions>
        </form>
      </Dialog>
    </Card>
  )
}

export default ViewAttendance
