// ** React Imports
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
import { TextField, InputLabel, Select, MenuItem, Autocomplete, Button } from '@mui/material'
import { Box, Typography, CardMedia, Stack } from '@mui/material'
import dayjs from 'dayjs'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LoadingButton } from '@mui/lab'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import { DataGrid } from '@mui/x-data-grid'
import IconButton from '@mui/material/IconButton'
import MuiDrawer from '@mui/material/Drawer'
import { styled } from '@mui/material/styles'
import Divider from '@mui/material/Divider'
import CustomChip from 'src/@core/components/mui/chip'
import Skeleton from '@mui/material/Skeleton'

// ** Other Imports
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import useCustomToast from 'src/@core/hooks/useCustomToast'
import { AbilityContext } from 'src/layouts/components/acl/Can'
import FileDropzone from 'src/layouts/components/FileDropzone'
import { useAuth } from 'src/hooks/useAuth'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import VisibilityIcon from '@mui/icons-material/Visibility'
import DeleteIcon from '@mui/icons-material/Delete'
import DescriptionIcon from '@mui/icons-material/Description'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

const parseDateString = dateString => {
  const [day, month, year] = dateString.split('-')

  return new Date(`${year}-${month}-${day}`)
}

const schema = yup.object().shape({
  party: yup.string().required('Party is required'),
  date: yup.date().typeError('Invalid date'),
  particulars: yup.string().required('Particulars is required')
})

const Drawer = styled(MuiDrawer)(({ theme }) => ({
  width: 300,
  zIndex: theme.zIndex.modal,
  '& .MuiDrawer-paper': {
    border: 0,
    width: 350,
    zIndex: theme.zIndex.modal,
    boxShadow: theme.shadows[9],
    padding: theme.spacing(4)
  }
}))

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
    width: 250,
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
    field: 'warehouse',
    headerName: 'Warehouse',
    width: 200,
    renderCell: params => (
      <div>
        <Typography variant='body1' style={{ fontSize: '15px' }}>
          {params?.row?.warehouse?.alias}
        </Typography>
      </div>
    )
  },
  {
    field: 'rate',
    headerName: 'Rate',
    width: 150,
    editable: true,
    renderCell: params => (
      <TextField
        type='number'
        name='rate'
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
    field: 'quantity',
    headerName: 'Quantity',
    width: 100,
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
        <IconButton color='secondary' onClick={() => actions.handleDrawerOpen(params.row)} size='5px'>
          <Icon icon='mdi:eye' />
        </IconButton>
        <IconButton color='error' onClick={() => actions.handleRemove(params.row)} size='5px'>
          <Icon icon='mdi:delete-outline' />
        </IconButton>
      </div>
    )
  }
]

const EditLedger = ({ selectedLedger }) => {
  // ** States
  const isUpdate = selectedLedger?.id !== undefined
  const [loading, setLoading] = useState({ dropdown: false, submit: false, itemProfile: false })
  const [dropdown, setDropdown] = useState({})
  const [partyList, setPartyList] = useState([])
  const itemList = dropdown?.item || []
  const warehouseList = dropdown?.warehouse || []
  const [partyType, setPartyType] = useState(selectedLedger?.party_type || null)

  const voucherTypes = [
    'Purchase',
    'Sales',
    'Credit Note',
    'Debit Note',
    'Payment',
    'Receipt',
    'Delivery Note',
    'Receipt Note',
    'Journal',
    'Contra'
  ]

  const transactionNatures = ['Goods', 'Service', 'Professional Service', 'Miscellaneous']
  const transactionTypes = ['Cheque', 'Cash', 'Transfer', 'Debit Card', 'Netbanking', 'UPI', 'Loan']
  const [voucherType, setVoucherType] = useState(selectedLedger?.vch_type || voucherTypes[0])
  const [file, setFile] = useState(selectedLedger?.docs_url || null)
  const [fileName, setFileName] = useState(selectedLedger?.filename || '')
  const [items, setItems] = useState(selectedLedger?.items || [])
  const [values, setValues] = useState({ item_id: '', rate: '', quantity: '', warehouse_id: '' })
  const [total, setTotal] = useState(0)
  const [isDrawerOpen, setDrawerOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [itemProfile, setItemProfile] = useState({})

  const { apiRequest } = useApi()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const ability = useContext(AbilityContext)
  const canEdit = ability.can('edit', 'ledger')
  const canCreate = ability.can('create', 'ledger')
  const { user } = useAuth()
  const fiscalData = user?.fiscalRange.find(item => item.fiscal === user?.currentFiscal)

  // ** Abort Controller
  const controller = new AbortController()
  const signal = controller.signal

  // ** Fetch dropdowns
  useEffect(() => {
    const fetchDropdowns = async () => {
      setLoading(prev => ({ ...prev, dropdown: true }))
      try {
        const data = await apiRequest(
          'get',
          '/dropdowns?tables=vendor,client,head,all_staff,all_partner,item,warehouse',
          null,
          {},
          signal
        )

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

  // ** Initial setup
  useEffect(() => {
    if (!dropdown) return

    let head = []

    if (voucherType === 'Purchase' || voucherType === 'Debit Note') {
      head = dropdown.head?.filter(item => item.ledger_group_id === 34)
    }

    if (voucherType === 'Sales' || voucherType === 'Credit Note') {
      head = dropdown.head?.filter(item => item.ledger_group_id === 35)
    }

    if (
      voucherType === 'Delivery Note' ||
      voucherType === 'Receipt Note' ||
      voucherType === 'Credit Note' ||
      voucherType === 'Debit Note'
    ) {
      head = dropdown.head?.filter(item => item.ledger_group_id === 34 || item.ledger_group_id === 35)
    }

    if (voucherType === 'Payment' || voucherType === 'Receipt' || voucherType === 'Journal') {
      head = dropdown.head?.filter(item => item.ledger_group_id !== 15)
    }

    if (voucherType === 'Contra') {
      head = dropdown.head?.filter(item => item.ledger_group_id === 1)
    }

    const map = {
      Vendor: dropdown.vendor,
      Client: dropdown.client,
      Head: head,
      Staff: dropdown.all_staff,
      Partner: dropdown.all_partner
    }

    setPartyList(map[partyType] || [])

    const partyKeyMap = {
      Vendor: 'vendor',
      Client: 'client',
      Head: 'head',
      Staff: 'staff',
      Partner: 'partner'
    }

    const key = partyKeyMap[partyType]
    if (isUpdate) {
      setValue('party', selectedLedger[key]?.id)
    } else {
      reset()
      setFile(null)
      setFileName('')
      setItems([])
      setValues({ item_id: '', rate: '', quantity: '' })
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partyType, dropdown, isUpdate])

  // ** Form
  const defaultValues = {
    party: null,
    date: selectedLedger?.date ? dayjs(parseDateString(selectedLedger?.date)) : null,
    particulars: selectedLedger?.particulars || '',
    vch_no: selectedLedger?.vch_no || '',
    credit: selectedLedger?.credit || '',
    debit: selectedLedger?.debit || '',
    taxable_value: selectedLedger?.taxable_value || '',
    original_invoice: selectedLedger?.original_invoice || '',
    transaction_nature: selectedLedger?.transaction_nature || '',
    transaction_type: selectedLedger?.transaction_type || '',
    cgst: selectedLedger?.cgst || '',
    sgst: selectedLedger?.sgst || '',
    igst: selectedLedger?.igst || '',
    round_off: selectedLedger?.round_off || '',
    discount: selectedLedger?.discount || '',
    freight_charges: selectedLedger?.freight_charges || ''
  }

  const {
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors }
  } = useForm({ defaultValues, resolver: yupResolver(schema) })

  // ** Submit
  const onSubmit = async formData => {
    if (
      (voucherType === 'Purchase' ||
        voucherType === 'Sales' ||
        voucherType === 'Credit Note' ||
        voucherType === 'Debit Note' ||
        voucherType === 'Delivery Note' ||
        voucherType === 'Receipt Note') &&
      !file
    ) {
      showErrorToast('No file attached', 5000)

      return
    }

    if (voucherType !== 'Delivery Note' && voucherType !== 'Receipt Note' && !formData.credit && !formData.debit) {
      showErrorToast('Amount is required', 5000)

      return
    }

    if (formData.credit && formData.debit) {
      showErrorToast('Both Credit & Debit are not allowed', 5000)

      return
    }

    if ((voucherType === 'Purchase' || voucherType === 'Sales') && !formData.transaction_nature) {
      showErrorToast('Mention Transaction Nature in More Info', 5000)

      return
    }

    if (voucherType === 'Credit Note' && !formData.original_invoice) {
      showErrorToast('Mention Original Invoice No in More Info', 5000)

      return
    }

    if ((voucherType === 'Payment' || voucherType === 'Receipt') && !formData.transaction_type) {
      showErrorToast('Mention Transaction Type in more info', 5000)

      return
    }
    try {
      setLoading(prev => ({ ...prev, submit: true }))
      const payload = new FormData()
      const date = dayjs(formData.date)

      payload.append('vch_type', voucherType)
      partyType === 'Vendor' && payload.append('vendor_id', formData.party)
      partyType === 'Client' && payload.append('client_id', formData.party)
      partyType === 'Head' && payload.append('head_id', formData.party)
      partyType === 'Staff' && payload.append('staff_id', formData.party)
      partyType === 'Partner' && payload.append('partner_id', formData.party)
      payload.append('date', date.format('YYYY-MM-DD'))
      payload.append('particulars', formData.particulars)
      payload.append('vch_no', formData.vch_no || '')
      payload.append('credit', formData.credit || '')
      payload.append('debit', formData.debit || '')
      payload.append('taxable_value', formData.taxable_value || '')
      payload.append('transaction_nature', formData.transaction_nature || '')
      payload.append('transaction_type', formData.transaction_type || '')
      payload.append('original_invoice', formData.original_invoice || '')
      payload.append('cgst', formData.cgst || '')
      payload.append('sgst', formData.sgst || '')
      payload.append('igst', formData.igst || '')
      payload.append('round_off', formData.round_off || '')
      payload.append('discount', formData.discount || '')
      payload.append('freight_charges', formData.freight_charges || '')

      if (file && file[0] && file[0] instanceof File) {
        payload.append('file', file[0])
      } else if (fileName) {
        payload.append('docs_url', fileName)
      }

      items.forEach((item, index) => {
        payload.append(`items[${index}][id]`, item['id'])
        payload.append(`items[${index}][ledger_id]`, item['ledger_id'])
        payload.append(`items[${index}][item_id]`, item['item_id'])
        payload.append(`items[${index}][rate]`, item['rate'])
        payload.append(`items[${index}][quantity]`, item['quantity'])
        payload.append(`items[${index}][warehouse_id]`, item['warehouse_id'])
      })

      let data
      if (!isUpdate) {
        data = await apiRequest('post', '/ledger', payload, {}, null)
      } else {
        payload.append('_method', 'PUT')
        data = await apiRequest('post', `/ledger/${selectedLedger?.id}`, payload, {}, null)
      }

      showSuccessToast(data?.message, 5000)

      if (!isUpdate) {
        reset()
        setFile(null)
        setFileName('')
        setItems([])
        setValues({ item_id: '', rate: '', quantity: '' })
      }
    } catch (error) {
      if (error?.status === 409) {
        showErrorToast(error?.response?.data?.message, 5000)
      } else {
        showErrorToast('Error while processing the entry', 5000)
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
        window.open(selectedLedger?.docs_url, '_blank')
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

  // ** Setup items array
  const modifiedItems = useMemo(() => {
    const total = items.reduce((acc, item) => acc + item.rate * item.quantity, 0).toFixed(0)
    setTotal(total)

    return items?.map((item, index) => ({
      ...item,
      sno: index + 1
    }))
  }, [items])

  //   ** Add items to array
  const handleAdd = () => {
    const selectedItem = itemList.find(item => item.id === values.item_id)
    const selectedWarehouse = warehouseList.find(warehouse => warehouse.id === values.warehouse_id)
    const itemExists = items?.some(i => i.item.id === values.item_id)

    if (itemExists) {
      showErrorToast('Item already exists', 5000)

      return
    }

    const newItem = {
      id: 'id' + Date.now(),
      item_id: values.item_id,
      rate: values.rate,
      quantity: values.quantity,
      warehouse_id: values.warehouse_id,
      item: {
        id: selectedItem.id,
        name: selectedItem.name,
        model: selectedItem.model,
        manufacturer: selectedItem.manufacturer,
        unit: selectedItem.unit
      },
      warehouse: {
        id: selectedWarehouse.id,
        alias: selectedWarehouse.name
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

  // ** Fetch item details
  const handleDrawerOpen = row => {
    setSelectedItem(row)
    setDrawerOpen(true)
  }

  useEffect(() => {
    const getItemProfile = async () => {
      try {
        setLoading(prev => ({ ...prev, itemProfile: true }))
        const data = await apiRequest('get', '/item_profile?id=' + selectedItem?.item_id, null, {}, signal)
        setItemProfile(data)
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log('Fetch aborted')
        } else {
          console.error(error)
        }
      } finally {
        setLoading(prev => ({ ...prev, itemProfile: false }))
      }
    }

    if (isDrawerOpen && selectedItem) {
      getItemProfile()
    }

    return () => {
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDrawerOpen])

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {!isUpdate && (
        <Card>
          <CardHeader sx={{ pb: 5 }} title='Voucher Type' titleTypographyProps={{ variant: 'h6' }} />
          <CardContent>
            <Grid container spacing={6}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id='type-select-label'>Voucher Type</InputLabel>
                  <Select
                    labelId='type-select-label'
                    label='Voucher Type'
                    value={voucherType}
                    onChange={e => {
                      setVoucherType(e.target.value)
                      setPartyType(null)
                    }}
                  >
                    {voucherTypes.map(item => (
                      <MenuItem key={item} value={item}>
                        {item}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl>
                  <RadioGroup
                    row
                    aria-labelledby='demo-row-radio-buttons-group-label'
                    name='row-radio-buttons-group'
                    onChange={event => {
                      setPartyType(event.target.value)
                      reset(prev => ({ ...prev, party: null }))
                    }}
                    value={partyType}
                  >
                    <FormControlLabel
                      value='Vendor'
                      control={<Radio />}
                      label='Vendor'
                      disabled={voucherType === 'Sales' || voucherType === 'Contra'}
                    />
                    <FormControlLabel
                      value='Client'
                      control={<Radio />}
                      label='Client'
                      disabled={voucherType === 'Purchase' || voucherType === 'Contra'}
                    />
                    <FormControlLabel value='Head' control={<Radio />} label='Head' />
                    <FormControlLabel
                      value='Staff'
                      control={<Radio />}
                      label='Staff'
                      disabled={voucherType !== 'Journal'}
                    />
                    <FormControlLabel
                      value='Partner'
                      control={<Radio />}
                      label='Partner'
                      disabled={voucherType !== 'Journal'}
                    />
                  </RadioGroup>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {partyType && (
        <Card sx={{ mt: 5 }}>
          <CardHeader sx={{ pb: 5 }} title={`${voucherType} Details`} titleTypographyProps={{ variant: 'h6' }} />
          <CardContent>
            <Grid container spacing={6}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <Controller
                    name='party'
                    control={control}
                    render={({ field }) => (
                      <Autocomplete
                        {...field}
                        options={partyList}
                        getOptionLabel={option => option?.name || ''}
                        onChange={(_, data) => {
                          field.onChange(data ? data.id : null)
                        }}
                        isOptionEqualToValue={(option, value) => option && value && option.id === value.id}
                        renderInput={params => <TextField {...params} label='Party' error={Boolean(errors.party)} />}
                        value={partyList?.find(party => party.id === Number(field.value)) || null}
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
                  {errors.party && <FormHelperText sx={{ color: 'error.main' }}>{errors.party.message}</FormHelperText>}
                </FormControl>
              </Grid>
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
                          slotProps={{
                            textField: {
                              error: Boolean(errors.date)
                            }
                          }}
                          format='DD-MM-YYYY'
                          minDate={dayjs(parseDateString(fiscalData?.start_date))}
                          maxDate={dayjs(parseDateString(fiscalData?.end_date))}
                        />
                      )}
                    />
                  </LocalizationProvider>
                  {errors.date && <FormHelperText sx={{ color: 'error.main' }}>{errors.date.message}</FormHelperText>}
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <Controller
                    name='particulars'
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} label='Particulars' error={Boolean(errors.particulars)} />
                    )}
                  />
                  {errors.particulars && (
                    <FormHelperText sx={{ color: 'error.main' }}>{errors.particulars.message}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <Controller
                    name='vch_no'
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} label='Voucher Number' error={Boolean(errors.vch_no)} />
                    )}
                  />
                  {errors.vch_no && (
                    <FormHelperText sx={{ color: 'error.main' }}>{errors.vch_no.message}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
              {(voucherType === 'Sales' ||
                voucherType === 'Credit Note' ||
                voucherType === 'Debit Note' ||
                voucherType === 'Payment' ||
                voucherType === 'Journal' ||
                voucherType === 'Contra') && (
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <Controller
                      name='credit'
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label={
                            voucherType === 'Journal' ||
                            voucherType === 'Contra' ||
                            voucherType === 'Credit Note' ||
                            voucherType === 'Debit Note'
                              ? 'Credit'
                              : 'Amount'
                          }
                          error={Boolean(errors.credit)}
                          type='number'
                        />
                      )}
                    />
                    {errors.credit && (
                      <FormHelperText sx={{ color: 'error.main' }}>{errors.credit.message}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
              )}
              {(voucherType === 'Purchase' ||
                voucherType === 'Credit Note' ||
                voucherType === 'Debit Note' ||
                voucherType === 'Receipt' ||
                voucherType === 'Journal' ||
                voucherType === 'Contra') && (
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <Controller
                      name='debit'
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label={
                            voucherType === 'Journal' ||
                            voucherType === 'Contra' ||
                            voucherType === 'Credit Note' ||
                            voucherType === 'Debit Note'
                              ? 'Debit'
                              : 'Amount'
                          }
                          error={Boolean(errors.debit)}
                          type='number'
                        />
                      )}
                    />
                    {errors.debit && (
                      <FormHelperText sx={{ color: 'error.main' }}>{errors.debit.message}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>
      )}

      {partyType && voucherType !== 'Journal' && voucherType !== 'Contra' && (
        <Accordion
          sx={{
            mt: 4,
            borderRadius: 1,
            boxShadow: 3,
            '&:before': {
              display: 'none'
            }
          }}
        >
          <AccordionSummary id='panel-header-1' aria-controls='panel-content-1' expandIcon={<ExpandMoreIcon />}>
            <Typography variant='h6' sx={{ pb: 1 }}>
              More Info
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={6}>
              {(voucherType === 'Purchase' ||
                voucherType === 'Sales' ||
                voucherType === 'Credit Note' ||
                voucherType === 'Debit Note' ||
                voucherType === 'Delivery Note' ||
                voucherType === 'Receipt Note') && (
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <Controller
                      name='taxable_value'
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label='Taxable Value'
                          error={Boolean(errors.taxable_value)}
                          type='number'
                        />
                      )}
                    />
                    {errors.taxable_value && (
                      <FormHelperText sx={{ color: 'error.main' }}>{errors.taxable_value.message}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
              )}
              {(voucherType === 'Credit Note' || voucherType === 'Debit Note') && (
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <Controller
                      name='original_invoice'
                      control={control}
                      render={({ field }) => (
                        <TextField {...field} label='Original Invoice' error={Boolean(errors.original_invoice)} />
                      )}
                    />
                    {errors.original_invoice && (
                      <FormHelperText sx={{ color: 'error.main' }}>{errors.original_invoice.message}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
              )}
              {(voucherType === 'Purchase' ||
                voucherType === 'Sales' ||
                voucherType === 'Credit Note' ||
                voucherType === 'Debit Note') && (
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel id='type-select-label'>Transaction Nature</InputLabel>
                    <Controller
                      name='transaction_nature'
                      control={control}
                      render={({ field }) => (
                        <Select
                          labelId='type-select-label'
                          {...field}
                          label='Transaction Nature'
                          value={field.value}
                          onChange={e => {
                            field.onChange(e)
                          }}
                        >
                          <MenuItem value=''>
                            <em>None</em>
                          </MenuItem>
                          {transactionNatures.map(item => (
                            <MenuItem key={item} value={item}>
                              {item}
                            </MenuItem>
                          ))}
                        </Select>
                      )}
                    />
                  </FormControl>
                </Grid>
              )}
              {(voucherType === 'Payment' || voucherType === 'Receipt') && (
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel id='select-label'>Transaction Type</InputLabel>
                    <Controller
                      name='transaction_type'
                      control={control}
                      render={({ field }) => (
                        <Select
                          labelId='select-label'
                          {...field}
                          label='Transaction Type'
                          value={field.value}
                          onChange={e => {
                            field.onChange(e)
                          }}
                        >
                          <MenuItem value=''>
                            <em>None</em>
                          </MenuItem>
                          {transactionTypes.map(item => (
                            <MenuItem key={item} value={item}>
                              {item}
                            </MenuItem>
                          ))}
                        </Select>
                      )}
                    />
                  </FormControl>
                </Grid>
              )}
            </Grid>
          </AccordionDetails>
        </Accordion>
      )}

      {partyType &&
        (voucherType === 'Purchase' ||
          voucherType === 'Sales' ||
          voucherType === 'Credit Note' ||
          voucherType === 'Debit Note' ||
          voucherType === 'Delivery Note' ||
          voucherType === 'Receipt Note') && (
          <Accordion
            sx={{
              mt: 4,
              borderRadius: 1,
              boxShadow: 3,
              '&:before': {
                display: 'none'
              }
            }}
          >
            <AccordionSummary id='panel-header-1' aria-controls='panel-content-1' expandIcon={<ExpandMoreIcon />}>
              <Typography variant='h6' sx={{ pb: 1 }}>
                Duties & Taxes
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={6}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <Controller
                      name='cgst'
                      control={control}
                      render={({ field }) => (
                        <TextField {...field} label='CGST' error={Boolean(errors.cgst)} type='number' />
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
                        <TextField {...field} label='GST' error={Boolean(errors.sgst)} type='number' />
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
                        <TextField {...field} label='IGST' error={Boolean(errors.igst)} type='number' />
                      )}
                    />
                    {errors.igst && <FormHelperText sx={{ color: 'error.main' }}>{errors.igst.message}</FormHelperText>}
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <Controller
                      name='round_off'
                      control={control}
                      render={({ field }) => (
                        <TextField {...field} label='Round Off' error={Boolean(errors.round_off)} type='number' />
                      )}
                    />
                    {errors.round_off && (
                      <FormHelperText sx={{ color: 'error.main' }}>{errors.round_off.message}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <Controller
                      name='discount'
                      control={control}
                      render={({ field }) => (
                        <TextField {...field} label='Discount' error={Boolean(errors.discount)} type='number' />
                      )}
                    />
                    {errors.discount && (
                      <FormHelperText sx={{ color: 'error.main' }}>{errors.discount.message}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <Controller
                      name='freight_charges'
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label='Freight Charges'
                          error={Boolean(errors.freight_charges)}
                          type='number'
                        />
                      )}
                    />
                    {errors.freight_charges && (
                      <FormHelperText sx={{ color: 'error.main' }}>{errors.freight_charges.message}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        )}

      {partyType &&
        (voucherType === 'Purchase' ||
          voucherType === 'Sales' ||
          voucherType === 'Credit Note' ||
          voucherType === 'Debit Note' ||
          voucherType === 'Delivery Note' ||
          voucherType === 'Receipt Note' ||
          (voucherType === 'Journal' && partyType === 'Head')) && (
          <Accordion
            sx={{
              mt: 4,
              borderRadius: 1,
              boxShadow: 3,
              '&:before': {
                display: 'none'
              }
            }}
          >
            <AccordionSummary id='panel-header-1' aria-controls='panel-content-1' expandIcon={<ExpandMoreIcon />}>
              <Typography variant='h6' sx={{ pb: 1 }}>
                Stock
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={6}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <Autocomplete
                      options={warehouseList}
                      getOptionLabel={option => option?.name || ''}
                      onChange={(_, data) => {
                        setValues({ ...values, warehouse_id: data ? data.id : null })
                      }}
                      isOptionEqualToValue={(option, value) => option && value && option.id === value.id}
                      renderInput={params => <TextField {...params} label='Warehouse' />}
                      value={warehouseList.find(warehouse => warehouse.id === Number(values.warehouse_id)) || null}
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
                  </FormControl>
                </Grid>
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
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <TextField
                      value={values?.rate}
                      label='Rate'
                      type='number'
                      onChange={e => {
                        setValues({ ...values, rate: e.target.value })
                      }}
                    />
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <TextField
                      value={values?.quantity}
                      label='Quantity'
                      type='number'
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
                      startIcon={<Icon icon='fluent:arrow-enter-16-regular' />}
                      disabled={values.item_id === null || values.rate === '' || values.quantity === ''}
                      onClick={handleAdd}
                    >
                      Add
                    </Button>
                  </Box>
                </Grid>
              </Grid>
              <Box sx={{ height: '60vh', width: '100%', mt: 6 }}>
                <DataGrid
                  rows={modifiedItems}
                  columns={columns({ actions: { handleRemove, handleDrawerOpen } })}
                  processRowUpdate={processRowUpdate}
                  sx={{
                    '& .MuiDataGrid-columnHeaders': {
                      borderTopLeftRadius: 0,
                      borderTopRightRadius: 0
                    },
                    '& .MuiDataGrid-root': {
                      borderRadius: 0
                    }
                  }}
                />
              </Box>
              <Box sx={{ display: 'flex', height: 30, alignItems: 'center' }}>
                <Typography>
                  <span>Total:</span> ₹{Number(total).toLocaleString('en-IN')}
                </Typography>
              </Box>
            </AccordionDetails>
          </Accordion>
        )}

      {partyType && (
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
      )}

      <Drawer open={isDrawerOpen} hideBackdrop anchor='right' variant='persistent'>
        {!loading['itemProfile'] ? (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Typography variant='h6'>{itemProfile?.name}</Typography>
            <IconButton onClick={() => setDrawerOpen(false)}>
              <Icon icon='mdi:close' fontSize={20} />
            </IconButton>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Skeleton animation='wave' height={30} width='50%' />
            <IconButton onClick={() => setDrawerOpen(false)}>
              <Icon icon='mdi:close' fontSize={20} />
            </IconButton>
          </Box>
        )}
        <Divider />
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            mt: 4
          }}
        >
          {!loading['itemProfile'] ? (
            <Card sx={{ width: 150 }}>
              <CardMedia component='img' height='140' image={itemProfile.image_url} alt='Item' />
            </Card>
          ) : (
            <Skeleton animation='wave' height={150} width='40%' />
          )}

          {!loading['itemProfile'] ? (
            <CustomChip skin='light' label={'ID: ' + itemProfile?.id} color='primary' sx={{ mt: 4 }} />
          ) : (
            <Skeleton animation='wave' height={40} width='40px' />
          )}

          {!loading['itemProfile'] ? (
            <Stack spacing={2} sx={{ mt: 4, width: '100%', maxWidth: 300 }}>
              <Divider />
              <Box display='flex' alignItems='center' justifyContent='space-between'>
                <Box display='flex' alignItems='center' gap={1}>
                  <Typography>Manufacturer</Typography>
                </Box>
                <Typography variant='body2' color='text.secondary'>
                  {itemProfile?.manufacturer}
                </Typography>
              </Box>
              <Box display='flex' alignItems='center' justifyContent='space-between'>
                <Box display='flex' alignItems='center' gap={1}>
                  <Typography>Model</Typography>
                </Box>
                <Typography variant='body2' color='text.secondary'>
                  {itemProfile?.model}
                </Typography>
              </Box>
              <Box display='flex' alignItems='center' justifyContent='space-between'>
                <Box display='flex' alignItems='center' gap={1}>
                  <Typography>HSN</Typography>
                </Box>
                <Typography variant='body2' color='text.secondary'>
                  {itemProfile?.hsn}
                </Typography>
              </Box>
              <Box display='flex' alignItems='center' justifyContent='space-between'>
                <Box display='flex' alignItems='center' gap={1}>
                  <Typography>CGST</Typography>
                </Box>
                <Typography variant='body2' color='text.secondary'>
                  {itemProfile?.cgst}
                </Typography>
              </Box>
              <Box display='flex' alignItems='center' justifyContent='space-between'>
                <Box display='flex' alignItems='center' gap={1}>
                  <Typography>SGST</Typography>
                </Box>
                <Typography variant='body2' color='text.secondary'>
                  {itemProfile?.sgst}
                </Typography>
              </Box>
              <Box display='flex' alignItems='center' justifyContent='space-between'>
                <Box display='flex' alignItems='center' gap={1}>
                  <Typography>IGST</Typography>
                </Box>
                <Typography variant='body2' color='text.secondary'>
                  {itemProfile?.igst}
                </Typography>
              </Box>
              <Box display='flex' alignItems='center' justifyContent='space-between'>
                <Box display='flex' alignItems='center' gap={1}>
                  <Typography>Unit</Typography>
                </Box>
                <Typography variant='body2' color='text.secondary'>
                  {itemProfile?.unit}
                </Typography>
              </Box>
              <Divider />
            </Stack>
          ) : (
            <Stack spacing={2} sx={{ mt: 4, width: '100%', maxWidth: 300 }}>
              <Divider />
              {Array.from({ length: 7 }).map((_, index) => (
                <Box key={index} display='flex' alignItems='center' justifyContent='space-between' sx={{ mb: 2 }}>
                  <Box display='flex' alignItems='center' gap={1}>
                    <Skeleton animation='wave' height={20} width='80px' />
                  </Box>
                  <Skeleton animation='wave' height={20} width='80px' />
                </Box>
              ))}
              <Divider />
            </Stack>
          )}

          {!loading['itemProfile'] ? (
            <Stack
              direction='row'
              divider={<Divider orientation='vertical' flexItem />}
              spacing={4}
              sx={{ mt: 4, justifyContent: 'center', alignItems: 'center' }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography variant='subtitle2' color='text.secondary'>
                  Total In
                </Typography>
                <Typography variant='h6' color='#67CB24'>
                  {itemProfile?.total_in}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography variant='subtitle2' color='text.secondary'>
                  Total Out
                </Typography>
                <Typography variant='h6' color='#E64542'>
                  {itemProfile?.total_out}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography variant='subtitle2' color='text.secondary'>
                  Balance
                </Typography>
                <Typography variant='h6'>{itemProfile?.stock_balance}</Typography>
              </Box>
            </Stack>
          ) : (
            <Stack
              direction='row'
              divider={<Divider orientation='vertical' flexItem />}
              spacing={4}
              sx={{ mt: 4, justifyContent: 'center', alignItems: 'center' }}
            >
              {Array.from({ length: 3 }).map((_, index) => (
                <Box key={index} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Skeleton animation='wave' height={20} width='80px' />
                  <Skeleton animation='wave' height={50} width='50px' />
                </Box>
              ))}
            </Stack>
          )}

          {!loading['itemProfile'] ? (
            <Box sx={{ mt: 6, width: '100%', maxWidth: 300, mx: 'auto' }}>
              <Divider sx={{ mb: 4 }} />
              <Typography gutterBottom>Latest Purchase</Typography>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <CustomChip
                    skin='light'
                    label={itemProfile?.latest_purchase?.date}
                    color='warning'
                    sx={{ mb: 1 }}
                    size='small'
                  />
                  <Typography variant='body2' mb={1} color='text.primary'>
                    {itemProfile?.latest_purchase?.vendor?.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant='body2'>Rate: ₹{itemProfile?.latest_purchase?.stock?.rate}</Typography>
                    <Box
                      sx={{
                        height: 16,
                        borderLeft: '1px solid',
                        borderColor: 'divider',
                        mx: 1
                      }}
                    />

                    <Typography variant='body2'>Quantity: {itemProfile?.latest_purchase?.stock?.quantity}</Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          ) : (
            <Box sx={{ mt: 6, width: '100%', maxWidth: 300, mx: 'auto' }}>
              <Divider sx={{ mb: 4 }} />
              <Skeleton animation='wave' height={30} width='80px' />
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Skeleton animation='wave' height={30} width='120px' />
                  <Skeleton animation='wave' height={20} width='60px' />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Skeleton animation='wave' height={20} width='60px' />
                    <Box
                      sx={{
                        height: 16,
                        borderLeft: '1px solid',
                        borderColor: 'divider',
                        mx: 1
                      }}
                    />

                    <Skeleton animation='wave' height={20} width='60px' />
                  </Box>
                </Box>
              </Box>
            </Box>
          )}

          {!loading['itemProfile'] ? (
            <Box sx={{ mt: 6, width: '100%', maxWidth: 300, mx: 'auto' }}>
              <Divider sx={{ mb: 4 }} />
              <Typography gutterBottom>Latest Sales</Typography>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <CustomChip
                    skin='light'
                    label={itemProfile?.latest_sales?.date}
                    color='info'
                    sx={{ mb: 1 }}
                    size='small'
                  />
                  <Typography variant='body2' mb={1} color='text.primary'>
                    {itemProfile?.latest_sales?.client?.address2}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant='body2'>Rate: ₹{itemProfile?.latest_sales?.stock?.rate}</Typography>
                    <Box
                      sx={{
                        height: 16,
                        borderLeft: '1px solid',
                        borderColor: 'divider',
                        mx: 1
                      }}
                    />

                    <Typography variant='body2'>Quantity: {itemProfile?.latest_sales?.stock?.quantity}</Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          ) : (
            <Box sx={{ mt: 6, width: '100%', maxWidth: 300, mx: 'auto' }}>
              <Divider sx={{ mb: 4 }} />
              <Skeleton animation='wave' height={30} width='80px' />
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Skeleton animation='wave' height={30} width='120px' />
                  <Skeleton animation='wave' height={20} width='60px' />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Skeleton animation='wave' height={20} width='60px' />
                    <Box
                      sx={{
                        height: 16,
                        borderLeft: '1px solid',
                        borderColor: 'divider',
                        mx: 1
                      }}
                    />

                    <Skeleton animation='wave' height={20} width='60px' />
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </Box>
      </Drawer>

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
          {isUpdate ? 'Update' : 'Submit'}
        </LoadingButton>
      </Grid>
    </form>
  )
}

export default EditLedger
