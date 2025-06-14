// React Imports
import { useState, useContext, useEffect } from 'react'
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
import { TextField, Autocomplete, Box, Avatar } from '@mui/material'
import { LoadingButton } from '@mui/lab'

// ** Other Imports
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import useCustomToast from 'src/@core/hooks/useCustomToast'
import { AbilityContext } from 'src/layouts/components/acl/Can'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import EditIcon from '@mui/icons-material/Edit'

const schema = yup.object().shape({
  category_id: yup.string().required('Category is required'),
  name: yup.string().required('Name is required'),
  manufacturer: yup.string().required('Manufacturer is required'),
  model: yup.string().required('Model is required'),
  hsn: yup.string().required('HSN is required'),
  unit: yup.string().required('Unit is required')
})

const EditItem = ({ selectedItem }) => {
  // ** States
  const [loading, setLoading] = useState({ submit: false })
  const isUpdate = selectedItem?.id !== undefined
  const [dropdown, setDropdown] = useState({})
  const categoryList = dropdown?.category || []
  const [image, setImage] = useState(selectedItem?.image_url || null)
  const [imageFile, setImageFile] = useState(selectedItem?.image_url || null)

  const { apiRequest } = useApi()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const ability = useContext(AbilityContext)
  const canEdit = ability.can('edit', 'item')
  const canCreate = ability.can('create', 'item')

  // ** Abort Controller
  const controller = new AbortController()
  const signal = controller.signal

  // ** Fetch dropdowns

  const fetchDropdowns = async () => {
    setLoading(prev => ({ ...prev, dropdown: true }))
    try {
      const data = await apiRequest('get', '/dropdowns?tables=category', null, {}, signal)
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

  // ** Form
  const defaultValues = {
    category_id: selectedItem?.category_id || null,
    name: selectedItem?.name || '',
    manufacturer: selectedItem?.manufacturer || '',
    model: selectedItem?.model || '',
    hsn: selectedItem?.hsn || '',
    cgst: selectedItem?.cgst || '',
    sgst: selectedItem?.sgst || '',
    igst: selectedItem?.igst || '',
    unit: selectedItem?.unit || ''
  }

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors }
  } = useForm({ defaultValues, resolver: yupResolver(schema) })

  // ** Submit
  const onSubmit = async formData => {
    if (!imageFile) {
      showErrorToast('No image selected', 5000)

      return
    }
    try {
      setLoading(prev => ({ ...prev, submit: true }))

      const payload = new FormData()
      payload.append('category_id', formData.category_id)
      payload.append('name', formData.name)
      payload.append('manufacturer', formData.manufacturer)
      payload.append('model', formData.model)
      payload.append('hsn', formData.hsn)
      payload.append('cgst', formData.cgst)
      payload.append('sgst', formData.sgst)
      payload.append('igst', formData.igst)
      payload.append('unit', formData.unit)

      if (imageFile && imageFile[0] && imageFile[0] instanceof File) {
        payload.append('file', imageFile[0])
      }

      let data
      if (!isUpdate) {
        data = await apiRequest('post', '/item', payload, {}, null)
      } else {
        payload.append('_method', 'PUT')
        data = await apiRequest('post', `/item/${selectedItem?.id}`, payload, {}, null)
      }

      showSuccessToast(data?.message, 5000)
      if (!isUpdate) {
        reset()
      }
    } catch (error) {
      if (error?.status === 409) {
        showErrorToast(error?.response?.data?.message, 5000)
      } else {
        showErrorToast('Error while processing the item', 5000)
      }
    } finally {
      setLoading(prev => ({ ...prev, submit: false }))
    }
  }

  // ** Click on avatar
  const handleAvatarClick = () => {
    document.getElementById('avatar-upload').click()
  }

  const handleAvatarChange = event => {
    const selectedFile = event?.target?.files

    if (selectedFile && selectedFile.length > 0) {
      setImageFile(selectedFile)
      setImage(URL.createObjectURL(selectedFile[0]))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card sx={{ mt: 5 }}>
        <CardHeader sx={{ pb: 5 }} title='Item Details' titleTypographyProps={{ variant: 'h6' }} />
        <CardContent>
          <Grid container spacing={6}>
            <Grid item xs={12}>
              <Box
                sx={{
                  position: 'relative',
                  width: 120,
                  height: 120,
                  cursor: 'pointer',
                  '&:hover .overlay': {
                    opacity: 1
                  }
                }}
                onClick={handleAvatarClick}
              >
                <Avatar
                  src={image || '/images/icons/project-icons/no_image_square.png'}
                  alt='Softech'
                  sx={{ width: '100%', height: '100%', borderRadius: '5%' }}
                  variant='square'
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
                    borderRadius: '5%',
                    opacity: 0,
                    transition: 'opacity 0.3s'
                  }}
                >
                  <EditIcon sx={{ color: '#fff', fontSize: 30 }} />
                </Box>
                <input
                  id='avatar-upload'
                  type='file'
                  accept='image/*'
                  style={{ display: 'none' }}
                  onChange={handleAvatarChange}
                />
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='category_id'
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      {...field}
                      options={categoryList}
                      getOptionLabel={option => option?.name || ''}
                      onChange={(_, data) => {
                        field.onChange(data ? data.id : null)
                      }}
                      isOptionEqualToValue={(option, value) => option && value && option.id === value.id}
                      renderInput={params => (
                        <TextField {...params} label='Category' error={Boolean(errors.category_id)} />
                      )}
                      value={categoryList?.find(category => category.id === Number(field.value)) || null}
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
                {errors.category_id && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.category_id.message}</FormHelperText>
                )}
              </FormControl>
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
                  name='manufacturer'
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label='Manufacturer' error={Boolean(errors.manufacturer)} />
                  )}
                />
                {errors.manufacturer && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.manufacturer.message}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='model'
                  control={control}
                  render={({ field }) => <TextField {...field} label='Model' error={Boolean(errors.model)} />}
                />
                {errors.model && <FormHelperText sx={{ color: 'error.main' }}>{errors.model.message}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='hsn'
                  control={control}
                  render={({ field }) => <TextField {...field} label='HSN' type='number' error={Boolean(errors.hsn)} />}
                />
                {errors.hsn && <FormHelperText sx={{ color: 'error.main' }}>{errors.hsn.message}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='cgst'
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label='CGST' type='number' error={Boolean(errors.cgst)} />
                  )}
                />
                {errors.cgst && <FormHelperText sx={{ color: 'error.main' }}>{errors.cgst.message}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='sgst'
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label='SGST' type='number' error={Boolean(errors.sgst)} />
                  )}
                />
                {errors.sgst && <FormHelperText sx={{ color: 'error.main' }}>{errors.sgst.message}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='igst'
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label='IGST' type='number' error={Boolean(errors.igst)} />
                  )}
                />
                {errors.igst && <FormHelperText sx={{ color: 'error.main' }}>{errors.igst.message}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='unit'
                  control={control}
                  render={({ field }) => <TextField {...field} label='Unit' error={Boolean(errors.unit)} />}
                />
                {errors.unit && <FormHelperText sx={{ color: 'error.main' }}>{errors.unit.message}</FormHelperText>}
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
        <CardActions>
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
            {isUpdate ? 'Update' : 'Submit'}
          </LoadingButton>
        </CardActions>
      </Card>
    </form>
  )
}

export default EditItem
