// React Imports
import { useState, useContext, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useApi } from 'src/@core/api/useApi'

// ** MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import { Box, Typography, MenuItem, Button } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import dayjs from 'dayjs'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'

// ** Other Imports
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import useCustomToast from 'src/@core/hooks/useCustomToast'
import { AbilityContext } from 'src/layouts/components/acl/Can'
import FileDropzone from 'src/layouts/components/FileDropzone'
import jsPDF from 'jspdf'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import VisibilityIcon from '@mui/icons-material/Visibility'
import DeleteIcon from '@mui/icons-material/Delete'
import DescriptionIcon from '@mui/icons-material/Description'

// ** Custom Components
import Personal from './Personal'
import Communication from './Communication'
import Salary from './Salary'
import Professional from './Professional'

const states = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry'
]

const bloodgroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

const schema = yup.object().shape({
  name: yup
    .string()
    .required('Name is required')
    .matches(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  address2: yup.string().required('Address Line 2 is required'),
  district: yup.string().required('District is required'),
  country: yup.string().required('Country is required'),
  pincode: yup.string().required('Pincode is required'),
  dob: yup.date().typeError('Invalid date'),
  father: yup.string().required('Father is required'),
  mother: yup.string().required('Mother is required'),
  phone: yup.string().matches(/^\d+$/, 'Phone must be a valid number').required('Phone is required'),
  email: yup.string().email('Please enter a valid email address').required('Email is required'),
  basic_pay: yup.number().typeError('Basic Pay must be a valid number'),
  hra: yup.number().typeError('HRA must be a valid number'),
  earned_increment: yup.number().typeError('Earned Increment must be a valid number'),
  ta: yup.number().typeError('TA must be a valid number'),
  performance_allowance: yup.number().typeError('Performance  Allowance must be a valid number'),
  salary: yup.number().typeError('Salary must be a valid number'),
  doj: yup.date().typeError('Invalid date'),
  designation: yup.string().required('Designation is required'),
  qualification: yup.string().required('Qualification is required'),
  bloodgroup: yup.string().required('Bloodgroup is required')
})

// ** Parsing date
const parseDateString = dateString => {
  const [day, month, year] = dateString.split('-')

  return new Date(`${year}-${month}-${day}`)
}

const EditStaff = ({ selectedStaff, dropdown }) => {
  // ** States
  const [loading, setLoading] = useState({ submit: false, generateCard: false })
  const { apiRequest } = useApi()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const ability = useContext(AbilityContext)
  const canCreate = ability.can('create', 'staff')
  const canEdit = ability.can('edit', 'staff')
  const canDelete = ability.can('delete', 'staff')
  const canPrint = ability.can('print', 'staff')
  const isUpdate = selectedStaff?.id !== undefined
  const [isDialogOpen, setDialogOpen] = useState({ delete: false })

  const [photo, setPhoto] = useState(selectedStaff?.photo_url || null)
  const [photoFile, setPhotoFile] = useState(selectedStaff?.photo_url || null)
  const [file, setFile] = useState(selectedStaff?.docs_url || null)
  const [fileName, setFileName] = useState(selectedStaff?.docs_filename || '')

  const designationList = dropdown?.designation?.map(({ id, name }) => (
    <MenuItem key={id} value={id}>
      {name}
    </MenuItem>
  ))

  // ** Abort Controller
  const controller = new AbortController()
  const signal = controller.signal

  // ** Form
  const defaultValues = {
    name: selectedStaff?.name || '',
    address1: selectedStaff?.address1 || '',
    address2: selectedStaff?.address2 || '',
    district: selectedStaff?.district || '',
    state: selectedStaff?.state || states[19],
    country: selectedStaff?.country || 'India',
    pincode: selectedStaff?.pincode || '',
    dob: selectedStaff?.dob ? dayjs(parseDateString(selectedStaff.dob)) : null,
    father: selectedStaff?.father || '',
    mother: selectedStaff?.mother || '',
    bloodgroup: selectedStaff?.bloodgroup || '',
    phone: selectedStaff?.phone || '',
    email: selectedStaff?.email || '',
    time_bound: Number(selectedStaff?.time_bound) === 1,
    location_bound: Number(selectedStaff?.location_bound) === 1,
    basic_pay: selectedStaff?.basic_pay || 0,
    hra: selectedStaff?.hra || 0,
    earned_increment: selectedStaff?.earned_increment || 0,
    ta: selectedStaff?.ta || 0,
    performance_allowance: selectedStaff?.performance_allowance || 0,
    salary: selectedStaff?.salary || 0,
    doj: selectedStaff?.doj ? dayjs(parseDateString(selectedStaff.doj)) : null,
    designation: selectedStaff?.designation['id'] || '',
    account: selectedStaff?.account || '',
    uan: selectedStaff?.uan || '',
    esi: selectedStaff?.esi || '',
    qualification: selectedStaff?.qualification || '',
    gender: selectedStaff?.gender || 'Male'
  }

  const {
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors }
  } = useForm({ defaultValues, resolver: yupResolver(schema) })

  // ** Calculate salary automatically
  const basicPay = watch('basic_pay', 0)
  const hra = watch('hra', 0)
  const earnedIncrement = watch('earned_increment', 0)
  const ta = watch('ta', 0)
  const performanceAllowance = watch('performance_allowance', 0)

  useEffect(() => {
    const computedSalary =
      parseFloat(basicPay || 0) +
      parseFloat(hra || 0) +
      parseFloat(earnedIncrement || 0) +
      parseFloat(ta || 0) +
      parseFloat(performanceAllowance || 0)
    setValue('salary', computedSalary, { shouldValidate: true })
  }, [basicPay, hra, earnedIncrement, ta, performanceAllowance, setValue])

  // ** Click on avatar
  const handleAvatarClick = () => {
    document.getElementById('avatar-upload').click()
  }

  const handleAvatarChange = event => {
    const selectedFile = event?.target?.files

    if (selectedFile && selectedFile.length > 0) {
      setPhotoFile(selectedFile)
      setPhoto(URL.createObjectURL(selectedFile[0]))
    }
  }

  // ** Submit
  const onSubmit = async formData => {
    try {
      setLoading(prev => ({ ...prev, submit: true }))
      if (!photoFile) {
        showErrorToast('No photo selected', 5000)

        return
      }

      const payload = new FormData()
      payload.append('name', formData.name)

      if (formData.address1) {
        payload.append('address1', formData.address1)
      }

      payload.append('address2', formData.address2)
      payload.append('district', formData.district)
      payload.append('state', formData.state)
      payload.append('country', formData.country)
      payload.append('pincode', formData.pincode)
      payload.append('phone', formData.phone)
      payload.append('email', formData.email)
      payload.append('qualification', formData.qualification)
      payload.append('gender', formData.gender)
      payload.append('bloodgroup', formData.bloodgroup)
      const dob = dayjs(formData.dob)
      payload.append('dob', dob.format('YYYY-MM-DD'))
      const doj = dayjs(formData.doj)
      payload.append('doj', doj.format('YYYY-MM-DD'))
      payload.append('basic_pay', formData.basic_pay)
      payload.append('hra', formData.hra)
      payload.append('earned_increment', formData.earned_increment)
      payload.append('ta', formData.ta)
      payload.append('performance_allowance', formData.performance_allowance)
      payload.append('salary', formData.salary)
      payload.append('designation', formData.designation)
      payload.append('father', formData.father)
      payload.append('mother', formData.mother)

      if (formData.account) {
        payload.append('account', formData.account)
      }

      if (formData.uan) {
        payload.append('uan', formData.uan)
      }

      if (formData.esi) {
        payload.append('esi', formData.esi)
      }

      payload.append('time_bound', formData.time_bound ? 1 : 0)
      payload.append('location_bound', formData.location_bound ? 1 : 0)

      if (photoFile && photoFile[0] && photoFile[0] instanceof File) {
        payload.append('photo_file', photoFile[0])
      }

      if (file && file[0] && file[0] instanceof File) {
        payload.append('docs_file', file[0])
      } else if (fileName) {
        payload.append('docs_url', fileName)
      }

      let data
      if (!isUpdate) {
        data = await apiRequest('post', '/staff', payload, {}, null)
      } else {
        payload.append('_method', 'PUT')
        data = await apiRequest('post', `/staff/${selectedStaff?.id}`, payload, {}, null)
      }
      showSuccessToast(data?.message, 5000)
    } catch (error) {
      if (error?.status === 409) {
        showErrorToast(error?.response?.data?.message, 5000)
      } else {
        showErrorToast('Error while processing the staff', 5000)
      }
    } finally {
      setLoading(prev => ({ ...prev, submit: false }))
    }
  }

  // ** View file uploaded
  const viewFile = () => {
    if (file) {
      if (file[0] instanceof File) {
        const fileURL = URL.createObjectURL(file[0])
        window.open(fileURL, '_blank')
      } else {
        window.open(selectedStaff?.docs_url, '_blank')
      }
    }
  }

  // ** Upload
  const handleDropRejected = fileRejections => {
    fileRejections.forEach(rejection => {
      if (rejection.errors.some(error => error.code === 'file-too-large')) {
        showErrorToast('File size exceeds the limit', 5000)
      } else if (rejection.errors.some(error => error.code === 'file-invalid-type')) {
        showErrorToast('Invalid file type', 5000)
      }
    })
  }

  const DocumentUpload = () => {
    const handleDrop = acceptedFiles => {
      if (acceptedFiles.length > 0) {
        setFile(acceptedFiles)
        setFileName(acceptedFiles[0]?.name)
      }
    }

    return (
      <FileDropzone
        onDrop={handleDrop}
        onDropRejected={handleDropRejected}
        acceptedFiles={{
          'application/pdf': ['.pdf']
        }}
        maxSize={30 * 1024 * 1024}
      />
    )
  }

  // ** Print ID Card
  const printCard = async () => {
    try {
      setLoading(prev => ({ ...prev, generateCard: true }))
      const data = await apiRequest('get', '/generate_card?id=' + selectedStaff?.id, null, {}, signal)

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const img = new Image()
      img.src = '/images/icons/project-icons/id-card.png'

      img.onload = function () {
        const pageWidth = doc.internal.pageSize.getWidth()
        const pageHeight = doc.internal.pageSize.getHeight()

        doc.addImage(img, 'JPEG', 0, 0, pageWidth, pageHeight)

        const avatarSize = 50
        const centerX = (pageWidth - avatarSize) / 2
        const centerY = 60

        doc.addImage(data?.avatar, 'JPEG', centerX, centerY, avatarSize, avatarSize)

        doc.setDrawColor(0)
        doc.setLineWidth(1)
        doc.rect(centerX, centerY, avatarSize, avatarSize)

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(24)
        doc.setTextColor(0, 0, 139)
        const name = (selectedStaff?.name).toUpperCase()

        const nameWidth = doc.getTextWidth(name)
        const nameX = (pageWidth - nameWidth) / 2
        doc.text(name, nameX, centerY + avatarSize + 10)

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(22)
        doc.setTextColor(0, 0, 139)
        const designation = selectedStaff['designation'].name

        const designationWidth = doc.getTextWidth(designation)
        const designationX = (pageWidth - designationWidth) / 2
        doc.text(designation, designationX, centerY + avatarSize + 20)

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(22)
        doc.setTextColor(0, 0, 0)

        const startX = 10
        const valueX = 80
        const startY = centerY + avatarSize + 40
        const lineSpacing = 12
        const maxWidth = 120

        const staffDetails = [
          { title: 'Father', value: selectedStaff.father },
          { title: 'Date of Birth', value: selectedStaff.dob },
          { title: 'Bloodgroup', value: selectedStaff.bloodgroup },
          { title: 'Phone', value: selectedStaff.phone },
          {
            title: 'Address',
            value: `${selectedStaff.address1}, ${selectedStaff.address2}, ${selectedStaff.district}, ${selectedStaff.state}, ${selectedStaff.pincode}`
          }
        ]

        let yOffset = startY

        staffDetails.forEach((item, index) => {
          let textValue = item.value

          if (item.title === 'Address') {
            textValue = doc.splitTextToSize(item.value, maxWidth)
          }

          doc.setFont('helvetica', 'normal')
          doc.text(item.title, startX, yOffset)

          doc.text(':', valueX - 5, yOffset)

          doc.setFont('helvetica', 'bold')

          if (Array.isArray(textValue)) {
            textValue.forEach((line, i) => {
              doc.text(line, valueX, yOffset + i * 12)
            })
            yOffset += textValue.length * 12
          } else {
            doc.text(textValue, valueX, yOffset)
            yOffset += lineSpacing
          }

          if (index !== staffDetails.length - 1) {
            doc.setDrawColor(200, 230, 250)
            doc.setLineWidth(1)
            doc.line(10, yOffset - 8, 200, yOffset - 8)
          }
        })

        const fileName = `${selectedStaff?.name || 'staff'}.pdf`
        doc.save(fileName)
      }
    } catch (error) {
      console.log(error)
      if (error?.status === 404) {
        showErrorToast(error?.response?.data?.error, 5000)
      } else {
        showErrorToast('Something went wrong', 5000)
      }
    } finally {
      setLoading(prev => ({ ...prev, generateCard: false }))
    }
  }

  // ** Open dialog
  const openDialog = (dialog, row) => {
    setDialogOpen(prev => ({ ...prev, [dialog]: true }))
  }

  // ** Close dialog
  const closeDialog = dialog => {
    setDialogOpen(prev => ({ ...prev, [dialog]: false }))
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Personal
        control={control}
        errors={errors}
        states={states}
        bloodgroups={bloodgroups}
        photo={photo}
        handleAvatarClick={handleAvatarClick}
        handleAvatarChange={handleAvatarChange}
      />
      <Communication control={control} errors={errors} />
      <Professional control={control} errors={errors} designationList={designationList} />
      <Salary control={control} errors={errors} />
      <Card sx={{ marginTop: 5 }}>
        <CardHeader sx={{ pb: 5 }} title='Uploads' titleTypographyProps={{ variant: 'h6' }} />
        <CardContent>
          <DocumentUpload />
          <Grid item xs={12} sm={12} mt={5} overflow='auto'>
            <Box display='flex' justifyContent='space-between' alignItems='center'>
              <Box display='flex' alignItems='center'>
                <DescriptionIcon sx={{ mr: 1, color: 'text.secondary' }} fontSize='large' />
                <Typography variant='body2' sx={{ mr: 1 }}>
                  {fileName || 'No files uploaded'}
                </Typography>
              </Box>

              {file && (
                <Box display='flex' alignItems='center'>
                  <VisibilityIcon
                    fontSize='medium'
                    sx={{ cursor: 'pointer', color: 'text.secondary', mr: 1 }}
                    onClick={viewFile}
                  />
                  {canDelete && (
                    <DeleteIcon
                      fontSize='medium'
                      sx={{ cursor: 'pointer', color: 'text.secondary' }}
                      onClick={() => {
                        openDialog('delete')
                      }}
                    />
                  )}
                </Box>
              )}
            </Box>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={3} mt={5}>
        <Grid item xs={6} sm='auto'>
          <LoadingButton
            loading={loading['submit']}
            disabled={isUpdate ? !canEdit : !canCreate}
            loadingPosition='start'
            startIcon={<Icon icon='formkit:submit' />}
            size='large'
            type='submit'
            variant='contained'
          >
            Submit
          </LoadingButton>
        </Grid>
        <Grid item xs={6} sm='auto'>
          {isUpdate && (
            <LoadingButton
              loading={loading['generateCard']}
              disabled={!canPrint}
              loadingPosition='start'
              startIcon={<Icon icon='mingcute:idcard-line' />}
              size='large'
              type='button'
              variant='outlined'
              onClick={printCard}
            >
              ID Card
            </LoadingButton>
          )}
        </Grid>
      </Grid>
      <Dialog
        open={isDialogOpen['delete']}
        onClose={() => closeDialog('delete')}
        aria-labelledby='alert-dialog-title'
        aria-describedby='alert-dialog-description'
      >
        <DialogTitle id='alert-dialog-title'>{'Delete Document'}</DialogTitle>
        <DialogContent>
          <DialogContentText id='alert-dialog-description'>
            Are you sure you want to delete this document?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => closeDialog('delete')} sx={{ color: 'error.main' }}>
            No
          </Button>
          <Button
            onClick={() => {
              setFile(null)
              setFileName('')
              closeDialog('delete')
            }}
            autoFocus
          >
            Yes
          </Button>
        </DialogActions>
      </Dialog>
    </form>
  )
}

export default EditStaff
