// React Imports
import { useState, useEffect, useContext, useRef } from 'react'
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
import { TextField, Select, InputLabel, MenuItem, Autocomplete } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import dayjs from 'dayjs'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'

// ** Other Imports
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import useCustomToast from 'src/@core/hooks/useCustomToast'
import { AbilityContext } from 'src/layouts/components/acl/Can'
import { useAuth } from 'src/hooks/useAuth'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Parsing date
const parseDateString = dateString => {
  const [day, month, year] = dateString.split('-')

  return new Date(`${year}-${month}-${day}`)
}

const EditVoucher = ({ selectedVoucher }) => {
  // ** States
  const isUpdate = selectedVoucher?.id
  const [loading, setLoading] = useState({ dropdown: false, submit: false })
  const [dropdown, setDropdown] = useState({})
  const recipientList = dropdown?.recipient || []
  const accountList = dropdown?.expense_head || []
  const [account, setAccount] = useState(selectedVoucher?.expense_head || null)
  const [recipient, setRecipient] = useState(selectedVoucher?.recipient || null)
  const creditTypes = ['Voucher', 'Cash']

  const { apiRequest } = useApi()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const ability = useContext(AbilityContext)
  const canEdit = ability.can('edit', 'expense')
  const canCreate = ability.can('create', 'expense')
  const isFirstRender = useRef(true)
  const { user } = useAuth()
  const fiscalData = user?.fiscalRange.find(item => item.fiscal === user?.currentFiscal)

  // ** Schema
  let schema

  if (account?.type === 'Credit') {
    schema = yup.object().shape({
      date: yup.date().typeError('Invalid date'),
      recipient: yup.string().required('Recipient is required'),
      account: yup.string().required('Expense Head is required'),
      particulars: yup.string().required('Particulars is required'),
      credit: yup.string().required('Credit is required'),
      credit_type: yup.string().required('Credit is required')
    })
  } else {
    schema = yup.object().shape({
      date: yup.date().typeError('Invalid date'),
      recipient: yup.string().required('Recipient is required'),
      account: yup.string().required('Expense Head is required'),
      particulars: yup.string().required('Particulars is required'),
      debit: yup.string().required('Debit is required')
    })
  }

  // ** Abort Controller
  const controller = new AbortController()
  const signal = controller.signal

  // ** Fetch dropdowns
  const fetchDropdowns = async () => {
    try {
      setLoading(prev => ({ ...prev, dropdown: true }))
      const data = await apiRequest('get', '/dropdowns?tables=recipient,expense_head', null, {}, signal)

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

  // ** Form
  const defaultValues = {
    date: selectedVoucher?.date ? dayjs(parseDateString(selectedVoucher?.date)) : null,
    recipient: selectedVoucher?.recipient?.id || null,
    account: selectedVoucher?.expense_head?.id || null,
    particulars: selectedVoucher?.particulars || '',
    credit: selectedVoucher?.credit || '',
    debit: selectedVoucher?.debit || '',
    credit_type: selectedVoucher?.credit_type || ''
  }

  const {
    handleSubmit,
    control,
    reset,
    setValue,
    trigger,
    watch,
    formState: { errors }
  } = useForm({ defaultValues, resolver: yupResolver(schema) })

  // ** Submit
  const onSubmit = async formData => {
    try {
      setLoading(prev => ({ ...prev, submit: true }))
      const date = dayjs(formData.date)

      const payload = {
        ...formData,
        date: date.format('YYYY-MM-DD'),
        recipient_id: formData.recipient,
        account_id: formData.account,
        particulars: formData.particulars,
        credit: formData.credit || null,
        debit: formData.debit || null,
        credit_type: formData.credit_type || null
      }

      let data
      if (!isUpdate) {
        data = await apiRequest('post', '/expense', payload, {}, null)
      } else {
        const updatedPayload = { ...payload, _method: 'PUT' }
        data = await apiRequest('post', `/expense/${selectedVoucher?.id}`, updatedPayload, {}, null)
      }

      showSuccessToast(data?.message, 5000)
      if (!isUpdate) {
        reset()
      }
    } catch (error) {
      if (error?.status === 409) {
        showErrorToast(error?.response?.data?.message, 5000)
      } else {
        showErrorToast('Error while processing the entry', 5000)
      }
    } finally {
      setLoading(prev => ({ ...prev, submit: false }))
    }
  }

  // ** Watching account change
  useEffect(() => {
    if (isUpdate && isFirstRender.current) {
      return
    }

    if (account && recipient) {
      let updatedText = account?.particulars?.replace('[name]', recipient?.name)
      setValue('particulars', updatedText)
    } else {
      setValue('particulars', '')
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, recipient])

  // ** Watching particulars, credit, debit and credit_type change
  const particulars = watch('particulars')

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false

      return
    }

    if (particulars) {
      trigger('particulars')
    }

    if (account) {
      if (account?.type === 'Credit') {
        setValue('debit', '')
      } else {
        setValue('credit', '')
        setValue('credit_type', '')
      }
    }

    if (particulars && account) {
      trigger(['credit', 'debit', 'credit_type'])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [particulars, account, watch('credit'), watch('debit'), watch('credit_type')])

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader sx={{ pb: 5 }} title='Voucher Details' titleTypographyProps={{ variant: 'h6' }} />
        <CardContent>
          <Grid container spacing={6}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <Controller
                    name='date'
                    control={control}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <DatePicker
                        label='Date'
                        value={value}
                        onChange={onChange}
                        onBlur={onBlur}
                        slotProps={{
                          textField: {
                            error: Boolean(errors.date)
                          }
                        }}
                        format='DD-MM-YYYY'
                        minDate={dayjs(parseDateString(fiscalData?.start_date))}
                        maxDate={dayjs(parseDateString(fiscalData?.end_date))}
                      />
                    )}
                  />
                </LocalizationProvider>
                {errors.date && <FormHelperText sx={{ color: 'error.main' }}>{errors.date.message}</FormHelperText>}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='account'
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      {...field}
                      options={accountList}
                      getOptionLabel={option => option?.name || ''}
                      onChange={(_, data) => {
                        field.onChange(data ? data.id : null)
                        setAccount(data)
                      }}
                      isOptionEqualToValue={(option, value) => option && value && option.id === value.id}
                      renderInput={params => (
                        <TextField {...params} label='Expense Head' error={Boolean(errors.account)} />
                      )}
                      value={accountList.find(account => account.id === Number(field.value)) || null}
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
                  )}
                />
                {errors.account && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.account.message}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='recipient'
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      {...field}
                      options={recipientList}
                      getOptionLabel={option => option?.name || ''}
                      onChange={(_, data) => {
                        field.onChange(data ? data.id : null)
                        setRecipient(data)
                      }}
                      isOptionEqualToValue={(option, value) => option && value && option.id === value.id}
                      renderInput={params => (
                        <TextField {...params} label='Recipient' error={Boolean(errors.recipient)} />
                      )}
                      value={recipientList.find(recipient => recipient.id === Number(field.value)) || null}
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
                  )}
                />
                {errors.recipient && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.recipient.message}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='credit'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label='Credit'
                      error={Boolean(errors.credit)}
                      type='number'
                      disabled={account?.type === 'Debit'}
                    />
                  )}
                />
                {errors.credit && <FormHelperText sx={{ color: 'error.main' }}>{errors.credit.message}</FormHelperText>}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='debit'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label='Debit'
                      error={Boolean(errors.debit)}
                      type='number'
                      disabled={account?.type === 'Credit'}
                    />
                  )}
                />
                {errors.debit && <FormHelperText sx={{ color: 'error.main' }}>{errors.debit.message}</FormHelperText>}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id='select-label' error={Boolean(errors.credit_type)} disabled={account?.type === 'Debit'}>
                  Credit Type
                </InputLabel>
                <Controller
                  name='credit_type'
                  control={control}
                  render={({ field }) => (
                    <Select
                      labelId='select-label'
                      {...field}
                      label='Credit Type'
                      value={field.value}
                      error={Boolean(errors.credit_type)}
                      onChange={e => {
                        field.onChange(e)
                      }}
                      disabled={account?.type === 'Debit'}
                    >
                      {creditTypes.map(item => (
                        <MenuItem key={item} value={item}>
                          {item}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
                {errors.credit_type && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.credit_type.message}</FormHelperText>
                )}
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
            disabled={isUpdate ? !canEdit : !canCreate}
            loadingPosition='start'
            startIcon={<Icon icon='formkit:submit' />}
            size='large'
            type='submit'
            variant='contained'
          >
            {isUpdate ? 'Update' : 'Submit'}
          </LoadingButton>
        </CardActions>
      </Card>
    </form>
  )
}

export default EditVoucher
