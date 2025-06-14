// React Imports
import { useState, useEffect, useContext } from 'react'
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
import { TextField, Select, InputLabel, MenuItem, Autocomplete } from '@mui/material'
import { LoadingButton } from '@mui/lab'

// ** Other Imports
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import useCustomToast from 'src/@core/hooks/useCustomToast'
import { AbilityContext } from 'src/layouts/components/acl/Can'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

const states = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry'
]

const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: 300
    }
  }
}

const schema = yup.object().shape({
  name: yup.string().required('Name is required'),
  address2: yup.string().required('Address Line 2 is required'),
  district: yup.string().required('District is required'),
  phone: yup.string().required('Phone is required')
})

const EditRecipient = () => {
  // ** States
  const [loading, setLoading] = useState({ dropdown: false, submit: false })
  const [dropdown, setDropdown] = useState({})
  const staffList = dropdown?.staff || []

  const partnerList = dropdown?.partner?.map(({ id, name }) => (
    <MenuItem key={id} value={id}>
      {name}
    </MenuItem>
  ))

  const { apiRequest } = useApi()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const ability = useContext(AbilityContext)
  const canCreate = ability.can('create', 'recipient')

  // ** Form
  const defaultValues = {
    name: '',
    address1: '',
    address2: '',
    district: '',
    state: states[19],
    phone: '',
    staff: null,
    partner: ''
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

  // ** Fetch dropdowns
  const fetchDropdowns = async () => {
    try {
      setLoading(prev => ({ ...prev, dropdown: true }))
      const data = await apiRequest('get', '/dropdowns?tables=staff,partner', null, {}, signal)

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

  useEffect(() => {
    fetchDropdowns()

    return () => {
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ** Submit
  const onSubmit = async formData => {
    try {
      setLoading(prev => ({ ...prev, submit: true }))

      const payload = {
        ...formData,
        staff_id: formData.staff || null,
        partner_id: formData.partner || null
      }

      let data = await apiRequest('post', '/recipient', payload, {}, null)
      reset()
      showSuccessToast(data?.message, 5000)
    } catch (error) {
      if (error?.status === 409) {
        showErrorToast(error?.response?.data?.message, 5000)
      } else {
        showErrorToast('Error while adding the recipient', 5000)
      }
    } finally {
      setLoading(prev => ({ ...prev, submit: false }))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader sx={{ pb: 5 }} title='Recipient Details' titleTypographyProps={{ variant: 'h6' }} />
        <CardContent>
          <Grid container spacing={6}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='name'
                  control={control}
                  render={({ field }) => <TextField {...field} label='Name' error={Boolean(errors.name)} />}
                />
                {errors.name && <FormHelperText sx={{ color: 'error.main' }}>{errors.name.message}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='address1'
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label='Address Line 1' error={Boolean(errors.address1)} />
                  )}
                />
                {errors.address1 && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.address1.message}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='address2'
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label='Address Line 2' error={Boolean(errors.address2)} />
                  )}
                />
                {errors.address2 && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.address2.message}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='district'
                  control={control}
                  render={({ field }) => <TextField {...field} label='District' error={Boolean(errors.district)} />}
                />
                {errors.district && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.district.message}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id='state-select-label'>State</InputLabel>
                <Controller
                  name='state'
                  control={control}
                  render={({ field }) => (
                    <Select
                      labelId='state-select-label'
                      {...field}
                      label='State'
                      value={field.value}
                      onChange={e => {
                        field.onChange(e)
                      }}
                      MenuProps={MenuProps}
                    >
                      {states.map(item => (
                        <MenuItem key={item} value={item}>
                          {item}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='phone'
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label='Phone' error={Boolean(errors.phone)} type='number' />
                  )}
                />
                {errors.phone && <FormHelperText sx={{ color: 'error.main' }}>{errors.phone.message}</FormHelperText>}
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
                      options={staffList}
                      getOptionLabel={option => option?.name || ''}
                      onChange={(_, data) => {
                        field.onChange(data ? data.id : null)
                      }}
                      isOptionEqualToValue={(option, value) => option && value && option.id === value.id}
                      renderInput={params => <TextField {...params} label='Staff' />}
                      value={staffList.find(staff => staff.id === Number(field.value)) || null}
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
                  )}
                />
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id='partner-select-label'>Partner</InputLabel>
                <Controller
                  name='partner'
                  control={control}
                  render={({ field }) => (
                    <Select
                      labelId='partner-select-label'
                      {...field}
                      label='Partner'
                      value={field.value}
                      onChange={e => {
                        field.onChange(e)
                      }}
                    >
                      <MenuItem value=''>
                        <em>None</em>
                      </MenuItem>
                      {partnerList}
                    </Select>
                  )}
                />
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
        <CardActions>
          <LoadingButton
            loading={loading['submit']}
            disabled={!canCreate}
            loadingPosition='start'
            startIcon={<Icon icon='gridicons:add-outline' />}
            size='large'
            type='submit'
            variant='contained'
            sx={{ marginRight: 2 }}
          >
            Add
          </LoadingButton>
        </CardActions>
      </Card>
    </form>
  )
}

export default EditRecipient
