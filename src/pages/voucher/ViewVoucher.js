// ** React Imports
import { useState, useEffect, useContext, useMemo } from 'react'
import { useApi } from 'src/@core/api/useApi'

// ** MUI Imports
import { DataGrid } from '@mui/x-data-grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import IconButton from '@mui/material/IconButton'
import { Box, TextField, Typography, Grid, InputLabel } from '@mui/material'
import { Select, MenuItem, InputAdornment, Button } from '@mui/material'
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
import { styled } from '@mui/material/styles'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Other Imports
import { AbilityContext } from 'src/layouts/components/acl/Can'
import useCustomToast from 'src/@core/hooks/useCustomToast'
import { useAuth } from 'src/hooks/useAuth'

const TypographyStyled = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  cursor: 'pointer',
  textDecoration: 'none',
  color: theme.palette.text.primary,
  '&:hover': {
    color: theme.palette.primary.main
  }
}))

const columns = (canDelete, handleEdit, openDialog) => [
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
    field: 'recipient',
    headerName: 'Recipient',
    width: 250,
    renderCell: params => (
      <div>
        <TypographyStyled variant='body2' onClick={() => handleEdit(params.row)}>
          {params.row.recipient.name}
        </TypographyStyled>
        <Typography variant='body2' style={{ fontStyle: 'italic', fontSize: '13px', color: '#FF69B4' }}>
          ({params.row.expense_head.name})
        </Typography>
      </div>
    )
  },
  {
    field: 'particulars',
    headerName: 'Particulars',
    width: 500
  },
  {
    field: 'credit',
    headerName: 'Voucher / Cash',
    width: 200,
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
    headerName: 'Cash Issued',
    width: 200,
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
        {canDelete && (
          <IconButton
            color='error'
            onClick={() => {
              openDialog('delete', params.row)
            }}
          >
            <Icon icon='mdi:delete-outline' />
          </IconButton>
        )}
      </div>
    )
  }
]

// ** Parsing date
const parseDateString = dateString => {
  const [day, month, year] = dateString.split('-')

  return new Date(`${year}-${month}-${day}`)
}

const ViewVoucher = ({ handleEdit }) => {
  // ** States
  const [vouchers, setVouchers] = useState([])
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState({ fetchAll: false, deleteData: false })
  const [isDialogOpen, setDialogOpen] = useState({ delete: false })
  const [searchKey, setSearchKey] = useState('')
  const [date, setDate] = useState(null)
  const types = ['Voucher Date', 'Entry Date']
  const [type, setType] = useState('')

  const { apiRequest } = useApi()
  const ability = useContext(AbilityContext)
  const canDelete = ability.can('delete', 'expense')
  const [selectedVoucher, setSelectedVoucher] = useState(null)
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const { user } = useAuth()
  const fiscalData = user?.fiscalRange.find(item => item.fiscal === user?.currentFiscal)

  // ** Abort Controller
  const controller = new AbortController()
  const signal = controller.signal

  // ** Fetch all
  const fetchVouchers = async () => {
    try {
      setLoading(prev => ({ ...prev, fetchAll: true }))
      const formattedDate = dayjs(date).format('YYYY-MM-DD')
      const data = await apiRequest('get', '/expenses?date=' + formattedDate + '&type=' + type, null, {}, signal)

      const vouchersWithSerial = data?.expenses?.map((voucher, index) => ({
        ...voucher,
        sno: index + 1
      }))
      setVouchers(vouchersWithSerial)
      setExpenses(data)
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
      fetchVouchers()
    }

    return () => {
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, type])

  // ** Open dialog
  const openDialog = (dialog, row) => {
    setSelectedVoucher(row)
    setDialogOpen(prev => ({ ...prev, [dialog]: true }))
  }

  // ** Close dialog
  const closeDialog = dialog => {
    setSelectedVoucher(null)
    setDialogOpen(prev => ({ ...prev, [dialog]: false }))
  }

  // Filter vouchers array according to search key
  const filteredVouchers = useMemo(() => {
    return vouchers
      ?.filter(v => v.particulars.toLowerCase().includes(searchKey.toLowerCase()))
      .map((voucher, index) => ({
        ...voucher,
        sno: index + 1
      }))
  }, [vouchers, searchKey])

  // ** Delete an entry
  const handleDelete = async () => {
    try {
      setLoading(prev => ({ ...prev, deleteData: true }))
      const response = await apiRequest('delete', `/expense/${selectedVoucher?.id}`, null, {}, signal)

      showSuccessToast(response?.message, 5000)
      fetchVouchers()
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

  return (
    <Card>
      <CardHeader sx={{ pb: 5 }} title='Vouchers' titleTypographyProps={{ variant: 'h6' }} />
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
            rows={filteredVouchers}
            columns={columns(canDelete, handleEdit, openDialog)}
            loading={loading['fetchAll']}
          />
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Typography>
              <span>Total Vouchers/Cash Returned:</span>{' '}
              <span style={{ color: '#67CB24' }}>₹{Number(expenses?.total?.credit || 0).toLocaleString('en-IN')}</span>
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography>
              <span>Total Amount Issued:</span>{' '}
              <span style={{ color: '#E64542' }}>₹{Number(expenses?.total?.debit || 0).toLocaleString('en-IN')}</span>
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography>
              <span>Petty Cash Balance:</span>{' '}
              <span style={{ color: '#5C61E6' }}>₹{Number(expenses?.balance || 0).toLocaleString('en-IN')}</span>
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
    </Card>
  )
}

export default ViewVoucher
