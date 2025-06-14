// ** React Imports
import { useState, useEffect, useContext } from 'react'
import { useApi } from 'src/@core/api/useApi'

// ** MUI Imports
import { DataGrid } from '@mui/x-data-grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import IconButton from '@mui/material/IconButton'
import { Box, Button, Typography, LinearProgress } from '@mui/material'
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
    field: 'date',
    headerName: 'Date',
    width: 120,
    renderCell: params => (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <CustomChip skin='light' label={params?.row?.date} color='primary' />
      </Box>
    )
  },
  {
    field: 'ref_no',
    headerName: 'Ref No',
    width: 230,
    renderCell: params => (
      <Box sx={{ display: 'flex', flexDirection: 'column', marginLeft: 2 }}>
        <TypographyStyled onClick={() => actions.handleDownload(params.row)}>{params.row.ref_no}</TypographyStyled>
      </Box>
    )
  },
  {
    field: 'vendor',
    headerName: 'vendor',
    width: 450,
    renderCell: params => (
      <Box sx={{ display: 'flex', flexDirection: 'column', marginLeft: 2 }}>
        <span>{params.row.vendor.name}</span>
      </Box>
    )
  },
  {
    field: 'deadline',
    headerName: 'Deadline',
    width: 120,
    renderCell: params => (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <CustomChip skin='light' label={params?.row?.deadline} color='warning' />
      </Box>
    )
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 120,
    renderCell: params => (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <CustomChip
          skin='light'
          label={params?.row?.status}
          color={params?.row?.status === 'Active' ? 'success' : 'error'}
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
        {permissions.canEdit && (
          <IconButton
            color='secondary'
            onClick={() => {
              actions.openDialog('cancel', params.row)
            }}
          >
            <Icon icon='ci:exit' />
          </IconButton>
        )}
      </div>
    )
  }
]

const base64ToBlob = (base64, mimeType = 'application/pdf') => {
  const binary = Buffer.from(base64, 'base64')

  return new Blob([binary], { type: mimeType })
}

const ViewPurchaseOrder = ({ handleEdit }) => {
  // ** States
  const [puchaseOrders, setPurchaseOrders] = useState([])
  const [loading, setLoading] = useState({ fetchAll: false, deleteData: false, download: false })
  const [isDialogOpen, setDialogOpen] = useState({ delete: false, cancel: false })
  const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState(null)

  const { apiRequest } = useApi()
  const ability = useContext(AbilityContext)
  const canDelete = ability.can('delete', 'purchase_order')
  const canEdit = ability.can('edit', 'purchase_order')
  const { showSuccessToast, showErrorToast } = useCustomToast()

  // ** Abort Controller
  const controller = new AbortController()
  const signal = controller.signal

  // ** Fetch all
  const fetchPurchaseOrders = async () => {
    try {
      setLoading(prev => ({ ...prev, fetchAll: true }))
      const data = await apiRequest('get', '/purchase_orders', null, {}, signal)

      const purchaseOrdersWithSerial = data.map((purchase_order, index) => ({
        ...purchase_order,
        sno: index + 1
      }))
      setPurchaseOrders(purchaseOrdersWithSerial)
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
    fetchPurchaseOrders()

    return () => {
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ** Open dialog
  const openDialog = (dialog, row) => {
    setSelectedPurchaseOrder(row)
    setDialogOpen(prev => ({ ...prev, [dialog]: true }))
  }

  // ** Close dialog
  const closeDialog = dialog => {
    setSelectedPurchaseOrder(null)
    setDialogOpen(prev => ({ ...prev, [dialog]: false }))
  }

  // ** Delete an entry
  const handleDelete = async () => {
    try {
      setLoading(prev => ({ ...prev, deleteData: true }))
      const response = await apiRequest('delete', `/purchase_order/${selectedPurchaseOrder?.id}`, null, {}, signal)
      showSuccessToast(response?.message, 5000)
      fetchPurchaseOrders()
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted')
      } else {
        const message = error?.response?.data?.message ?? 'Error while deleting the purchase order'
        showErrorToast(message, 5000)
      }
    } finally {
      setLoading(prev => ({ ...prev, deleteData: false }))
      closeDialog('delete')
    }
  }

  // ** Cancel the purchase order
  const handleCancel = async () => {
    try {
      setLoading(prev => ({ ...prev, cancel: true }))
      const payload = { id: selectedPurchaseOrder?.id, _method: 'PATCH' }
      const response = await apiRequest('post', `/purchase_order`, payload, {}, signal)
      showSuccessToast(response?.message, 5000)
      fetchPurchaseOrders()
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted')
      } else {
        const message = error?.response?.data?.message ?? 'Error while updating the purchase order'
        showErrorToast(message, 5000)
      }
    } finally {
      setLoading(prev => ({ ...prev, cancel: false }))
      closeDialog('cancel')
    }
  }

  // ** Download purchase order
  const handleDownload = async item => {
    try {
      setLoading(prev => ({ ...prev, download: true }))
      const response = await apiRequest('get', `/purchase_order?id=${item?.id}`, null, {}, signal)

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
        showErrorToast('Something went wrong', 5000)
      }
    } finally {
      setLoading(prev => ({ ...prev, download: false }))
    }
  }

  return (
    <Card>
      <CardHeader sx={{ pb: 5 }} title='Purchase Orders' titleTypographyProps={{ variant: 'h6' }} />
      <CardContent>
        <Box sx={{ height: 'calc(60vh)', width: '100%', marginTop: 6 }}>
          {loading['download'] && <LinearProgress sx={{ height: 2 }} />}
          <DataGrid
            rows={puchaseOrders}
            columns={columns({
              permissions: { canDelete, canEdit },
              actions: { openDialog, handleEdit, handleDownload }
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
          <DialogTitle id='alert-dialog-title'>{'Delete Purchase Order'}</DialogTitle>
          <DialogContent>
            <DialogContentText id='alert-dialog-description'>
              Are you sure you want to delete this purchase order?
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
          open={isDialogOpen['cancel']}
          onClose={() => closeDialog('cancel')}
          aria-labelledby='alert-dialog-title'
          aria-describedby='alert-dialog-description'
        >
          <DialogTitle id='alert-dialog-title'>{'Cancel Purchase Order'}</DialogTitle>
          <DialogContent>
            <DialogContentText id='alert-dialog-description'>
              Are you sure you want to cancel this purchase order?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => closeDialog('cancel')} sx={{ color: 'error.main' }}>
              No
            </Button>
            <LoadingButton
              onClick={handleCancel}
              autoFocus
              loading={loading['cancel']}
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

export default ViewPurchaseOrder
