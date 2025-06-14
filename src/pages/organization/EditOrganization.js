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
import { TextField, Select, Avatar, MenuItem, InputLabel, Box } from '@mui/material'
import { LoadingButton } from '@mui/lab'

// ** Other Imports
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import useCustomToast from 'src/@core/hooks/useCustomToast'
import { AbilityContext } from 'src/layouts/components/acl/Can'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import EditIcon from '@mui/icons-material/Edit'

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
  state: yup.string().required('State is required'),
  country: yup.string().required('Country is required'),
  pincode: yup.string().matches(/^\d+$/, 'Pincode must be a valid number').required('Pincode is required'),
  contact: yup.string().matches(/^\d+$/, 'Contact must be a valid number').required('Contact is required'),
  email: yup.string().email('Please enter a valid email address').required('Email is required')
})

const EditOrganization = ({ selectedOrganization }) => {
  // ** States
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState(selectedOrganization?.logo || null)
  const [logo, setLogo] = useState(selectedOrganization?.logo || null)
  const isUpdate = selectedOrganization?.id !== undefined

  const { apiRequest } = useApi()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const ability = useContext(AbilityContext)

  const canEdit = ability.can('edit', 'organization')
  const canCreate = ability.can('create', 'organization')

  // ** Form
  const defaultValues = {
    name: selectedOrganization?.name || '',
    address1: selectedOrganization?.address1 || '',
    address2: selectedOrganization?.address2 || '',
    district: selectedOrganization?.district || '',
    state: selectedOrganization?.state || states[19],
    country: selectedOrganization?.country || 'India',
    pincode: selectedOrganization?.pincode || '',
    contact: selectedOrganization?.contact || '',
    email: selectedOrganization?.email || ''
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
      if (!file) {
        showErrorToast('No logo selected', 5000)

        return
      }

      setLoading(true)

      const payload = new FormData()
      payload.append('name', formData.name)
      if (formData.address1) {
        payload.append('address1', formData.address1)
      }
      payload.append('address2', formData.address2)
      payload.append('district', formData.district)
      payload.append('state', formData.state)
      payload.append('country', formData.country)
      payload.append('pincode', formData.pincode)
      payload.append('contact', formData.contact)
      payload.append('email', formData.email)

      if (file && file[0] && file[0] instanceof File) {
        payload.append('file', file[0])
      }

      let data
      if (!isUpdate) {
        data = await apiRequest('post', '/organization', payload, {}, null)
      } else {
        payload.append('_method', 'PUT')
        data = await apiRequest('post', `/organization/${selectedOrganization?.id}`, payload, {}, null)
      }
      showSuccessToast(data?.message, 5000)
    } catch (error) {
      console.log(error)
      if (error?.status === 409) {
        showErrorToast(error?.response?.data?.message, 5000)
      } else {
        showErrorToast('Error while processing the organization', 5000)
      }
    } finally {
      setLoading(false)
      if (!isUpdate) {
        reset()
      }
    }
  }

  // ** Click on logo
  const handleLogoClick = () => {
    document.getElementById('logo-upload').click()
  }

  const handleFileChange = event => {
    const selectedFile = event?.target?.files

    if (selectedFile && selectedFile.length > 0) {
      setFile(selectedFile)
      setLogo(URL.createObjectURL(selectedFile[0]))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader sx={{ pb: 5 }} title='Organization Details' titleTypographyProps={{ variant: 'h6' }} />
        <CardContent>
          <Grid container spacing={6}>
            <Grid item xs={12}>
              <Box
                sx={{
                  position: 'relative',
                  width: 100,
                  height: 100,
                  cursor: 'pointer',
                  '&:hover .overlay': {
                    opacity: 1
                  }
                }}
                onClick={handleLogoClick}
              >
                <Avatar
                  src={logo || '/images/icons/project-icons/no_image.png'}
                  alt='Softech'
                  sx={{ width: '100%', height: '100%' }}
                />
                <Box
                  className='overlay'
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    opacity: 0,
                    transition: 'opacity 0.3s'
                  }}
                >
                  <EditIcon sx={{ color: '#fff', fontSize: 30 }} />
                </Box>
                <input
                  id='logo-upload'
                  type='file'
                  accept='image/*'
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
              </Box>
            </Grid>
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
                  name='country'
                  control={control}
                  render={({ field }) => <TextField {...field} label='Country' error={Boolean(errors.country)} />}
                />
                {errors.country && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.country.message}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='pincode'
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label='Pincode' error={Boolean(errors.pincode)} type='number' />
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
                  name='contact'
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label='Contact' error={Boolean(errors.contact)} type='number' />
                  )}
                />
                {errors.contact && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.contact.message}</FormHelperText>
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
          </Grid>
        </CardContent>
      </Card>
    </form>
  )
}

export default EditOrganization
