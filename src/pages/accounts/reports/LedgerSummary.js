// ** React Imports
import { useState, useEffect, useMemo } from 'react'
import { useApi } from 'src/@core/api/useApi'

// ** MUI Imports
import { DataGrid } from '@mui/x-data-grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import { Box, Grid } from '@mui/material'
import { Typography, TextField, InputAdornment, FormControl } from '@mui/material'
import { InputLabel, Select, MenuItem } from '@mui/material'
import { styled } from '@mui/material/styles'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

const TypographyStyled = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  textDecoration: 'none',
  color: theme.palette.text.primary
}))

const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: 300
    }
  }
}

const columns = () => [
  {
    field: 'sno',
    headerName: 'S.No',
    width: 80
  },
  {
    field: 'name',
    headerName: 'Name',
    width: 350,
    renderCell: params => (
      <Box sx={{ display: 'flex', flexDirection: 'column', marginLeft: 2 }}>
        <TypographyStyled variant='body2'>{params?.row?.name}</TypographyStyled>
        <span style={{ fontSize: 'smaller', color: '#FF69B4', fontStyle: 'italic' }}>({params?.row?.id})</span>
      </Box>
    )
  },
  {
    field: 'address',
    headerName: 'Address',
    width: 300
  },
  {
    field: 'debit',
    headerName: 'Total Debit',
    width: 200
  },
  {
    field: 'credit',
    headerName: 'Total Credit',
    width: 200
  },
  {
    field: 'balance',
    headerName: 'Balance',
    width: 200,
    renderCell: params => {
      const balance = params.row.balance
      let balanceColor

      if (balance < 0) balanceColor = 'error.dark'
      else balanceColor = 'success.dark'

      return (
        <Typography variant='body1' sx={{ fontSize: '15px', color: balanceColor }}>
          ₹{Number(balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </Typography>
      )
    }
  }
]

const LedgerSummary = () => {
  // ** States
  const [summary, setSummary] = useState([])
  const [totalBalance, setTotalBalance] = useState(0)
  const [searchKey, setSearchKey] = useState('')
  const [loading, setLoading] = useState({ fetchAll: false })
  const partyTypes = ['Vendor', 'Client', 'Head', 'Staff', 'Partner']
  const [partyType, setPartyType] = useState('')

  const { apiRequest } = useApi()

  // ** Abort Controller
  const controller = new AbortController()
  const signal = controller.signal

  // ** Fetch expense report
  const fetchSummary = async () => {
    try {
      setLoading(prev => ({ ...prev, fetchAll: true }))

      const data = await apiRequest('get', '/ledger_summary?party_type=' + partyType, null, {}, signal)

      const summaryWithSerial = data?.summary?.map((item, index) => ({
        ...item,
        sno: index + 1
      }))

      setSummary(summaryWithSerial)
      setTotalBalance(data?.total_balance)
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
    if (partyType) {
      fetchSummary()
    }

    return () => {
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partyType])

  // ** Filter summary according to search key
  const filteredSummary = useMemo(() => {
    return summary
      ?.filter(
        s =>
          s.name.toLowerCase().includes(searchKey.toLowerCase()) ||
          s.address?.toLowerCase().includes(searchKey.toLowerCase())
      )
      .map((summary, index) => ({
        ...summary,
        sno: index + 1
      }))
  }, [summary, searchKey])

  return (
    <Card>
      <CardHeader sx={{ pb: 5 }} title='Balance Summary' titleTypographyProps={{ variant: 'h6' }} />
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
                }}
                MenuProps={MenuProps}
              >
                {partyTypes.map(item => (
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
              placeholder='Search by name or address...'
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

        <Box sx={{ height: 'calc(60vh)', width: '100%', marginTop: 6 }}>
          <DataGrid
            rows={filteredSummary}
            columns={columns()}
            loading={loading['fetchAll']}
            disableRowSelectionOnClick
          />
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Typography>
              <span>Total Balance:</span>{' '}
              <span style={{ color: '#5C61E6' }}>₹{Number(totalBalance || 0).toLocaleString('en-IN')}</span>
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

export default LedgerSummary
