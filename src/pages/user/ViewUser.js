// ** React Imports
import { useState, useEffect, useMemo } from 'react'
import { useApi } from 'src/@core/api/useApi'

// ** MUI Imports
import { DataGrid } from '@mui/x-data-grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import IconButton from '@mui/material/IconButton'
import { Chip, Box, Grid, TextField, InputAdornment } from '@mui/material'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

const columns = handleEdit => [
  {
    field: 'sno',
    headerName: 'S.No',
    width: 100
  },
  {
    field: 'name',
    headerName: 'Name',
    width: 150
  },
  {
    field: 'email',
    headerName: 'Email',
    width: 350
  },
  {
    field: 'username',
    headerName: 'Username',
    width: 150
  },
  {
    field: 'role_name',
    headerName: 'Role',
    width: 200,
    renderCell: params => <ChipComponent row={params.row} />
  },
  {
    field: 'staff_id',
    headerName: 'Staff ID',
    width: 100
  },
  {
    field: 'partner_id',
    headerName: 'Partner ID',
    width: 100
  },
  {
    field: 'actions',
    headerName: 'Actions',
    width: 100,
    sortable: false,
    filterable: false,
    renderCell: params => (
      <IconButton color='secondary' onClick={() => handleEdit(params.row)}>
        <Icon icon='tdesign:edit' />
      </IconButton>
    )
  }
]

const getColorByRoleId = roleId => {
  const colors = [
    'primary',
    'secondary',
    'error',
    'warning',
    'info',
    'success',
    'primary',
    'secondary',
    'error',
    'warning'
  ]

  return colors[(roleId - 1) % colors.length] || 'default'
}

const ChipComponent = ({ row }) => {
  return (
    <Chip
      label={row?.role_name}
      variant='outlined'
      size='medium'
      color={getColorByRoleId(row?.role_id)}
      sx={{
        margin: '4px',
        width: 150
      }}
    />
  )
}

const ViewUser = ({ handleEdit }) => {
  // ** States
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchKey, setSearchKey] = useState('')

  // ** Abort Controller
  const controller = new AbortController()
  const signal = controller.signal

  // ** Custom Hooks
  const { apiRequest } = useApi()

  // ** Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true)
        const data = await apiRequest('get', '/users', null, {}, signal)

        const usersWithSerial = data.map((user, index) => ({
          ...user,
          sno: index + 1
        }))
        setUsers(usersWithSerial)
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

    fetchUsers()

    return () => {
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ** Handle search key change
  const handleSearchChange = e => {
    setSearchKey(e.target.value)
  }

  // Filter users array according to search key
  const filteredUsers = useMemo(() => {
    return users
      ?.filter(u => u.name.toLowerCase().includes(searchKey.toLowerCase()))
      .map((user, index) => ({
        ...user,
        sno: index + 1
      }))
  }, [users, searchKey])

  return (
    <Card>
      <CardHeader sx={{ pb: 5 }} title='Users' titleTypographyProps={{ variant: 'h6' }} />
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
          <DataGrid rows={filteredUsers} columns={columns(handleEdit)} loading={loading} disableRowSelectionOnClick />
        </Box>
      </CardContent>
    </Card>
  )
}

export default ViewUser
