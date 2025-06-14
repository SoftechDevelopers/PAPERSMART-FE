// ** React Imports
import { useState, useEffect, useContext } from 'react'
import { useApi } from 'src/@core/api/useApi'

// ** MUI Imports
import { DataGrid } from '@mui/x-data-grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import { Box, Grid, InputLabel, Select } from '@mui/material'
import { MenuItem } from '@mui/material'
import FormControl from '@mui/material/FormControl'
import Avatar from '@mui/material/Avatar'
import { LoadingButton } from '@mui/lab'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Other Imports
import { AbilityContext } from 'src/layouts/components/acl/Can'
import useCustomToast from 'src/@core/hooks/useCustomToast'
import ExcelJS from 'exceljs'

const columns = () => [
  {
    field: 'sno',
    headerName: 'S.No',
    width: 80
  },
  {
    field: 'name',
    headerName: 'Staff',
    width: 250,
    renderCell: params => (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Avatar alt={params.row.staff_name} src={params.row.avatar} />
        <Box sx={{ display: 'flex', flexDirection: 'column', marginLeft: 2 }}>
          <span>{params.row.name}</span>
          <span style={{ fontSize: 'smaller', color: '#FF69B4', fontStyle: 'italic' }}>({params.row.id})</span>
        </Box>
      </Box>
    )
  },
  {
    field: 'total_distance',
    headerName: 'Distance Travelled (Km)',
    width: 250
  },
  {
    field: 'total_attendance',
    headerName: 'Total Attendance (Days)',
    width: 250
  },
  {
    field: 'total_hours',
    headerName: 'Hours Worked',
    width: 250
  }
]

const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: 300
    }
  }
}

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

const DutySummary = () => {
  // ** States
  const [summary, setSummary] = useState([])
  const [loading, setLoading] = useState({ fetchAll: false, generateExcel: false })
  const { apiRequest } = useApi()
  const { showErrorToast } = useCustomToast()
  const [month, setMonth] = useState(months[getFiscalMonthIndex()])
  const ability = useContext(AbilityContext)
  const canExport = ability.can('export', 'duty_summary')

  // ** Abort Controller
  const controller = new AbortController()
  const signal = controller.signal

  // ** Fetch duty summary
  const fetchSummary = async () => {
    try {
      setLoading(prev => ({ ...prev, fetchAll: true }))

      const data = await apiRequest('get', '/duty_summary?month=' + month, null, {}, signal)

      const summaryWithSerial = data.map((duty, index) => ({
        ...duty,
        sno: index + 1
      }))

      setSummary(summaryWithSerial)
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
    fetchSummary()

    return () => {
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month])

  // Generate excel
  const handleExport = async () => {
    if (summary.length === 0) {
      showErrorToast('No row found', 5000)

      return
    }

    try {
      setLoading(prev => ({ ...prev, generateExcel: true }))

      // Prepare data for rows
      const data = summary.map(item => [
        item.sno,
        item.id,
        item.name,
        item.total_distance,
        item.total_attendance,
        item.total_hours
      ])

      // Create a new workbook and worksheet
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('Sheet1')

      // Title Row (Row 1)
      const titleRow = worksheet.addRow([`Duty Summary for ${month}`])
      titleRow.font = { bold: true, size: 12 }
      titleRow.alignment = { horizontal: 'center' }
      worksheet.mergeCells('A1:F1')

      // Column Headers Row (Row 2)
      const headerRow = worksheet.addRow([
        'S.No',
        'Staff ID',
        'Name',
        'Distance Travelled',
        'Total Attendance',
        'Hours Worked'
      ])
      headerRow.font = { bold: true }

      for (let col = 1; col <= 6; col++) {
        const cell = headerRow.getCell(col)
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD3D3D3' }
        }
      }

      // headerRow.fill = {
      //   type: 'pattern',
      //   pattern: 'solid',
      //   fgColor: { argb: 'FFD3D3D3' }
      // }

      // Add data rows (starting from row 3)
      data.forEach(item => {
        worksheet.addRow(item)
      })

      // Adjust column width
      worksheet.columns.forEach((col, index) => {
        const maxLength = Math.max(
          ...data.map(row => (row[index] ? row[index].toString().length : 0)),
          headerRow.getCell(index + 1).text.length
        )
        col.width = maxLength + 10 // Add some padding to the column width
      })

      // Apply borders to all cells
      worksheet.eachRow(row => {
        row.eachCell(cell => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          }
        })
      })

      // Center-align all cells
      worksheet.eachRow(row => {
        row.eachCell(cell => {
          cell.alignment = { horizontal: 'center', vertical: 'middle' }
        })
      })

      // Generate and download the Excel file
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/octet-stream' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${month}.xlsx`
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      showErrorToast('Excel could not be generated', 5000)
    } finally {
      setLoading(prev => ({ ...prev, generateExcel: false }))
    }
  }

  return (
    <Card>
      <CardHeader sx={{ pb: 5 }} title='Duty Summary' titleTypographyProps={{ variant: 'h6' }} />
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
          {canExport && (
            <Grid item xs={12} sm={6}>
              <Box display='flex' justifyContent='flex-end'>
                <LoadingButton
                  loading={loading['generateExcel']}
                  loadingPosition='start'
                  startIcon={<Icon icon='vscode-icons:file-type-excel2' />}
                  size='medium'
                  type='button'
                  variant='outlined'
                  onClick={handleExport}
                >
                  Generate
                </LoadingButton>
              </Box>
            </Grid>
          )}
        </Grid>
        <Box sx={{ height: 'calc(60vh)', width: '100%', marginTop: 6 }}>
          <DataGrid rows={summary} columns={columns()} loading={loading['fetchAll']} disableRowSelectionOnClick />
        </Box>
      </CardContent>
    </Card>
  )
}

export default DutySummary
