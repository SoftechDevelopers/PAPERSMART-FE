// React Imports
import { useState, useContext } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useApi } from 'src/@core/api/useApi'

// ** MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import Grid from '@mui/material/Grid'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import { TextField, Autocomplete } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import dayjs from 'dayjs'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { TimePicker } from '@mui/x-date-pickers/TimePicker'
import { renderTimeViewClock } from '@mui/x-date-pickers/timeViewRenderers'

// ** Other Imports
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import useCustomToast from 'src/@core/hooks/useCustomToast'
import { AbilityContext } from 'src/layouts/components/acl/Can'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

const schema = yup.object().shape({
  client: yup.string().required('Client is required'),
  address: yup.string().required('Address is required'),
  latitude: yup.string().required('Latitude is required'),

  // .test('decimal-places', 'Latitude must have exactly 3 decimal places', value => {
  //   if (value === undefined || value === null) return false

  //   return /^-?\d+\.\d{3}$/.test(value.toString())
  // })

  longitude: yup.string().required('Longitude is required'),

  // .test('decimal-places', 'Longitude must have exactly 3 decimal places', value => {
  //   if (value === undefined || value === null) return false

  //   return /^-?\d+\.\d{3}$/.test(value.toString())
  // })

  time_in: yup.date().typeError('Invalid time format'),
  time_out: yup.date().typeError('Invalid time format')
})

const timeToDate = timeStr => {
  const [hour, minute] = timeStr.split(':').map(Number)

  return dayjs().set('hour', hour).set('minute', minute).set('second', 0)
}

const EditLocation = ({ selectedLocation, dropdown }) => {
  // ** States
  const [loading, setLoading] = useState(false)
  const isUpdate = selectedLocation?.id !== undefined
  const clientList = dropdown?.client || []

  const { apiRequest } = useApi()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const ability = useContext(AbilityContext)
  const canEdit = ability.can('edit', 'location')
  const canCreate = ability.can('create', 'location')

  // ** Form
  const defaultValues = {
    client: selectedLocation?.client_id || null,
    address: selectedLocation?.address || '',
    latitude: selectedLocation?.latitude || '',
    longitude: selectedLocation?.longitude || '',
    time_in: selectedLocation?.time_in ? timeToDate(selectedLocation?.time_in) : null,
    time_out: selectedLocation?.time_out ? timeToDate(selectedLocation?.time_out) : null
  }

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors }
  } = useForm({ defaultValues, resolver: yupResolver(schema) })

  // ** Submit
  const onSubmit = async formData => {
    try {
      setLoading(true)

      const payload = {
        client_id: formData.client,
        address: formData.address,
        latitude: formData.latitude,
        longitude: formData.longitude,
        time_in: dayjs(formData.time_in).format('HH:mm'),
        time_out: dayjs(formData.time_out).format('HH:mm')
      }

      let data
      if (!isUpdate) {
        data = await apiRequest('post', '/location', payload, {}, null)
      } else {
        const updatedPayload = { ...payload, _method: 'PUT' }
        data = await apiRequest('post', `/location/${selectedLocation?.id}`, updatedPayload, {}, null)
      }

      showSuccessToast(data?.message, 5000)
      if (!isUpdate) {
        reset()
      }
    } catch (error) {
      if (error?.status === 409) {
        showErrorToast(error?.response?.data?.message, 5000)
      } else {
        showErrorToast('Error while processing the location', 5000)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader sx={{ pb: 5 }} title='Location Details' titleTypographyProps={{ variant: 'h6' }} />
        <CardContent>
          <Grid container spacing={6}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='client'
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      {...field}
                      options={clientList}
                      getOptionLabel={option => option?.name || ''}
                      onChange={(_, data) => {
                        field.onChange(data ? data.id : null)
                      }}
                      isOptionEqualToValue={(option, value) => option && value && option.id === value.id}
                      renderInput={params => <TextField {...params} label='Client' error={Boolean(errors.client)} />}
                      value={clientList.find(client => client.id === Number(field.value)) || null}
                      renderOption={(props, option) => (
                        <li {...props} key={option.id} style={{ display: 'flex', alignItems: 'center' }}>
                          <div>
                            <span style={{ color: '#ff4d49' }}>{`ID: ${option.id}`}</span>
                            <br />
                            <span>{`Name: ${option.name}`}</span>
                          </div>
                        </li>
                      )}
                      disabled={isUpdate}
                    />
                  )}
                />
                {errors.client && <FormHelperText sx={{ color: 'error.main' }}>{errors.client.message}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='address'
                  control={control}
                  render={({ field }) => <TextField {...field} label='Address' error={Boolean(errors.address)} />}
                />
                {errors.address && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.address.message}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='latitude'
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label='Latitude' error={Boolean(errors.latitude)} type='number' />
                  )}
                />
                {errors.latitude && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.latitude.message}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='longitude'
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label='Longitude' error={Boolean(errors.longitude)} type='number' />
                  )}
                />
                {errors.longitude && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.longitude.message}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <Controller
                    name='time_in'
                    control={control}
                    render={({ field: { onChange, value } }) => (
                      <TimePicker
                        label='Time In'
                        value={value}
                        onChange={onChange}
                        viewRenderers={{
                          hours: renderTimeViewClock,
                          minutes: renderTimeViewClock,
                          seconds: renderTimeViewClock
                        }}
                        slotProps={{
                          textField: {
                            error: Boolean(errors.arrival)
                          }
                        }}
                      />
                    )}
                  />
                </LocalizationProvider>
                {errors.time_in && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.time_in.message}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <Controller
                    name='time_out'
                    control={control}
                    render={({ field: { onChange, value } }) => (
                      <TimePicker
                        label='Time Out'
                        value={value}
                        onChange={onChange}
                        viewRenderers={{
                          hours: renderTimeViewClock,
                          minutes: renderTimeViewClock,
                          seconds: renderTimeViewClock
                        }}
                        slotProps={{
                          textField: {
                            error: Boolean(errors.arrival)
                          }
                        }}
                      />
                    )}
                  />
                </LocalizationProvider>
                {errors.time_out && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.time_out.message}</FormHelperText>
                )}
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
        <CardActions>
          <LoadingButton
            loading={loading}
            disabled={isUpdate ? !canEdit : !canCreate}
            loadingPosition='start'
            startIcon={<Icon icon='formkit:submit' />}
            size='large'
            type='submit'
            variant='contained'
            sx={{ marginRight: 2 }}
          >
            Submit
          </LoadingButton>
        </CardActions>
      </Card>
    </form>
  )
}

export default EditLocation
