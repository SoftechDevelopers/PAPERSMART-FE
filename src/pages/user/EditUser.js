// React Imports
import { useState, useContext, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useApi } from 'src/@core/api/useApi'

// ** MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import { TextField, Select, InputLabel, MenuItem, Autocomplete, CircularProgress } from '@mui/material'
import { LoadingButton } from '@mui/lab'

// ** Other Imports
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import useCustomToast from 'src/@core/hooks/useCustomToast'
import { AbilityContext } from 'src/layouts/components/acl/Can'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

const schema = yup.object().shape({
  name: yup.string().required('Name is required'),
  username: yup.string().email('Enter a valid email').required('Username is required'),
  role: yup.string().required('Role is required')
})

const EditUser = ({ selectedUser }) => {
  // ** States
  const [loading, setLoading] = useState({ dropdown: false, submit: false })
  const isUpdate = selectedUser?.id !== undefined
  const [dropdown, setDropdown] = useState({})

  const roleList = dropdown?.role?.map(({ id, name }) => (
    <MenuItem key={id} value={id}>
      {name}
    </MenuItem>
  ))

  // ** Custom Hooks
  const { apiRequest } = useApi()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const ability = useContext(AbilityContext)

  const canEdit = ability.can('edit', 'user')
  const canCreate = ability.can('create', 'user')

  // ** Abort Controller
  const controller = new AbortController()
  const signal = controller.signal

  // ** Fetch dropdowns
  useEffect(() => {
    const fetchDropdowns = async () => {
      setLoading(prev => ({ ...prev, dropdown: true }))
      try {
        const data = await apiRequest('get', '/dropdowns?tables=role,staff,partner', null, {}, signal)

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

  // ** Form
  const defaultValues = {
    name: selectedUser?.name || '',
    username: selectedUser?.username || '',
    role: selectedUser?.role_id || ''
  }

  const {
    handleSubmit,
    control,
    formState: { errors }
  } = useForm({ defaultValues, resolver: yupResolver(schema) })

  // ** Submit
  const onSubmit = async formData => {
    try {
      setLoading(prev => ({ ...prev, submit: true }))
      let data
      if (!isUpdate) {
        data = await apiRequest('post', '/user', formData, {}, null)
      } else {
        data = await apiRequest('put', `/user/${selectedUser?.id}`, formData, {}, null)
      }

      showSuccessToast(data?.message, 5000)
    } catch (error) {
      if (error.status === 422) {
        const message = error?.response?.data?.errors
        showErrorToast(message?.email || message?.username, 5000)
      } else {
        showErrorToast('Error while processing the user', 5000)
      }
    } finally {
      setLoading(prev => ({ ...prev, submit: false }))
    }
  }

  return (
    <Card>
      <CardHeader sx={{ pb: 5 }} title='User Details' titleTypographyProps={{ variant: 'h6' }} />
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={6}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='name'
                  control={control}
                  render={({ field }) => <TextField {...field} label='Name' error={Boolean(errors.name)} />}
                />
                {errors.name && <FormHelperText sx={{ color: 'error.main' }}>{errors.name.message}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='username'
                  control={control}
                  render={({ field }) => <TextField {...field} label='Username' error={Boolean(errors.username)} />}
                />
                {errors.username && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.username.message}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id='roles-select-label' error={Boolean(errors.role)}>
                  Role
                </InputLabel>
                <Controller
                  name='role'
                  control={control}
                  render={({ field }) => (
                    <Select
                      labelId='roles-select-label'
                      {...field}
                      label='Role'
                      value={field.value}
                      error={Boolean(errors.role)}
                      onChange={e => {
                        field.onChange(e)
                      }}
                    >
                      {loading['dropdown'] ? (
                        <MenuItem disabled>
                          <CircularProgress size={20} style={{ marginRight: 10 }} />
                        </MenuItem>
                      ) : (
                        roleList
                      )}
                    </Select>
                  )}
                />
                {errors.role && (
                  <FormHelperText sx={{ color: 'error.main' }} id='roles-select-label'>
                    {errors.role.message}
                  </FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={12}>
              <LoadingButton
                loading={loading['submit']}
                disabled={isUpdate ? !canEdit : !canCreate}
                loadingPosition='start'
                startIcon={<Icon icon='formkit:submit' />}
                size='large'
                type='submit'
                variant='contained'
                sx={{ marginRight: 2 }}
              >
                {isUpdate ? 'Update' : 'Submit'}
              </LoadingButton>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  )
}

export default EditUser
