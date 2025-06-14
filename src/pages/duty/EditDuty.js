// React Imports
import { useState, useContext } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useApi } from 'src/@core/api/useApi'

// ** MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import { TextField, Autocomplete, InputLabel, Select, MenuItem } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import dayjs from 'dayjs'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'

// ** Other Imports
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import useCustomToast from 'src/@core/hooks/useCustomToast'
import { AbilityContext } from 'src/layouts/components/acl/Can'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

const schema = yup.object().shape({
  date: yup.date().typeError('Invalid date'),
  staff: yup.string().required('Staff is required'),
  distance: yup.number().typeError('Distance must be a valid number')
})

// ** Parsing date
const parseDateString = dateString => {
  const [day, month, year] = dateString.split('-')

  return new Date(`${year}-${month}-${day}`)
}

const EditDuty = ({ selectedDuty, dropdown }) => {
  // ** States
  const [loading, setLoading] = useState(false)
  const technicianList = dropdown?.technician || []
  const { apiRequest } = useApi()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const ability = useContext(AbilityContext)
  const canEdit = ability.can('edit', 'duty')
  const types = ['Active', 'Cancelled']

  // ** Form
  const defaultValues = {
    date: selectedDuty?.date ? dayjs(parseDateString(selectedDuty.date)) : dayjs(),
    staff: selectedDuty?.staff_id || null,
    distance: selectedDuty?.distance || '',
    status: selectedDuty?.status || types[0]
  }

  const {
    handleSubmit,
    control,
    formState: { errors }
  } = useForm({ defaultValues, resolver: yupResolver(schema) })

  // ** Submit
  const onSubmit = async formData => {
    try {
      setLoading(true)
      const date = dayjs(formData.date)

      const payload = {
        ...formData,
        date: date.format('YYYY-MM-DD'),
        staff_id: formData.staff,
        distance: Number(formData.distance),
        ticket_id: selectedDuty?.ticket_id,
        status: formData.status,
        _method: 'PUT'
      }

      const data = await apiRequest('post', `/duty/${selectedDuty?.id}`, payload, {}, null)

      showSuccessToast(data?.message, 5000)
    } catch (error) {
      if (error?.status === 409) {
        showErrorToast(error?.response?.data?.message, 5000)
      } else {
        showErrorToast('Error while processing the duty', 5000)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader sx={{ pb: 5 }} title='Duty Details' titleTypographyProps={{ variant: 'h6' }} />
        <CardContent>
          <Grid container spacing={6}>
            <Grid item xs={12} sm={6}>
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

            <Grid item xs={12} sm={6}>
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
                {errors.staff && <FormHelperText sx={{ color: 'error.main' }}>{errors.staff.message}</FormHelperText>}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
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

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id='status-select-label'>Status</InputLabel>
                <Controller
                  name='status'
                  control={control}
                  render={({ field }) => (
                    <Select
                      labelId='status-select-label'
                      {...field}
                      label='Status'
                      value={field.value}
                      onChange={e => {
                        field.onChange(e)
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
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={12} mt={5}>
              <LoadingButton
                loading={loading}
                disabled={!canEdit}
                loadingPosition='start'
                startIcon={<Icon icon='formkit:submit' />}
                size='large'
                type='submit'
                variant='contained'
                sx={{ marginRight: 2 }}
              >
                Submit
              </LoadingButton>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </form>
  )
}

export default EditDuty
