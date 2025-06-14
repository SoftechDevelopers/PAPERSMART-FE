// ** React Imports
import { useState, useEffect, useContext } from 'react'
import { useApi } from 'src/@core/api/useApi'

// ** MUI Imports
import { DataGrid } from '@mui/x-data-grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import IconButton from '@mui/material/IconButton'
import { Box, Button, Typography, Grid, Autocomplete } from '@mui/material'
import { TextField, InputLabel, Select, MenuItem, Stack } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import FormControl from '@mui/material/FormControl'
import CustomChip from 'src/@core/components/mui/chip'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Other Imports
import { AbilityContext } from 'src/layouts/components/acl/Can'
import useCustomToast from 'src/@core/hooks/useCustomToast'

const formatMonth = monthStr => {
  const date = new Date(monthStr + '-01')

  return date.toLocaleString('default', { month: 'long', year: 'numeric' })
}

const columns = ({ permissions, actions }) => [
  {
    field: 'sno',
    headerName: 'S.No',
    width: 80
  },
  {
    field: 'month',
    headerName: 'Month',
    width: 200,
    renderCell: params => (
      <div>
        <Typography variant='body1' sx={{ fontSize: '15px', color: 'error.dark' }}>
          {formatMonth(params?.row?.month)}
        </Typography>
      </div>
    )
  },
  {
    field: 'invoice_no',
    headerName: 'Invoice No',
    width: 200,
    renderCell: params => (
      <div>
        <Typography variant='body1' sx={{ fontSize: '15px' }}>
          {params?.row?.invoice?.invoice_no}
        </Typography>
      </div>
    )
  },
  {
    field: 'invoice_date',
    headerName: 'Invoice Date',
    width: 150,
    renderCell: params => (
      <div>
        <Typography variant='body1' sx={{ fontSize: '15px' }}>
          {params?.row?.invoice?.ledger?.date}
        </Typography>
      </div>
    )
  },
  {
    field: 'amount',
    headerName: 'Amount',
    width: 150,
    renderCell: params => (
      <div>
        <Typography variant='body1' sx={{ fontSize: '15px', color: '#67CB24' }}>
          {params?.row?.invoice?.ledger?.credit || params?.row?.invoice?.ledger?.debit}
        </Typography>
      </div>
    )
  },
  {
    field: 'taxable_value',
    headerName: 'Taxable Value',
    width: 150,
    renderCell: params => (
      <div>
        <Typography variant='body1' sx={{ fontSize: '15px' }}>
          {params?.row?.invoice?.ledger?.taxable_value}
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
        <IconButton color='secondary' onClick={() => actions.handleAttachment(params?.row?.invoice?.ledger?.docs_url)}>
          <Icon icon='heroicons-outline:paper-clip' />
        </IconButton>
        <IconButton color='primary' onClick={() => actions.openDialog('edit', params.row)}>
          <Icon icon='tdesign:edit' />
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

const ViewServiceInvoices = () => {
  // ** States
  const [deals, setDeals] = useState([])
  const [invoices, setInvoices] = useState([])
  const [ledgers, setLedgers] = useState([])

  const [loading, setLoading] = useState({
    fetchAll: false,
    dropdown: false,
    fetchDeals: false,
    deleteData: false,
    submit: false
  })
  const [isDialogOpen, setDialogOpen] = useState({ delete: false, edit: false })
  const partyTypes = ['Vendor', 'Client']
  const [partyType, setPartyType] = useState('')
  const [dropdown, setDropdown] = useState({})
  const vendorList = dropdown?.contracted_vendor || []
  const clientList = dropdown?.agreemented_client || []
  const [selectedParty, setSelectedParty] = useState(null)
  const [selectedDeal, setSelectedDeal] = useState(null)
  const [selectedDealDetails, setSelectedDealDetails] = useState(null)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [selectedLedger, setSelectedLedger] = useState(null)

  const { apiRequest } = useApi()
  const ability = useContext(AbilityContext)
  const canDelete = ability.can('delete', 'service_invoices')
  const canEdit = ability.can('edit', 'service_invoices')
  const { showSuccessToast, showErrorToast } = useCustomToast()

  // ** Abort Controller
  const controller = new AbortController()
  const signal = controller.signal

  // ** Fetch dropdowns
  useEffect(() => {
    const fetchDropdowns = async () => {
      setLoading(prev => ({ ...prev, dropdown: true }))
      try {
        const data = await apiRequest('get', '/dropdowns?tables=contracted_vendor,agreemented_client', null, {}, signal)
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

  // ** Fetch all
  const fetchDeals = async () => {
    try {
      setLoading(prev => ({ ...prev, fetchDeals: true }))
      let url = null
      if (partyType === 'Vendor') {
        url = '/contracts?id=' + selectedParty
      } else {
        url = '/agreement?id=' + selectedParty
      }

      const data = await apiRequest('get', url, null, {}, signal)
      setDeals(data)
    } catch (error) {
      console.log(error)
      if (error.name === 'AbortError') {
        console.log('Fetch aborted')
      } else {
        console.error(error)
      }
    } finally {
      setLoading(prev => ({ ...prev, fetchDeals: false }))
    }
  }

  useEffect(() => {
    if (selectedParty) {
      fetchDeals()
    }

    return () => {
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedParty])

  // ** Fetch all
  const fetchInvoices = async () => {
    try {
      setLoading(prev => ({ ...prev, fetchAll: true }))

      let data = null

      if (partyType === 'Vendor') {
        data = await apiRequest(
          'get',
          '/service_invoices?party_type=' + partyType + '&vendor_id=' + selectedParty + '&contract_id=' + selectedDeal,
          null,
          {},
          signal
        )
      } else {
        data = await apiRequest(
          'get',
          '/service_invoices?party_type=' + partyType + '&client_id=' + selectedParty + '&agreement_id=' + selectedDeal,
          null,
          {},
          signal
        )
      }

      const invoicesWithSerial = data?.invoices?.map((invoice, index) => ({
        ...invoice,
        sno: index + 1
      }))

      setInvoices(invoicesWithSerial)
      setLedgers(data?.ledgers)
    } catch (error) {
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
    if (selectedDeal) {
      fetchInvoices()
    }

    return () => {
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDeal])

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
    setSelectedInvoice(row)
    setDialogOpen(prev => ({ ...prev, [dialog]: true }))
  }

  // ** Close dialog
  const closeDialog = dialog => {
    setSelectedInvoice(null)
    setDialogOpen(prev => ({ ...prev, [dialog]: false }))
    setSelectedLedger(null)
  }

  // ** Delete an entry
  const handleDelete = async () => {
    try {
      setLoading(prev => ({ ...prev, deleteData: true }))
      const response = await apiRequest('delete', `/service_invoices/${selectedInvoice?.invoice?.id}`, null, {}, signal)
      showSuccessToast(response?.message, 5000)
      fetchInvoices()
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted')
      } else {
        const message = error?.response?.data?.message ?? 'Error while deleting the invoice'
        showErrorToast(message, 5000)
      }
    } finally {
      setLoading(prev => ({ ...prev, deleteData: false }))
      closeDialog('delete')
    }
  }

  // ** Edit invoice
  const handleEdit = async () => {
    try {
      setLoading(prev => ({ ...prev, submit: true }))

      const matchedLedger = ledgers.find(item => item.id === selectedLedger)

      const payload = {
        id: selectedInvoice?.invoice?.id || null,
        ledger_id: selectedLedger,
        invoice_no: matchedLedger?.vch_no,
        invoice_type: partyType === 'Vendor' ? 'Purchase' : 'Sales',
        month: selectedInvoice?.month,
        ...(partyType === 'Vendor' ? { vendor_id: selectedParty } : { client_id: selectedParty }),
        ...(partyType === 'Vendor' ? { contract_id: selectedDeal } : { agreement_id: selectedDeal })
      }

      const data = await apiRequest('post', '/service_invoices', payload, {}, null)
      showSuccessToast(data?.message, 5000)
      fetchInvoices()
    } catch (error) {
      console.log(error)
      showErrorToast('Error while processing the invoice', 5000)
    } finally {
      setLoading(prev => ({ ...prev, submit: false }))
      closeDialog('edit')
    }
  }

  return (
    <Box>
      <Card>
        <CardHeader sx={{ pb: 5 }} title='Service Invoices' titleTypographyProps={{ variant: 'h6' }} />
        <CardContent>
          <Grid container spacing={6}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Party Type</InputLabel>
                <Select
                  label='Party Type'
                  value={partyType}
                  onChange={e => {
                    setPartyType(e.target.value)
                    setSelectedParty(null)
                    setSelectedDeal(null)
                  }}
                >
                  {partyTypes.map(item => (
                    <MenuItem key={item} value={item}>
                      {item}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {partyType === 'Vendor' && (
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <Autocomplete
                    options={vendorList}
                    getOptionLabel={option => option?.name || ''}
                    onChange={(_, data) => {
                      setSelectedParty(data ? data.id : null)
                      setSelectedDeal(null)
                      setInvoices([])
                    }}
                    isOptionEqualToValue={(option, value) => option && value && option.id === value.id}
                    renderInput={params => <TextField {...params} label='Vendor' />}
                    value={vendorList.find(vendor => vendor.id === Number(selectedParty)) || null}
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
            )}

            {partyType === 'Client' && (
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <Autocomplete
                    options={clientList}
                    getOptionLabel={option => option?.name || ''}
                    onChange={(_, data) => {
                      setSelectedParty(data ? data.id : null)
                      setSelectedDeal(null)
                      setInvoices([])
                    }}
                    isOptionEqualToValue={(option, value) => option && value && option.id === value.id}
                    renderInput={params => <TextField {...params} label='Client' />}
                    value={clientList.find(client => client.id === Number(selectedParty)) || null}
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
            )}
            {partyType === 'Vendor' && (
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <Autocomplete
                    options={deals}
                    getOptionLabel={option => (option?.id).toString() || ''}
                    onChange={(_, data) => {
                      setSelectedDeal(data ? data.id : null)
                      setSelectedDealDetails(data ? data : null)
                    }}
                    isOptionEqualToValue={(option, value) => option && value && option.id === value.id}
                    renderInput={params => <TextField {...params} label='Contract' />}
                    value={deals.find(deal => deal.id === Number(selectedDeal)) || null}
                    renderOption={(props, option) => (
                      <li {...props} key={option.id} style={{ display: 'flex', alignItems: 'center' }}>
                        <div>
                          <span style={{ color: '#ff4d49' }}>{`ID: ${option.id}`}</span>
                          <br />
                          <span style={{ fontSize: '13px', fontStyle: 'italic' }}>License: </span>
                          <span style={{ color: '#E4A324', fontSize: '13px', fontStyle: 'italic' }}>
                            {option.license}
                          </span>
                          <br />
                          <span style={{ fontSize: '13px', fontStyle: 'italic' }}>Fee: </span>
                          <span style={{ color: '#E4A324', fontSize: '13px', fontStyle: 'italic' }}>{option.fee}</span>
                        </div>
                      </li>
                    )}
                    loading={loading['fetchDeals']}
                  />
                </FormControl>
              </Grid>
            )}
            {partyType === 'Client' && (
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <Autocomplete
                    options={deals}
                    getOptionLabel={option => (option?.id).toString() || ''}
                    onChange={(_, data) => {
                      setSelectedDeal(data ? data.id : null)
                      setSelectedDealDetails(data ? data : null)
                    }}
                    isOptionEqualToValue={(option, value) => option && value && option.id === value.id}
                    renderInput={params => <TextField {...params} label='Agreement' />}
                    value={deals.find(deal => deal.id === Number(selectedDeal)) || null}
                    renderOption={(props, option) => (
                      <li {...props} key={option.id} style={{ display: 'flex', alignItems: 'center' }}>
                        <div>
                          <span style={{ color: '#ff4d49' }}>{`ID: ${option.id}`}</span>
                          <br />
                          <span style={{ fontSize: '13px', fontStyle: 'italic' }}>Classes: </span>
                          <span style={{ color: '#E4A324', fontSize: '13px', fontStyle: 'italic' }}>
                            {option.classes}
                          </span>
                          <br />
                          <span style={{ fontSize: '13px', fontStyle: 'italic' }}>Type: </span>
                          <span style={{ color: '#E4A324', fontSize: '13px', fontStyle: 'italic' }}>{option.type}</span>
                        </div>
                      </li>
                    )}
                    loading={loading['fetchDeals']}
                  />
                </FormControl>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>
      {partyType === 'Vendor' && selectedDeal && (
        <Card sx={{ mt: 5 }}>
          <CardContent>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} alignItems='flex-start'>
              <Stack spacing={3} flex={1}>
                <Box display='flex' alignItems='center' gap={1}>
                  <Typography variant='subtitle2' color='text.secondary'>
                    Start Date:
                  </Typography>
                  <CustomChip skin='light' label={selectedDealDetails?.start_date || 'N/A'} color='primary' />
                </Box>

                <Box display='flex' alignItems='center' gap={1}>
                  <Typography variant='subtitle2' color='text.secondary'>
                    End Date:
                  </Typography>
                  <CustomChip skin='light' label={selectedDealDetails?.end_date || 'N/A'} color='primary' />
                </Box>
              </Stack>

              <Box
                sx={{
                  width: {
                    xs: '100%',
                    sm: '1px'
                  },
                  height: {
                    xs: '1px',
                    sm: 'auto'
                  },
                  bgcolor: 'divider',
                  alignSelf: 'stretch'
                }}
              />

              <Stack spacing={3} flex={1}>
                <Box display='flex' alignItems='center' gap={1}>
                  <Typography variant='subtitle2' color='text.secondary'>
                    Fee:
                  </Typography>
                  <Typography variant='body1' fontWeight={500}>
                    ₹{selectedDealDetails?.fee || '0'}
                  </Typography>
                </Box>

                <Box display='flex' alignItems='center' gap={1}>
                  <Typography variant='subtitle2' color='text.secondary'>
                    License
                  </Typography>
                  <Typography variant='body1' fontWeight={500}>
                    {selectedDealDetails?.license || 'Not Available'}
                  </Typography>
                </Box>
              </Stack>

              <Box
                sx={{
                  width: {
                    xs: '100%',
                    sm: '1px'
                  },
                  height: {
                    xs: '1px',
                    sm: 'auto'
                  },
                  bgcolor: 'divider',
                  alignSelf: 'stretch'
                }}
              />

              <Stack spacing={3} flex={1}>
                <Box display='flex' alignItems='center' gap={1}>
                  <Typography variant='subtitle2' color='text.secondary'>
                    Monthly Billing:
                  </Typography>
                  <Typography variant='body1' fontWeight={500}>
                    ₹{selectedDealDetails?.monthly}
                  </Typography>
                </Box>

                <Box display='flex' alignItems='center' gap={1}>
                  <Typography variant='subtitle2' color='text.secondary'>
                    Quarterly Billing:
                  </Typography>
                  <Typography variant='body1' fontWeight={500}>
                    ₹{selectedDealDetails?.quarterly}
                  </Typography>
                </Box>
              </Stack>

              <Box
                sx={{
                  width: {
                    xs: '100%',
                    sm: '1px'
                  },
                  height: {
                    xs: '1px',
                    sm: 'auto'
                  },
                  bgcolor: 'divider',
                  alignSelf: 'stretch'
                }}
              />

              <Stack spacing={3} flex={1}>
                <Box display='flex' alignItems='center' gap={1}>
                  <Typography variant='subtitle2' color='text.secondary'>
                    Type:
                  </Typography>
                  <Typography variant='body1' fontWeight={500}>
                    {selectedDealDetails?.type}
                  </Typography>
                </Box>

                <Box display='flex' alignItems='center' gap={1}>
                  <Button
                    variant='outlined'
                    onClick={() => {
                      handleAttachment(selectedDealDetails?.docs_url)
                    }}
                  >
                    Download
                  </Button>
                </Box>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      )}

      {partyType === 'Client' && selectedDeal && (
        <Card sx={{ mt: 5 }}>
          <CardContent>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} alignItems='flex-start'>
              <Stack spacing={3} flex={1}>
                <Box display='flex' alignItems='center' gap={1}>
                  <Typography variant='subtitle2' color='text.secondary'>
                    Start Date:
                  </Typography>
                  <CustomChip skin='light' label={selectedDealDetails?.start_date || 'N/A'} color='primary' />
                </Box>

                <Box display='flex' alignItems='center' gap={1}>
                  <Typography variant='subtitle2' color='text.secondary'>
                    End Date:
                  </Typography>
                  <CustomChip skin='light' label={selectedDealDetails?.end_date || 'N/A'} color='primary' />
                </Box>
              </Stack>

              <Box
                sx={{
                  width: {
                    xs: '100%',
                    sm: '1px'
                  },
                  height: {
                    xs: '1px',
                    sm: 'auto'
                  },
                  bgcolor: 'divider',
                  alignSelf: 'stretch'
                }}
              />

              <Stack spacing={3} flex={1}>
                <Box display='flex' alignItems='center' gap={1}>
                  <Typography variant='subtitle2' color='text.secondary'>
                    Consideration:
                  </Typography>
                  <Typography variant='body1' fontWeight={500}>
                    ₹{selectedDealDetails?.consideration || '0'}
                  </Typography>
                </Box>

                <Box display='flex' alignItems='center' gap={1}>
                  <Typography variant='subtitle2' color='text.secondary'>
                    Classes
                  </Typography>
                  <Typography variant='body1' fontWeight={500}>
                    {selectedDealDetails?.classes || 'Not Available'}
                  </Typography>
                </Box>
              </Stack>

              <Box
                sx={{
                  width: {
                    xs: '100%',
                    sm: '1px'
                  },
                  height: {
                    xs: '1px',
                    sm: 'auto'
                  },
                  bgcolor: 'divider',
                  alignSelf: 'stretch'
                }}
              />

              <Stack spacing={3} flex={1}>
                <Box display='flex' alignItems='center' gap={1}>
                  <Typography variant='subtitle2' color='text.secondary'>
                    Signatory 2:
                  </Typography>
                  <Typography variant='body1' fontWeight={500}>
                    {selectedDealDetails?.signatory_2}
                  </Typography>
                </Box>

                <Box display='flex' alignItems='center' gap={1}>
                  <Typography variant='subtitle2' color='text.secondary'>
                    Signatory 3:
                  </Typography>
                  <Typography variant='body1' fontWeight={500}>
                    {selectedDealDetails?.signatory_3}
                  </Typography>
                </Box>
              </Stack>

              <Box
                sx={{
                  width: {
                    xs: '100%',
                    sm: '1px'
                  },
                  height: {
                    xs: '1px',
                    sm: 'auto'
                  },
                  bgcolor: 'divider',
                  alignSelf: 'stretch'
                }}
              />

              <Stack spacing={3} flex={1}>
                <Box display='flex' alignItems='center' gap={1}>
                  <Typography variant='subtitle2' color='text.secondary'>
                    Type:
                  </Typography>
                  <Typography variant='body1' fontWeight={500}>
                    {selectedDealDetails?.type}
                  </Typography>
                </Box>

                <Box display='flex' alignItems='center' gap={1}>
                  <Button
                    variant='outlined'
                    onClick={() => {
                      handleAttachment(selectedDealDetails?.docs_url)
                    }}
                  >
                    Download
                  </Button>
                </Box>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      )}
      {selectedDeal && (
        <Card sx={{ mt: 5 }}>
          <CardContent>
            <Box sx={{ height: 'calc(55vh)', width: '100%', marginTop: 6 }}>
              <DataGrid
                rows={invoices}
                columns={columns({
                  permissions: { canDelete, canEdit },
                  actions: { handleAttachment, openDialog }
                })}
                loading={loading['fetchAll']}
              />
            </Box>
          </CardContent>
        </Card>
      )}
      <Dialog
        open={isDialogOpen['delete']}
        onClose={() => closeDialog('delete')}
        aria-labelledby='alert-dialog-title'
        aria-describedby='alert-dialog-description'
      >
        <DialogTitle id='alert-dialog-title'>{'Delete Invoice'}</DialogTitle>
        <DialogContent>
          <DialogContentText id='alert-dialog-description'>
            Are you sure you want to delete this invoice?
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
        open={isDialogOpen['edit']}
        onClose={() => closeDialog('edit')}
        aria-labelledby='alert-dialog-title'
        aria-describedby='alert-dialog-description'
      >
        <DialogTitle id='alert-dialog-title'>{'Edit Invoice'}</DialogTitle>
        <DialogContent>
          <Box sx={{ padding: 1, marginTop: 1, width: { sm: 300, xl: 400 } }}>
            <Grid container spacing={6}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <Autocomplete
                    options={ledgers}
                    getOptionLabel={option => option?.vch_no || ''}
                    onChange={(_, data) => {
                      setSelectedLedger(data ? data.id : null)
                    }}
                    isOptionEqualToValue={(option, value) => option && value && option.id === value.id}
                    renderInput={params => <TextField {...params} label='Invoice No' />}
                    value={ledgers.find(ledger => ledger.id === Number(selectedLedger)) || null}
                    renderOption={(props, option) => (
                      <li {...props} key={option.id} style={{ display: 'flex', alignItems: 'center' }}>
                        <div>
                          <span style={{ color: '#ff4d49' }}>{`ID: ${option.id}`}</span>
                          <br />
                          <span style={{ fontSize: '13px', fontStyle: 'italic' }}>Invoice No: </span>
                          <span style={{ color: '#E4A324', fontSize: '13px', fontStyle: 'italic' }}>
                            {option.vch_no}
                          </span>
                          <br />
                          <span style={{ fontSize: '13px', fontStyle: 'italic' }}>Date: </span>
                          <span style={{ color: '#E4A324', fontSize: '13px', fontStyle: 'italic' }}>{option.date}</span>
                          <br />
                          <span style={{ fontSize: '13px', fontStyle: 'italic' }}>Amount: </span>
                          <span style={{ color: '#E4A324', fontSize: '13px', fontStyle: 'italic' }}>
                            {option?.credit ? option?.credit : option?.debit}
                          </span>
                        </div>
                      </li>
                    )}
                    loading={loading['fetchDeals']}
                  />
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => closeDialog('edit')} sx={{ color: 'error.main' }}>
            Cancel
          </Button>
          {canEdit && (
            <LoadingButton
              onClick={handleEdit}
              autoFocus
              loading={loading['submit']}
              loadingPosition='start'
              startIcon={<Icon icon='mdi:tick' />}
              disabled={Boolean(!selectedLedger)}
            >
              Submit
            </LoadingButton>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ViewServiceInvoices
