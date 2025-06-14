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
import { TextField, InputLabel, Select, MenuItem, Autocomplete } from '@mui/material'
import { Box, Typography } from '@mui/material'
import dayjs from 'dayjs'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
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
  signatory_1: yup.string().required('Signatory 1 is required'),
  signatory_3: yup.string().required('Signatory 3 is required'),
  start_date: yup.date().typeError('Invalid date'),
  end_date: yup.date().typeError('Invalid date'),
  consideration: yup.string().required('Consideration is required'),
  classes: yup.string().required('Classes is required')
})

// ** Parsing date
const parseDateString = dateString => {
  const [day, month, year] = dateString.split('-')

  return new Date(`${year}-${month}-${day}`)
}

const EditAgreement = ({ selectedAgreement }) => {
  // ** States
  const [loading, setLoading] = useState({ dropdown: false, submit: false })
  const [dropdown, setDropdown] = useState({})
  const clientList = dropdown?.client || []
  const isUpdate = selectedAgreement?.id !== undefined
  const types = ['Hardware & Service', 'Service', 'Content Service', 'Professional Service', 'Others']
  const [file, setFile] = useState(selectedAgreement?.docs_url || null)
  const [fileName, setFileName] = useState(selectedAgreement?.filename || '')

  const { apiRequest } = useApi()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const ability = useContext(AbilityContext)
  const canEdit = ability.can('edit', 'agreement')
  const canCreate = ability.can('create', 'agreement')

  // ** Abort Controller
  const controller = new AbortController()
  const signal = controller.signal

  // ** Fetch dropdowns
  useEffect(() => {
    const fetchDropdowns = async () => {
      setLoading(prev => ({ ...prev, dropdown: true }))
      try {
        const data = await apiRequest('get', '/dropdowns?tables=client', null, {}, signal)

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
    client: selectedAgreement?.client?.id || null,
    type: selectedAgreement?.type || types[0],
    signatory_1: selectedAgreement?.signatory_1 || '',
    signatory_2: selectedAgreement?.signatory_2 || '',
    signatory_3: selectedAgreement?.signatory_3 || '',
    witness_1: selectedAgreement?.witness_1 || '',
    witness_2: selectedAgreement?.witness_2 || '',
    start_date: selectedAgreement?.start_date ? dayjs(parseDateString(selectedAgreement?.start_date)) : null,
    end_date: selectedAgreement?.end_date ? dayjs(parseDateString(selectedAgreement?.end_date)) : null,
    consideration: selectedAgreement?.consideration || '',
    classes: selectedAgreement?.classes || '',
    docs_url: selectedAgreement?.docs_url || ''
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
      const start_date = dayjs(formData.start_date)
      const end_date = dayjs(formData.end_date)

      payload.append('client_id', formData.client)
      payload.append('type', formData.type)
      payload.append('signatory_1', formData.signatory_1)
      payload.append('signatory_2', formData.signatory_2)
      payload.append('signatory_3', formData.signatory_3)
      payload.append('witness_1', formData.witness_1)
      payload.append('witness_2', formData.witness_2)
      payload.append('start_date', start_date.format('YYYY-MM-DD'))
      payload.append('end_date', end_date.format('YYYY-MM-DD'))
      payload.append('consideration', formData.consideration)
      payload.append('classes', formData.classes)

      if (file && file[0] && file[0] instanceof File) {
        payload.append('file', file[0])
      } else if (fileName) {
        payload.append('docs_url', fileName)
      }

      let data
      if (!isUpdate) {
        data = await apiRequest('post', '/agreement', payload, {}, null)
      } else {
        payload.append('_method', 'PUT')
        data = await apiRequest('post', `/agreement/${selectedAgreement?.id}`, payload, {}, null)
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
        showErrorToast('Error while processing the agreement', 5000)
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
        maxSize={20 * 1024 * 1024}
        disabled={false}
      />
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader sx={{ pb: 5 }} title='Agreement Details' titleTypographyProps={{ variant: 'h6' }} />
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
                      renderInput={params => <TextField {...params} label='Client *' error={Boolean(errors.client)} />}
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
                <InputLabel id='type-select-label'>Type *</InputLabel>
                <Controller
                  name='type'
                  control={control}
                  render={({ field }) => (
                    <Select
                      labelId='type-select-label'
                      {...field}
                      label='Type *'
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

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='signatory_1'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label='Signatory 1 *'
                      error={Boolean(errors.signatory_1)}
                      placeholder='Partner of the Firm'
                    />
                  )}
                />
                {errors.signatory_1 && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.signatory_1.message}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='signatory_2'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label='Signatory 2'
                      error={Boolean(errors.signatory_2)}
                      placeholder='Director or Manager of the Client'
                    />
                  )}
                />
                {errors.signatory_2 && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.signatory_2.message}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='signatory_3'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label='Signatory 3 *'
                      error={Boolean(errors.signatory_3)}
                      placeholder='Principal or Head of the Client'
                    />
                  )}
                />
                {errors.signatory_3 && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.signatory_3.message}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='witness_1'
                  control={control}
                  render={({ field }) => <TextField {...field} label='Witness 1' error={Boolean(errors.witness_1)} />}
                />
                {errors.witness_1 && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.witness_1.message}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='witness_2'
                  control={control}
                  render={({ field }) => <TextField {...field} label='Witness 2' error={Boolean(errors.witness_2)} />}
                />
                {errors.witness_2 && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.witness_2.message}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <Controller
                    name='start_date'
                    control={control}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <DatePicker
                        label='Start Date *'
                        value={value}
                        onChange={onChange}
                        onBlur={onBlur}
                        slotProps={{
                          textField: {
                            error: Boolean(errors.start_date)
                          }
                        }}
                        format='DD-MM-YYYY'
                      />
                    )}
                  />
                </LocalizationProvider>
                {errors.start_date && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.start_date.message}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <Controller
                    name='end_date'
                    control={control}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <DatePicker
                        label='End Date *'
                        value={value}
                        onChange={onChange}
                        onBlur={onBlur}
                        slotProps={{
                          textField: {
                            error: Boolean(errors.end_date)
                          }
                        }}
                        format='DD-MM-YYYY'
                      />
                    )}
                  />
                </LocalizationProvider>
                {errors.end_date && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.end_date.message}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='consideration'
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label='Consideration *' error={Boolean(errors.consideration)} type='number' />
                  )}
                />
                {errors.consideration && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.consideration.message}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='classes'
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label='Classes *' error={Boolean(errors.classes)} type='number' />
                  )}
                />
                {errors.classes && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.classes.message}</FormHelperText>
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

export default EditAgreement
