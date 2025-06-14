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
import { Box, Grid, TextField, InputAdornment, CardMedia, Stack } from '@mui/material'
import { Autocomplete, Typography } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import { styled } from '@mui/material/styles'
import FormControl from '@mui/material/FormControl'
import Avatar from '@mui/material/Avatar'
import MuiDrawer from '@mui/material/Drawer'
import Divider from '@mui/material/Divider'
import CustomChip from 'src/@core/components/mui/chip'
import Skeleton from '@mui/material/Skeleton'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Other Imports
import { AbilityContext } from 'src/layouts/components/acl/Can'
import useCustomToast from 'src/@core/hooks/useCustomToast'

const TypographyStyled = styled(Typography)(({ theme }) => ({
  fontWeight: 500,
  cursor: 'pointer',
  textDecoration: 'none',
  color: theme.palette.text.primary,
  '&:hover': {
    color: theme.palette.primary.main
  }
}))

const Drawer = styled(MuiDrawer)(({ theme }) => ({
  width: 300,
  zIndex: theme.zIndex.modal,
  '& .MuiDrawer-paper': {
    border: 0,
    width: 350,
    zIndex: theme.zIndex.modal,
    boxShadow: theme.shadows[9],
    padding: theme.spacing(4)
  }
}))

const columns = ({ permissions, actions }) => [
  {
    field: 'sno',
    headerName: 'S.No',
    width: 80
  },
  {
    field: 'staff',
    headerName: 'Staff',
    width: 300,
    renderCell: params => (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Avatar alt={params.row.name} src={params.row.image_url} />
        <Box sx={{ display: 'flex', flexDirection: 'column', marginLeft: 2 }}>
          <TypographyStyled variant='body2' onClick={() => actions.handleDrawerOpen(params.row)}>
            {params.row.name}
          </TypographyStyled>
          <span style={{ fontSize: 'smaller', color: '#FF69B4', fontStyle: 'italic' }}>({params.row.id})</span>
        </Box>
      </Box>
    )
  },
  {
    field: 'make',
    headerName: 'Make',
    width: 300,
    renderCell: params => (
      <Box sx={{ display: 'flex', flexDirection: 'column', marginLeft: 2 }}>
        <span>{params.row.manufacturer}</span>
        <span style={{ fontSize: 'smaller', color: '#8A93A4' }}>({params.row.model})</span>
      </Box>
    )
  },
  {
    field: 'hsn',
    headerName: 'HSN',
    width: 120,
    renderCell: params => (
      <Box sx={{ display: 'flex', flexDirection: 'column', marginLeft: 2 }}>
        <span style={{ color: '#666CFF' }}>{params.row.hsn}</span>
      </Box>
    )
  },
  {
    field: 'cgst',
    headerName: 'CGST',
    width: 80,
    renderCell: params => (
      <Box sx={{ display: 'flex', flexDirection: 'column', marginLeft: 2 }}>
        {params.row.cgst && <span>{params.row.cgst}%</span>}
      </Box>
    )
  },
  {
    field: 'sgst',
    headerName: 'SGST',
    width: 80,
    renderCell: params => (
      <Box sx={{ display: 'flex', flexDirection: 'column', marginLeft: 2 }}>
        {params.row.sgst && <span>{params.row.sgst}%</span>}
      </Box>
    )
  },
  {
    field: 'igst',
    headerName: 'IGST',
    width: 80,
    renderCell: params => (
      <Box sx={{ display: 'flex', flexDirection: 'column', marginLeft: 2 }}>
        {params.row.igst && <span>{params.row.igst}%</span>}
      </Box>
    )
  },
  {
    field: 'unit',
    headerName: 'Unit',
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

const ViewItems = ({ handleEdit }) => {
  // ** States
  const [items, setItems] = useState([])

  const [loading, setLoading] = useState({
    fetchAll: false,
    deleteData: false,
    dropdown: false,
    itemProfile: false,
    submit: false
  })
  const [isDialogOpen, setDialogOpen] = useState({ delete: false, category: false })
  const [selectedItem, setSelectedItem] = useState(null)
  const [searchKey, setSearchKey] = useState('')
  const [dropdown, setDropdown] = useState({})
  const categoryList = dropdown?.category || []
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [itemProfile, setItemProfile] = useState({})
  const [isDrawerOpen, setDrawerOpen] = useState(false)
  const [category, setCategory] = useState('')

  const { apiRequest } = useApi()
  const ability = useContext(AbilityContext)
  const canDelete = ability.can('delete', 'item')
  const canCreate = ability.can('create', 'category')
  const { showSuccessToast, showErrorToast } = useCustomToast()

  // ** Abort Controller
  const controller = new AbortController()
  const signal = controller.signal

  // ** Fetch dropdowns

  const fetchDropdowns = async () => {
    setLoading(prev => ({ ...prev, dropdown: true }))
    try {
      const data = await apiRequest('get', '/dropdowns?tables=category', null, {}, signal)
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

  useEffect(() => {
    fetchDropdowns()

    return () => {
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ** Fetch all
  const fetchAll = async () => {
    try {
      setLoading(prev => ({ ...prev, fetchAll: true }))
      const data = await apiRequest('get', '/items?id=' + selectedCategory, null, {}, signal)

      const itemsWithSerial = data.map((item, index) => ({
        ...item,
        sno: index + 1
      }))
      setItems(itemsWithSerial)
    } catch (error) {
      console.log(error)
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
    if (selectedCategory) {
      fetchAll()
    }

    return () => {
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory])

  // ** Handle search key change
  const handleSearchChange = e => {
    setSearchKey(e.target.value)
  }

  // ** Filter items array according to search key
  const filteredItems = useMemo(() => {
    return items
      ?.filter(i => i.name.toLowerCase().includes(searchKey.toLowerCase()))
      .map((item, index) => ({
        ...item,
        sno: index + 1
      }))
  }, [items, searchKey])

  // ** Open dialog
  const openDialog = (dialog, row) => {
    setSelectedItem(row)
    setDialogOpen(prev => ({ ...prev, [dialog]: true }))
  }

  // ** Close dialog
  const closeDialog = dialog => {
    setCategory('')
    setSelectedItem(null)
    setDialogOpen(prev => ({ ...prev, [dialog]: false }))
  }

  // ** Delete an entry
  const handleDelete = async () => {
    try {
      setLoading(prev => ({ ...prev, deleteData: true }))
      const response = await apiRequest('delete', `/item/${selectedItem?.id}`, null, {}, signal)
      showSuccessToast(response?.message, 5000)
      fetchAll()
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted')
      } else {
        const message = error?.response?.data?.message ?? 'Error while deleting the item'
        showErrorToast(message, 5000)
      }
    } finally {
      setLoading(prev => ({ ...prev, deleteData: false }))
      closeDialog('delete')
    }
  }

  // ** Fetch item details
  const handleDrawerOpen = row => {
    setSelectedItem(row)
    setDrawerOpen(true)
  }

  useEffect(() => {
    const getItemProfile = async () => {
      try {
        setLoading(prev => ({ ...prev, itemProfile: true }))
        const data = await apiRequest('get', '/item_profile?id=' + selectedItem?.id, null, {}, signal)
        setItemProfile(data)
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log('Fetch aborted')
        } else {
          console.error(error)
        }
      } finally {
        setLoading(prev => ({ ...prev, itemProfile: false }))
      }
    }

    if (isDrawerOpen && selectedItem) {
      getItemProfile()
    }

    return () => {
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDrawerOpen])

  //   ** Function add category
  const handleAdd = async () => {
    try {
      setLoading(prev => ({ ...prev, submit: true }))
      const data = await apiRequest('post', '/category', { name: category }, {}, null)
      showSuccessToast(data?.message, 5000)
      fetchDropdowns()
    } catch (error) {
      console.log(error)
      showErrorToast('Error while processing the category', 5000)
    } finally {
      setLoading(prev => ({ ...prev, submit: false }))
      closeDialog('category')
    }
  }

  return (
    <Card>
      <CardHeader sx={{ pb: 5 }} title='Items' titleTypographyProps={{ variant: 'h6' }} />
      <CardContent>
        <Grid container spacing={6}>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <Autocomplete
                options={categoryList}
                getOptionLabel={option => option?.name || ''}
                onChange={(_, data) => {
                  setSelectedCategory(data ? data.id : null)
                }}
                isOptionEqualToValue={(option, value) => option && value && option.id === value.id}
                renderInput={params => <TextField {...params} label='Category' />}
                value={categoryList.find(vendor => vendor.id === Number(selectedCategory)) || null}
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
          <Grid item xs={12} sm={6}>
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
          <Grid item xs={12} sm={2}>
            <Box display='flex' justifyContent='flex-end'>
              <Button
                variant='outlined'
                sx={{ mr: 2 }}
                onClick={() => openDialog('category')}
                startIcon={<Icon icon='material-symbols:add-rounded' />}
              >
                Category
              </Button>
            </Box>
          </Grid>
        </Grid>
        <Box sx={{ height: 'calc(55vh)', width: '100%', marginTop: 6 }}>
          <DataGrid
            rows={filteredItems}
            columns={columns({
              permissions: { canDelete },
              actions: { handleEdit, openDialog, handleDrawerOpen }
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
          <DialogTitle id='alert-dialog-title'>{'Delete Item'}</DialogTitle>
          <DialogContent>
            <DialogContentText id='alert-dialog-description'>
              Are you sure you want to delete this item?
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

        <Drawer open={isDrawerOpen} hideBackdrop anchor='right' variant='persistent'>
          {!loading['itemProfile'] ? (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
              <Typography variant='h6'>{itemProfile?.name}</Typography>
              <IconButton onClick={() => setDrawerOpen(false)}>
                <Icon icon='mdi:close' fontSize={20} />
              </IconButton>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
              <Skeleton animation='wave' height={30} width='50%' />
              <IconButton onClick={() => setDrawerOpen(false)}>
                <Icon icon='mdi:close' fontSize={20} />
              </IconButton>
            </Box>
          )}
          <Divider />
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              mt: 4
            }}
          >
            {!loading['itemProfile'] ? (
              <Card sx={{ width: 150 }}>
                <CardMedia component='img' height='140' image={itemProfile.image_url} alt='Item' />
              </Card>
            ) : (
              <Skeleton animation='wave' height={150} width='40%' />
            )}

            {!loading['itemProfile'] ? (
              <CustomChip skin='light' label={'ID: ' + itemProfile?.id} color='primary' sx={{ mt: 4 }} />
            ) : (
              <Skeleton animation='wave' height={40} width='40px' />
            )}

            {!loading['itemProfile'] ? (
              <Stack spacing={2} sx={{ mt: 4, width: '100%', maxWidth: 300 }}>
                <Divider />
                <Box display='flex' alignItems='center' justifyContent='space-between'>
                  <Box display='flex' alignItems='center' gap={1}>
                    <Typography>Manufacturer</Typography>
                  </Box>
                  <Typography variant='body2' color='text.secondary'>
                    {itemProfile?.manufacturer}
                  </Typography>
                </Box>
                <Box display='flex' alignItems='center' justifyContent='space-between'>
                  <Box display='flex' alignItems='center' gap={1}>
                    <Typography>Model</Typography>
                  </Box>
                  <Typography variant='body2' color='text.secondary'>
                    {itemProfile?.model}
                  </Typography>
                </Box>
                <Box display='flex' alignItems='center' justifyContent='space-between'>
                  <Box display='flex' alignItems='center' gap={1}>
                    <Typography>HSN</Typography>
                  </Box>
                  <Typography variant='body2' color='text.secondary'>
                    {itemProfile?.hsn}
                  </Typography>
                </Box>
                <Box display='flex' alignItems='center' justifyContent='space-between'>
                  <Box display='flex' alignItems='center' gap={1}>
                    <Typography>CGST</Typography>
                  </Box>
                  <Typography variant='body2' color='text.secondary'>
                    {itemProfile?.cgst}
                  </Typography>
                </Box>
                <Box display='flex' alignItems='center' justifyContent='space-between'>
                  <Box display='flex' alignItems='center' gap={1}>
                    <Typography>SGST</Typography>
                  </Box>
                  <Typography variant='body2' color='text.secondary'>
                    {itemProfile?.sgst}
                  </Typography>
                </Box>
                <Box display='flex' alignItems='center' justifyContent='space-between'>
                  <Box display='flex' alignItems='center' gap={1}>
                    <Typography>IGST</Typography>
                  </Box>
                  <Typography variant='body2' color='text.secondary'>
                    {itemProfile?.igst}
                  </Typography>
                </Box>
                <Box display='flex' alignItems='center' justifyContent='space-between'>
                  <Box display='flex' alignItems='center' gap={1}>
                    <Typography>Unit</Typography>
                  </Box>
                  <Typography variant='body2' color='text.secondary'>
                    {itemProfile?.unit}
                  </Typography>
                </Box>
                <Divider />
              </Stack>
            ) : (
              <Stack spacing={2} sx={{ mt: 4, width: '100%', maxWidth: 300 }}>
                <Divider />
                {Array.from({ length: 7 }).map((_, index) => (
                  <Box key={index} display='flex' alignItems='center' justifyContent='space-between' sx={{ mb: 2 }}>
                    <Box display='flex' alignItems='center' gap={1}>
                      <Skeleton animation='wave' height={20} width='80px' />
                    </Box>
                    <Skeleton animation='wave' height={20} width='80px' />
                  </Box>
                ))}
                <Divider />
              </Stack>
            )}

            {!loading['itemProfile'] ? (
              <Stack
                direction='row'
                divider={<Divider orientation='vertical' flexItem />}
                spacing={4}
                sx={{ mt: 4, justifyContent: 'center', alignItems: 'center' }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Typography variant='subtitle2' color='text.secondary'>
                    Total In
                  </Typography>
                  <Typography variant='h6' color='#67CB24'>
                    {itemProfile?.total_in}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Typography variant='subtitle2' color='text.secondary'>
                    Total Out
                  </Typography>
                  <Typography variant='h6' color='#E64542'>
                    {itemProfile?.total_out}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Typography variant='subtitle2' color='text.secondary'>
                    Balance
                  </Typography>
                  <Typography variant='h6'>{itemProfile?.stock_balance}</Typography>
                </Box>
              </Stack>
            ) : (
              <Stack
                direction='row'
                divider={<Divider orientation='vertical' flexItem />}
                spacing={4}
                sx={{ mt: 4, justifyContent: 'center', alignItems: 'center' }}
              >
                {Array.from({ length: 3 }).map((_, index) => (
                  <Box key={index} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Skeleton animation='wave' height={20} width='80px' />
                    <Skeleton animation='wave' height={50} width='50px' />
                  </Box>
                ))}
              </Stack>
            )}

            {!loading['itemProfile'] ? (
              <Box sx={{ mt: 6, width: '100%', maxWidth: 300, mx: 'auto' }}>
                <Divider sx={{ mb: 4 }} />
                <Typography gutterBottom>Latest Purchase</Typography>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <CustomChip
                      skin='light'
                      label={itemProfile?.latest_purchase?.date}
                      color='warning'
                      sx={{ mb: 1 }}
                      size='small'
                    />
                    <Typography variant='body2' mb={1} color='text.primary'>
                      {itemProfile?.latest_purchase?.vendor?.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant='body2'>Rate: ₹{itemProfile?.latest_purchase?.stock?.rate}</Typography>
                      <Box
                        sx={{
                          height: 16,
                          borderLeft: '1px solid',
                          borderColor: 'divider',
                          mx: 1
                        }}
                      />

                      <Typography variant='body2'>Quantity: {itemProfile?.latest_purchase?.stock?.quantity}</Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            ) : (
              <Box sx={{ mt: 6, width: '100%', maxWidth: 300, mx: 'auto' }}>
                <Divider sx={{ mb: 4 }} />
                <Skeleton animation='wave' height={30} width='80px' />
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Skeleton animation='wave' height={30} width='120px' />
                    <Skeleton animation='wave' height={20} width='60px' />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Skeleton animation='wave' height={20} width='60px' />
                      <Box
                        sx={{
                          height: 16,
                          borderLeft: '1px solid',
                          borderColor: 'divider',
                          mx: 1
                        }}
                      />

                      <Skeleton animation='wave' height={20} width='60px' />
                    </Box>
                  </Box>
                </Box>
              </Box>
            )}

            {!loading['itemProfile'] ? (
              <Box sx={{ mt: 6, width: '100%', maxWidth: 300, mx: 'auto' }}>
                <Divider sx={{ mb: 4 }} />
                <Typography gutterBottom>Latest Sales</Typography>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <CustomChip
                      skin='light'
                      label={itemProfile?.latest_sales?.date}
                      color='info'
                      sx={{ mb: 1 }}
                      size='small'
                    />
                    <Typography variant='body2' mb={1} color='text.primary'>
                      {itemProfile?.latest_sales?.client?.address2}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant='body2'>Rate: ₹{itemProfile?.latest_sales?.stock?.rate}</Typography>
                      <Box
                        sx={{
                          height: 16,
                          borderLeft: '1px solid',
                          borderColor: 'divider',
                          mx: 1
                        }}
                      />

                      <Typography variant='body2'>Quantity: {itemProfile?.latest_sales?.stock?.quantity}</Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            ) : (
              <Box sx={{ mt: 6, width: '100%', maxWidth: 300, mx: 'auto' }}>
                <Divider sx={{ mb: 4 }} />
                <Skeleton animation='wave' height={30} width='80px' />
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Skeleton animation='wave' height={30} width='120px' />
                    <Skeleton animation='wave' height={20} width='60px' />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Skeleton animation='wave' height={20} width='60px' />
                      <Box
                        sx={{
                          height: 16,
                          borderLeft: '1px solid',
                          borderColor: 'divider',
                          mx: 1
                        }}
                      />

                      <Skeleton animation='wave' height={20} width='60px' />
                    </Box>
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
        </Drawer>
        <Dialog
          open={isDialogOpen['category']}
          onClose={() => closeDialog('category')}
          aria-labelledby='alert-dialog-title'
          aria-describedby='alert-dialog-description'
        >
          <DialogTitle id='alert-dialog-title'>{'Add Category'}</DialogTitle>
          <DialogContent>
            <Box sx={{ padding: 1, marginTop: 1, width: { sm: 300, xl: 400 } }}>
              <Grid container spacing={6}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <TextField
                      value={category}
                      label='Category'
                      onChange={e => {
                        setCategory(e.target.value)
                      }}
                    />
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => closeDialog('category')} sx={{ color: 'error.main' }}>
              Cancel
            </Button>
            {canCreate && (
              <LoadingButton
                onClick={handleAdd}
                autoFocus
                loading={loading['submit']}
                loadingPosition='start'
                disabled={Boolean(!category)}
                startIcon={<Icon icon='mdi:tick' />}
              >
                Submit
              </LoadingButton>
            )}
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  )
}

export default ViewItems
