// ** React Imports
import { useState, useContext, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useApi } from 'src/@core/api/useApi'

// ** MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import { TextField, Autocomplete } from '@mui/material'
import { Box, Typography } from '@mui/material'
import { LoadingButton } from '@mui/lab'

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
  client: yup.string().required('Client is required'),
  strength: yup.string().required('Strength is required')
})

const EditStrength = ({ selectedStrength }) => {
  // ** States
  const [loading, setLoading] = useState({ dropdown: false, submit: false })
  const [dropdown, setDropdown] = useState({})
  const clientList = dropdown?.agreemented_client || []
  const isUpdate = selectedStrength?.strength_id !== null && selectedStrength?.strength_id !== undefined
  const [file, setFile] = useState(selectedStrength?.docs_url || null)
  const [fileName, setFileName] = useState(selectedStrength?.filename || '')

  const { apiRequest } = useApi()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const ability = useContext(AbilityContext)
  const canEdit = ability.can('edit', 'strength')
  const canCreate = ability.can('create', 'strength')

  // ** Abort Controller
  const controller = new AbortController()
  const signal = controller.signal

  // ** Fetch dropdowns
  useEffect(() => {
    const fetchDropdowns = async () => {
      setLoading(prev => ({ ...prev, dropdown: true }))
      try {
        const data = await apiRequest('get', '/dropdowns?tables=agreemented_client', null, {}, signal)

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

    fetchDropdowns()

    return () => {
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ** Form
  const defaultValues = {
    client: selectedStrength?.id || null,
    strength: selectedStrength?.strength || '',
    docs_url: selectedStrength?.docs_url || ''
  }

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors }
  } = useForm({ defaultValues, resolver: yupResolver(schema) })

  // ** Submit
  const onSubmit = async formData => {
    if (!file) {
      showErrorToast('No attachment found', 5000)

      return
    }

    try {
      setLoading(prev => ({ ...prev, submit: true }))
      const payload = new FormData()

      payload.append('client_id', formData.client)
      payload.append('strength', formData.strength)

      if (file && file[0] && file[0] instanceof File) {
        payload.append('file', file[0])
      } else if (fileName) {
        payload.append('docs_url', fileName)
      }

      let data
      if (!isUpdate) {
        data = await apiRequest('post', '/strength', payload, {}, null)
      } else {
        payload.append('_method', 'PUT')
        data = await apiRequest('post', `/strength/${selectedStrength?.strength_id}`, payload, {}, null)
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
        showErrorToast('Error while processing the strength', 5000)
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
        window.open(selectedStrength?.docs_url, '_blank')
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
        <CardHeader sx={{ pb: 5 }} title='Strength Details' titleTypographyProps={{ variant: 'h6' }} />
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
                      loading={loading['dropdown']}
                    />
                  )}
                />
                {errors.client && <FormHelperText sx={{ color: 'error.main' }}>{errors.client.message}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='strength'
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label='Strength' error={Boolean(errors.strength)} type='number' />
                  )}
                />
                {errors.strength && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.strength.message}</FormHelperText>
                )}
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

export default EditStrength
