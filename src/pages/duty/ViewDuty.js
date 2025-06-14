// ** React Imports
import { useState, useEffect, useContext, useMemo } from 'react'
import { useApi } from 'src/@core/api/useApi'

// ** MUI Imports
import { DataGrid } from '@mui/x-data-grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import IconButton from '@mui/material/IconButton'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import Button from '@mui/material/Button'
import { Chip, Box, Grid, InputLabel, Select } from '@mui/material'
import { MenuItem, Typography, Stack } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import FormControl from '@mui/material/FormControl'
import { styled } from '@mui/material/styles'
import Avatar from '@mui/material/Avatar'
import AvatarGroup from '@mui/material/AvatarGroup'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Other Imports
import { AbilityContext } from 'src/layouts/components/acl/Can'
import useCustomToast from 'src/@core/hooks/useCustomToast'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
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

const columns = ({ date, canDelete, handleEdit, openDialog, handleTicket }) => [
  {
    field: 'sno',
    headerName: 'S.No',
    width: 80
  },
  {
    field: 'staff_name',
    headerName: 'Staff',
    width: 250,
    renderCell: params => (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Avatar alt={params.row.staff_name} src={params.row.photo} />
        <Box sx={{ display: 'flex', flexDirection: 'column', marginLeft: 2 }}>
          <span>{params.row.staff_name}</span>
          <span style={{ fontSize: 'smaller', color: '#FF69B4', fontStyle: 'italic' }}>({params.row.staff_id})</span>
        </Box>
      </Box>
    )
  },
  {
    field: 'ticket_id',
    headerName: 'Ticket ID',
    width: 150,
    renderCell: params => (
      <Box>
        <TypographyStyled
          variant='body2'
          onClick={() => {
            handleTicket(params.value)
          }}
        >
          {params.value}
        </TypographyStyled>
      </Box>
    )
  },
  {
    field: 'client_name',
    headerName: 'Client',
    width: 250
  },
  {
    field: 'distance',
    headerName: 'Distance',
    width: 150
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 200,
    renderCell: params => <ChipComponent row={params.row} />
  },
  {
    field: 'actions',
    headerName: 'Actions',
    width: 150,
    sortable: false,
    filterable: false,
    renderCell: params => (
      <div>
        <IconButton
          color='primary'
          onClick={() => {
            const row = { ...params.row, date: dayjs(date).format('DD-MM-YYYY') }
            handleEdit(row)
          }}
        >
          <Icon icon='tdesign:edit' />
        </IconButton>
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

const ChipComponent = ({ row }) => {
  return (
    <Chip
      label={row?.status}
      variant='outlined'
      size='medium'
      color={row?.status === 'Active' ? 'success' : 'error'}
      sx={{
        margin: '4px',
        width: 150
      }}
    />
  )
}

// ** Parsing date
const parseDateString = dateString => {
  const [day, month, year] = dateString.split('-')

  return new Date(`${year}-${month}-${day}`)
}

const ViewDuty = ({ handleEdit, dropdown }) => {
  // ** States
  const [duties, setDuties] = useState([])
  const [loading, setLoading] = useState({ fetchAll: false, deleteData: false })
  const [isDialogOpen, setDialogOpen] = useState({ delete: false, ticket: false, duty: false })
  const [selectedDuty, setSelectedDuty] = useState(null)
  const [date, setDate] = useState(null)
  const [ticket, setTicket] = useState({})
  const [pendingDuty, setPendingDuty] = useState([])

  const { apiRequest } = useApi()
  const ability = useContext(AbilityContext)
  const canDelete = ability.can('delete', 'duty')
  const canExport = ability.can('export', 'duty')
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const types = ['Active', 'Cancelled']
  const [status, setStatus] = useState(types[0])
  const { user } = useAuth()
  const fiscalData = user?.fiscalRange.find(item => item.fiscal === user?.currentFiscal)

  // ** Abort Controller
  const controller = new AbortController()
  const signal = controller.signal

  // ** Fetch all duties
  const fetchDuties = async () => {
    const formattedDate = dayjs(date).format('YYYY-MM-DD')
    try {
      setLoading(prev => ({ ...prev, fetchAll: true }))

      const data = await apiRequest('get', '/duties?date=' + formattedDate, null, {}, signal)

      const dutiesWithSerial = data.map((duty, index) => ({
        ...duty,
        sno: index + 1
      }))

      setDuties(dutiesWithSerial)
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
    if (date) {
      fetchDuties()
    }

    return () => {
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date])

  // Filter duties array according to search key
  const filteredDuties = useMemo(() => {
    return duties
      ?.filter(d => d.status.toLowerCase().includes(status.toLowerCase()))
      .map((duty, index) => ({
        ...duty,
        sno: index + 1
      }))
  }, [duties, status])

  // ** Open dialog
  const openDialog = (dialog, row) => {
    if (dialog === 'delete') {
      setSelectedDuty(row)
    }

    if (dialog === 'ticket') {
      setTicket(row)
    }

    if (dialog === 'duty') {
      setPendingDuty(row)
    }

    setDialogOpen(prev => ({ ...prev, [dialog]: true }))
  }

  // ** Close dialog
  const closeDialog = dialog => {
    if (dialog === 'delete') {
      setSelectedDuty(null)
    }

    if (dialog === 'ticket') {
      setTicket(null)
    }

    if (dialog === 'duty') {
      setPendingDuty([])
    }

    setDialogOpen(prev => ({ ...prev, [dialog]: false }))
  }

  // ** Delete an entry
  const handleDelete = async () => {
    try {
      setLoading(prev => ({ ...prev, deleteData: true }))
      const response = await apiRequest('delete', `/duty/${selectedDuty?.id}`, null, {}, signal)
      closeDialog('delete')
      showSuccessToast(response?.message, 5000)
      fetchDuties()
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted')
      } else {
        const message = error?.response?.data?.message ?? 'Error while deleting the duty'
        closeDialog('delete')
        showErrorToast(message, 5000)
      }
    } finally {
      setLoading(prev => ({ ...prev, deleteData: false }))
    }
  }

  // ** Fetch ticket
  const handleTicket = async id => {
    try {
      setLoading(prev => ({ ...prev, fetchAll: true }))
      const data = await apiRequest('get', `/ticket?id=${id}`, null, {}, signal)
      openDialog('ticket', data)
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted')
      } else {
        showErrorToast('Error while fetching the ticket', 5000)
      }
    } finally {
      setLoading(prev => ({ ...prev, fetchAll: false }))
    }
  }

  // ** Show pending duties
  const handleDuty = () => {
    const technicianList = dropdown?.technician

    const filteredTechnicianList = technicianList.filter(
      itemB => !filteredDuties.some(itemA => Number(itemA.staff_id) === Number(itemB.id))
    )
    openDialog('duty', filteredTechnicianList)
  }

  // ** Generate pdf of active duties
  const generatePDF = () => {
    if (filteredDuties && filteredDuties.length > 0) {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'A4'
      })

      const head = '/images/icons/project-icons/head.png'
      const imgWidth = 210
      const imgHeight = (imgWidth * 40) / 190
      doc.addImage(head, 'PNG', 0, 10, imgWidth, imgHeight)

      doc.setFontSize(38)
      doc.setFont('helvetica', 'bold')
      const titleText = 'DUTY ROSTER'
      const textWidth = (doc.getStringUnitWidth(titleText) * doc.internal.getFontSize()) / doc.internal.scaleFactor
      const xPosition = (doc.internal.pageSize.width - textWidth) / 2
      doc.setTextColor(0, 0, 139)
      doc.text(titleText, xPosition + 10, 35)

      doc.setFontSize(12)
      const subtitleText = dayjs(date).format('DD-MM-YYYY')

      const subtitleWidth =
        (doc.getStringUnitWidth(subtitleText) * doc.internal.getFontSize()) / doc.internal.scaleFactor
      const subtitlePosition = (doc.internal.pageSize.width - subtitleWidth) / 2
      doc.setTextColor(231, 120, 35)
      doc.text(subtitleText, subtitlePosition + 5, 45)

      // const updatedRows = filteredDuties.map(({ id, client_id, ...rest }) => rest)
      const data = filteredDuties.map(row => ({
        sno: row.sno,
        ticket_id: row.ticket_id,
        staff_id: row.staff_id,
        name: row.staff_name,
        client: row.client_name,
        distance: row.distance
      }))
      const headers = ['SNo', 'Ticket ID', 'Staff ID', 'Name', 'Client', 'Distance (KM)']

      doc.autoTable({
        startY: 70,
        head: [headers],
        body: data.map(row => Object.values(row)),
        rowPageBreak: 'avoid',
        styles: {
          cellPadding: 2,
          cellWidth: 'auto',
          valign: 'middle',
          halign: 'center',
          lineWidth: 0.1,
          lineColor: [0, 0, 0]
        },
        headStyles: {
          fillColor: [48, 51, 78],
          textColor: [255, 255, 255]
        },
        bodyStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0]
        }
      })

      doc.save(`${dayjs(date).format('DD-MM-YYYY')}.pdf`)
    } else {
      showErrorToast('No duty found', 5000)
    }
  }

  return (
    <Card>
      <CardHeader sx={{ pb: 5 }} title='Duties' titleTypographyProps={{ variant: 'h6' }} />
      <CardContent>
        <Grid container spacing={6}>
          <Grid item xs={12} sm={5}>
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
          {date && (
            <Grid item xs={12} sm={5}>
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
          {date && status === 'Active' && (
            <Grid item xs={12} sm={2}>
              <Box display='flex' justifyContent='flex-end'>
                <Button variant='outlined' onClick={handleDuty} sx={{ mr: 2 }}>
                  <Icon icon='mdi:account-pending-outline' color='#FFC107' />
                </Button>
                {canExport && (
                  <Button variant='outlined' onClick={generatePDF}>
                    <Icon icon='bi:file-earmark-pdf' color='#FF69B4' />
                  </Button>
                )}
              </Box>
            </Grid>
          )}
        </Grid>

        <Box sx={{ height: 'calc(60vh)', width: '100%', marginTop: 6 }}>
          <DataGrid
            rows={filteredDuties}
            columns={columns({ date, canDelete, handleEdit, openDialog, handleTicket })}
            loading={loading['fetchAll']}
            disableRowSelectionOnClick
          />
        </Box>

        <Dialog
          open={isDialogOpen['delete']}
          onClose={() => closeDialog('delete')}
          aria-labelledby='delete-dialog-title'
          aria-describedby='delete-dialog-description'
        >
          <DialogTitle id='delete-dialog-title'>{'Delete Duty'}</DialogTitle>
          <DialogContent>
            <DialogContentText id='delete-dialog-description'>
              Are you sure you want to delete this duty?
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
          open={isDialogOpen['ticket']}
          onClose={() => closeDialog('ticket')}
          aria-labelledby='ticket-dialog-title'
          aria-describedby='ticket-dialog-description'
        >
          <DialogTitle id='ticket-dialog-title'>{'Ticket'}</DialogTitle>
          <DialogContent>
            <Box sx={{ width: 300 }}>
              <Box spacing={2} sx={{ mb: 2 }}>
                <Chip size='large' label={ticket?.date} color='primary' sx={{ mr: 2 }} />
                <Chip size='large' label={ticket?.status} color={ticket?.status === 'Pending' ? 'success' : 'error'} />
              </Box>

              <Stack spacing={2}>
                <Typography variant='h6' sx={{ fontWeight: 'bold' }}>
                  {ticket?.category_name}
                </Typography>

                <Typography variant='body2' sx={{ fontStyle: 'italic' }}>
                  {ticket?.comment}
                </Typography>
              </Stack>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => closeDialog('ticket')} sx={{ color: 'error.main' }}>
              Cancel
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={isDialogOpen['duty']}
          onClose={() => closeDialog('duty')}
          aria-labelledby='duty-dialog-title'
          aria-describedby='duty-dialog-description'
        >
          <DialogTitle id='duty-dialog-title'>{'Pending Duties'}</DialogTitle>
          <DialogContent>
            <Box sx={{ width: 300 }}>
              {pendingDuty.length === 0 ? (
                <Typography variant='body1' color='textSecondary'>
                  No pending duties
                </Typography>
              ) : (
                <AvatarGroup max={8}>
                  {pendingDuty.map(duty => (
                    <Avatar key={duty.id} alt={duty.name} src={duty.avatar} />
                  ))}
                </AvatarGroup>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => closeDialog('duty')} sx={{ color: 'error.main' }}>
              Cancel
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  )
}

export default ViewDuty
