// ** React Imports
import { useState, useEffect, useContext, useMemo } from 'react'
import { useApi } from 'src/@core/api/useApi'

// ** MUI Imports
import { DataGrid } from '@mui/x-data-grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import IconButton from '@mui/material/IconButton'
import { Box, Button, Grid, FormControl, TextField, Typography, Autocomplete } from '@mui/material'
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
    field: 'hide',
    headerName: 'Hide',
    width: 60,
    sortable: false,
    filterable: false,
    renderCell: params => (
      <IconButton
        onClick={() => actions.handleHideRow(params.id)}
        sx={{
          '&:hover svg': {
            color: theme => theme.palette.error.main
          }
        }}
      >
        <Icon icon='material-symbols:visibility-off' />
      </IconButton>
    )
  },
  {
    field: 'sno',
    headerName: 'S.No',
    width: 80
  },
  {
    field: 'type',
    headerName: 'Type',
    width: 200,
    renderCell: params => (
      <Box sx={{ display: 'flex', flexDirection: 'column', marginLeft: 2 }}>
        <TypographyStyled onClick={() => actions.handleAttachment(params.row)}>{params.row.type}</TypographyStyled>
      </Box>
    )
  },
  {
    field: 'start_date',
    headerName: 'Start Date',
    width: 150,
    renderCell: params => (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <CustomChip skin='light' label={params?.row?.start_date} color='primary' />
      </Box>
    )
  },
  {
    field: 'end_date',
    headerName: 'End Date',
    width: 150,
    renderCell: params => (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <CustomChip skin='light' label={params?.row?.end_date} color='warning' />
      </Box>
    )
  },
  {
    field: 'fee',
    headerName: 'Fee',
    width: 100
  },
  {
    field: 'license',
    headerName: 'License',
    width: 80
  },
  {
    field: 'monthly',
    headerName: 'Monthly',
    width: 120
  },
  {
    field: 'quarterly',
    headerName: 'Quarterly',
    width: 120
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
              actions.openDialog('terminate', params.row)
            }}
          >
            <Icon icon='ci:exit' />
          </IconButton>
        )}
      </div>
    )
  }
]

const ViewContract = ({ handleEdit }) => {
  // ** States
  const [contracts, setContracts] = useState([])
  const [hiddenIds, setHiddenIds] = useState([])
  const [loading, setLoading] = useState({ fetchAll: false, deleteData: false, dropdown: false })
  const [isDialogOpen, setDialogOpen] = useState({ delete: false, terminate: false })
  const [dropdown, setDropdown] = useState({})
  const vendorList = dropdown?.contracted_vendor || []
  const [selectedContract, setSelectedContract] = useState(null)
  const [selectedVendor, setSelectedVendor] = useState(null)

  const { apiRequest } = useApi()
  const ability = useContext(AbilityContext)
  const canDelete = ability.can('delete', 'contract')
  const canEdit = ability.can('edit', 'contract')
  const { showSuccessToast, showErrorToast } = useCustomToast()

  // ** Abort Controller
  const controller = new AbortController()
  const signal = controller.signal

  // ** Fetch dropdowns
  useEffect(() => {
    const fetchDropdowns = async () => {
      setLoading(prev => ({ ...prev, dropdown: true }))
      try {
        const data = await apiRequest('get', '/dropdowns?tables=contracted_vendor', null, {}, signal)

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

  // ** Fetch all
  const fetchContracts = async () => {
    try {
      setLoading(prev => ({ ...prev, fetchAll: true }))
      const data = await apiRequest('get', '/contracts?id=' + selectedVendor, null, {}, signal)

      const contractsWithSerial = data.map((contract, index) => ({
        ...contract,
        sno: index + 1
      }))
      setContracts(contractsWithSerial)
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
    if (selectedVendor) {
      setHiddenIds([])
      fetchContracts()
    } else {
      setContracts([])
    }

    return () => {
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVendor])

  // ** Open dialog
  const openDialog = (dialog, row) => {
    setSelectedContract(row)
    setDialogOpen(prev => ({ ...prev, [dialog]: true }))
  }

  // ** Close dialog
  const closeDialog = dialog => {
    setSelectedContract(null)
    setDialogOpen(prev => ({ ...prev, [dialog]: false }))
  }

  // ** Delete an entry
  const handleDelete = async () => {
    try {
      setLoading(prev => ({ ...prev, deleteData: true }))
      const response = await apiRequest('delete', `/contract/${selectedContract?.id}`, null, {}, signal)
      showSuccessToast(response?.message, 5000)
      fetchContracts()
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted')
      } else {
        const message = error?.response?.data?.message ?? 'Error while deleting the contract'
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

  //   ** Hide row
  const handleHideRow = row => {
    setHiddenIds(prev => [...new Set([...prev, row])])
  }

  // ** Filter contracts
  const filteredContracts = useMemo(() => {
    return contracts
      ?.filter(row => !hiddenIds.includes(row.id))
      .map((contract, index) => ({
        ...contract,
        sno: index + 1
      }))
  }, [hiddenIds, contracts])

  //   ** Terminate contract
  const handleTerminate = async () => {
    try {
      setLoading(prev => ({ ...prev, terminate: true }))
      const payload = { id: selectedContract?.id, _method: 'PATCH' }
      const response = await apiRequest('post', `/contract`, payload, {}, signal)
      showSuccessToast(response?.message, 5000)
      fetchContracts()
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted')
      } else {
        const message = error?.response?.data?.message ?? 'Error while updating the contract'
        showErrorToast(message, 5000)
      }
    } finally {
      setLoading(prev => ({ ...prev, terminate: false }))
      closeDialog('terminate')
    }
  }

  return (
    <Card>
      <CardHeader sx={{ pb: 5 }} title='Contracts' titleTypographyProps={{ variant: 'h6' }} />
      <CardContent>
        <Grid container spacing={6}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <Autocomplete
                options={vendorList}
                getOptionLabel={option => option?.name || ''}
                onChange={(_, data) => {
                  setSelectedVendor(data ? data.id : null)
                }}
                isOptionEqualToValue={(option, value) => option && value && option.id === value.id}
                renderInput={params => <TextField {...params} label='Vendor' />}
                value={vendorList.find(vendor => vendor.id === Number(selectedVendor)) || null}
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
        </Grid>
        <Box sx={{ height: 'calc(60vh)', width: '100%', marginTop: 6 }}>
          <DataGrid
            rows={filteredContracts}
            columns={columns({
              permissions: { canDelete, canEdit },
              actions: { openDialog, handleEdit, handleAttachment, handleHideRow }
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
          <DialogTitle id='alert-dialog-title'>{'Delete Contract'}</DialogTitle>
          <DialogContent>
            <DialogContentText id='alert-dialog-description'>
              Are you sure you want to delete this contract?
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
          open={isDialogOpen['terminate']}
          onClose={() => closeDialog('terminate')}
          aria-labelledby='alert-dialog-title'
          aria-describedby='alert-dialog-description'
        >
          <DialogTitle id='alert-dialog-title'>{'Terminate Contract'}</DialogTitle>
          <DialogContent>
            <DialogContentText id='alert-dialog-description'>
              Are you sure you want to terminate this contract?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => closeDialog('terminate')} sx={{ color: 'error.main' }}>
              No
            </Button>
            <LoadingButton
              onClick={handleTerminate}
              autoFocus
              loading={loading['terminate']}
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

export default ViewContract
