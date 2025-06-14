// ** React Imports
import { useState, useEffect, useContext, useMemo } from 'react'
import { useApi } from 'src/@core/api/useApi'

// ** MUI Imports
import { DataGrid } from '@mui/x-data-grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import IconButton from '@mui/material/IconButton'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import Button from '@mui/material/Button'
import { Box, Grid, TextField, InputLabel, Select, MenuItem, CircularProgress } from '@mui/material'
import { Autocomplete, Typography } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import FormControl from '@mui/material/FormControl'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Other Imports
import { AbilityContext } from 'src/layouts/components/acl/Can'
import useCustomToast from 'src/@core/hooks/useCustomToast'

const columns = ({ permissions, actions }) => [
  {
    field: 'sno',
    headerName: 'S.No',
    width: 80
  },
  {
    field: 'type',
    headerName: 'Type',
    width: 180
  },
  {
    field: 'party',
    headerName: 'Party',
    width: 200,
    renderCell: params => (
      <Box sx={{ display: 'flex', flexDirection: 'column', marginLeft: 2 }}>
        {params?.row?.ledger?.vendor_id && <span variant='body2'>{params?.row?.ledger?.vendor?.name}</span>}
        {params?.row?.ledger?.client_id && <span variant='body2'>{params?.row?.ledger?.client?.address2}</span>}
        {params?.row?.ledger?.head_id && <span variant='body2'>{params?.row?.ledger?.head?.name}</span>}
        {params?.row?.ledger?.staff_id && <span variant='body2'>{params?.row?.ledger?.staff?.name}</span>}
        {params?.row?.ledger?.partner_id && <span variant='body2'>{params?.row?.ledger?.partner?.name}</span>}
      </Box>
    )
  },
  {
    field: 'particulars',
    headerName: 'Particulars',
    width: 200
  },
  {
    field: 'rate',
    headerName: 'Rate',
    width: 150
  },
  {
    field: 'qty_in',
    headerName: 'Qty In',
    width: 100,
    renderCell: params => (
      <div>
        <Typography variant='body1' sx={{ fontSize: '15px', color: 'success.dark' }}>
          {params?.row?.qty_in}
        </Typography>
      </div>
    )
  },
  {
    field: 'qty_out',
    headerName: 'Qty Out',
    width: 100,
    renderCell: params => (
      <div>
        <Typography variant='body1' sx={{ fontSize: '15px', color: 'error.dark' }}>
          {params?.row?.qty_out}
        </Typography>
      </div>
    )
  },
  {
    field: 'warehouse',
    headerName: 'Warehouse',
    width: 150,
    renderCell: params => (
      <div>
        <Typography variant='body1' style={{ fontSize: '15px' }}>
          {params?.row?.warehouse?.alias}
        </Typography>
      </div>
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
        <IconButton color='secondary' onClick={() => actions.handleAttachment(params?.row?.ledger?.docs_url)}>
          <Icon icon='heroicons-outline:paper-clip' />
        </IconButton>
        {permissions.canDelete && (
          <IconButton
            color='error'
            onClick={() => {
              actions.openDialog('delete', params.row)
            }}
          >
            <Icon icon='mdi:delete-outline' />
          </IconButton>
        )}
      </div>
    )
  }
]

const ViewStock = () => {
  // ** States
  const [stocks, setStocks] = useState([])
  const [footers, setFooters] = useState([])

  const [loading, setLoading] = useState({
    fetchAll: false,
    deleteData: false,
    dropdown: false,
    submit: false
  })
  const [isDialogOpen, setDialogOpen] = useState({ delete: false, stock: false })
  const [selectedStock, setSelectedStock] = useState(null)
  const [dropdown, setDropdown] = useState({})
  const categoryList = dropdown?.category || []
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)
  const types = ['Inward', 'Outward']
  const [selectedType, setSelectedType] = useState('')
  const [values, setValues] = useState({ warehouse_id: '', particulars: '', qty_in: '', qty_out: '' })

  const warehouseList = dropdown?.warehouse?.map(({ id, name }) => (
    <MenuItem key={id} value={id}>
      {name}
    </MenuItem>
  ))

  const { apiRequest } = useApi()
  const ability = useContext(AbilityContext)
  const canDelete = ability.can('delete', 'stock')
  const { showSuccessToast, showErrorToast } = useCustomToast()

  // ** Abort Controller
  const controller = new AbortController()
  const signal = controller.signal

  // ** Fetch dropdowns

  const fetchDropdowns = async () => {
    setLoading(prev => ({ ...prev, dropdown: true }))
    try {
      const data = await apiRequest('get', '/dropdowns?tables=category,item,warehouse', null, {}, signal)
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

  // ** Filter items array according to category
  const filteredItems = useMemo(() => {
    const itemList = dropdown?.item || []

    return itemList?.filter(i => i.category_id === selectedCategory)
  }, [dropdown, selectedCategory])

  // ** Fetch all
  const fetchAll = async () => {
    try {
      setLoading(prev => ({ ...prev, fetchAll: true }))
      const data = await apiRequest('get', '/stocks?id=' + selectedItem, null, {}, signal)

      const stocksWithSerial = data?.stocks?.map((item, index) => ({
        ...item,
        sno: index + 1
      }))
      setStocks(stocksWithSerial)
      setFooters(data)
    } catch (error) {
      console.log(error)
      if (error.name === 'AbortError') {
        console.log('Fetch aborted')
      } else {
        console.error(error)
      }
    } finally {
      setLoading(prev => ({ ...prev, fetchAll: false }))
    }
  }

  useEffect(() => {
    if (selectedItem) {
      fetchAll()
    }

    return () => {
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItem])

  // ** Download attachment
  const handleAttachment = pdfUrl => {
    if (pdfUrl) {
      pdfUrl += `?t=${new Date().getTime()}`
      window.open(pdfUrl, '_blank')
    } else {
      showErrorToast('No attachment found', 5000)
    }
  }

  // ** Open dialog
  const openDialog = (dialog, row) => {
    setSelectedStock(row)
    setDialogOpen(prev => ({ ...prev, [dialog]: true }))
  }

  // ** Close dialog
  const closeDialog = dialog => {
    setSelectedStock(null)
    setValues({ warehouse_id: '', particulars: '', qty_in: '', qty_out: '' })
    setSelectedType('')
    setDialogOpen(prev => ({ ...prev, [dialog]: false }))
  }

  // ** Delete an entry
  const handleDelete = async () => {
    try {
      setLoading(prev => ({ ...prev, deleteData: true }))
      const response = await apiRequest('delete', `/stock/${selectedStock?.id}`, null, {}, signal)
      showSuccessToast(response?.message, 5000)
      fetchAll()
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted')
      } else {
        const message = error?.response?.data?.message ?? 'Error while deleting the stock'
        showErrorToast(message, 5000)
      }
    } finally {
      setLoading(prev => ({ ...prev, deleteData: false }))
      closeDialog('delete')
    }
  }

  //   ** Function to add stock
  const handleAdd = async () => {
    try {
      const payload = {
        item_id: selectedItem,
        qty_in: values?.qty_in || null,
        qty_out: values?.qty_out || null,
        warehouse_id: values?.warehouse_id || null,
        particulars: values?.particulars
      }
      setLoading(prev => ({ ...prev, submit: true }))

      const data = await apiRequest('post', '/stock', payload, {}, null)
      fetchAll()
      showSuccessToast(data?.message, 5000)
    } catch (error) {
      if (error?.status === 409) {
        showErrorToast(error?.response?.data?.message, 5000)
      } else {
        showErrorToast('Error while processing the stock', 5000)
      }
    } finally {
      setLoading(prev => ({ ...prev, submit: false }))
      closeDialog('stock')
    }
  }

  return (
    <Card>
      <CardHeader sx={{ pb: 5 }} title='Stock' titleTypographyProps={{ variant: 'h6' }} />
      <CardContent>
        <Grid container spacing={6}>
          <Grid item xs={12} sm={5}>
            <FormControl fullWidth>
              <Autocomplete
                options={categoryList}
                getOptionLabel={option => option?.name || ''}
                onChange={(_, data) => {
                  setSelectedCategory(data ? data.id : null)
                  setStocks([])
                }}
                isOptionEqualToValue={(option, value) => option && value && option.id === value.id}
                renderInput={params => <TextField {...params} label='Category' />}
                value={categoryList.find(vendor => vendor.id === Number(selectedCategory)) || null}
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
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={5}>
            <FormControl fullWidth>
              <Autocomplete
                options={filteredItems}
                getOptionLabel={option => option?.name || ''}
                onChange={(_, data) => {
                  setSelectedItem(data ? data.id : null)
                  setStocks([])
                }}
                isOptionEqualToValue={(option, value) => option && value && option.id === value.id}
                renderInput={params => <TextField {...params} label='Item' />}
                value={filteredItems.find(vendor => vendor.id === Number(selectedItem)) || null}
                renderOption={(props, option) => (
                  <li {...props} key={option.id} style={{ display: 'flex', alignItems: 'center' }}>
                    <div>
                      <span style={{ color: '#ff4d49' }}>{`ID: ${option.id}`}</span>
                      <br />
                      <span style={{ fontSize: '13px', fontStyle: 'italic' }}>Name: </span>
                      <span style={{ color: '#E4A324', fontSize: '13px', fontStyle: 'italic' }}>{option.name}</span>
                      <br />
                      <span style={{ fontSize: '13px', fontStyle: 'italic' }}>Manufacturer: </span>
                      <span style={{ color: '#E4A324', fontSize: '13px', fontStyle: 'italic' }}>
                        {option.manufacturer}
                      </span>
                      <br />
                      <span style={{ fontSize: '13px', fontStyle: 'italic' }}>Model: </span>
                      <span style={{ color: '#E4A324', fontSize: '13px', fontStyle: 'italic' }}>{option.model}</span>
                      <br />
                      <span style={{ fontSize: '13px', fontStyle: 'italic' }}>Unit: </span>
                      <span style={{ color: '#E4A324', fontSize: '13px', fontStyle: 'italic' }}>{option.unit}</span>
                    </div>
                  </li>
                )}
                loading={loading['dropdown']}
              />
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2}>
            <Box display='flex' justifyContent='flex-end'>
              <Button
                variant='outlined'
                sx={{ mr: 2 }}
                onClick={() => openDialog('stock')}
                startIcon={<Icon icon='material-symbols:add-rounded' />}
                disabled={!selectedItem}
              >
                Stock
              </Button>
            </Box>
          </Grid>
        </Grid>
        <Box sx={{ height: 'calc(55vh)', width: '100%', marginTop: 6 }}>
          <DataGrid
            rows={stocks}
            columns={columns({
              permissions: { canDelete },
              actions: { handleAttachment, openDialog }
            })}
            loading={loading['fetchAll']}
          />
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Typography>
              <span>Total Inward:</span> <span style={{ color: '#67CB24' }}>{Number(footers?.total_qty_in || 0)}</span>
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography>
              <span>Total Outward:</span>{' '}
              <span style={{ color: '#E64542' }}>{Number(footers?.total_qty_out || 0)}</span>
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography>
              <span>Balance:</span> <span style={{ color: '#5C61E6' }}>{Number(footers?.balance || 0)}</span>
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
      <Dialog
        open={isDialogOpen['delete']}
        onClose={() => closeDialog('delete')}
        aria-labelledby='alert-dialog-title'
        aria-describedby='alert-dialog-description'
      >
        <DialogTitle id='alert-dialog-title'>{'Delete Stock'}</DialogTitle>
        <DialogContent>
          <DialogContentText id='alert-dialog-description'>
            Are you sure you want to delete this stock?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => closeDialog('delete')} sx={{ color: 'error.main' }}>
            No
          </Button>
          <LoadingButton
            onClick={handleDelete}
            autoFocus
            loading={loading['deleteData']}
            loadingPosition='start'
            startIcon={<Icon icon='mdi:tick' />}
          >
            Yes
          </LoadingButton>
        </DialogActions>
      </Dialog>
      <Dialog
        open={isDialogOpen['stock']}
        onClose={() => closeDialog('stock')}
        aria-labelledby='alert-dialog-title'
        aria-describedby='alert-dialog-description'
      >
        <DialogTitle id='alert-dialog-title'>{'Stock Journal'}</DialogTitle>
        <DialogContent>
          <Box sx={{ padding: 1, marginTop: 1, width: { sm: 300, xl: 400 } }}>
            <Grid container spacing={6}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    label='Type'
                    value={selectedType}
                    onChange={e => {
                      setSelectedType(e.target.value)
                    }}
                  >
                    {types.map(item => (
                      <MenuItem key={item} value={item}>
                        {item}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              {selectedType === 'Inward' && (
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel id='warehouse-select-model'>Warehouse</InputLabel>
                    <Select
                      labelId='warehouse-select-model'
                      label='Warehouse'
                      value={values.warehouse_id}
                      onChange={e => {
                        setValues({ ...values, warehouse_id: e.target.value, qty_out: '' })
                      }}
                    >
                      {loading['dropdown'] ? (
                        <MenuItem disabled>
                          <CircularProgress size={20} style={{ marginRight: 10 }} />
                        </MenuItem>
                      ) : (
                        warehouseList
                      )}
                    </Select>
                  </FormControl>
                </Grid>
              )}

              <Grid item xs={12}>
                <FormControl fullWidth>
                  <TextField
                    value={values.particulars}
                    label='Particulars'
                    placeholder='Reason for stock adjustment'
                    onChange={e => {
                      setValues({ ...values, particulars: e.target.value })
                    }}
                  />
                </FormControl>
              </Grid>

              {selectedType === 'Inward' && (
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <TextField
                      value={values.qty_in}
                      label='Qty In'
                      type='number'
                      InputProps={{
                        inputProps: { min: 0 }
                      }}
                      onChange={e => {
                        setValues({ ...values, qty_in: e.target.value, qty_out: '' })
                      }}
                    />
                  </FormControl>
                </Grid>
              )}

              {selectedType === 'Outward' && (
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <TextField
                      value={values.qty_out}
                      label='Qty Out'
                      type='number'
                      InputProps={{
                        inputProps: { min: 0 }
                      }}
                      onChange={e => {
                        setValues({ ...values, qty_in: '', qty_out: e.target.value, warehouse_id: '' })
                      }}
                    />
                  </FormControl>
                </Grid>
              )}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => closeDialog('stock')} sx={{ color: 'error.main' }}>
            Cancel
          </Button>
          <LoadingButton
            onClick={handleAdd}
            autoFocus
            loading={loading['submit']}
            loadingPosition='start'
            startIcon={<Icon icon='mdi:tick' />}
            disabled={
              !values.particulars || (!values.qty_in && !values.qty_out) || (values.qty_in && !values.warehouse_id)
            }
          >
            Submit
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Card>
  )
}

export default ViewStock
