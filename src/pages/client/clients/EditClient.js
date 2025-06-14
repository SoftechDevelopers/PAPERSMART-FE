// ** React Imports
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
import { TextField, InputLabel, Select, MenuItem } from '@mui/material'
import { Box, Checkbox, Typography } from '@mui/material'
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
  pincode: yup.string().required('Pincode is required'),
  primary_contact: yup.string().required('Primary is required'),
  email: yup.string().nullable().notRequired().email('Please enter a valid email address')
})

const EditClient = ({ selectedClient, dropdown }) => {
  // ** States
  const [loading, setLoading] = useState(false)
  const isUpdate = selectedClient?.id !== undefined
  const [business, setBusiness] = useState(selectedClient?.organization_business || dropdown?.organization_business)
  const { apiRequest } = useApi()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const ability = useContext(AbilityContext)
  const canEdit = ability.can('edit', 'client')
  const canCreate = ability.can('create', 'client')

  // ** Form
  const defaultValues = {
    name: selectedClient?.name || '',
    address1: selectedClient?.address1 || '',
    address2: selectedClient?.address2 || '',
    district: selectedClient?.district || '',
    state: selectedClient?.state || states[19],
    pincode: selectedClient?.pincode || '',
    primary_contact: selectedClient?.primary_contact || '',
    secondary_contact: selectedClient?.secondary_contact || '',
    email: selectedClient?.email || '',
    principal: selectedClient?.principal || '',
    director: selectedClient?.director || '',
    manager: selectedClient?.manager || '',
    head: selectedClient?.head || ''
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
        name: formData.name,
        address1: formData.address1,
        address2: formData.address2 || null,
        district: formData.district,
        state: formData.state,
        pincode: formData.pincode,
        primary_contact: formData.primary_contact,
        secondary_contact: formData.secondary_contact || null,
        email: formData.email || null,
        principal: formData.principal || null,
        director: formData.director || null,
        manager: formData.manager || null,
        head: formData.head || null,
        business: business
      }

      let data
      if (!isUpdate) {
        data = await apiRequest('post', '/client', payload, {}, null)
      } else {
        const updatedPayload = { ...payload, _method: 'PUT' }
        data = await apiRequest('post', `/client/${selectedClient?.id}`, updatedPayload, {}, null)
      }

      showSuccessToast(data?.message, 5000)
      if (!isUpdate) {
        reset()
      }
    } catch (error) {
      if (error?.status === 409) {
        showErrorToast(error?.response?.data?.message, 5000)
      } else {
        showErrorToast('Error while processing the client', 5000)
      }
    } finally {
      setLoading(false)
    }
  }

  // ** Register business changes
  const handleBusinessChange = id => {
    setBusiness(prev => prev.map(item => (item.id === id ? { ...item, idExists: !item.idExists } : item)))
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader sx={{ pb: 5 }} title='Client Details' titleTypographyProps={{ variant: 'h6' }} />
        <CardContent>
          <Grid container spacing={6}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='name'
                  control={control}
                  render={({ field }) => <TextField {...field} label='Name *' error={Boolean(errors.name)} />}
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
                    <TextField {...field} label='Address Line 2 *' error={Boolean(errors.address2)} />
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
                  render={({ field }) => <TextField {...field} label='District *' error={Boolean(errors.district)} />}
                />
                {errors.district && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.district.message}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id='state-select-label'>State *</InputLabel>
                <Controller
                  name='state'
                  control={control}
                  render={({ field }) => (
                    <Select
                      labelId='state-select-label'
                      {...field}
                      label='State *'
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
                  name='pincode'
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label='Pincode *' error={Boolean(errors.pincode)} type='number' />
                  )}
                />
                {errors.pincode && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.pincode.message}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='primary_contact'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label='Primary Contact *'
                      error={Boolean(errors.primary_contact)}
                      type='number'
                    />
                  )}
                />
                {errors.primary_contact && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.primary_contact.message}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='secondary_contact'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label='Secondary Contact'
                      error={Boolean(errors.secondary_contact)}
                      type='number'
                    />
                  )}
                />
                {errors.secondary_contact && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.secondary_contact.message}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='email'
                  control={control}
                  render={({ field }) => <TextField {...field} label='Email' error={Boolean(errors.email)} />}
                />
                {errors.email && <FormHelperText sx={{ color: 'error.main' }}>{errors.email.message}</FormHelperText>}
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      <Card sx={{ mt: 6 }}>
        <CardHeader sx={{ pb: 5 }} title='Management' titleTypographyProps={{ variant: 'h6' }} />
        <CardContent>
          <Grid container spacing={6}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='principal'
                  control={control}
                  render={({ field }) => <TextField {...field} label='Principal' error={Boolean(errors.principal)} />}
                />
                {errors.principal && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.principal.message}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='director'
                  control={control}
                  render={({ field }) => <TextField {...field} label='Director' error={Boolean(errors.director)} />}
                />
                {errors.director && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.director.message}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='manager'
                  control={control}
                  render={({ field }) => <TextField {...field} label='Manager' error={Boolean(errors.manager)} />}
                />
                {errors.manager && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.manager.message}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='head'
                  control={control}
                  render={({ field }) => <TextField {...field} label='Head' error={Boolean(errors.head)} />}
                />
                {errors.head && <FormHelperText sx={{ color: 'error.main' }}>{errors.head.message}</FormHelperText>}
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      <Card sx={{ mt: 6 }}>
        <CardHeader sx={{ pb: 5 }} title='Business' titleTypographyProps={{ variant: 'h6' }} />
        <CardContent>
          <Box display='flex' flexWrap='wrap'>
            {business?.map(item => (
              <Box key={item?.id} display='flex' alignItems='center' sx={{ mr: 3, mb: 2 }}>
                <Checkbox checked={item?.idExists} sx={{ mr: 1 }} onChange={() => handleBusinessChange(item?.id)} />
                <Typography>{item?.business_type?.name}</Typography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
      <Grid item xs={12} sm={12} mt={5}>
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
      </Grid>
    </form>
  )
}

export default EditClient
