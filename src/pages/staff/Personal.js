// React Imports
import { Controller } from 'react-hook-form'

// ** MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import { TextField, Box, InputLabel, Select, FormControlLabel, FormLabel } from '@mui/material'
import { MenuItem, Avatar, Radio, RadioGroup } from '@mui/material'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'

// ** Icon Imports
import EditIcon from '@mui/icons-material/Edit'

const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: 300
    }
  }
}

const Personal = ({ control, errors, states, bloodgroups, photo, handleAvatarClick, handleAvatarChange }) => {
  return (
    <Card>
      <CardHeader sx={{ pb: 5 }} title='Personal' titleTypographyProps={{ variant: 'h6' }} />
      <CardContent>
        <Grid container spacing={6}>
          <Grid item xs={12}>
            <Box
              sx={{
                position: 'relative',
                width: 100,
                height: 100,
                cursor: 'pointer',
                '&:hover .overlay': {
                  opacity: 1
                }
              }}
              onClick={handleAvatarClick}
            >
              <Avatar src={photo} alt='Softech' sx={{ width: '100%', height: '100%' }} />
              <Box
                className='overlay'
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  opacity: 0,
                  transition: 'opacity 0.3s'
                }}
              >
                <EditIcon sx={{ color: '#fff', fontSize: 30 }} />
              </Box>
              <input
                id='avatar-upload'
                type='file'
                accept='image/*'
                style={{ display: 'none' }}
                onChange={handleAvatarChange}
              />
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <Controller
                name='name'
                control={control}
                render={({ field }) => <TextField {...field} label='Name *' error={Boolean(errors.name)} />}
              />
              {errors.name && <FormHelperText sx={{ color: 'error.main' }}>{errors.name.message}</FormHelperText>}
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <Controller
                name='address1'
                control={control}
                render={({ field }) => <TextField {...field} label='Address Line 1' error={Boolean(errors.address1)} />}
              />
              {errors.address1 && (
                <FormHelperText sx={{ color: 'error.main' }}>{errors.address1.message}</FormHelperText>
              )}
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <Controller
                name='address2'
                control={control}
                render={({ field }) => (
                  <TextField {...field} label='Address Line 2 *' error={Boolean(errors.address2)} />
                )}
              />
              {errors.address2 && (
                <FormHelperText sx={{ color: 'error.main' }}>{errors.address2.message}</FormHelperText>
              )}
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <Controller
                name='district'
                control={control}
                render={({ field }) => <TextField {...field} label='District *' error={Boolean(errors.district)} />}
              />
              {errors.district && (
                <FormHelperText sx={{ color: 'error.main' }}>{errors.district.message}</FormHelperText>
              )}
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel id='state-select-label'>State</InputLabel>
              <Controller
                name='state'
                control={control}
                render={({ field }) => (
                  <Select
                    labelId='state-select-label'
                    {...field}
                    label='State'
                    value={field.value}
                    onChange={e => {
                      field.onChange(e)
                    }}
                    MenuProps={MenuProps}
                  >
                    {states.map(item => (
                      <MenuItem key={item} value={item}>
                        {item}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <Controller
                name='country'
                control={control}
                render={({ field }) => <TextField {...field} label='Country *' error={Boolean(errors.country)} />}
              />
              {errors.country && <FormHelperText sx={{ color: 'error.main' }}>{errors.country.message}</FormHelperText>}
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <Controller
                name='pincode'
                control={control}
                render={({ field }) => (
                  <TextField {...field} label='Pincode *' error={Boolean(errors.pincode)} type='number' />
                )}
              />
              {errors.pincode && <FormHelperText sx={{ color: 'error.main' }}>{errors.pincode.message}</FormHelperText>}
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Controller
                  name='dob'
                  control={control}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <DatePicker
                      label='Date of Birth *'
                      value={value}
                      onChange={onChange}
                      onBlur={onBlur}
                      slotProps={{
                        textField: {
                          error: Boolean(errors.dob)
                        }
                      }}
                      format='DD-MM-YYYY'
                    />
                  )}
                />
              </LocalizationProvider>
              {errors.dob && <FormHelperText sx={{ color: 'error.main' }}>{errors.dob.message}</FormHelperText>}
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <Controller
                name='father'
                control={control}
                render={({ field }) => <TextField {...field} label='Father *' error={Boolean(errors.father)} />}
              />
              {errors.father && <FormHelperText sx={{ color: 'error.main' }}>{errors.father.message}</FormHelperText>}
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <Controller
                name='mother'
                control={control}
                render={({ field }) => <TextField {...field} label='Mother *' error={Boolean(errors.mother)} />}
              />
              {errors.mother && <FormHelperText sx={{ color: 'error.main' }}>{errors.mother.message}</FormHelperText>}
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel id='bloodgroup-select-label' error={Boolean(errors.bloodgroup)}>
                Bloodgroup *
              </InputLabel>
              <Controller
                name='bloodgroup'
                control={control}
                render={({ field }) => (
                  <Select
                    labelId='bloodgroup-select-label'
                    {...field}
                    label='Bloodgroup *'
                    value={field.value}
                    error={Boolean(errors.bloodgroup)}
                    onChange={e => {
                      field.onChange(e)
                    }}
                  >
                    {bloodgroups.map(item => (
                      <MenuItem key={item} value={item}>
                        {item}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
              {errors.bloodgroup && (
                <FormHelperText sx={{ color: 'error.main' }}>{errors.bloodgroup.message}</FormHelperText>
              )}
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl>
              <FormLabel id='gender-label'>Gender</FormLabel>
              <Controller
                name='gender'
                control={control}
                render={({ field }) => (
                  <>
                    <RadioGroup {...field} aria-labelledby='gender-label' row>
                      <FormControlLabel value='Male' control={<Radio />} label='Male' />
                      <FormControlLabel value='Female' control={<Radio />} label='Female' />
                      <FormControlLabel value='Other' control={<Radio />} label='Other' />
                    </RadioGroup>
                  </>
                )}
              />
            </FormControl>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

export default Personal
