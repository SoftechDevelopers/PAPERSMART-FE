// ** React Imports
import { useState, useEffect, useContext, useMemo } from 'react'
import { useApi } from 'src/@core/api/useApi'

// ** MUI Imports
import { DataGrid } from '@mui/x-data-grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import IconButton from '@mui/material/IconButton'
import { Box, Button, Grid, InputAdornment, TextField, Typography } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import { styled } from '@mui/material/styles'
import CustomChip from 'src/@core/components/mui/chip'

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
    field: 'name',
    headerName: 'Name',
    width: 350,
    renderCell: params => (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', marginLeft: 2 }}>
          <TypographyStyled onClick={() => actions.handleAttachment(params.row)}>{params.row.name}</TypographyStyled>
          <span style={{ fontSize: 'smaller', color: '#FF69B4' }}>
            {params.row.address2}, {params.row.district}
          </span>
        </Box>
      </Box>
    )
  },
  {
    field: 'phone',
    headerName: 'Phone',
    width: 150
  },
  {
    field: 'email',
    headerName: 'Email',
    width: 300
  },
  {
    field: 'gst_registration',
    headerName: 'GST Registration',
    width: 200,
    renderCell: params => (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <CustomChip
          skin='light'
          label={params?.row?.gstin ? 'Registered' : 'Unregistered'}
          color={params?.row?.gstin ? 'success' : 'error'}
        />
      </Box>
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
        <IconButton color='primary' onClick={() => actions.handleEdit(params.row)}>
          <Icon icon='tdesign:edit' />
        </IconButton>
        {permissions?.canDelete && (
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

const ViewVendor = ({ handleEdit }) => {
  // ** States
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState({ fetchAll: false, deleteData: false })
  const [isDialogOpen, setDialogOpen] = useState({ delete: false })
  const [searchKey, setSearchKey] = useState('')

  const { apiRequest } = useApi()
  const ability = useContext(AbilityContext)
  const canDelete = ability.can('delete', 'vendor')
  const [selectedVendor, setSelectedVendor] = useState(null)
  const { showSuccessToast, showErrorToast } = useCustomToast()

  // ** Abort Controller
  const controller = new AbortController()
  const signal = controller.signal

  // ** Fetch all
  const fetchVendors = async () => {
    try {
      setLoading(prev => ({ ...prev, fetchAll: true }))
      const data = await apiRequest('get', '/vendors', null, {}, signal)

      const vendorsWithSerial = data.map((vendor, index) => ({
        ...vendor,
        sno: index + 1
      }))
      setVendors(vendorsWithSerial)
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
    fetchVendors()

    return () => {
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ** Handle search key change
  const handleSearchChange = e => {
    setSearchKey(e.target.value)
  }

  // ** Filter vendors according to search key
  const filteredVendors = useMemo(() => {
    return vendors
      ?.filter(v => v.name.toLowerCase().includes(searchKey.toLowerCase()))
      .map((vendor, index) => ({
        ...vendor,
        sno: index + 1
      }))
  }, [vendors, searchKey])

  // ** Open dialog
  const openDialog = (dialog, row) => {
    setSelectedVendor(row)
    setDialogOpen(prev => ({ ...prev, [dialog]: true }))
  }

  // ** Close dialog
  const closeDialog = dialog => {
    setSelectedVendor(null)
    setDialogOpen(prev => ({ ...prev, [dialog]: false }))
  }

  // ** Delete an entry
  const handleDelete = async () => {
    try {
      setLoading(prev => ({ ...prev, deleteData: true }))
      const response = await apiRequest('delete', `/vendor/${selectedVendor?.id}`, null, {}, signal)
      showSuccessToast(response?.message, 5000)
      fetchVendors()
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted')
      } else {
        const message = error?.response?.data?.message ?? 'Error while deleting the vendor'
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
      <CardHeader sx={{ pb: 5 }} title='Vendors' titleTypographyProps={{ variant: 'h6' }} />
      <CardContent>
        <Grid item xs={12}>
          <TextField
            value={searchKey}
            fullWidth
            label='Search'
            onChange={handleSearchChange}
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
            rows={filteredVendors}
            columns={columns({
              permissions: { canDelete },
              actions: { openDialog, handleEdit, handleAttachment }
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
          <DialogTitle id='alert-dialog-title'>{'Delete Vendor'}</DialogTitle>
          <DialogContent>
            <DialogContentText id='alert-dialog-description'>
              Are you sure you want to delete this vendor?
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

export default ViewVendor
