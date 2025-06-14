// ** React Imports
import { forwardRef } from 'react'

// ** MUI Imports
import TextField from '@mui/material/TextField'

// ** Third Party Imports
import format from 'date-fns/format'
import DatePicker from 'react-datepicker'

const PickersRange = ({ startDate, endDate, popperPlacement, handleOnChange, dateFormat = 'dd/MM/yyyy' }) => {
  const CustomInput = forwardRef(({ start, end, label, ...props }, ref) => {
    const formattedStartDate = start ? format(start, dateFormat) : ''
    const formattedEndDate = end ? ` - ${format(end, dateFormat)}` : ''
    const value = `${formattedStartDate}${formattedEndDate}`

    return <TextField inputRef={ref} label={label || ''} {...props} value={value} fullWidth />
  })

  return (
    <DatePicker
      selectsRange
      endDate={endDate}
      selected={startDate}
      startDate={startDate}
      id='date-range-picker'
      onChange={handleOnChange}
      shouldCloseOnSelect={true}
      popperPlacement={popperPlacement}
      isClearable
      customInput={<CustomInput label='Date Range' start={startDate} end={endDate} />}
    />
  )
}

export default PickersRange
