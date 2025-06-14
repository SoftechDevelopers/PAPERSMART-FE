// React Imports
import { Controller } from 'react-hook-form'

// ** MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import { TextField } from '@mui/material'

const Salary = ({ control, errors }) => {
  return (
    <Card sx={{ mt: 5 }}>
      <CardHeader sx={{ pb: 5 }} title='Salary' titleTypographyProps={{ variant: 'h6' }} />
      <CardContent>
        <Grid container spacing={6}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <Controller
                name='basic_pay'
                control={control}
                render={({ field }) => (
                  <TextField {...field} label='Basic Pay' error={Boolean(errors.basic_pay)} type='number' />
                )}
              />
              {errors.basic_pay && (
                <FormHelperText sx={{ color: 'error.main' }}>{errors.basic_pay.message}</FormHelperText>
              )}
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <Controller
                name='hra'
                control={control}
                render={({ field }) => <TextField {...field} label='HRA' error={Boolean(errors.hra)} type='number' />}
              />
              {errors.hra && <FormHelperText sx={{ color: 'error.main' }}>{errors.hra.message}</FormHelperText>}
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <Controller
                name='earned_increment'
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label='Earned Increment'
                    error={Boolean(errors.earned_increment)}
                    type='number'
                  />
                )}
              />
              {errors.earned_increment && (
                <FormHelperText sx={{ color: 'error.main' }}>{errors.earned_increment.message}</FormHelperText>
              )}
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <Controller
                name='ta'
                control={control}
                render={({ field }) => <TextField {...field} label='TA' error={Boolean(errors.ta)} type='number' />}
              />
              {errors.ta && <FormHelperText sx={{ color: 'error.main' }}>{errors.ta.message}</FormHelperText>}
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <Controller
                name='performance_allowance'
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label='Performance  Allowance'
                    error={Boolean(errors.performance_allowance)}
                    type='number'
                  />
                )}
              />
              {errors.performance_allowance && (
                <FormHelperText sx={{ color: 'error.main' }}>{errors.performance_allowance.message}</FormHelperText>
              )}
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <Controller
                name='salary'
                control={control}
                render={({ field }) => (
                  <TextField {...field} label='Salary' error={Boolean(errors.salary)} type='number' disabled />
                )}
              />
              {errors.salary && <FormHelperText sx={{ color: 'error.main' }}>{errors.salary.message}</FormHelperText>}
            </FormControl>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

export default Salary
