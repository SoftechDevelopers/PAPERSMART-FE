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
import { TextField, Select, InputLabel, MenuItem, Autocomplete } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import dayjs from 'dayjs'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import Switch from '@mui/material/Switch'
import { FormControlLabel, Typography } from '@mui/material'
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
  date: yup.date().typeError('Invalid date'),
  client: yup.string().required('Client is required'),
  category: yup.string().required('Category is required'),
  type: yup.string().required('Type is required'),
  comment: yup.string().required('Comment is required'),
  closing_date: yup.date().when('status', {
    is: true,
    then: () => yup.date().typeError('Invalid date'),
    otherwise: () => yup.date().nullable()
  }),
  staff_head: yup.string().when('status', {
    is: true,
    then: () => yup.string().required('Staff Head is required'),
    otherwise: () => yup.string().nullable()
  })
})

// ** Parsing date
const parseDateString = dateString => {
  const [day, month, year] = dateString.split('-')

  return new Date(`${year}-${month}-${day}`)
}

const EditTicket = ({ selectedTicket, dropdown }) => {
  // ** States
  const [loading, setLoading] = useState(false)
  const clientList = dropdown?.client || []
  const [isDisabled, setIsDisabled] = useState(true)
  const [canUpload, setCanUpload] = useState(Boolean(Number(selectedTicket?.type_id) === 5) || false)
  const [file, setFile] = useState(selectedTicket?.docs_url || null)
  const [fileName, setFileName] = useState(selectedTicket?.filename || '')
  const isUpdate = selectedTicket?.id !== undefined

  const categoryList = dropdown?.ticket_category?.map(({ id, name }) => (
    <MenuItem key={id} value={id}>
      {name}
    </MenuItem>
  ))

  const typeList = dropdown?.ticket_type?.map(({ id, name }) => (
    <MenuItem key={id} value={id}>
      {name}
    </MenuItem>
  ))

  const { apiRequest } = useApi()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const ability = useContext(AbilityContext)

  const canEdit = ability.can('edit', 'ticket')
  const canCreate = ability.can('create', 'ticket')

  // ** Form
  const defaultValues = {
    date: selectedTicket?.date ? dayjs(parseDateString(selectedTicket.date)) : dayjs(),
    client: selectedTicket?.client_id || null,
    category: selectedTicket?.category_id || '',
    type: selectedTicket?.type_id || '',
    comment: selectedTicket?.comment || '',
    closing_date: null,
    staff_head: '',
    status: false,
    docs_url: selectedTicket?.docs_url || ''
  }

  const {
    handleSubmit,
    control,
    reset,
    trigger,
    formState: { errors }
  } = useForm({ defaultValues, resolver: yupResolver(schema) })

  // ** Submit
  const onSubmit = async formData => {
    try {
      if (canUpload && !file) {
        showErrorToast('No document selected', 5000)

        return
      }

      setLoading(true)
      const status = formData?.status ? 'Closed' : 'Pending'
      const payload = new FormData()
      const date = dayjs(formData.date)
      payload.append('date', date.format('YYYY-MM-DD'))
      payload.append('client_id', formData.client)
      payload.append('category_id', formData.category)
      payload.append('type_id', formData.type)
      payload.append('comment', formData.comment)
      payload.append('status', status)
      if (formData.status) {
        const closing_date = dayjs(formData.closing_date)
        payload.append('closing_date', closing_date.format('YYYY-MM-DD'))
        payload.append('staff_head', formData.staff_head)
      }

      if (canUpload) {
        if (file && file[0] && file[0] instanceof File) {
          payload.append('file', file[0])
        } else if (fileName) {
          payload.append('docs_url', fileName)
        }
      }

      let data
      if (!isUpdate) {
        data = await apiRequest('post', '/ticket', payload, {}, null)
      } else {
        payload.append('_method', 'PUT')
        data = await apiRequest('post', `/ticket/${selectedTicket?.id}`, payload, {}, null)
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
        showErrorToast('Error while processing the ticket', 5000)
      }
    } finally {
      setLoading(false)
    }
  }

  // ** Toggle switch
  const handleStatus = checked => {
    setIsDisabled(!checked)
    if (!checked) {
      trigger()
    }
  }

  // ** Handle ticket type
  const handleType = type => {
    if (type === 5) {
      setCanUpload(true)
    } else {
      setCanUpload(false)
      setFile(null)
      setFileName('')
    }
  }

  // ** View file uploaded
  const viewFile = () => {
    if (file) {
      if (file[0] instanceof File) {
        const fileURL = URL.createObjectURL(file[0])
        window.open(fileURL, '_blank')
      } else {
        window.open(selectedTicket?.docs_url, '_blank')
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
        disabled={!canUpload}
      />
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader sx={{ pb: 5 }} title='Ticket Details' titleTypographyProps={{ variant: 'h6' }} />
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
                        minDate={!isUpdate ? dayjs() : undefined}
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
                    />
                  )}
                />
                {errors.client && <FormHelperText sx={{ color: 'error.main' }}>{errors.client.message}</FormHelperText>}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id='category-select-label' error={Boolean(errors.category)}>
                  Category
                </InputLabel>
                <Controller
                  name='category'
                  control={control}
                  render={({ field }) => (
                    <Select
                      labelId='category-select-label'
                      {...field}
                      label='Category'
                      value={field.value}
                      error={Boolean(errors.category)}
                      onChange={e => {
                        field.onChange(e)
                      }}
                    >
                      {categoryList}
                    </Select>
                  )}
                />
                {errors.category && (
                  <FormHelperText sx={{ color: 'error.main' }} id='category-select-label'>
                    {errors.category.message}
                  </FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
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
                      value={field.value}
                      error={Boolean(errors.type)}
                      onChange={e => {
                        field.onChange(e)
                        handleType(e.target.value)
                      }}
                    >
                      {typeList}
                    </Select>
                  )}
                />
                {errors.type && (
                  <FormHelperText sx={{ color: 'error.main' }} id='type-select-label'>
                    {errors.type.message}
                  </FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={12}>
              <FormControl fullWidth>
                <Controller
                  name='comment'
                  control={control}
                  render={({ field }) => <TextField {...field} label='Comment' error={Boolean(errors.comment)} />}
                />
                {errors.comment && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.comment.message}</FormHelperText>
                )}
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      {isUpdate && (
        <Card sx={{ marginTop: 5 }}>
          <CardHeader sx={{ pb: 5 }} title='Ticket Closure' titleTypographyProps={{ variant: 'h6' }} />
          <CardContent>
            <Grid item xs={12} sm={12} mb={5}>
              <FormControl>
                <Controller
                  name='status'
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          {...field}
                          checked={field.value}
                          color={field.value ? 'success' : 'default'}
                          onChange={event => {
                            field.onChange(event.target.checked)
                            handleStatus(event.target.checked)
                          }}
                        />
                      }
                      label={field.value ? 'Closed' : 'Pending'}
                      labelPlacement='end'
                    />
                  )}
                />
              </FormControl>
            </Grid>
            <Grid container spacing={6}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <Controller
                      name='closing_date'
                      control={control}
                      render={({ field: { onChange, onBlur, value } }) => (
                        <DatePicker
                          label='Closing Date'
                          value={value}
                          onChange={onChange}
                          onBlur={onBlur}
                          slotProps={{
                            textField: {
                              error: Boolean(errors.closing_date)
                            }
                          }}
                          minDate={!isUpdate ? dayjs() : undefined}
                          format='DD-MM-YYYY'
                          disabled={isDisabled}
                        />
                      )}
                    />
                  </LocalizationProvider>
                  {errors.closing_date && (
                    <FormHelperText sx={{ color: 'error.main' }}>{errors.closing_date.message}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <Controller
                    name='staff_head'
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label='Staff Head'
                        error={Boolean(errors.staff_head)}
                        disabled={isDisabled}
                      />
                    )}
                  />
                  {errors.staff_head && (
                    <FormHelperText sx={{ color: 'error.main' }}>{errors.staff_head.message}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

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

export default EditTicket
