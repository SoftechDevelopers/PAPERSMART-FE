// React Imports
import { Controller } from 'react-hook-form'

// ** MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import { TextField, InputLabel, Select } from '@mui/material'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'

const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: 300
    }
  }
}

const Professional = ({ control, errors, designationList }) => {
  return (
    <Card sx={{ mt: 5 }}>
      <CardHeader sx={{ pb: 5 }} title='Professional' titleTypographyProps={{ variant: 'h6' }} />
      <CardContent>
        <Grid container spacing={6}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Controller
                  name='doj'
                  control={control}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <DatePicker
                      label='Date of Joining *'
                      value={value}
                      onChange={onChange}
                      onBlur={onBlur}
                      slotProps={{
                        textField: {
                          error: Boolean(errors.doj)
                        }
                      }}
                      format='DD-MM-YYYY'
                    />
                  )}
                />
              </LocalizationProvider>
              {errors.doj && <FormHelperText sx={{ color: 'error.main' }}>{errors.doj.message}</FormHelperText>}
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel id='designation-select-label' error={Boolean(errors.designation)}>
                Designation *
              </InputLabel>
              <Controller
                name='designation'
                control={control}
                render={({ field }) => (
                  <Select
                    labelId='designation-select-label'
                    {...field}
                    label='Designation *'
                    value={field.value}
                    error={Boolean(errors.designation)}
                    onChange={e => {
                      field.onChange(e)
                    }}
                    MenuProps={MenuProps}
                  >
                    {designationList}
                  </Select>
                )}
              />
              {errors.designation && (
                <FormHelperText sx={{ color: 'error.main' }}>{errors.designation.message}</FormHelperText>
              )}
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <Controller
                name='account'
                control={control}
                render={({ field }) => (
                  <TextField {...field} label='Account' error={Boolean(errors.account)} type='number' />
                )}
              />
              {errors.account && <FormHelperText sx={{ color: 'error.main' }}>{errors.account.message}</FormHelperText>}
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <Controller
                name='uan'
                control={control}
                render={({ field }) => <TextField {...field} label='UAN' error={Boolean(errors.uan)} type='number' />}
              />
              {errors.uan && <FormHelperText sx={{ color: 'error.main' }}>{errors.uan.message}</FormHelperText>}
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <Controller
                name='esi'
                control={control}
                render={({ field }) => <TextField {...field} label='ESI' error={Boolean(errors.esi)} type='number' />}
              />
              {errors.esi && <FormHelperText sx={{ color: 'error.main' }}>{errors.esi.message}</FormHelperText>}
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <Controller
                name='qualification'
                control={control}
                render={({ field }) => (
                  <TextField {...field} label='Qualification *' error={Boolean(errors.qualification)} />
                )}
              />
              {errors.qualification && (
                <FormHelperText sx={{ color: 'error.main' }}>{errors.qualification.message}</FormHelperText>
              )}
            </FormControl>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

export default Professional
