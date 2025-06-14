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
import { TextField, Autocomplete, MenuItem, InputLabel } from '@mui/material'
import { Box, Select, Typography, Button, FormControlLabel, Switch } from '@mui/material'
import { DataGrid, GridRow } from '@mui/x-data-grid'
import { LoadingButton } from '@mui/lab'
import dayjs from 'dayjs'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'

// ** Other Imports
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import useCustomToast from 'src/@core/hooks/useCustomToast'
import { AbilityContext } from 'src/layouts/components/acl/Can'
import { useDraggable, DndContext, rectIntersection, useDroppable } from '@dnd-kit/core'
import { arrayMove, SortableContext } from '@dnd-kit/sortable'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'

const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: 300
    }
  }
}

const columns = () => [
  {
    field: 'drag',
    headerName: '↕',
    sortable: false,
    width: 50,
    renderCell: params => (
      <span {...params.row.dragHandleProps} style={{ cursor: 'grab', display: 'flex', alignItems: 'center' }}>
        ⠿
      </span>
    )
  },
  {
    field: 'sno',
    headerName: 'S.No',
    width: 80
  },
  {
    field: 'item',
    headerName: 'Item',
    width: 250,
    renderCell: params => (
      <div>
        <Typography variant='body1' style={{ fontSize: '15px' }}>
          {params.row.item.name}
        </Typography>
        <Typography variant='body2' style={{ fontStyle: 'italic', fontSize: '13px', color: '#FF69B4' }}>
          ({params.row.item.id}) - ({params.row.item.unit})
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
    field: 'taxable_value',
    headerName: 'Base Price',
    width: 150,
    renderCell: params => (
      <div>
        <Typography variant='body1' style={{ fontSize: '15px' }}>
          {params.row.taxable_value}
        </Typography>
        <Typography variant='body2' style={{ fontStyle: 'italic', fontSize: '13px', color: '#FF69B4' }}>
          ({params.row.gst}%)
        </Typography>
      </div>
    )
  },
  {
    field: 'rate',
    headerName: 'Rate (GST Inc)',
    width: 180,
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
    field: 'profit',
    headerName: 'Profit %',
    width: 120,
    editable: true,
    renderCell: params => (
      <TextField
        type='number'
        name='profit'
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
    field: 'net_gain',
    headerName: 'Net Gain',
    width: 120
  },
  {
    field: 'quantity',
    headerName: 'QTY',
    width: 120,
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
    field: 'amount',
    headerName: 'Amount',
    width: 150
  }
]

function DraggableRow({ row, index, style, ...props }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
    transform: dragTransform
  } = useDraggable({
    id: row.id
  })

  const { isOver, setNodeRef: setDroppableRef } = useDroppable({
    id: row.id
  })

  const translate = dragTransform
    ? {
        transform: `translate3d(${dragTransform.x}px, ${dragTransform.y}px, 0)`,
        transition: 'transform 0.1s ease'
      }
    : {}

  const handleDrag = event => {
    const targetCell = event.target.closest('.MuiDataGrid-cell')

    if (!targetCell || targetCell.getAttribute('data-field') !== 'drag') {
      return
    }

    listeners?.onPointerDown?.(event)
  }

  return (
    <GridRow
      ref={node => {
        setNodeRef(node)
        setDroppableRef(node)
      }}
      {...attributes}
      {...listeners}
      {...props}
      onPointerDown={handleDrag}
      style={{
        ...style,
        ...translate,
        height: props.style?.height || 'auto',
        backgroundColor: isOver ? '#a3a9ff' : 'inherit',
        color: isOver ? 'white' : 'inherit',
        boxShadow: isDragging ? '0px 4px 10px rgba(0, 0, 0, 0.2)' : 'none',
        opacity: isDragging ? 0.8 : 1,
        transition: 'background-color 0.2s ease, opacity 0.2s ease'
      }}
    />
  )
}

const parseDateString = dateString => {
  const [day, month, year] = dateString.split('-')

  return new Date(`${year}-${month}-${day}`)
}

const EditProposal = ({ dropdown, selectedProposal }) => {
  // ** States
  const [loading, setLoading] = useState({ fetchAll: false, submit: false })
  const isUpdate = selectedProposal?.id !== undefined
  const clientList = dropdown?.client || []
  const [type, setType] = useState(selectedProposal?.proposal_type?.id || '')
  const [templates, setTemplates] = useState([])
  const [isDialogOpen, setDialogOpen] = useState({ template: false })
  const [values, setValues] = useState({ item_id: '', rate: '', quantity: '' })
  const itemList = dropdown?.item || []
  const [total, setTotal] = useState(0)
  const [selectedRows, setSelectedRows] = useState([])
  const [isDate, setIsDate] = useState(Boolean(selectedProposal?.valid_upto))

  const typeList = dropdown?.proposal_type?.map(({ id, name }) => (
    <MenuItem key={id} value={id}>
      {name}
    </MenuItem>
  ))

  const noteList = dropdown?.note?.map(({ id, name }) => (
    <MenuItem key={id} value={id}>
      {name}
    </MenuItem>
  ))

  const accountList = dropdown?.bank?.map(({ id, name }) => (
    <MenuItem key={id} value={id}>
      {name}
    </MenuItem>
  ))

  let schema
  if (isDate) {
    schema = yup.object().shape({
      client: yup.string().required('Client is required'),
      proposal_note: yup.string().required('Proposal Note is required'),
      bank_account: yup.string().required('Bank Account is required'),
      valid_upto: yup.date().typeError('Invalid date')
    })
  } else {
    schema = yup.object().shape({
      client: yup.string().required('Client is required'),
      proposal_note: yup.string().required('Proposal Note is required'),
      bank_account: yup.string().required('Bank Account is required'),
      valid_for: yup.string().required('Valid For is required')
    })
  }

  const { apiRequest } = useApi()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const ability = useContext(AbilityContext)
  const canEdit = ability.can('edit', 'proposal')
  const canCreate = ability.can('create', 'proposal')

  // ** Abort Controller
  const controller = new AbortController()
  const signal = controller.signal

  // ** Form
  const defaultValues = {
    client: selectedProposal?.client?.id || null,
    proposal_note: selectedProposal?.proposal_note?.id || '',
    bank_account: selectedProposal?.bank_account?.id || '',
    valid_upto: selectedProposal?.valid_upto ? dayjs(parseDateString(selectedProposal?.valid_upto)) : null,
    valid_for: selectedProposal?.valid_for || ''
  }

  const {
    handleSubmit,
    control,
    reset,
    getValues,
    formState: { errors }
  } = useForm({ defaultValues, resolver: yupResolver(schema) })

  const onError = () => {
    showErrorToast('Validation failed', 5000)
  }

  const fetchTemplates = async () => {
    try {
      setLoading(prev => ({ ...prev, fetchAll: true }))
      let items
      if (!isUpdate) {
        const data = await apiRequest('get', '/proposal_templates?id=' + type, null, {}, signal)

        items = data?.map((template, index) => {
          const { rate, item } = template
          const gst = Number(item?.igst ?? (Number(item?.cgst) || 0) + (Number(item?.sgst) || 0))
          const taxable_value = parseFloat(((Number(rate) * 100) / (100 + gst)).toFixed(2))
          const net_gain = parseFloat((Number(rate) * 110) / 100).toFixed(2)
          const amount = (((Number(rate) * 110) / 100) * 1).toFixed(2)

          return {
            ...template,
            sno: index + 1,
            taxable_value: taxable_value,
            gst: gst,
            profit: 0,
            quantity: 1,
            net_gain: net_gain,
            amount: amount
          }
        })
      } else {
        items = selectedProposal?.proposal_items?.map((template, index) => {
          const { rate, cgst, sgst, igst, quantity } = template
          const gst = Number(igst ?? (Number(cgst) || 0) + (Number(sgst) || 0))
          const taxable_value = parseFloat(((Number(rate) * 100) / (100 + gst)).toFixed(2))
          const net_gain = parseFloat((Number(rate) * 110) / 100).toFixed(2)
          const amount = (((Number(rate) * 110) / 100) * 1).toFixed(2)

          return {
            ...template,
            sno: index + 1,
            taxable_value: taxable_value,
            gst: gst,
            profit: 0,
            quantity: quantity,
            net_gain: net_gain,
            amount: amount
          }
        })
      }

      setTemplates(items)
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted')
      } else {
        console.log(error)
        showErrorToast('Something went wrong', 5000)
      }
    } finally {
      setLoading(prev => ({ ...prev, fetchAll: false }))
    }
  }

  // ** Submit
  const onSubmit = async formData => {
    if (modifiedTemplates.length < 1) {
      showErrorToast('No items added for proposal', 5000)

      return
    }

    try {
      setLoading(prev => ({ ...prev, submit: true }))
      let valid_upto = null
      let valid_for = null
      if (isDate) {
        const date = dayjs(formData?.valid_upto)
        valid_upto = date.format('YYYY-MM-DD')
      } else {
        valid_for = formData?.valid_for
      }

      const payload = {
        client_id: formData?.client,
        proposal_type_id: type,
        proposal_note_id: formData?.proposal_note,
        bank_account_id: formData?.bank_account,
        valid_upto: valid_upto,
        valid_for: valid_for,
        items:
          modifiedTemplates?.map(template => ({
            id: template?.id,
            item_id: template?.item?.id,
            cgst: template?.item?.cgst,
            sgst: template?.item?.sgst,
            igst: template?.item?.igst,
            quantity: template?.quantity,
            rate: template?.net_gain
          })) || []
      }

      let data
      if (!isUpdate) {
        data = await apiRequest('post', '/proposal', payload, {}, null)
        reset()
        setType('')
        setTemplates([])
        setIsDate(false)
      } else {
        const updatedPayload = { ...payload, _method: 'PUT' }
        data = await apiRequest('post', `/proposal/${selectedProposal?.id}`, updatedPayload, {}, null)
      }

      showSuccessToast(data?.message, 5000)
    } catch (error) {
      console.log(error)
      if (error?.status === 409) {
        showErrorToast(error?.response?.data?.message, 5000)
      } else {
        showErrorToast('Error while processing the proposal', 5000)
      }
    } finally {
      setLoading(prev => ({ ...prev, submit: false }))
    }
  }

  // ** Fetch proposal templates
  useEffect(() => {
    fetchTemplates()

    return () => {
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type])

  // ** Open dialog
  const openDialog = dialog => {
    setDialogOpen(prev => ({ ...prev, [dialog]: true }))
  }

  // ** Close dialog
  const closeDialog = dialog => {
    setDialogOpen(prev => ({ ...prev, [dialog]: false }))
    setValues({ ...values, item_id: '', rate: '', quantity: '' })
  }

  // ** Change template values
  const processRowUpdate = (newRow, _) => {
    setTemplates(prevTemplates => prevTemplates.map(row => (row.id === newRow.id ? newRow : row)))

    return newRow
  }

  // ** Modified for amount and total
  const modifiedTemplates = useMemo(() => {
    const updatedTemplates = templates.map(item => ({
      ...item,
      amount: parseFloat(
        (((Number(item?.rate) * (100 + Number(item?.profit))) / 100) * Number(item?.quantity)).toFixed(2)
      ),
      net_gain: parseFloat((Number(item?.rate) * (100 + Number(item?.profit))) / 100).toFixed(2),
      taxable_value: parseFloat(((Number(item?.rate) * 100) / (100 + Number(item?.gst))).toFixed(2))
    }))

    const total = updatedTemplates.reduce((acc, item) => acc + item.amount, 0).toFixed(0)
    setTotal(total)

    return updatedTemplates
  }, [templates])

  // ** Setting array after drag
  const handleDragEnd = event => {
    const { active, over } = event

    if (!over) {
      return
    }

    if (active && over && active.id !== over.id) {
      const oldIndex = templates.findIndex(row => row.id === active.id)
      const newIndex = templates.findIndex(row => row.id === over.id)
      const updatedRows = arrayMove(templates, oldIndex, newIndex)

      const updatedRowsWithSno = updatedRows.map((row, index) => ({
        ...row,
        sno: index + 1
      }))
      setTemplates(updatedRowsWithSno)
    }
  }

  // ** Handle checkbox selection
  const handleSelectionChange = selectionModel => {
    setSelectedRows(selectionModel)
  }

  // ** Delete selected rows
  const handleDelete = () => {
    if (selectedRows.length > 0) {
      setTemplates(prevTemplates => {
        const filtered = prevTemplates.filter(row => !selectedRows.includes(row.id))

        const reIndexed = filtered.map((row, index) => ({
          ...row,
          sno: index + 1
        }))

        return reIndexed
      })

      setSelectedRows([])
    } else {
      showErrorToast('No row selected', 5000)
    }
  }

  // ** Add a row to table
  const handleAdd = () => {
    closeDialog('template')

    const item = dropdown?.item?.find(item => item.id === values.item_id)
    const itemExists = templates?.some(template => template.item.id === item.id)

    if (itemExists) {
      showErrorToast('Item already exists', 5000)

      return
    }

    const gst = Number(item?.igst ?? (Number(item?.cgst) || 0) + (Number(item?.sgst) || 0))

    const newRow = {
      id: 'id' + Date.now(),
      sno: templates.length + 1,
      item: item,
      rate: values.rate,
      quantity: values.quantity,
      profit: 0,
      gst: gst,
      taxable_value: 0,
      amount: 0
    }

    setTemplates(prevTemplates => {
      const updated = [...prevTemplates, newRow]

      return updated.map((row, index) => ({
        ...row,
        sno: index + 1
      }))
    })
  }

  // ** Watching isDate
  useEffect(() => {
    reset({
      ...getValues(),
      valid_upto: isDate ? getValues().valid_upto : null,
      valid_for: isDate ? '' : getValues().valid_for
    })

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDate])

  return (
    <form onSubmit={handleSubmit(onSubmit, onError)}>
      <Card>
        <CardHeader sx={{ pb: 5 }} title='Proposal Details' titleTypographyProps={{ variant: 'h6' }} />
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
                    />
                  )}
                />
                {errors.client && <FormHelperText sx={{ color: 'error.main' }}>{errors.client.message}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id='bank-select-label' error={Boolean(errors.bank_account)}>
                  Bank Account
                </InputLabel>
                <Controller
                  name='bank_account'
                  control={control}
                  render={({ field }) => (
                    <Select
                      labelId='bank-select-label'
                      {...field}
                      label='Bank Account'
                      value={field.value}
                      error={Boolean(errors.bank_account)}
                      onChange={e => {
                        field.onChange(e)
                      }}
                      MenuProps={MenuProps}
                    >
                      {accountList}
                    </Select>
                  )}
                />
                {errors.bank_account && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.bank_account.message}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id='note-select-label' error={Boolean(errors.proposal_note)}>
                  Notes
                </InputLabel>
                <Controller
                  name='proposal_note'
                  control={control}
                  render={({ field }) => (
                    <Select
                      labelId='note-select-label'
                      {...field}
                      label='Notes'
                      value={field.value}
                      error={Boolean(errors.proposal_note)}
                      onChange={e => {
                        field.onChange(e)
                      }}
                      MenuProps={MenuProps}
                    >
                      {noteList}
                    </Select>
                  )}
                />
                {errors.proposal_note && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.proposal_note.message}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <Controller
                    name='valid_upto'
                    control={control}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <DatePicker
                        label='Valid Upto'
                        value={value}
                        onChange={onChange}
                        onBlur={onBlur}
                        slotProps={{
                          textField: {
                            error: Boolean(errors.valid_upto)
                          }
                        }}
                        format='DD-MM-YYYY'
                        disabled={!isDate}
                      />
                    )}
                  />
                </LocalizationProvider>
                {errors.valid_upto && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.valid_upto.message}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='valid_for'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label='Valid For'
                      error={Boolean(errors.valid_for)}
                      type='number'
                      disabled={isDate}
                    />
                  )}
                />
                {errors.valid_for && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.valid_for.message}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <FormControlLabel
                  control={<Switch checked={isDate} onChange={() => setIsDate(prev => !prev)} />}
                  label={isDate ? 'Valid Upto' : 'Valid For'}
                />
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
                <InputLabel id='type-select-label'>Proposal Type</InputLabel>
                <Select
                  labelId='type-select-label'
                  label='Proposal Type'
                  value={type}
                  onChange={e => setType(e.target.value)}
                  MenuProps={MenuProps}
                  disabled={isUpdate}
                >
                  {typeList}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box display='flex' justifyContent='flex-end'>
                <Button
                  variant='outlined'
                  sx={{ mr: 2 }}
                  disabled={!Boolean(type)}
                  onClick={() => openDialog('template')}
                  startIcon={<Icon icon='material-symbols:add-rounded' />}
                >
                  Add
                </Button>
                <Button
                  variant='outlined'
                  sx={{ mr: 2 }}
                  disabled={!Boolean(type)}
                  onClick={handleDelete}
                  color='error'
                  startIcon={<DeleteOutlineIcon />}
                >
                  Delete
                </Button>
              </Box>
            </Grid>
          </Grid>
          <Box sx={{ height: '60vh', width: '100%', mt: 6 }}>
            <DndContext collisionDetection={rectIntersection} onDragEnd={handleDragEnd}>
              <SortableContext items={modifiedTemplates.map(row => row.id)}>
                <DataGrid
                  rows={modifiedTemplates}
                  columns={columns()}
                  loading={loading['fetchAll']}
                  disableRowSelectionOnClick={true}
                  checkboxSelection
                  slots={{
                    row: props => <DraggableRow {...props} row={props.row} />
                  }}
                  disableColumnReorder
                  onRowSelectionModelChange={handleSelectionChange}
                  processRowUpdate={processRowUpdate}
                  onCellKeyDown={(_, event) => {
                    if (event.key === 'Enter') {
                      event.stopPropagation()
                    }
                    if (event.key === 'Tab') {
                      event.preventDefault()
                      event.stopPropagation()
                    }
                  }}
                  initialState={{
                    columns: {
                      columnVisibilityModel: {
                        profit: isUpdate ? false : true,
                        net_gain: isUpdate ? false : true
                      }
                    }
                  }}
                />
              </SortableContext>
            </DndContext>
          </Box>
          <Box sx={{ display: 'flex', height: 30, alignItems: 'center' }}>
            <Typography>
              <span>Total:</span> ₹{Number(total).toLocaleString('en-IN')}
            </Typography>
          </Box>
        </CardContent>
      </Card>
      <Dialog
        open={isDialogOpen['template']}
        onClose={() => closeDialog('template')}
        aria-labelledby='dialog-title'
        aria-describedby='dialog-description'
      >
        <DialogTitle id='dialog-title'>{'Item Details'}</DialogTitle>
        <DialogContent>
          <Box
            sx={{
              padding: 1,
              marginTop: 1,
              width: { sm: 300, xl: 400 }
            }}
          >
            <Grid container spacing={6}>
              <Grid item xs={12}>
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
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <TextField
                    value={values.rate}
                    label='Rate'
                    type='number'
                    InputProps={{
                      inputProps: { min: 0 }
                    }}
                    onChange={e => {
                      setValues({ ...values, rate: e.target.value })
                    }}
                  />
                </FormControl>
              </Grid>
              <Grid item xs={12}>
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
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => closeDialog('template')} sx={{ color: 'error.main' }}>
            Cancel
          </Button>
          <Button
            startIcon={<Icon icon='mdi:tick' />}
            size='large'
            type='button'
            sx={{ marginRight: 2 }}
            disabled={Object.values(values).some(value => !value)}
            onClick={handleAdd}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>
      <Grid container spacing={3} mt={5}>
        <Grid item xs={6} sm='auto'>
          <LoadingButton
            loading={loading['submit']}
            disabled={isUpdate ? !canEdit : !canCreate}
            loadingPosition='start'
            startIcon={<Icon icon='formkit:submit' />}
            size='large'
            type='submit'
            variant='contained'
          >
            Submit
          </LoadingButton>
        </Grid>
      </Grid>
    </form>
  )
}

export default EditProposal
