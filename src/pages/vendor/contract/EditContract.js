// ** React Imports
import { useState, useContext, useEffect } from 'react'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { useApi } from 'src/@core/api/useApi'

// ** MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import { TextField, InputLabel, Select, MenuItem } from '@mui/material'
import { Autocomplete, IconButton, Button } from '@mui/material'
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
import RemoveIcon from '@mui/icons-material/Remove'

const schema = yup.object().shape({
  vendor: yup.string().required('Vendor is required'),
  fee: yup.string().required('Fee is required'),
  start_date: yup.date().typeError('Invalid date'),
  end_date: yup.date().typeError('Invalid date'),
  licenses: yup.array().of(
    yup.object().shape({
      client_id: yup.string().required('Client is required'),
      license: yup
        .number()
        .typeError('License must be a number')
        .min(1, 'License must be at least 1')
        .required('License is required')
    })
  )
})

// ** Parsing date
const parseDateString = dateString => {
  const [day, month, year] = dateString.split('-')

  return new Date(`${year}-${month}-${day}`)
}

const EditContract = ({ selectedContract }) => {
  // ** States
  const [loading, setLoading] = useState({ dropdown: false, submit: false })
  const [dropdown, setDropdown] = useState({})
  const vendorList = dropdown?.vendor || []
  const clientList = dropdown?.client || []
  const isUpdate = selectedContract?.id !== undefined
  const types = ['Content Service', 'Service', 'Professional Service', 'Others']
  const [file, setFile] = useState(selectedContract?.docs_url || null)
  const [fileName, setFileName] = useState(selectedContract?.filename || '')

  const newRow = {
    id: 'id' + Date.now(),
    contract_id: null,
    client_id: null,
    license: 0
  }

  const { apiRequest } = useApi()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const ability = useContext(AbilityContext)
  const canEdit = ability.can('edit', 'contract')
  const canCreate = ability.can('create', 'contract')

  // ** Abort Controller
  const controller = new AbortController()
  const signal = controller.signal

  // ** Fetch dropdowns
  useEffect(() => {
    const fetchDropdowns = async () => {
      setLoading(prev => ({ ...prev, dropdown: true }))
      try {
        const data = await apiRequest('get', '/dropdowns?tables=vendor,client', null, {}, signal)
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
    vendor: selectedContract?.vendor?.id || null,
    fee: selectedContract?.fee || '',
    type: selectedContract?.type || types[0],
    start_date: selectedContract?.start_date ? dayjs(parseDateString(selectedContract?.start_date)) : null,
    end_date: selectedContract?.end_date ? dayjs(parseDateString(selectedContract?.end_date)) : null,
    licenses: selectedContract?.licenses?.length > 0 ? selectedContract.licenses : [newRow]
  }

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors }
  } = useForm({ defaultValues, resolver: yupResolver(schema) })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'licenses'
  })

  // ** Submit
  const onSubmit = async formData => {
    try {
      setLoading(prev => ({ ...prev, submit: true }))

      if (!file) {
        showErrorToast('No file attached', 5000)

        return
      }

      const clientIds = formData.licenses.map(license => license.client_id)
      const hasDuplicates = new Set(clientIds).size !== clientIds.length

      if (hasDuplicates) {
        showErrorToast('Duplicate clients in licenses', 5000)

        return
      }

      const payload = new FormData()
      const start_date = dayjs(formData.start_date)
      const end_date = dayjs(formData.end_date)
      payload.append('vendor_id', formData.vendor)
      payload.append('fee', formData.fee)
      payload.append('type', formData.type)
      payload.append('start_date', start_date.format('YYYY-MM-DD'))
      payload.append('end_date', end_date.format('YYYY-MM-DD'))

      if (file && file[0] && file[0] instanceof File) {
        payload.append('file', file[0])
      } else if (fileName) {
        payload.append('docs_url', fileName)
      }

      formData?.licenses.forEach((license, index) => {
        payload.append(`licenses[${index}][id]`, license['id'])
        payload.append(`licenses[${index}][contract_id]`, license['contract_id'])
        payload.append(`licenses[${index}][client_id]`, license['client_id'])
        payload.append(`licenses[${index}][license]`, license['license'])
      })

      let data
      if (!isUpdate) {
        data = await apiRequest('post', '/contract', payload, {}, null)
      } else {
        payload.append('_method', 'PUT')
        data = await apiRequest('post', `/contract/${selectedContract?.id}`, payload, {}, null)
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
        showErrorToast('Error while processing the contract', 5000)
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
        window.open(selectedContract?.docs_url, '_blank')
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
        <CardHeader sx={{ pb: 5 }} title='Contract Details' titleTypographyProps={{ variant: 'h6' }} />
        <CardContent>
          <Grid container spacing={6}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='vendor'
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      {...field}
                      options={vendorList}
                      getOptionLabel={option => option?.name || ''}
                      onChange={(_, data) => {
                        field.onChange(data ? data.id : null)
                      }}
                      isOptionEqualToValue={(option, value) => option && value && option.id === value.id}
                      renderInput={params => <TextField {...params} label='Vendor' error={Boolean(errors.vendor)} />}
                      value={vendorList.find(vendor => vendor.id === Number(field.value)) || null}
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
                {errors.vendor && <FormHelperText sx={{ color: 'error.main' }}>{errors.vendor.message}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='fee'
                  control={control}
                  render={({ field }) => <TextField {...field} label='Fee' error={Boolean(errors.fee)} type='number' />}
                />
                {errors.fee && <FormHelperText sx={{ color: 'error.main' }}>{errors.fee.message}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id='type-select-label'>Type</InputLabel>
                <Controller
                  name='type'
                  control={control}
                  render={({ field }) => (
                    <Select
                      labelId='type-select-label'
                      {...field}
                      label='Type'
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
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <Controller
                    name='start_date'
                    control={control}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <DatePicker
                        label='Start Date'
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
                        label='End Date'
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
      <Card sx={{ marginTop: 5 }}>
        <CardHeader sx={{ pb: 5 }} title='Licenses' titleTypographyProps={{ variant: 'h6' }} />
        <CardContent>
          <Grid container spacing={6} mb={6} justifyContent='flex-end'>
            <Button
              variant='outlined'
              onClick={() =>
                append({
                  id: 'id' + Date.now(),
                  contract_id: null,
                  client_id: null,
                  license: 0
                })
              }
            >
              <Icon icon='material-symbols:add' />
              Add
            </Button>
          </Grid>

          <Box>
            {fields.map((field, index) => (
              <Grid container spacing={6} key={field.id}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <Controller
                      name={`licenses.${index}.client_id`}
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
                          renderInput={params => (
                            <TextField
                              {...params}
                              label='Client'
                              error={Boolean(errors?.licenses?.[index]?.client_id)}
                            />
                          )}
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
                    {errors?.licenses?.[index]?.client_id && (
                      <FormHelperText sx={{ color: 'error.main' }}>
                        {errors?.licenses?.[index]?.client_id?.message}
                      </FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                <Grid item xs={9} sm={5} mb={6}>
                  <FormControl fullWidth>
                    <Controller
                      name={`licenses.${index}.license`}
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label='License'
                          type='number'
                          error={Boolean(errors?.licenses?.[index]?.license)}
                        />
                      )}
                    />
                    {errors?.licenses?.[index]?.license && (
                      <FormHelperText sx={{ color: 'error.main' }}>
                        {errors?.licenses?.[index]?.license?.message}
                      </FormHelperText>
                    )}
                  </FormControl>
                </Grid>

                {index > 0 && (
                  <Grid item xs={1} sm={1}>
                    <IconButton color='error' onClick={() => remove(index)}>
                      <RemoveIcon />
                    </IconButton>
                  </Grid>
                )}
              </Grid>
            ))}
          </Box>
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

export default EditContract
