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
import { TextField } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import { Typography } from '@mui/material'
import { Box } from '@mui/material'

// ** Other Imports
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import useCustomToast from 'src/@core/hooks/useCustomToast'
import { AbilityContext } from 'src/layouts/components/acl/Can'
import FileDropzone from 'src/layouts/components/FileDropzone'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import VisibilityIcon from '@mui/icons-material/Visibility'
import DeleteIcon from '@mui/icons-material/Delete'
import DescriptionIcon from '@mui/icons-material/Description'

const schema = yup.object().shape({
  name: yup.string().required('Name is required'),
  address2: yup.string().required('Address Line 2 is required'),
  country: yup.string().required('Country is required')
})

const EditVendor = ({ selectedVendor }) => {
  // ** States
  const [loading, setLoading] = useState({ submit: false })
  const isUpdate = selectedVendor?.id !== undefined
  const [file, setFile] = useState(selectedVendor?.docs_url || null)
  const [fileName, setFileName] = useState(selectedVendor?.filename || '')

  const { apiRequest } = useApi()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const ability = useContext(AbilityContext)
  const canEdit = ability.can('edit', 'vendor')
  const canCreate = ability.can('create', 'vendor')

  // ** Form
  const defaultValues = {
    name: selectedVendor?.name || '',
    address1: selectedVendor?.address1 || '',
    address2: selectedVendor?.address2 || '',
    district: selectedVendor?.district || '',
    state: selectedVendor?.state || '',
    country: selectedVendor?.country || '',
    pincode: selectedVendor?.pincode || '',
    phone: selectedVendor?.phone || '',
    email: selectedVendor?.email || '',
    contact_person: selectedVendor?.contact_person || '',
    gstin: selectedVendor?.gstin || '',
    pan: selectedVendor?.pan || '',
    tan: selectedVendor?.tan || '',
    account_no: selectedVendor?.account_no || '',
    bank: selectedVendor?.bank || '',
    ifsc: selectedVendor?.ifsc || '',
    branch: selectedVendor?.branch || '',
    docs_url: selectedVendor?.docs_url || ''
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
      setLoading(prev => ({ ...prev, submit: true }))
      const payload = new FormData()
      payload.append('name', formData.name)
      payload.append('address1', formData.address1)
      payload.append('address2', formData.address2)
      payload.append('district', formData.district)
      payload.append('state', formData.state)
      payload.append('country', formData.country)
      payload.append('pincode', formData.pincode)
      payload.append('phone', formData.phone)
      payload.append('email', formData.email)
      payload.append('contact_person', formData.contact_person)
      payload.append('gstin', formData.gstin)
      payload.append('pan', formData.pan)
      payload.append('tan', formData.tan)
      payload.append('account_no', formData.account_no)
      payload.append('bank', formData.bank)
      payload.append('ifsc', formData.ifsc)
      payload.append('branch', formData.branch)

      if (file && file[0] && file[0] instanceof File) {
        payload.append('file', file[0])
      } else if (fileName) {
        payload.append('docs_url', fileName)
      }

      let data
      if (!isUpdate) {
        data = await apiRequest('post', '/vendor', payload, {}, null)
      } else {
        payload.append('_method', 'PUT')
        data = await apiRequest('post', `/vendor/${selectedVendor?.id}`, payload, {}, null)
      }

      showSuccessToast(data?.message, 5000)
      if (!isUpdate) {
        reset()
        setFile(null)
        setFileName('')
      }
    } catch (error) {
      if (error?.status === 409) {
        showErrorToast(error?.response?.data?.message, 5000)
      } else {
        showErrorToast('Error while processing the vendor', 5000)
      }
    } finally {
      setLoading(prev => ({ ...prev, submit: false }))
    }
  }

  // ** View file uploaded
  const viewFile = () => {
    if (file) {
      if (file[0] instanceof File) {
        const fileURL = URL.createObjectURL(file[0])
        window.open(fileURL, '_blank')
      } else {
        window.open(selectedAgreement?.docs_url, '_blank')
      }
    }
  }

  // ** Upload
  const handleDropRejected = fileRejections => {
    fileRejections.forEach(rejection => {
      if (rejection.errors.some(error => error.code === 'file-too-large')) {
        showErrorToast('File size exceeds the limit', 5000)
      } else if (rejection.errors.some(error => error.code === 'file-invalid-type')) {
        showErrorToast('Invalid file type', 5000)
      }
    })
  }

  const DocumentUpload = () => {
    const handleDrop = acceptedFiles => {
      if (acceptedFiles.length > 0) {
        setFile(acceptedFiles)
        setFileName(acceptedFiles[0]?.name)
      }
    }

    return (
      <FileDropzone
        onDrop={handleDrop}
        onDropRejected={handleDropRejected}
        acceptedFiles={{
          'application/pdf': ['.pdf']
        }}
        maxSize={10 * 1024 * 1024}
        disabled={false}
      />
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader sx={{ pb: 5 }} title='Vendor Details' titleTypographyProps={{ variant: 'h6' }} />
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
                  render={({ field }) => <TextField {...field} label='District' error={Boolean(errors.district)} />}
                />
                {errors.district && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.district.message}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='state'
                  control={control}
                  render={({ field }) => <TextField {...field} label='State' error={Boolean(errors.state)} />}
                />
                {errors.state && <FormHelperText sx={{ color: 'error.main' }}>{errors.state.message}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='country'
                  control={control}
                  render={({ field }) => <TextField {...field} label='Country *' error={Boolean(errors.country)} />}
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
          </Grid>
        </CardContent>
      </Card>
      <Card sx={{ mt: 6 }}>
        <CardHeader sx={{ pb: 5 }} title='Contact' titleTypographyProps={{ variant: 'h6' }} />
        <CardContent>
          <Grid container spacing={6}>
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
                  name='email'
                  control={control}
                  render={({ field }) => <TextField {...field} label='Email' error={Boolean(errors.email)} />}
                />
                {errors.email && <FormHelperText sx={{ color: 'error.main' }}>{errors.email.message}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='contact_person'
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label='Contact Person' error={Boolean(errors.contact_person)} />
                  )}
                />
                {errors.contact_person && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.contact_person.message}</FormHelperText>
                )}
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      <Card sx={{ mt: 6 }}>
        <CardHeader sx={{ pb: 5 }} title='Tax Registration' titleTypographyProps={{ variant: 'h6' }} />
        <CardContent>
          <Grid container spacing={6}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='gstin'
                  control={control}
                  render={({ field }) => <TextField {...field} label='GSTIN' error={Boolean(errors.gstin)} />}
                />
                {errors.gstin && <FormHelperText sx={{ color: 'error.main' }}>{errors.gstin.message}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='pan'
                  control={control}
                  render={({ field }) => <TextField {...field} label='PAN' error={Boolean(errors.pan)} />}
                />
                {errors.pan && <FormHelperText sx={{ color: 'error.main' }}>{errors.pan.message}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='tan'
                  control={control}
                  render={({ field }) => <TextField {...field} label='TAN' error={Boolean(errors.tan)} />}
                />
                {errors.tan && <FormHelperText sx={{ color: 'error.main' }}>{errors.tan.message}</FormHelperText>}
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      <Card sx={{ mt: 6 }}>
        <CardHeader sx={{ pb: 5 }} title='Bank' titleTypographyProps={{ variant: 'h6' }} />
        <CardContent>
          <Grid container spacing={6}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='account_no'
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label='Account Number' error={Boolean(errors.account_no)} type='number' />
                  )}
                />
                {errors.account_no && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.account_no.message}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='bank'
                  control={control}
                  render={({ field }) => <TextField {...field} label='Bank' error={Boolean(errors.bank)} />}
                />
                {errors.bank && <FormHelperText sx={{ color: 'error.main' }}>{errors.bank.message}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='ifsc'
                  control={control}
                  render={({ field }) => <TextField {...field} label='IFSC' error={Boolean(errors.ifsc)} />}
                />
                {errors.ifsc && <FormHelperText sx={{ color: 'error.main' }}>{errors.ifsc.message}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='branch'
                  control={control}
                  render={({ field }) => <TextField {...field} label='Branch' error={Boolean(errors.branch)} />}
                />
                {errors.branch && <FormHelperText sx={{ color: 'error.main' }}>{errors.branch.message}</FormHelperText>}
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      <Card sx={{ marginTop: 5 }}>
        <CardHeader sx={{ pb: 5 }} title='Uploads' titleTypographyProps={{ variant: 'h6' }} />
        <CardContent>
          <DocumentUpload />
          <Grid item xs={12} sm={12} mt={5} overflow='auto'>
            <Box display='flex' justifyContent='space-between' alignItems='center'>
              <Box display='flex' alignItems='center'>
                <DescriptionIcon sx={{ mr: 1, color: 'text.secondary' }} fontSize='large' />
                <Typography variant='body2' sx={{ mr: 1 }}>
                  {fileName || 'No files uploaded'}
                </Typography>
              </Box>

              {file && (
                <Box display='flex' alignItems='center'>
                  <VisibilityIcon
                    fontSize='medium'
                    sx={{ cursor: 'pointer', color: 'text.secondary', mr: 1 }}
                    onClick={viewFile}
                  />
                  <DeleteIcon
                    fontSize='medium'
                    sx={{ cursor: 'pointer', color: 'text.secondary' }}
                    onClick={() => {
                      setFile(null)
                      setFileName('')
                    }}
                  />
                </Box>
              )}
            </Box>
          </Grid>
        </CardContent>
      </Card>
      <Grid item xs={12} sm={12} mt={5}>
        <LoadingButton
          loading={loading['submit']}
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

export default EditVendor
