// ** React Imports
import { useState, useEffect, useContext } from 'react'
import { useApi } from 'src/@core/api/useApi'

// ** MUI Imports
import { DataGrid } from '@mui/x-data-grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import { Box, TextField, Typography, Grid, Autocomplete } from '@mui/material'
import IconButton from '@mui/material/IconButton'
import { RadioGroup, Radio, FormControlLabel, Button } from '@mui/material'
import dayjs from 'dayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import FormControl from '@mui/material/FormControl'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { useTheme } from '@mui/material/styles'
import { styled } from '@mui/material/styles'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import { LoadingButton } from '@mui/lab'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Other Imports
import { AbilityContext } from 'src/layouts/components/acl/Can'
import useCustomToast from 'src/@core/hooks/useCustomToast'
import { useAuth } from 'src/hooks/useAuth'

const columns = ({ actions }) => [
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
    width: 420
  },
  {
    field: 'voucher',
    headerName: 'Voucher',
    width: 150,
    renderCell: params => (
      <Box sx={{ display: 'flex', flexDirection: 'column', marginLeft: 2 }}>
        <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{params.row.vch_type}</Typography>
        <span style={{ fontSize: 'smaller', color: '#FF69B4' }}>{params.row.vch_no}</span>
      </Box>
    )
  },
  {
    field: 'debit',
    headerName: 'Debit',
    width: 140,
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
    headerName: 'Credit',
    width: 140,
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
    width: 120,
    renderCell: params => (
      <div>
        <Typography variant='body1' sx={{ fontSize: '15px', color: 'primary.dark' }}>
          {params.row.balance}
        </Typography>
      </div>
    )
  },
  {
    field: 'actions',
    headerName: 'Actions',
    width: 120,
    sortable: false,
    filterable: false,
    renderCell: params => (
      <div>
        <IconButton color='secondary' onClick={() => actions.handleAttachment(params.row)}>
          <Icon icon='heroicons-outline:paper-clip' />
        </IconButton>

        <IconButton
          color='error'
          onClick={() => {
            actions.openDialog('delete', params.row)
          }}
        >
          <Icon icon='mdi:delete-outline' />
        </IconButton>
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

const AccountStatement = () => {
  // ** States
  const [ledgers, setLedgers] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState({ fetchAll: false, dropdown: false, export: false })
  const [isDialogOpen, setDialogOpen] = useState({ delete: false })
  const [dropdown, setDropdown] = useState({})
  const [partyList, setPartyList] = useState([])
  const [partyType, setPartyType] = useState(null)
  const [party, setParty] = useState(null)
  const [selectedLedger, setSelectedLedger] = useState(null)

  const { apiRequest } = useApi()
  const ability = useContext(AbilityContext)
  const canDelete = ability.can('delete', 'ledger')
  const canExport = ability.can('view', 'export_ledger')
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const { user } = useAuth()
  const fiscalData = user?.fiscalRange.find(item => item.fiscal === user?.currentFiscal)
  const [startDate, setStartDate] = useState(dayjs(parseDateString(fiscalData?.start_date)))
  const [endDate, setEndDate] = useState(dayjs(parseDateString(fiscalData?.end_date)))

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
          '/dropdowns?tables=vendor,client,head,all_staff,all_partner,item',
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

    const map = {
      Vendor: dropdown.vendor,
      Client: dropdown.client,
      Head: dropdown.head?.filter(item => item.ledger_group_id !== 15),
      Staff: dropdown.all_staff,
      Partner: dropdown.all_partner
    }

    setPartyList(map[partyType] || [])

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partyType, dropdown])

  // ** Fetch all
  const fetchLedgers = async () => {
    try {
      setLoading(prev => ({ ...prev, fetchAll: true }))

      const from = dayjs(startDate).format('YYYY-MM-DD')
      const to = dayjs(endDate).format('YYYY-MM-DD')

      const partyKeys = {
        Vendor: 'vendor_id',
        Client: 'client_id',
        Head: 'head_id',
        Staff: 'staff_id',
        Partner: 'partner_id'
      }

      const partyKey = partyKeys[partyType]

      const queryParams = new URLSearchParams({
        start_date: from,
        end_date: to,
        [partyKey]: party
      })
      const url = `/ledger_statement?${queryParams.toString()}`

      const data = await apiRequest('get', url, null, {}, signal)

      const ledgersWithSerial = data?.ledgers?.map((ledger, index) => ({
        ...ledger,
        sno: index + 1
      }))

      setLedgers(data)
      setTransactions(ledgersWithSerial)
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
    setLedgers([])
    if (startDate && endDate && party) {
      fetchLedgers()
    }

    return () => {
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, party])

  // ** Download attachment
  const handleAttachment = row => {
    let pdfUrl = row.docs_url

    if (pdfUrl) {
      pdfUrl += `?t=${new Date().getTime()}`
      window.open(pdfUrl, '_blank')
    } else {
      showErrorToast('No attachment found', 5000)
    }
  }

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

  // ** Function to export statement
  const handleExport = async () => {
    try {
      setLoading(prev => ({ ...prev, export: true }))

      const from = dayjs(startDate).format('YYYY-MM-DD')
      const to = dayjs(endDate).format('YYYY-MM-DD')

      const partyKeys = {
        Vendor: 'vendor_id',
        Client: 'client_id',
        Head: 'head_id',
        Staff: 'staff_id',
        Partner: 'partner_id'
      }

      const partyKey = partyKeys[partyType]

      const queryParams = new URLSearchParams({
        start_date: from,
        end_date: to,
        [partyKey]: party
      })

      const url = `/export_ledger?${queryParams.toString()}`
      const response = await apiRequest('get', url, null, {}, signal)
      const { excel, filename, mime } = response

      if (!excel) {
        showErrorToast('Invalid Excel')

        return
      }

      downloadExcel(excel, mime, filename)
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted')
      } else {
        console.error(error)
      }
    } finally {
      setLoading(prev => ({ ...prev, export: false }))
    }
  }

  // ** Convert to blob
  const downloadExcel = async (
    base64,
    mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    filename = 'report.xlsx'
  ) => {
    const response = await fetch(`data:${mime};base64,${base64}`)
    const blob = await response.blob()

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Card>
      <CardHeader sx={{ pb: 5 }} title='Account Statement' titleTypographyProps={{ variant: 'h6' }} />
      <CardContent>
        <Grid container spacing={6}>
          <Grid item xs={12} sm={6}>
            <FormControl>
              <RadioGroup
                row
                aria-labelledby='demo-row-radio-buttons-group-label'
                name='row-radio-buttons-group'
                onChange={event => {
                  setPartyType(event.target.value)
                  setParty(null)
                  setTransactions([])
                  setLedgers([])
                }}
                value={partyType}
              >
                <FormControlLabel value='Vendor' control={<Radio />} label='Vendor' />
                <FormControlLabel value='Client' control={<Radio />} label='Client' />
                <FormControlLabel value='Head' control={<Radio />} label='Head' />
                <FormControlLabel value='Staff' control={<Radio />} label='Staff' />
                <FormControlLabel value='Partner' control={<Radio />} label='Partner' />
              </RadioGroup>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box display='flex' justifyContent='flex-end'>
              <LoadingButton
                loading={loading['export']}
                loadingPosition='start'
                startIcon={<Icon icon='mdi:microsoft-excel' />}
                size='medium'
                type='button'
                variant='outlined'
                onClick={handleExport}
                disabled={!canExport || !party}
              >
                Export
              </LoadingButton>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <Autocomplete
                options={partyList}
                getOptionLabel={option => option?.name || ''}
                onChange={(_, data) => {
                  setParty(data ? data.id : null)
                }}
                isOptionEqualToValue={(option, value) => option && value && option.id === value.id}
                renderInput={params => <TextField {...params} label='Party' />}
                value={partyList.find(item => item.id === Number(party)) || null}
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
        </Grid>
        <Box sx={{ height: 'calc(55vh)', width: '100%', marginTop: 6 }}>
          <DataGrid
            rows={transactions}
            columns={columns({ permissions: { canDelete }, actions: { handleAttachment, openDialog } })}
            loading={loading['fetchAll']}
          />
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Typography>
              <span>Total Credit:</span>{' '}
              <span style={{ color: '#67CB24' }}>₹{Number(ledgers?.total_credit || 0).toLocaleString('en-IN')}</span>
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography>
              <span>Total Debit:</span>{' '}
              <span style={{ color: '#E64542' }}>₹{Number(ledgers?.total_debit || 0).toLocaleString('en-IN')}</span>
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography>
              <span>Balance:</span>{' '}
              <span style={{ color: '#5C61E6' }}>₹{Number(ledgers?.balance || 0).toLocaleString('en-IN')}</span>
            </Typography>
          </Grid>
        </Grid>
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
      </CardContent>
    </Card>
  )
}

export default AccountStatement
