// ** React Imports
import { useState, useEffect, useContext } from 'react'
import { useApi } from 'src/@core/api/useApi'

// ** MUI Imports
import { DataGrid, GridRow } from '@mui/x-data-grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import { FormControl, InputLabel, Typography, Button, Autocomplete, CardActions } from '@mui/material'
import { Box, Grid, Select, MenuItem, TextField } from '@mui/material'
import CustomChip from 'src/@core/components/mui/chip'
import { LoadingButton } from '@mui/lab'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Other Imports
import { AbilityContext } from 'src/layouts/components/acl/Can'
import useCustomToast from 'src/@core/hooks/useCustomToast'
import { useDraggable, DndContext, rectIntersection, useDroppable } from '@dnd-kit/core'
import { arrayMove, SortableContext } from '@dnd-kit/sortable'

const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: 300
    }
  }
}

const columns = ({ permissions, actions }) => [
  {
    field: 'sno',
    headerName: 'S.No',
    width: 80
  },
  {
    field: 'item',
    headerName: 'Item',
    width: 250,
    renderCell: params => (
      <div>
        <Typography variant='body1' style={{ fontSize: '15px' }}>
          {params.row.item.name}
        </Typography>
        <Typography variant='body2' style={{ fontStyle: 'italic', fontSize: '13px', color: '#FF69B4' }}>
          ({params.row.item.id})
        </Typography>
      </div>
    )
  },
  {
    field: 'make',
    headerName: 'Make',
    width: 250,
    renderCell: params => (
      <div>
        <Typography variant='body1' style={{ fontSize: '15px' }}>
          {params.row.item.manufacturer}
        </Typography>
        <Typography variant='body2' style={{ fontStyle: 'italic', fontSize: '13px', color: '#FF69B4' }}>
          ({params.row.item.model})
        </Typography>
      </div>
    )
  },
  {
    field: 'unit',
    headerName: 'Unit',
    width: 80,
    renderCell: params => (
      <div>
        <Typography variant='body1' style={{ fontSize: '15px' }}>
          {params.row.item.unit}
        </Typography>
      </div>
    )
  },
  {
    field: 'rate',
    headerName: 'Rate',
    width: 150
  },
  {
    field: 'purchase_price',
    headerName: 'Purchase Price',
    width: 150
  },
  {
    field: 'sales_price',
    headerName: 'Sales Price',
    width: 150
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
            actions.openDialog('template', params.row)
          }}
        >
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

function DraggableRow({ row, index, style, ...props }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
    transform: dragTransform
  } = useDraggable({
    id: row.id
  })

  const { isOver, setNodeRef: setDroppableRef } = useDroppable({
    id: row.id
  })

  const translate = dragTransform
    ? {
        transform: `translate3d(${dragTransform.x}px, ${dragTransform.y}px, 0)`,
        transition: 'transform 0.1s ease'
      }
    : {}

  const handleDrag = event => {
    const targetCell = event.target.closest('.MuiDataGrid-cell')
    if (targetCell && targetCell.getAttribute('data-field') === 'actions') {
      return
    }
    listeners?.onPointerDown?.(event)
  }

  return (
    <GridRow
      ref={node => {
        setNodeRef(node)
        setDroppableRef(node)
      }}
      {...attributes}
      {...listeners}
      {...props}
      onPointerDown={handleDrag}
      style={{
        ...style,
        ...translate,
        height: props.style?.height || 'auto',
        backgroundColor: isOver ? '#a3a9ff' : 'inherit',
        color: isOver ? 'white' : 'inherit',
        cursor: 'grab',
        boxShadow: isDragging ? '0px 4px 10px rgba(0, 0, 0, 0.2)' : 'none',
        opacity: isDragging ? 0.8 : 1,
        transition: 'background-color 0.2s ease, opacity 0.2s ease'
      }}
    />
  )
}

const ManageProposalTemplate = ({ dropdownData }) => {
  // ** States
  const { dropdown, fetchDropdowns } = dropdownData
  const [type, setType] = useState('')

  const [loading, setLoading] = useState({
    fetchAll: false,
    submitTemplate: false,
    deleteData: false,
    submitType: false,
    updateSequence: false
  })
  const [isDialogOpen, setDialogOpen] = useState({ template: false, delete: false, type: false })
  const [templates, setTemplates] = useState([])
  const [values, setValues] = useState({ item_id: '', rate: '' })
  const itemList = dropdown?.item || []
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [proposalType, setProposalType] = useState('')

  const typeList = dropdown?.proposal_type?.map(({ id, name }) => (
    <MenuItem key={id} value={id}>
      {name}
    </MenuItem>
  ))

  const ability = useContext(AbilityContext)
  const canCreate = ability.can('create', 'proposal_template')
  const canEdit = ability.can('edit', 'proposal_template')
  const canDelete = ability.can('delete', 'proposal_template')
  const canCreateType = ability.can('create', 'proposal_type')
  const canUpdate = ability.can('edit', 'proposal_templates')

  const { apiRequest } = useApi()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  // ** Abort Controller
  const controller = new AbortController()
  const signal = controller.signal

  // ** Fetch proposal templates
  useEffect(() => {
    fetchTemplates()

    return () => {
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type])

  const fetchTemplates = async () => {
    try {
      setLoading(prev => ({ ...prev, fetchAll: true }))
      const data = await apiRequest('get', '/proposal_templates?id=' + type, null, {}, signal)

      const templatesWithSerial = data.map((template, index) => ({
        ...template,
        sno: index + 1
      }))

      setTemplates(templatesWithSerial)
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted')
      } else {
        showErrorToast('Something went wrong', 5000)
      }
    } finally {
      setLoading(prev => ({ ...prev, fetchAll: false }))
    }
  }

  // ** Open dialog
  const openDialog = (dialog, row) => {
    if (row) {
      setValues({ ...values, item_id: row.item.id, rate: row.rate })
      setSelectedTemplate(row)
    } else {
      setValues({ ...values, item_id: '', rate: '' })
    }
    setProposalType('')
    setDialogOpen(prev => ({ ...prev, [dialog]: true }))
  }

  // ** Close dialog
  const closeDialog = dialog => {
    setDialogOpen(prev => ({ ...prev, [dialog]: false }))
  }

  // ** Add or Edit template
  const submitTemplate = async () => {
    try {
      setLoading(prev => ({ ...prev, submitTemplate: true }))

      const payload = {
        proposal_type_id: type,
        item_id: values.item_id,
        rate: values.rate
      }

      let data
      if (!selectedTemplate?.id) {
        data = await apiRequest('post', '/proposal_template', payload, {}, null)
      } else {
        const updatedPayload = { ...payload, _method: 'PUT' }
        data = await apiRequest('post', `/proposal_template/${selectedTemplate?.id}`, updatedPayload, {}, null)
        setSelectedTemplate(null)
      }

      showSuccessToast(data?.message, 5000)
      fetchTemplates()
    } catch (error) {
      if (error?.status === 409) {
        showErrorToast(error?.response?.data?.message, 5000)
      } else {
        showErrorToast('Error while processing the template', 5000)
      }
    } finally {
      setLoading(prev => ({ ...prev, submitTemplate: false }))
      closeDialog('template')
    }
  }

  // ** Delete item from template
  const handleDelete = async () => {
    try {
      setLoading(prev => ({ ...prev, deleteData: true }))
      const response = await apiRequest('delete', `/proposal_template/${selectedTemplate?.id}`, null, {}, signal)
      showSuccessToast(response?.message, 5000)
      fetchTemplates()
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

  // ** Add type
  const submitType = async () => {
    try {
      setLoading(prev => ({ ...prev, submitType: true }))

      const payload = {
        name: proposalType
      }

      let data = await apiRequest('post', '/proposal_type', payload, {}, null)

      showSuccessToast(data?.message, 5000)
      fetchDropdowns()
    } catch (error) {
      if (error?.status === 409) {
        showErrorToast(error?.response?.data?.message, 5000)
      } else {
        showErrorToast('Error while processing the type', 5000)
      }
    } finally {
      setLoading(prev => ({ ...prev, submitType: false }))
      closeDialog('type')
    }
  }

  // ** Setting array after drag
  const handleDragEnd = event => {
    const { active, over } = event

    if (!over) {
      return
    }

    if (active && over && active.id !== over.id) {
      const oldIndex = templates.findIndex(row => row.id === active.id)
      const newIndex = templates.findIndex(row => row.id === over.id)
      const updatedRows = arrayMove(templates, oldIndex, newIndex)

      const updatedRowsWithSno = updatedRows.map((row, index) => ({
        ...row,
        sno: index + 1
      }))
      setTemplates(updatedRowsWithSno)
    }
  }

  // ** Update sequence
  const updateSequence = async () => {
    try {
      setLoading(prev => ({ ...prev, updateSequence: true }))

      const sequenceArray = templates.map(({ id }, index) => ({
        id,
        sequence: index + 1
      }))

      const payload = {
        data: sequenceArray,
        _method: 'PATCH'
      }

      let data = await apiRequest('post', '/proposal_templates', payload, {}, null)
      showSuccessToast(data?.message, 5000)
      fetchTemplates()
    } catch (error) {
      showErrorToast('Error while updating the sequence', 5000)
    } finally {
      setLoading(prev => ({ ...prev, updateSequence: false }))
    }
  }

  return (
    <Card>
      <CardHeader sx={{ pb: 5 }} title='Proposal Template' titleTypographyProps={{ variant: 'h6' }} />
      <CardContent>
        <Grid container spacing={6}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel id='type-select-label'>Proposal Type</InputLabel>
              <Select
                labelId='type-select-label'
                label='Proposal Type'
                value={type}
                onChange={e => setType(e.target.value)}
                MenuProps={MenuProps}
              >
                {typeList}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box display='flex' justifyContent='flex-end'>
              <LoadingButton
                onClick={updateSequence}
                loading={loading['updateSequence']}
                loadingPosition='start'
                startIcon={<Icon icon='ri:sort-number-desc' />}
                variant='outlined'
                size='large'
                sx={{ mr: 2 }}
                disabled={!canUpdate || !Boolean(type)}
              >
                Update
              </LoadingButton>
              <Button
                variant='outlined'
                sx={{ mr: 2 }}
                disabled={!Boolean(type)}
                onClick={() => openDialog('template')}
                startIcon={<Icon icon='material-symbols:add-rounded' color={!Boolean(type) || '#FF69B4'} />}
              >
                <span style={{ color: !Boolean(type) || '#FF69B4' }}>Add</span>
              </Button>
              <Button variant='outlined' sx={{ mr: 2 }} onClick={() => openDialog('type')}>
                <Icon icon='fluent:scan-type-24-filled' color='#FFA500' />
              </Button>
            </Box>
          </Grid>
        </Grid>
        <Box sx={{ height: 'calc(60vh)', width: '100%', marginTop: 6 }}>
          <DndContext collisionDetection={rectIntersection} onDragEnd={handleDragEnd}>
            <SortableContext items={templates.map(row => row.id)}>
              <DataGrid
                rows={templates}
                columns={columns({
                  permissions: { canDelete },
                  actions: { openDialog }
                })}
                loading={loading['fetchAll']}
                slots={{
                  row: props => <DraggableRow {...props} row={props.row} />
                }}
                disableColumnReorder
              />
            </SortableContext>
          </DndContext>
        </Box>
        <Dialog
          open={isDialogOpen['template']}
          onClose={() => closeDialog('template')}
          aria-labelledby='dialog-title'
          aria-describedby='dialog-description'
        >
          <DialogTitle id='dialog-title'>{'Item Details'}</DialogTitle>
          <DialogContent>
            <Box
              sx={{
                padding: 1,
                marginTop: 1,
                width: { sm: 300, xl: 400 }
              }}
            >
              <Grid container spacing={6}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <Autocomplete
                      options={itemList}
                      getOptionLabel={option => option?.name || ''}
                      onChange={(_, data) => {
                        setValues({ ...values, item_id: data ? data.id : null })
                      }}
                      isOptionEqualToValue={(option, value) => option && value && option.id === value.id}
                      renderInput={params => <TextField {...params} label='Item' />}
                      value={itemList.find(item => item.id === Number(values.item_id)) || null}
                      renderOption={(props, option) => (
                        <li {...props} key={option.id} style={{ display: 'flex', alignItems: 'center' }}>
                          <div>
                            <span style={{ color: '#ff4d49' }}>{`ID: ${option.id}`}</span>
                            <br />
                            <span>{`Name: ${option.name}`}</span>
                            <br />
                            <span style={{ fontSize: '0.87rem', fontStyle: 'italic', color: '#666' }}>
                              {`Manufacturer: ${option.manufacturer}`}
                            </span>
                            <br />
                            <span style={{ fontSize: '0.87rem', fontStyle: 'italic', color: '#666' }}>
                              {`Model: ${option.model}`}
                            </span>
                          </div>
                        </li>
                      )}
                    />
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <TextField
                      value={values.rate}
                      label='Rate'
                      type='number'
                      InputProps={{
                        inputProps: { min: 0 }
                      }}
                      onChange={e => {
                        setValues({ ...values, rate: e.target.value })
                      }}
                    />
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => closeDialog('template')} sx={{ color: 'error.main' }}>
              Cancel
            </Button>
            {(selectedTemplate?.id ? canEdit : canCreate) && (
              <LoadingButton
                loading={loading['submitTemplate']}
                loadingPosition='start'
                startIcon={<Icon icon='mdi:tick' />}
                size='large'
                type='button'
                sx={{ marginRight: 2 }}
                onClick={submitTemplate}
                disabled={Object.values(values).some(value => !value)}
              >
                Submit
              </LoadingButton>
            )}
          </DialogActions>
        </Dialog>

        <Dialog
          open={isDialogOpen['type']}
          onClose={() => closeDialog('type')}
          aria-labelledby='dialog-title'
          aria-describedby='dialog-description'
        >
          <DialogTitle id='dialog-title'>{'Proposal Type'}</DialogTitle>
          <DialogContent>
            <Box
              sx={{
                padding: 1,
                marginTop: 1,
                width: 300
              }}
            >
              <Grid container spacing={6}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <TextField
                      value={proposalType}
                      label='Name'
                      onChange={e => {
                        setProposalType(e.target.value)
                      }}
                    />
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => closeDialog('type')} sx={{ color: 'error.main' }}>
              Cancel
            </Button>
            {canCreateType && (
              <LoadingButton
                loading={loading['submitType']}
                loadingPosition='start'
                startIcon={<Icon icon='mdi:tick' />}
                size='large'
                type='button'
                sx={{ marginRight: 2 }}
                onClick={submitType}
                disabled={!proposalType}
              >
                Submit
              </LoadingButton>
            )}
          </DialogActions>
        </Dialog>

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
      </CardContent>
      <CardActions></CardActions>
    </Card>
  )
}

export default ManageProposalTemplate
