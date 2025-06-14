// ** React Imports
import { useState, useEffect, useContext } from 'react'
import { useApi } from 'src/@core/api/useApi'

// ** MUI Imports
import { DataGrid } from '@mui/x-data-grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import { Box, TextField, Typography, Grid, Autocomplete } from '@mui/material'
import { CircularProgress, Button } from '@mui/material'
import dayjs from 'dayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import FormControl from '@mui/material/FormControl'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { useTheme } from '@mui/material/styles'

// ** Icon Imports
import DownloadIcon from '@mui/icons-material/Download'

// ** Other Imports
import { AbilityContext } from 'src/layouts/components/acl/Can'
import useCustomToast from 'src/@core/hooks/useCustomToast'
import { useAuth } from 'src/hooks/useAuth'

const columns = () => [
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
    field: 'particulars',
    headerName: 'Particulars',
    width: 600,
    renderCell: params => (
      <div>
        <Typography variant='body2' style={{ fontStyle: 'italic', fontSize: '13px', color: '#FF69B4' }}>
          {params?.row?.account?.name ? `(${params.row.account.name})` : null}
        </Typography>
        <Typography variant='body1' style={{ fontSize: '15px' }}>
          {params.row.particulars}
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
    field: 'balance',
    headerName: 'Balance',
    width: 200,
    renderCell: params => (
      <div>
        <Typography variant='body1' sx={{ fontSize: '15px', color: 'primary.dark' }}>
          {params.row.balance}
        </Typography>
      </div>
    )
  }
]

const parseDateString = dateString => {
  const [day, month, year] = dateString.split('-')

  return new Date(`${year}-${month}-${day}`)
}

const base64ToBlob = (base64, mimeType = 'application/pdf') => {
  const binary = Buffer.from(base64, 'base64')

  return new Blob([binary], { type: mimeType })
}

const ExpenseStatement = () => {
  // ** States
  const [expenses, setExpenses] = useState([])
  const [vouchers, setVouchers] = useState([])
  const [dropdown, setDropdown] = useState({})
  const recipientList = dropdown?.recipient || []
  const [loading, setLoading] = useState({ fetchAll: false, dropdown: false, download: false })
  const [recipient, setRecipient] = useState(null)

  const theme = useTheme()
  const { apiRequest } = useApi()
  const ability = useContext(AbilityContext)
  const canRead = ability.can('view', 'download_statement')
  const { showErrorToast } = useCustomToast()
  const { user } = useAuth()
  const fiscalData = user?.fiscalRange.find(item => item.fiscal === user?.currentFiscal)
  const [startDate, setStartDate] = useState(dayjs(parseDateString(fiscalData?.start_date)))
  const [endDate, setEndDate] = useState(dayjs(parseDateString(fiscalData?.end_date)))

  // ** Abort Controller
  const controller = new AbortController()
  const signal = controller.signal

  // ** Fetch dropdowns
  const fetchDropdowns = async () => {
    try {
      setLoading(prev => ({ ...prev, dropdown: true }))
      const data = await apiRequest('get', '/dropdowns?tables=recipient', null, {}, signal)

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

  // ** Fetch all
  const fetchVouchers = async () => {
    try {
      setLoading(prev => ({ ...prev, fetchAll: true }))

      const from = dayjs(startDate).format('YYYY-MM-DD')
      const to = dayjs(endDate).format('YYYY-MM-DD')

      const data = await apiRequest(
        'get',
        '/expense_statement?start_date=' + from + '&end_date=' + to + '&recipient=' + recipient,
        null,
        {},
        signal
      )

      const vouchersWithSerial = data?.expenses?.map((voucher, index) => ({
        ...voucher,
        sno: index + 1
      }))

      setExpenses(vouchersWithSerial)
      setVouchers(data)
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
    setExpenses([])
    if (startDate && endDate && recipient) {
      fetchVouchers()
    }

    return () => {
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, recipient])

  // Download statement
  const handleDownload = async () => {
    if (!recipient) {
      showErrorToast('No recipient selected', 5000)

      return
    }

    try {
      setLoading(prev => ({ ...prev, download: true }))

      const from = dayjs(startDate).format('YYYY-MM-DD')
      const to = dayjs(endDate).format('YYYY-MM-DD')

      const response = await apiRequest(
        'get',
        '/download_statement?start_date=' + from + '&end_date=' + to + '&recipient=' + recipient,
        null,
        {},
        signal
      )

      if (!response?.pdf) {
        showErrorToast('Invalid PDF response', 5000)
      }

      const blob = base64ToBlob(response.pdf, 'application/pdf')
      const pdfUrl = URL.createObjectURL(blob)
      window.open(pdfUrl, '_blank')
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted')
      } else {
        console.error(error)
      }
    } finally {
      setLoading(prev => ({ ...prev, download: false }))
    }
  }

  return (
    <Card>
      <CardHeader sx={{ pb: 5 }} title='Statement' titleTypographyProps={{ variant: 'h6' }} />
      <CardContent>
        <Grid container spacing={6}>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label='Start Date'
                  value={startDate}
                  onChange={value => {
                    setStartDate(value)
                  }}
                  maxDate={endDate}
                  format='DD-MM-YYYY'
                />
              </LocalizationProvider>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label='End Date'
                  value={endDate}
                  onChange={value => {
                    setEndDate(value)
                  }}
                  minDate={startDate}
                  format='DD-MM-YYYY'
                />
              </LocalizationProvider>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={5}>
            <FormControl fullWidth>
              <Autocomplete
                options={recipientList}
                getOptionLabel={option => option?.name || ''}
                onChange={(_, data) => {
                  setRecipient(data ? data.id : null)
                }}
                isOptionEqualToValue={(option, value) => option && value && option.id === value.id}
                renderInput={params => <TextField {...params} label='Recipient' />}
                value={recipientList.find(item => item.id === Number(recipient)) || null}
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

          <Grid
            item
            xs={12}
            sm={1}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end'
            }}
          >
            <Button
              onClick={handleDownload}
              disabled={loading['download'] || !canRead}
              variant='outlined'
              color='primary'
              sx={{
                minWidth: 0,
                width: 80,
                height: 40,
                padding: 0,
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {loading['download'] ? <CircularProgress size={20} color='inherit' /> : <DownloadIcon />}
            </Button>
          </Grid>
        </Grid>
        <Box sx={{ height: 'calc(55vh)', width: '100%', marginTop: 6 }}>
          <DataGrid rows={expenses} columns={columns()} loading={loading['fetchAll']} />
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Typography>
              <span>Total Vouchers/Cash Returned:</span>{' '}
              <span style={{ color: '#67CB24' }}>₹{Number(vouchers?.total_credit || 0).toLocaleString('en-IN')}</span>
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography>
              <span>Total Amount Issued:</span>{' '}
              <span style={{ color: '#E64542' }}>₹{Number(vouchers?.total_debit || 0).toLocaleString('en-IN')}</span>
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography>
              {vouchers?.balance < 0 ? (
                <span style={{ color: '#E4A324' }}>Cash Spent Ahead:</span>
              ) : (
                <span>Remaining Cash:</span>
              )}{' '}
              <span style={{ color: '#5C61E6' }}>₹{Number(vouchers?.balance || 0).toLocaleString('en-IN')}</span>
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

export default ExpenseStatement
