// React Imports
import { Controller } from 'react-hook-form'

// ** MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import { TextField, FormGroup, FormControlLabel, Checkbox } from '@mui/material'

const Communication = ({ control, errors }) => {
  return (
    <Card sx={{ mt: 5 }}>
      <CardHeader sx={{ pb: 5 }} title='Communication' titleTypographyProps={{ variant: 'h6' }} />
      <CardContent>
        <Grid container spacing={6}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <Controller
                name='phone'
                control={control}
                render={({ field }) => (
                  <TextField {...field} label='Phone *' error={Boolean(errors.phone)} type='number' />
                )}
              />
              {errors.phone && <FormHelperText sx={{ color: 'error.main' }}>{errors.phone.message}</FormHelperText>}
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <Controller
                name='email'
                control={control}
                render={({ field }) => <TextField {...field} label='Email *' error={Boolean(errors.email)} />}
              />
              {errors.email && <FormHelperText sx={{ color: 'error.main' }}>{errors.email.message}</FormHelperText>}
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2}>
            <FormControl fullWidth>
              <Controller
                name='time_bound'
                control={control}
                render={({ field }) => (
                  <FormGroup>
                    <FormControlLabel control={<Checkbox {...field} checked={field.value} />} label='Time Bound' />
                  </FormGroup>
                )}
              />
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2}>
            <FormControl fullWidth>
              <Controller
                name='location_bound'
                control={control}
                render={({ field }) => (
                  <FormGroup>
                    <FormControlLabel control={<Checkbox {...field} checked={field.value} />} label='Location Bound' />
                  </FormGroup>
                )}
              />
            </FormControl>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

export default Communication
