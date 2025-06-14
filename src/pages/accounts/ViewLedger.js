// ** React Imports
import { useState, useEffect, useContext, useMemo } from 'react'
import { useApi } from 'src/@core/api/useApi'

// ** MUI Imports
import { DataGrid } from '@mui/x-data-grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import IconButton from '@mui/material/IconButton'
import { Box, Button, Typography, Grid, InputAdornment } from '@mui/material'
import { TextField, InputLabel, Select, MenuItem, Stack, Divider } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import dayjs from 'dayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import FormControl from '@mui/material/FormControl'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import CustomChip from 'src/@core/components/mui/chip'
import { styled } from '@mui/material/styles'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import ReceiptIcon from '@mui/icons-material/Receipt'
import CategoryIcon from '@mui/icons-material/Category'

// ** Other Imports
import { AbilityContext } from 'src/layouts/components/acl/Can'
import useCustomToast from 'src/@core/hooks/useCustomToast'
import { useAuth } from 'src/hooks/useAuth'

const TypographyStyled = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  fontSize: 14,
  cursor: 'pointer',
  textDecoration: 'none',
  color: theme.palette.text.primary,
  '&:hover': {
    color: theme.palette.primary.main
  }
}))

const parseDateString = dateString => {
  const [day, month, year] = dateString.split('-')

  return new Date(`${year}-${month}-${day}`)
}

const columns = ({ permissions, actions }) => [
  {
    field: 'sno',
    headerName: 'S.No',
    width: 80
  },
  {
    field: 'date',
    headerName: 'Date',
    width: 120
  },
  {
    field: 'party',
    headerName: 'Party',
    width: 300,
    renderCell: params => {
      let partyName = '',
        partyDetails = ''
      if (params.row.vendor) {
        partyName = params.row.vendor?.name
        partyDetails = params.row.vendor?.address2
      }

      if (params.row.client) {
        partyName = params.row.client?.address2
        partyDetails = params.row.client?.name
      }

      if (params.row.head) {
        partyName = params.row.head?.name
      }

      if (params.row.staff) {
        partyName = params.row.staff?.name
        partyDetails = params.row.staff?.father
      }

      if (params.row.partner) {
        partyName = params.row.partner?.name
      }

      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', marginLeft: 2 }}>
          <TypographyStyled onClick={() => actions.openDialog('details', params.row)}>{partyName}</TypographyStyled>
          <span style={{ fontSize: 'smaller', color: '#8A93A4', fontStyle: 'italic' }}>{partyDetails}</span>
        </Box>
      )
    }
  },
  {
    field: 'party_type',
    headerName: 'Party Type',
    width: 100,
    renderCell: params => {
      let color = 'secondary'

      if (params.row.vendor) {
        color = 'primary'
      }

      if (params.row.client) {
        color = 'warning'
      }

      if (params.row.head) {
        color = 'success'
      }

      if (params.row.staff) {
        color = 'error'
      }

      if (params.row.partner) {
        color = 'secondary'
      }

      return (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <CustomChip skin='light' label={params.row.party_type} color={color} sx={{ width: 80 }} />
        </Box>
      )
    }
  },
  {
    field: 'particulars',
    headerName: 'Particulars',
    width: 400,
    renderCell: params => (
      <Box sx={{ display: 'flex', flexDirection: 'column', marginLeft: 2 }}>
        <span>{params.row.particulars}</span>
        <span style={{ fontSize: 'smaller' }}>
          <span style={{ color: '#666CFF', fontWeight: 'bold' }}>{params.row.vch_type}</span>
          {params.row.vch_no ? <span style={{ color: '#FF69B4' }}> - {params.row.vch_no}</span> : null}
        </span>
      </Box>
    )
  },
  {
    field: 'credit',
    headerName: 'Credit',
    width: 100,
    renderCell: params => (
      <div>
        <Typography variant='body1' sx={{ fontSize: '15px', color: 'success.dark' }}>
          {params.row.credit}
        </Typography>
      </div>
    )
  },
  {
    field: 'debit',
    headerName: 'Debit',
    width: 100,
    renderCell: params => (
      <div>
        <Typography variant='body1' sx={{ fontSize: '15px', color: 'error.dark' }}>
          {params.row.debit}
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
        <IconButton color='secondary' onClick={() => actions.handleAttachment(params.row)}>
          <Icon icon='heroicons-outline:paper-clip' />
        </IconButton>
        <IconButton color='primary' onClick={() => actions.handleEdit(params.row)}>
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

const ViewLedger = ({ handleEdit }) => {
  // ** States
  const [ledgers, setLedgers] = useState([])
  const [loading, setLoading] = useState({ fetchAll: false, deleteData: false })
  const [isDialogOpen, setDialogOpen] = useState({ delete: false, details: false })
  const [searchKey, setSearchKey] = useState('')
  const [date, setDate] = useState(null)
  const types = ['Voucher Date', 'Entry Date']
  const [type, setType] = useState('')

  const { apiRequest } = useApi()
  const ability = useContext(AbilityContext)
  const canDelete = ability.can('delete', 'ledger')
  const [selectedLedger, setSelectedLedger] = useState(null)
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const { user } = useAuth()
  const fiscalData = user?.fiscalRange.find(item => item.fiscal === user?.currentFiscal)

  // ** Abort Controller
  const controller = new AbortController()
  const signal = controller.signal

  // ** Fetch all
  const fetchLedgers = async () => {
    try {
      setLoading(prev => ({ ...prev, fetchAll: true }))
      const formattedDate = dayjs(date).format('YYYY-MM-DD')
      const data = await apiRequest('get', '/ledgers?date=' + formattedDate + '&type=' + type, null, {}, signal)

      const ledgersWithSerial = data?.map((ledger, index) => ({
        ...ledger,
        sno: index + 1
      }))
      setLedgers(ledgersWithSerial)
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
    if (date && type) {
      fetchLedgers()
    }

    return () => {
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, type])

  // ** Open dialog
  const openDialog = (dialog, row) => {
    setSelectedLedger(row)
    setDialogOpen(prev => ({ ...prev, [dialog]: true }))
  }

  // ** Close dialog
  const closeDialog = dialog => {
    setSelectedLedger(null)
    setDialogOpen(prev => ({ ...prev, [dialog]: false }))
  }

  // Filter ledgers array according to search key
  const filteredLedgers = useMemo(() => {
    return ledgers
      ?.filter(v => v.particulars.toLowerCase().includes(searchKey.toLowerCase()))
      .map((ledger, index) => ({
        ...ledger,
        sno: index + 1
      }))
  }, [ledgers, searchKey])

  // ** Delete an entry
  const handleDelete = async () => {
    try {
      setLoading(prev => ({ ...prev, deleteData: true }))
      const response = await apiRequest('delete', `/ledger/${selectedLedger?.id}`, null, {}, signal)

      showSuccessToast(response?.message, 5000)
      fetchLedgers()
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted')
      } else {
        const message = error?.response?.data?.message ?? 'Error while deleting the entry'
        showErrorToast(message, 5000)
      }
    } finally {
      setLoading(prev => ({ ...prev, deleteData: false }))
      closeDialog('delete')
    }
  }

  // Download attachment
  const handleAttachment = row => {
    let pdfUrl = row.docs_url

    if (pdfUrl) {
      pdfUrl += `?t=${new Date().getTime()}`
      window.open(pdfUrl, '_blank')
    } else {
      showErrorToast('No attachment found', 5000)
    }
  }

  return (
    <Card>
      <CardHeader sx={{ pb: 5 }} title='Day Book' titleTypographyProps={{ variant: 'h6' }} />
      <CardContent>
        <Grid container spacing={6}>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label='Date'
                  value={date}
                  onChange={value => {
                    setDate(value)
                  }}
                  format='DD-MM-YYYY'
                  minDate={dayjs(parseDateString(fiscalData?.start_date))}
                  maxDate={dayjs(parseDateString(fiscalData?.end_date))}
                />
              </LocalizationProvider>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                label='Type'
                value={type}
                onChange={e => {
                  setType(e.target.value)
                }}
                disabled={!date}
              >
                {types.map(item => (
                  <MenuItem key={item} value={item}>
                    {item}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              value={searchKey}
              fullWidth
              label='Search'
              onChange={e => setSearchKey(e.target.value)}
              placeholder='Search by particulars...'
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <Icon icon='mdi:magnify' />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
        </Grid>
        <Box sx={{ height: 'calc(55vh)', width: '100%', marginTop: 6 }}>
          <DataGrid
            rows={filteredLedgers}
            columns={columns({
              permissions: { canDelete },
              actions: { handleEdit, openDialog, handleAttachment }
            })}
            loading={loading['fetchAll']}
          />
        </Box>
        <Dialog
          open={isDialogOpen['delete']}
          onClose={() => closeDialog('delete')}
          aria-labelledby='alert-dialog-title'
          aria-describedby='alert-dialog-description'
        >
          <DialogTitle id='alert-dialog-title'>{'Delete Entry'}</DialogTitle>
          <DialogContent>
            <DialogContentText id='alert-dialog-description'>
              Are you sure you want to delete this entry?
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
          open={isDialogOpen['details']}
          onClose={() => closeDialog('details')}
          aria-labelledby='alert-dialog-title'
          aria-describedby='alert-dialog-description'
        >
          <DialogTitle id='alert-dialog-title'>{'Details'}</DialogTitle>
          <DialogContent>
            <Box sx={{ padding: 1, marginTop: 1, width: { sm: 300, xl: 400 } }}>
              <Stack spacing={2}>
                <Box display='flex' alignItems='center' justifyContent='space-between'>
                  <Box display='flex' alignItems='center' gap={1}>
                    <ReceiptIcon color='success' sx={{ fontSize: 18 }} />
                    <Typography fontWeight='bold'>Voucher Type</Typography>
                  </Box>
                  <Typography variant='body2' color='text.secondary'>
                    {selectedLedger?.vch_type || '--'}
                  </Typography>
                </Box>

                <Divider />

                <Box display='flex' alignItems='center' justifyContent='space-between'>
                  <Box display='flex' alignItems='center' gap={1}>
                    <CategoryIcon color='warning' sx={{ fontSize: 18 }} />
                    <Typography fontWeight='bold'>Transaction Nature</Typography>
                  </Box>
                  <Typography variant='body2' color='text.secondary'>
                    {selectedLedger?.transaction_nature || '--'}
                  </Typography>
                </Box>

                <Divider />
                <Box>
                  {selectedLedger?.docs_url && (
                    <CustomChip
                      skin='light'
                      label='Document Exists'
                      color='error'
                      sx={{ marginRight: 2 }}
                      icon={<Icon icon='prime:file-pdf' />}
                    />
                  )}
                  {selectedLedger?.stock_exists && (
                    <CustomChip
                      skin='light'
                      label='Stock Exists'
                      color='primary'
                      sx={{ marginRight: 2 }}
                      icon={<Icon icon='humbleicons:cart' />}
                    />
                  )}
                </Box>
              </Stack>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => closeDialog('details')} sx={{ color: 'error.main' }}>
              Cancel
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  )
}

export default ViewLedger
