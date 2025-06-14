// ** React Imports
import { useState, useEffect, useMemo } from 'react'
import { useApi } from 'src/@core/api/useApi'

// ** MUI Imports
import { DataGrid } from '@mui/x-data-grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import { Chip, Box, Grid, TextField, Select } from '@mui/material'
import { FormControl, Autocomplete, MenuItem, InputLabel } from '@mui/material'

const columns = handleAttachment => [
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
    field: 'category_name',
    headerName: 'Category',
    width: 150
  },
  {
    field: 'type_name',
    headerName: 'Type',
    width: 200,
    renderCell: params =>
      params.value === 'Parts Request' ? (
        <Chip
          label='Parts Request'
          color='primary'
          variant='outlined'
          style={{ cursor: 'pointer' }}
          onClick={() => handleAttachment(params.row)}
        />
      ) : (
        <span>{params.value}</span>
      )
  },
  {
    field: 'comment',
    headerName: 'Comment',
    width: 300
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 200,
    renderCell: params => <ChipComponent row={params.row} />
  },
  {
    field: 'closing_date',
    headerName: 'Closing Date',
    width: 120
  },
  {
    field: 'staff_head',
    headerName: 'Staff Head',
    width: 200
  }
]

const ChipComponent = ({ row }) => {
  return (
    <Chip
      label={row?.status}
      variant='outlined'
      size='medium'
      color={row?.status === 'Pending' ? 'success' : 'error'}
      sx={{
        margin: '4px',
        width: 150
      }}
    />
  )
}

const TicketDetails = ({ dropdown }) => {
  // ** States
  const clientList = dropdown?.client || []
  const [selectedClient, setSelectedClient] = useState(null)
  const [loading, setLoading] = useState(false)
  const [tickets, setTickets] = useState([])
  const types = ['Pending', 'Closed']
  const [status, setStatus] = useState(types[0])

  // ** Abort Controller
  const controller = new AbortController()
  const signal = controller.signal

  // ** Custom Hooks
  const { apiRequest } = useApi()

  // ** Fetch tickets of selected client
  const fetchTicket = async () => {
    try {
      setTickets([])
      setLoading(true)
      const data = await apiRequest('get', `/ticket_client?id=${selectedClient}`, null, {}, signal)

      const ticketsWithSerial = data.map((ticket, index) => ({
        ...ticket,
        sno: index + 1
      }))
      setTickets(ticketsWithSerial)
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted')
      } else {
        console.error(error)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTicket()

    return () => {
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClient])

  // ** Download attachment
  const handleAttachment = row => {
    const pdfUrl = row.docs_url

    if (pdfUrl) {
      window.open(pdfUrl, '_blank')
    } else {
      console.error('No PDF URL available for this ticket')
    }
  }

  // Filter tickets array according to status
  const filteredTickets = useMemo(() => {
    return tickets
      ?.filter(t => t.status.toLowerCase().includes(status.toLowerCase()))
      .map((ticket, index) => ({
        ...ticket,
        sno: index + 1
      }))
  }, [tickets, status])

  return (
    <Card>
      <CardHeader sx={{ pb: 5 }} title='Details' titleTypographyProps={{ variant: 'h6' }} />
      <CardContent>
        <Grid container spacing={6}>
          <Grid item xs={12} sm={6}>
            <Autocomplete
              options={clientList}
              getOptionLabel={option => option?.name || ''}
              onChange={(_, data) => {
                setSelectedClient(data ? data.id : null)
              }}
              isOptionEqualToValue={(option, value) => option && value && option.id === value.id}
              renderInput={params => <TextField {...params} label='Client' />}
              value={clientList.find(client => Number(client.id) === Number(selectedClient)) || null}
              renderOption={(props, option) => (
                <li {...props} key={option.id} style={{ display: 'flex', alignItems: 'center' }}>
                  <div>
                    <span style={{ color: '#ff4d49' }}>{`ID: ${option.id}`}</span>
                    <br />
                    <span>{`Name: ${option.name}`}</span>
                  </div>
                </li>
              )}
            />
          </Grid>
          {selectedClient && (
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  label='Status'
                  value={status}
                  onChange={e => {
                    setStatus(e.target.value)
                  }}
                >
                  {types.map(type => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}
        </Grid>
        <Box sx={{ height: 'calc(60vh - 10px)', width: '100%', marginTop: 6 }}>
          <DataGrid
            rows={filteredTickets}
            columns={columns(handleAttachment)}
            loading={loading}
            disableRowSelectionOnClick
          />
        </Box>
      </CardContent>
    </Card>
  )
}

export default TicketDetails
