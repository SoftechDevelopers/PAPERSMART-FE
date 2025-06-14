// React Imports
import { useState, useContext, useEffect, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useApi } from 'src/@core/api/useApi'

// ** MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import { TextField, Autocomplete, Button } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import dayjs from 'dayjs'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { Typography } from '@mui/material'
import { Box } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import IconButton from '@mui/material/IconButton'

// ** Other Imports
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import useCustomToast from 'src/@core/hooks/useCustomToast'
import { AbilityContext } from 'src/layouts/components/acl/Can'
import { useAuth } from 'src/hooks/useAuth'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

const schema = yup.object().shape({
  vendor: yup.string().required('Vendor is required'),
  ship_to: yup.string().required('Shipping Address is required'),
  deadline: yup.date().typeError('Invalid date')
})

// ** Parsing date
const parseDateString = dateString => {
  const [day, month, year] = dateString.split('-')

  return new Date(`${year}-${month}-${day}`)
}

const columns = ({ actions }) => [
  {
    field: 'sno',
    headerName: 'S.No',
    width: 80
  },
  {
    field: 'id',
    headerName: 'Item ID',
    width: 80,
    renderCell: params => (
      <div>
        <Typography variant='body1' style={{ fontSize: '15px', fontWeight: 'bold' }}>
          {params.row.item.id}
        </Typography>
      </div>
    )
  },
  {
    field: 'item',
    headerName: 'Item',
    width: 350,
    renderCell: params => (
      <div>
        <Typography variant='body1' style={{ fontSize: '15px' }}>
          {params.row.item.name}
        </Typography>
        <Typography variant='body2' style={{ fontStyle: 'italic', fontSize: '13px', color: '#FF69B4' }}>
          ({params.row.item.unit})
        </Typography>
      </div>
    )
  },
  {
    field: 'make',
    headerName: 'Make',
    width: 350,
    renderCell: params => (
      <div>
        <Typography variant='body1' style={{ fontSize: '15px' }}>
          {params.row.item.manufacturer}
        </Typography>
        <Typography variant='body2' style={{ fontStyle: 'italic', fontSize: '13px', color: '#FF69B4' }}>
          ({params.row.item.model})
        </Typography>
      </div>
    )
  },
  {
    field: 'quantity',
    headerName: 'Quantity',
    width: 150,
    editable: true,
    renderCell: params => (
      <TextField
        type='number'
        name='quantity'
        size='small'
        value={params.value}
        InputProps={{
          sx: {
            '& input': { fontSize: 14 },
            color: 'error.dark'
          }
        }}
      />
    )
  },
  {
    field: 'actions',
    headerName: 'Actions',
    width: 150,
    sortable: false,
    filterable: false,
    renderCell: params => (
      <div>
        <IconButton color='error' onClick={() => actions.handleRemove(params.row)} size='5px'>
          <Icon icon='mdi:delete-outline' />
        </IconButton>
      </div>
    )
  }
]

const EditPurchaseOrder = ({ selectedPurchaseOrder }) => {
  // ** States
  const [loading, setLoading] = useState({ submit: false, dropdown: false })
  const [dropdown, setDropdown] = useState({})
  const vendorList = dropdown?.vendor || []
  const itemList = dropdown?.item || []
  const isUpdate = selectedPurchaseOrder?.id !== undefined
  const [items, setItems] = useState(selectedPurchaseOrder?.items || [])
  const [values, setValues] = useState({ item_id: '', rate: '', uantity: '' })

  const { user } = useAuth()
  const { apiRequest } = useApi()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const ability = useContext(AbilityContext)
  const canEdit = ability.can('edit', 'purchase_order')
  const canCreate = ability.can('create', 'purchase_order')
  const fiscalData = user?.fiscalRange.find(item => item.fiscal === user?.currentFiscal)

  // ** Abort Controller
  const controller = new AbortController()
  const signal = controller.signal

  // ** Fetch dropdowns
  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        setLoading(prev => ({ ...prev, dropdown: true }))
        const data = await apiRequest('get', '/dropdowns?tables=vendor,item', null, {}, signal)

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
    vendor: selectedPurchaseOrder?.vendor?.id || null,
    ship_to: selectedPurchaseOrder?.ship_to || '',
    deadline: selectedPurchaseOrder?.date ? dayjs(parseDateString(selectedPurchaseOrder?.date)) : dayjs()
  }

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors }
  } = useForm({ defaultValues, resolver: yupResolver(schema) })

  // ** Submit
  const onSubmit = async formData => {
    if (items.length < 1) {
      showErrorToast('No item selected', 5000)

      return
    }

    try {
      setLoading(prev => ({ ...prev, submit: true }))
      const date = dayjs(formData.deadline)

      const payload = {
        vendor_id: formData.vendor,
        ship_to: formData.ship_to,
        deadline: date.format('YYYY-MM-DD'),
        items: items
      }

      let data
      if (!isUpdate) {
        data = await apiRequest('post', '/purchase_order', payload, {}, null)
      } else {
        const updatedPayload = { ...payload, _method: 'PUT' }
        data = await apiRequest('post', `/purchase_order/${selectedPurchaseOrder?.id}`, updatedPayload, {}, null)
      }

      showSuccessToast(data?.message, 5000)
      if (!isUpdate) {
        reset()
        setValues({ item_id: '', quantity: '' })
        setItems([])
      }
    } catch (error) {
      if (error?.status === 409) {
        showErrorToast(error?.response?.data?.message, 5000)
      } else {
        showErrorToast('Error while processing the purchase order', 5000)
      }
    } finally {
      setLoading(prev => ({ ...prev, submit: false }))
    }
  }

  // ** Setup items array
  const modifiedItems = useMemo(() => {
    return items?.map((item, index) => ({
      ...item,
      sno: index + 1
    }))
  }, [items])

  //   ** Add items to array
  const handleAdd = () => {
    const selectedItem = itemList.find(item => item.id === values.item_id)
    const itemExists = items?.some(i => i.item.id === values.item_id)

    if (itemExists) {
      showErrorToast('Item already exists', 5000)

      return
    }

    const newItem = {
      id: 'id' + Date.now(),
      item_id: values.item_id,
      quantity: values.quantity,
      item: {
        id: selectedItem.id,
        name: selectedItem.name,
        model: selectedItem.model,
        manufacturer: selectedItem.manufacturer,
        unit: selectedItem.unit
      }
    }

    setItems(prevItems => [...prevItems, newItem])
  }

  // ** Change items values
  const processRowUpdate = (newRow, _) => {
    setItems(prev => prev.map(row => (row.id === newRow.id ? newRow : row)))

    return newRow
  }

  // ** Remove a row from items
  const handleRemove = row => {
    const filteredRows = items.filter(item => item.id !== row.id)
    setItems(filteredRows)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader sx={{ pb: 5 }} title='Purchase Order Details' titleTypographyProps={{ variant: 'h6' }} />
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
                    />
                  )}
                />
                {errors.vendor && <FormHelperText sx={{ color: 'error.main' }}>{errors.vendor.message}</FormHelperText>}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='ship_to'
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label='Shipping Address' error={Boolean(errors.ship_to)} />
                  )}
                />
                {errors.ship_to && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.ship_to.message}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <Controller
                    name='deadline'
                    control={control}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <DatePicker
                        label='Deadline'
                        value={value}
                        onChange={onChange}
                        onBlur={onBlur}
                        minDate={!isUpdate ? dayjs() : dayjs(parseDateString(fiscalData?.start_date))}
                        maxDate={dayjs(parseDateString(fiscalData?.end_date))}
                        slotProps={{
                          textField: {
                            error: Boolean(errors.deadline)
                          }
                        }}
                        format='DD-MM-YYYY'
                      />
                    )}
                  />
                </LocalizationProvider>
                {errors.deadline && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.deadline.message}</FormHelperText>
                )}
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      <Card sx={{ mt: 5 }}>
        <CardHeader sx={{ pb: 5 }} title='Items' titleTypographyProps={{ variant: 'h6' }} />
        <CardContent>
          <Grid container spacing={6}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Autocomplete
                  options={itemList}
                  getOptionLabel={option => option?.name || ''}
                  onChange={(_, data) => {
                    setValues({ ...values, item_id: data ? data.id : null })
                  }}
                  isOptionEqualToValue={(option, value) => option && value && option.id === value.id}
                  renderInput={params => <TextField {...params} label='Item' />}
                  value={itemList.find(item => item.id === Number(values.item_id)) || null}
                  renderOption={(props, option) => (
                    <li {...props} key={option.id} style={{ display: 'flex', alignItems: 'center' }}>
                      <div>
                        <span style={{ color: '#ff4d49' }}>{`ID: ${option.id}`}</span>
                        <br />
                        <span>{`Name: ${option.name}`}</span>
                        <br />
                        <span style={{ fontSize: '0.87rem', fontStyle: 'italic', color: '#666' }}>
                          {`Manufacturer: ${option.manufacturer}`}
                        </span>
                        <br />
                        <span style={{ fontSize: '0.87rem', fontStyle: 'italic', color: '#666' }}>
                          {`Model: ${option.model}`}
                        </span>
                      </div>
                    </li>
                  )}
                />
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <TextField
                  value={values.quantity}
                  label='Quantity'
                  type='number'
                  InputProps={{
                    inputProps: { min: 0 }
                  }}
                  onChange={e => {
                    setValues({ ...values, quantity: e.target.value })
                  }}
                />
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}>
              <Box display='flex' justifyContent='flex-end'>
                <Button
                  variant='outlined'
                  sx={{ mr: 2 }}
                  startIcon={<Icon icon='material-symbols:add-rounded' />}
                  disabled={values.item_id === null || values.quantity === ''}
                  onClick={handleAdd}
                >
                  Add
                </Button>
              </Box>
            </Grid>
          </Grid>
          <Box sx={{ height: '50vh', width: '100%', mt: 6 }}>
            <DataGrid
              rows={modifiedItems}
              columns={columns({ actions: { handleRemove } })}
              processRowUpdate={processRowUpdate}
            />
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

export default EditPurchaseOrder
