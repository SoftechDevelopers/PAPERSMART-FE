// React Imports
import { useState, useContext, useEffect } from 'react'
import { useApi } from 'src/@core/api/useApi'

// ** MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import Grid from '@mui/material/Grid'
import { Autocomplete, TextField, Box, Skeleton, Button, Backdrop } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import { useTheme } from '@mui/material/styles'

// ** Other Imports
import useCustomToast from 'src/@core/hooks/useCustomToast'
import { AbilityContext } from 'src/layouts/components/acl/Can'
import * as pdfjsLib from 'pdfjs-dist/webpack'
import { toByteArray } from 'base64-js'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import IconButton from '@mui/material/IconButton'
import DeleteIcon from '@mui/icons-material/Delete'

const Thumbnail = ({ id, src, index, handleDelete }) => {
  const theme = useTheme()
  const isDarkMode = theme.palette.mode === 'dark'
  const [isHovered, setIsHovered] = useState(false)

  const style = {
    width: '100%',
    height: '100%',
    zIndex: 'auto',
    opacity: 1,
    border: isDarkMode ? '2px solid rgba(255, 255, 255, 0.3)' : '2px solid rgba(0, 0, 0, 0.2)',
    boxShadow: isDarkMode ? '0px 4px 12px rgba(255, 255, 255, 0.2)' : '0px 4px 12px rgba(0, 0, 0, 0.1)',
    position: 'relative',
    overflow: 'hidden'
  }

  return (
    <Card style={style} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      <CardContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <img src={src} alt={`Thumbnail ${id}`} style={{ width: '100%', height: '100%' }} />
        </Box>
      </CardContent>

      {index !== 0 && isHovered && (
        <Backdrop
          open={true}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            zIndex: 2
          }}
        >
          <IconButton
            onMouseUp={() => handleDelete(id)}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              width: 28,
              height: 28,
              fontSize: 12,
              backgroundColor: 'rgba(255, 0, 0, 0.7)',
              color: '#ffffff',
              '&:hover': {
                backgroundColor: 'rgba(255, 0, 0, 1)'
              }
            }}
          >
            <DeleteIcon />
          </IconButton>
        </Backdrop>
      )}
    </Card>
  )
}

const MergePDF = () => {
  // ** States
  const [staff, setStaff] = useState(null)
  const [thumbnails, setThumbnails] = useState([])
  const [loading, setLoading] = useState({ loadPages: false, mergePDF: false, dropdown: false })
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const [file, setFile] = useState(null)
  const [dropdown, setDropdown] = useState({})
  const staffList = dropdown?.staff || []

  const ability = useContext(AbilityContext)
  const canCreate = ability.can('create', 'merge_pdf')
  const { apiRequest } = useApi()

  // ** Abort Controller
  const controller = new AbortController()
  const signal = controller.signal

  // ** Fetch dropdowns
  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        setLoading(prev => ({ ...prev, dropdown: true }))
        const data = await apiRequest('get', '/dropdowns?tables=staff', null, {}, signal)

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

  // ** Load thumbnails
  useEffect(() => {
    setThumbnails([])
    const selectedStaff = staffList.find(item => Number(item.id) === Number(staff))
    const pdfUrl = selectedStaff?.docs_url

    const loadPDF = async () => {
      try {
        setLoading(prev => ({ ...prev, loadPages: true }))

        const data = await apiRequest('get', '/merge_pdf?id=' + staff, null, {}, signal)

        const pdfArray = toByteArray(data?.pdf)

        const pdf = await pdfjsLib.getDocument({ data: pdfArray }).promise

        const page = await pdf.getPage(1)
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        const viewport = page.getViewport({ scale: 1 })
        canvas.width = viewport.width
        canvas.height = viewport.height

        const renderContext = {
          canvasContext: context,
          viewport
        }

        await page.render(renderContext).promise

        const firstPageThumbnail = canvas.toDataURL()
        setThumbnails([{ id: 0, src: firstPageThumbnail }])
      } catch (error) {
        if (error?.status === 404) {
          showErrorToast(error?.response?.data?.message, 5000)
        } else {
          showErrorToast('Something went wrong', 5000)
        }
      } finally {
        setLoading(prev => ({ ...prev, loadPages: false }))
      }
    }

    if (pdfUrl) {
      loadPDF()
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staff])

  // ** Delete the selected page
  const handleDelete = id => {
    setFile(null)
    setThumbnails(prevItems => prevItems.filter(item => Number(item.id) !== Number(id)))
  }

  // ** Trigger file input click
  const handleClick = () => {
    document.getElementById('file-input').click()
  }

  // ** Select the file
  const handleFileChange = async event => {
    const selectedFile = event.target.files[0]

    if (selectedFile && selectedFile.type === 'application/pdf') {
      generatePDFThumbnails(selectedFile)
    } else {
      showErrorToast('Please select a valid PDF file', 5000)
    }
  }

  // ** Add a new page to the thumbnail
  const generatePDFThumbnails = async file => {
    const reader = new FileReader()
    reader.readAsArrayBuffer(file)

    reader.onload = async e => {
      const pdfData = new Uint8Array(e.target.result)
      const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise

      if (pdf.numPages < 1) return
      const page = await pdf.getPage(1)
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      const viewport = page.getViewport({ scale: 1 })
      canvas.width = viewport.width
      canvas.height = viewport.height

      await page.render({ canvasContext: context, viewport }).promise
      const src = canvas.toDataURL()

      setThumbnails(prev => {
        if (prev.length === 0) {
          return [{ id: 0, src }]
        } else {
          return [prev[0], { id: 1, src }]
        }
      })
      setFile(file)
    }
  }

  // ** Merge pdf
  const mergePDF = async () => {
    if (!staff) {
      showErrorToast('No staff selected', 5000)

      return
    }

    if (!file) {
      showErrorToast('No new page selected', 5000)

      return
    }

    try {
      setLoading(prev => ({ ...prev, mergePDF: true }))
      const payload = new FormData()
      payload.append('staff_id', staff)
      payload.append('file', file)

      const data = await apiRequest('post', '/merge_pdf', payload, {}, null)
      showSuccessToast(data?.message, 5000)
    } catch (error) {
      showErrorToast('Error while merging the documents', 5000)
    } finally {
      setLoading(prev => ({ ...prev, mergePDF: false }))
    }
  }

  return (
    <Card>
      <CardHeader sx={{ pb: 5 }} title='Merge Documents' titleTypographyProps={{ variant: 'h6' }} />
      <CardContent>
        <Grid container spacing={6}>
          <Grid item xs={12} sm={6}>
            <Autocomplete
              options={staffList}
              getOptionLabel={option => option?.name || ''}
              onChange={(_, data) => {
                setFile(null)
                setStaff(data ? data.id : null)
              }}
              isOptionEqualToValue={(option, value) => option && value && option.id === value.id}
              renderInput={params => <TextField {...params} label='Staff' />}
              value={staffList.find(s => Number(s.id) === Number(staff)) || null}
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
          </Grid>

          {thumbnails && thumbnails.length > 0 && (
            <Grid item xs={12} sm={6}>
              <Box display='flex' justifyContent='flex-end'>
                <Button
                  variant='contained'
                  onClick={handleClick}
                  style={{
                    borderRadius: '50%',
                    padding: '10px',
                    minWidth: 'auto',
                    height: 'auto'
                  }}
                >
                  <Icon icon='ic:baseline-plus' />
                  <input
                    id='file-input'
                    type='file'
                    accept='application/pdf'
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                </Button>
              </Box>
            </Grid>
          )}
        </Grid>
        {!loading['loadPages'] ? (
          <Box sx={{ minHeight: 'calc(50vh)', width: '100%', marginTop: 6 }}>
            <Grid container spacing={4} sx={{ padding: 2 }}>
              {thumbnails.map((thumb, index) => (
                <Grid key={thumb.id} item xs={12} sm={6} md={4} lg={3} xl={2}>
                  <Thumbnail id={thumb.id} src={thumb.src} index={index} handleDelete={handleDelete} />
                </Grid>
              ))}
            </Grid>
          </Box>
        ) : (
          <Box sx={{ minHeight: 'calc(50vh)', width: '100%', marginTop: 6 }}>
            <Grid container spacing={4} sx={{ padding: 2 }}>
              {[1, 2].map((_, index) => (
                <Grid key={index} item xs={12} sm={6} md={4} lg={3} xl={2}>
                  <Box sx={{ padding: 0, height: '250px' }}>
                    <Skeleton variant='rounded' width='100%' height='100%' animation='wave' />
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </CardContent>
      <CardActions>
        <Grid item xs={6} sm={6}>
          <LoadingButton
            loading={loading['mergePDF']}
            disabled={!canCreate}
            loadingPosition='start'
            startIcon={<Icon icon='formkit:submit' />}
            size='large'
            type='button'
            variant='contained'
            sx={{ marginRight: 5 }}
            onClick={mergePDF}
          >
            Merge
          </LoadingButton>
        </Grid>
      </CardActions>
    </Card>
  )
}

export default MergePDF
