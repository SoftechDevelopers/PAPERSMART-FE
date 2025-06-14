// ** React Imports
import { useState, useEffect, useMemo } from 'react'
import { useApi } from 'src/@core/api/useApi'

// ** MUI Imports
import { DataGrid } from '@mui/x-data-grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import { Box, Grid } from '@mui/material'
import { Typography, TextField, InputAdornment } from '@mui/material'
import { styled } from '@mui/material/styles'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

const TypographyStyled = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  textDecoration: 'none',
  color: theme.palette.text.primary
}))

const columns = () => [
  {
    field: 'sno',
    headerName: 'S.No',
    width: 80
  },
  {
    field: 'name',
    headerName: 'Name',
    width: 300,
    renderCell: params => (
      <Box sx={{ display: 'flex', flexDirection: 'column', marginLeft: 2 }}>
        <TypographyStyled variant='body2'>{params?.row?.name}</TypographyStyled>
        <span style={{ fontSize: 'smaller', color: '#FF69B4', fontStyle: 'italic' }}>({params?.row?.id})</span>
      </Box>
    )
  },
  {
    field: 'make',
    headerName: 'Make',
    width: 250,
    renderCell: params => (
      <Box sx={{ display: 'flex', flexDirection: 'column', marginLeft: 2 }}>
        <span>{params?.row?.manufacturer}</span>
        <span style={{ fontSize: 'smaller', color: '#8A93A4' }}>{params?.row?.model}</span>
      </Box>
    )
  },
  {
    field: 'category',
    headerName: 'Category',
    width: 250,
    renderCell: params => (
      <Box sx={{ display: 'flex', flexDirection: 'column', marginLeft: 2 }}>
        <span style={{ color: '#5C61E6' }}>{params?.row?.category?.name}</span>
      </Box>
    )
  },
  {
    field: 'inward',
    headerName: 'Inward',
    width: 120,
    renderCell: params => (
      <Box sx={{ display: 'flex', flexDirection: 'column', marginLeft: 2 }}>
        <span style={{ color: '#67CB24' }}>{params?.row?.total_qty_in}</span>
      </Box>
    )
  },
  {
    field: 'outward',
    headerName: 'Outward',
    width: 120,
    renderCell: params => (
      <Box sx={{ display: 'flex', flexDirection: 'column', marginLeft: 2 }}>
        <span style={{ color: '#E64542' }}>{params?.row?.total_qty_out}</span>
      </Box>
    )
  },
  {
    field: 'balance',
    headerName: 'Balance',
    width: 120,
    renderCell: params => (
      <Box sx={{ display: 'flex', flexDirection: 'column', marginLeft: 2 }}>
        {Number(params?.row?.balance) < 0 ? (
          <span style={{ color: '#22B3E1', fontWeight: 'bold' }}>{params?.row?.balance}</span>
        ) : (
          <span style={{ color: '#626C7F' }}>{params?.row?.balance}</span>
        )}
      </Box>
    )
  }
]

const StockSummary = () => {
  // ** States
  const [summary, setSummary] = useState([])
  const [searchKey, setSearchKey] = useState('')
  const [loading, setLoading] = useState({ fetchAll: false })

  const { apiRequest } = useApi()

  // ** Abort Controller
  const controller = new AbortController()
  const signal = controller.signal

  // ** Fetch expense report
  const fetchSummary = async () => {
    try {
      setLoading(prev => ({ ...prev, fetchAll: true }))

      const data = await apiRequest('get', '/stock_summary', null, {}, signal)

      const summaryWithSerial = data?.map((item, index) => ({
        ...item,
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
  }, [])

  // ** Filter summary according to search key
  const filteredSummary = useMemo(() => {
    return summary
      ?.filter(s => s.name.toLowerCase().includes(searchKey.toLowerCase()))
      .map((summary, index) => ({
        ...summary,
        sno: index + 1
      }))
  }, [summary, searchKey])

  return (
    <Card>
      <CardHeader sx={{ pb: 5 }} title='Stock Summary' titleTypographyProps={{ variant: 'h6' }} />
      <CardContent>
        <Grid item xs={12}>
          <TextField
            value={searchKey}
            fullWidth
            label='Search'
            onChange={e => setSearchKey(e.target.value)}
            placeholder='Search by name...'
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <Icon icon='mdi:magnify' />
                </InputAdornment>
              )
            }}
          />
        </Grid>
        <Box sx={{ height: 'calc(60vh)', width: '100%', marginTop: 6 }}>
          <DataGrid
            rows={filteredSummary}
            columns={columns()}
            loading={loading['fetchAll']}
            disableRowSelectionOnClick
          />
        </Box>
      </CardContent>
    </Card>
  )
}

export default StockSummary
