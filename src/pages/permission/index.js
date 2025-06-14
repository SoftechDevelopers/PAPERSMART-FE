// ** React Imports
import { useState, useEffect, useContext, useMemo } from 'react'
import { useApi } from 'src/@core/api/useApi'

// ** MUI Imports
import Grid from '@mui/material/Grid'
import { Box } from '@mui/material'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import { DataGrid } from '@mui/x-data-grid'
import FormControl from '@mui/material/FormControl'
import { Select, InputLabel, MenuItem, TextField, InputAdornment } from '@mui/material'
import Checkbox from '@mui/material/Checkbox'
import LoadingButton from '@mui/lab/LoadingButton'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Other Imports
import useCustomToast from 'src/@core/hooks/useCustomToast'
import { AbilityContext } from 'src/layouts/components/acl/Can'

const getColumns = handleCheckboxChange => [
  {
    field: 'sno',
    headerName: 'S.No',
    width: 100
  },
  {
    field: 'page',
    headerName: 'Page',
    width: 300
  },
  {
    field: 'create',
    headerName: 'Create',
    width: 100,
    renderCell: params => <Checkbox checked={params.value} onChange={event => handleCheckboxChange(event, params)} />
  },
  {
    field: 'view',
    headerName: 'View',
    width: 100,
    renderCell: params => <Checkbox checked={params.value} onChange={event => handleCheckboxChange(event, params)} />
  },
  {
    field: 'edit',
    headerName: 'Edit',
    width: 100,
    renderCell: params => <Checkbox checked={params.value} onChange={event => handleCheckboxChange(event, params)} />
  },
  {
    field: 'remove',
    headerName: 'Delete',
    width: 100,
    renderCell: params => <Checkbox checked={params.value} onChange={event => handleCheckboxChange(event, params)} />
  },
  {
    field: 'export',
    headerName: 'Export',
    width: 100,
    renderCell: params => <Checkbox checked={params.value} onChange={event => handleCheckboxChange(event, params)} />
  },
  {
    field: 'print',
    headerName: 'Print',
    width: 100,
    renderCell: params => <Checkbox checked={params.value} onChange={event => handleCheckboxChange(event, params)} />
  },
  {
    field: 'send',
    headerName: 'Send',
    width: 100,
    renderCell: params => <Checkbox checked={params.value} onChange={event => handleCheckboxChange(event, params)} />
  }
]

const types = ['Any', 'Web', 'Mobile']

const Permission = () => {
  // ** States
  const [permissions, setPermissions] = useState([])
  const [pages, setPages] = useState([])
  const [dropdown, setDropdown] = useState({})
  const [loading, setLoading] = useState({ fetchAll: false, saveData: false })
  const [role, setRole] = useState('')
  const [type, setType] = useState('')
  const [rows, setRows] = useState([])
  const [searchKey, setSearchKey] = useState('')

  const roleList = dropdown?.role?.map(({ id, name }) => (
    <MenuItem key={id} value={id}>
      {name}
    </MenuItem>
  ))

  const typeList = types?.map(type => (
    <MenuItem key={type} value={type}>
      {type}
    </MenuItem>
  ))

  // ** Abort Controller
  const controller = new AbortController()
  const signal = controller.signal

  // ** Custom Hooks
  const { apiRequest } = useApi()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const ability = useContext(AbilityContext)
  const canCreate = ability.can('create', 'permission')

  // ** Prepare rows
  useEffect(() => {
    const filteredRows = pages
      .filter(page => role !== '' && page.type === type)
      .map((page, index) => {
        const permission = permissions.find(
          p => Number(p.page_id) === Number(page.id) && Number(p.role_id) === Number(role)
        )

        return {
          id: page.id,
          sno: index + 1,
          page: page.name,
          create: permission ? permission.create : false,
          view: permission ? permission.view : false,
          edit: permission ? permission.edit : false,
          remove: permission ? permission.remove : false,
          export: permission ? permission.export : false,
          print: permission ? permission.print : false,
          send: permission ? permission.send : false
        }
      })

    setRows(filteredRows)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, type])

  // ** Load permissions
  const fetchPermissions = async () => {
    try {
      setLoading(prev => ({ ...prev, fetchAll: true }))
      const permissionData = await apiRequest('get', '/permissions', null, {}, signal)
      setPermissions(permissionData?.permissions)
      setPages(permissionData?.pages)
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

  // ** Fetch dropdowns and permissions
  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const dropdownData = await apiRequest('get', '/dropdowns?tables=role', null, {}, signal)

        setDropdown(dropdownData)
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log('Fetch aborted')
        } else {
          console.error(error)
        }
      }
    }

    fetchDropdowns()
    fetchPermissions()

    return () => {
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ** Handle selects
  const handleChange = e => {
    const { name, value } = e.target
    if (name === 'role') {
      setRole(value)
    }
    if (name === 'type') {
      setType(value)
    }
  }

  // ** Checkbox Selection
  const handleCheckboxChange = (_, params) => {
    const { field } = params
    setRows(prevRows => {
      return prevRows.map(row => (row.id === params.id ? { ...row, [field]: !row[field] } : row))
    })
  }

  // ** Handle save
  const handleSave = async () => {
    if (rows.length !== 0) {
      try {
        setLoading(prev => ({ ...prev, saveData: true }))

        const payload = {
          role_id: role,
          permissions: rows
        }
        const data = await apiRequest('post', '/permission', payload, {}, null)
        fetchPermissions()
        showSuccessToast(data?.message, 5000)
      } catch (error) {
        showErrorToast('Permission could not be updated', 5000)
      } finally {
        setLoading(prev => ({ ...prev, saveData: false }))
      }
    } else {
      showErrorToast('No rows found', 5000)
    }
  }

  // ** Handle search key change
  const handleSearchChange = e => {
    setSearchKey(e.target.value)
  }

  // Filter rows according to search key
  const filteredRows = useMemo(() => {
    return rows?.filter(r => r.page.toLowerCase().includes(searchKey.toLowerCase()))
  }, [rows, searchKey])

  return (
    <>
      <Grid container>
        <Box sx={{ width: '100%' }}>
          <Card>
            <CardHeader sx={{ pb: 5 }} title='Permissions' titleTypographyProps={{ variant: 'h6' }} />
            <CardContent>
              <Grid container spacing={6}>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel id='roles-select-label'>Role</InputLabel>
                    <Select labelId='roles-select-label' name='role' label='Role' value={role} onChange={handleChange}>
                      {roleList}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel id='types-select-label'>Type</InputLabel>
                    <Select labelId='types-select-label' name='type' label='Type' value={type} onChange={handleChange}>
                      {typeList}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    value={searchKey}
                    fullWidth
                    label='Search'
                    onChange={handleSearchChange}
                    placeholder='Search by page...'
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
                  rows={filteredRows}
                  columns={getColumns(handleCheckboxChange)}
                  loading={loading['fetchAll']}
                  disableRowSelectionOnClick
                />
              </Box>
              <Grid item xs={12} sm={12}>
                <LoadingButton
                  loading={loading['saveData']}
                  loadingPosition='start'
                  startIcon={<Icon icon='material-symbols:save-outline' />}
                  disabled={!canCreate}
                  size='large'
                  type='button'
                  variant='contained'
                  sx={{ marginRight: 2 }}
                  onClick={handleSave}
                >
                  Save
                </LoadingButton>
              </Grid>
            </CardContent>
          </Card>
        </Box>
      </Grid>
    </>
  )
}

Permission.acl = {
  action: 'view',
  subject: 'permissions'
}

export default Permission
