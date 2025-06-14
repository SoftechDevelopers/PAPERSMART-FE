// ** React Imports
import { useState, useEffect, useContext, useMemo } from 'react'
import { useApi } from 'src/@core/api/useApi'

// ** MUI Imports
import { DataGrid } from '@mui/x-data-grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import IconButton from '@mui/material/IconButton'
import { Box, Button, Grid, InputAdornment, TextField } from '@mui/material'
import { FormControl, InputLabel, Select, MenuItem, Typography } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import CustomChip from 'src/@core/components/mui/chip'
import { styled } from '@mui/material/styles'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Other Imports
import { AbilityContext } from 'src/layouts/components/acl/Can'
import useCustomToast from 'src/@core/hooks/useCustomToast'

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

const columns = ({ permissions, actions }) => [
  {
    field: 'sno',
    headerName: 'S.No',
    width: 80
  },
  {
    field: 'client',
    headerName: 'Client',
    width: 400,
    renderCell: params => (
      <Box sx={{ display: 'flex', flexDirection: 'column', marginLeft: 2 }}>
        <TypographyStyled onClick={() => actions.handleAttachment(params.row)}>
          {params.row.client.name}
        </TypographyStyled>
        <span style={{ fontSize: 'smaller', color: '#FF69B4' }}>{params.row.client.address2}</span>
      </Box>
    )
  },
  {
    field: 'signatory_2',
    headerName: 'Director / Manager',
    width: 200
  },
  {
    field: 'signatory_3',
    headerName: 'Principal',
    width: 200
  },
  {
    field: 'end_date',
    headerName: 'End Date',
    width: 150,
    renderCell: params => (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <CustomChip skin='light' label={params?.row?.end_date} color='primary' />
      </Box>
    )
  },
  {
    field: 'consideration',
    headerName: 'Rate',
    width: 100
  },
  {
    field: 'classes',
    headerName: 'Classes',
    width: 80
  },
  {
    field: 'actions',
    headerName: 'Actions',
    width: 150,
    sortable: false,
    filterable: false,
    renderCell: params => (
      <div>
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

const ViewAgreement = ({ handleEdit }) => {
  // ** States
  const [agreements, setAgreements] = useState([])
  const [loading, setLoading] = useState({ fetchAll: false, deleteData: false })
  const [isDialogOpen, setDialogOpen] = useState({ delete: false })
  const [searchKey, setSearchKey] = useState('')
  const types = ['Hardware & Service', 'Service', 'Content Service', 'Professional Service', 'Others']
  const [type, setType] = useState('')

  const { apiRequest } = useApi()
  const ability = useContext(AbilityContext)
  const canDelete = ability.can('delete', 'client')
  const [selectedAgreement, setSelectedAgreement] = useState(null)
  const { showSuccessToast, showErrorToast } = useCustomToast()

  // ** Abort Controller
  const controller = new AbortController()
  const signal = controller.signal

  // ** Fetch all
  const fetchAgreements = async () => {
    try {
      setLoading(prev => ({ ...prev, fetchAll: true }))
      const data = await apiRequest('get', '/agreements?type=' + encodeURIComponent(type), null, {}, signal)

      const agreementsWithSerial = data.map((agreement, index) => ({
        ...agreement,
        sno: index + 1
      }))
      setAgreements(agreementsWithSerial)
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
    if (type) {
      fetchAgreements()
    }

    return () => {
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type])

  // ** Handle search key change
  const handleSearchChange = e => {
    setSearchKey(e.target.value)
  }

  // ** Filter agreements according to search key
  const filteredAgreements = useMemo(() => {
    return agreements
      ?.filter(
        a =>
          a.client.address2.toLowerCase().includes(searchKey.toLowerCase()) ||
          a.client.name.toLowerCase().includes(searchKey.toLowerCase())
      )
      .map((agreement, index) => ({
        ...agreement,
        sno: index + 1
      }))
  }, [agreements, searchKey])

  // ** Open dialog
  const openDialog = (dialog, row) => {
    setSelectedAgreement(row)
    setDialogOpen(prev => ({ ...prev, [dialog]: true }))
  }

  // ** Close dialog
  const closeDialog = dialog => {
    setSelectedAgreement(null)
    setDialogOpen(prev => ({ ...prev, [dialog]: false }))
  }

  // ** Delete an entry
  const handleDelete = async () => {
    try {
      setLoading(prev => ({ ...prev, deleteData: true }))
      const response = await apiRequest('delete', `/agreement/${selectedAgreement?.id}`, null, {}, signal)
      showSuccessToast(response?.message, 5000)
      fetchAgreements()
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted')
      } else {
        const message = error?.response?.data?.message ?? 'Error while deleting the agreement'
        showErrorToast(message, 5000)
      }
    } finally {
      setLoading(prev => ({ ...prev, deleteData: false }))
      closeDialog('delete')
    }
  }

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

  return (
    <Card>
      <CardHeader sx={{ pb: 5 }} title='Agreements' titleTypographyProps={{ variant: 'h6' }} />
      <CardContent>
        <Grid container spacing={6}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel id='type-select-label'>Type</InputLabel>
              <Select
                labelId='type-select-label'
                label='Type'
                value={type}
                onChange={e => {
                  setType(e.target.value)
                }}
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
              onChange={handleSearchChange}
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
            rows={filteredAgreements}
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
          <DialogTitle id='alert-dialog-title'>{'Delete Agreement'}</DialogTitle>
          <DialogContent>
            <DialogContentText id='alert-dialog-description'>
              Are you sure you want to delete this agreement?
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

export default ViewAgreement
