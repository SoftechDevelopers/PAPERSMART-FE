// React Imports
import { useState, useContext } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useApi } from 'src/@core/api/useApi'

// ** MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import Grid from '@mui/material/Grid'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import { TextField, Select, InputLabel, MenuItem } from '@mui/material'
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
  particulars: yup.string().required('Particulars is required')
})

const EditExpenseHead = () => {
  // ** States
  const [loading, setLoading] = useState({ submit: false })
  const types = ['Credit', 'Debit']

  const { apiRequest } = useApi()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const ability = useContext(AbilityContext)
  const canCreate = ability.can('create', 'expense_head')

  // ** Form
  const defaultValues = {
    name: '',
    type: types[0],
    particulars: ''
  }

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors }
  } = useForm({ defaultValues, resolver: yupResolver(schema) })

  // ** Submit
  const onSubmit = async formData => {
    try {
      setLoading(prev => ({ ...prev, submit: true }))

      let data = await apiRequest('post', '/expense_head', formData, {}, null)
      reset()
      showSuccessToast(data?.message, 5000)
    } catch (error) {
      if (error?.status === 409) {
        showErrorToast(error?.response?.data?.message, 5000)
      } else {
        showErrorToast('Error while creating the expense head', 5000)
      }
    } finally {
      setLoading(prev => ({ ...prev, submit: false }))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader sx={{ pb: 5 }} title='Expense Head Details' titleTypographyProps={{ variant: 'h6' }} />
        <CardContent>
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
                <InputLabel>Type</InputLabel>
                <Controller
                  name='type'
                  control={control}
                  render={({ field }) => (
                    <Select label='Type' {...field}>
                      {types.map(type => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <Controller
                  name='particulars'
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label='Particulars' error={Boolean(errors.particulars)} />
                  )}
                />
                {errors.particulars && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.particulars.message}</FormHelperText>
                )}
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
        <CardActions>
          <LoadingButton
            loading={loading['submit']}
            disabled={!canCreate}
            loadingPosition='start'
            startIcon={<Icon icon='gridicons:add-outline' />}
            size='large'
            type='submit'
            variant='contained'
            sx={{ marginRight: 2 }}
          >
            Add
          </LoadingButton>
        </CardActions>
      </Card>
    </form>
  )
}

export default EditExpenseHead
