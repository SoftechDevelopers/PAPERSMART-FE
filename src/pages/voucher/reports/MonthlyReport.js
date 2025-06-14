// ** React Imports
import { useState, useEffect, useContext } from 'react'
import { useApi } from 'src/@core/api/useApi'

// ** MUI Imports
import { DataGrid } from '@mui/x-data-grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import { Box, Grid } from '@mui/material'
import { InputLabel, Select, MenuItem, Typography } from '@mui/material'
import FormControl from '@mui/material/FormControl'
import { LoadingButton } from '@mui/lab'
import CustomChip from 'src/@core/components/mui/chip'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Other Imports
import { AbilityContext } from 'src/layouts/components/acl/Can'
import useCustomToast from 'src/@core/hooks/useCustomToast'

const columns = () => [
  {
    field: 'sno',
    headerName: 'S.No',
    width: 80
  },
  {
    field: 'date',
    headerName: 'Date',
    width: 150
  },
  {
    field: 'particulars',
    headerName: 'Particulars',
    width: 600
  },
  {
    field: 'amount',
    headerName: 'Amount',
    width: 200,
    renderCell: params => (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <CustomChip skin='light' label={params?.row?.amount} color='primary' />
      </Box>
    )
  },
  {
    field: 'expense_head',
    headerName: 'Expense Head',
    width: 300,
    renderCell: params => (
      <Typography variant='body1' sx={{ fontSize: '15px', color: 'success.dark' }}>
        {params.row.expense_head}
      </Typography>
    )
  }
]

const months = [
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
  'January',
  'February',
  'March'
]

// ** Function make index for fiscal
const getFiscalMonthIndex = () => {
  const currentMonthIndex = new Date().getMonth()

  return (currentMonthIndex + 9) % 12
}

const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: 300
    }
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

const MonthlyReport = () => {
  // ** States
  const [report, setReport] = useState([])
  const [loading, setLoading] = useState({ fetchAll: false, export: false })
  const { apiRequest } = useApi()
  const { showErrorToast } = useCustomToast()
  const [month, setMonth] = useState(months[getFiscalMonthIndex()])
  const ability = useContext(AbilityContext)
  const canRead = ability.can('view', 'export_expense')

  // ** Abort Controller
  const controller = new AbortController()
  const signal = controller.signal

  // ** Fetch expense report
  const fetchReport = async () => {
    try {
      setLoading(prev => ({ ...prev, fetchAll: true }))

      const data = await apiRequest('get', '/monthly_report?month=' + month, null, {}, signal)

      const reportWithSerial = data.map((item, index) => ({
        ...item,
        sno: index + 1
      }))

      setReport(reportWithSerial)
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
    fetchReport()

    return () => {
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month])

  // ** Function to download excel
  const handleExport = async () => {
    try {
      setLoading(prev => ({ ...prev, export: true }))
      const response = await apiRequest('get', '/export_expense?month=' + month, null, {}, signal)

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

  return (
    <Card>
      <CardHeader sx={{ pb: 5 }} title='Monthly Report' titleTypographyProps={{ variant: 'h6' }} />
      <CardContent>
        <Grid container spacing={6}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Month</InputLabel>
              <Select
                label='Month'
                value={month}
                onChange={e => {
                  setMonth(e.target.value)
                }}
                MenuProps={MenuProps}
              >
                {months.map(item => (
                  <MenuItem key={item} value={item}>
                    {item}
                  </MenuItem>
                ))}
              </Select>
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
                disabled={!canRead}
              >
                Export
              </LoadingButton>
            </Box>
          </Grid>
        </Grid>
        <Box sx={{ height: 'calc(60vh)', width: '100%', marginTop: 6 }}>
          <DataGrid rows={report} columns={columns()} loading={loading['fetchAll']} disableRowSelectionOnClick />
        </Box>
      </CardContent>
    </Card>
  )
}

export default MonthlyReport
