// ** React Imports
import { useState, useEffect, useMemo } from 'react'
import { useApi } from 'src/@core/api/useApi'

// ** MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import { Box, Grid, TextField, Select, Typography, Skeleton, IconButton } from '@mui/material'
import { FormControl, Autocomplete, MenuItem, InputLabel, CircularProgress } from '@mui/material'
import CustomChip from 'src/@core/components/mui/chip'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Other Imports
import useCustomToast from 'src/@core/hooks/useCustomToast'

const ProposalCard = ({ filteredProposals, loading, loadingProposal, handleDownload, handleEdit }) => {
  return (
    <Box
      sx={{
        height: '60vh',
        width: '100%',
        mt: 2,
        overflowY: 'auto',
        p: 2
      }}
    >
      {!loading['fetchAll'] ? (
        <Grid container spacing={6} sx={{ padding: 2 }}>
          {filteredProposals.map((item, index) => (
            <Grid item xs={12} sm={6} md={4} lg={4} xl={3} key={index}>
              <Card
                sx={{
                  height: 150,
                  width: '100%',
                  position: 'relative',
                  boxShadow: 2,
                  cursor: 'pointer',
                  transition: '0.3s',
                  '&:hover': {
                    boxShadow: 4,
                    backgroundColor: 'rgba(0, 0, 0, 0.1)'
                  }
                }}
              >
                <CardContent
                  sx={{
                    height: '100%',
                    padding: 0,
                    '&:last-child': { paddingBottom: 0 }
                  }}
                >
                  <Box
                    sx={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <Grid sx={{ padding: 5, width: '100%' }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%'
                        }}
                      >
                        <CustomChip
                          skin='light'
                          label={item.status}
                          color={item.status === 'Active' ? 'success' : 'error'}
                          size='small'
                        />
                        <Box>
                          <IconButton onClick={() => handleEdit(item)}>
                            <Icon icon='grommet-icons:edit' height={20} width={20} color='#8589FF' />
                          </IconButton>
                          <IconButton onClick={() => handleDownload(item)}>
                            {loadingProposal === item.id ? (
                              <CircularProgress size={25} color='inherit' />
                            ) : (
                              <Icon icon='ri:download-2-fill' height={25} width={25} color='#6D788D' />
                            )}
                          </IconButton>
                        </Box>
                      </Box>

                      <Typography variant='body1' sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        {item.date}
                      </Typography>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%'
                        }}
                      >
                        <Typography variant='body1' sx={{ fontSize: '13px' }}>
                          {item.ref_no}
                        </Typography>
                        <Typography variant='body1' sx={{ fontSize: '13px', color: 'error.dark' }}>
                          ₹{item.total}
                        </Typography>
                      </Box>
                      <Typography variant='body1' sx={{ fontSize: '13px', fontWeight: 'bold' }}>
                        {item.proposal_type.name}
                      </Typography>
                    </Grid>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Grid container spacing={6} sx={{ padding: 2 }}>
          {[...Array(10)].map((_, index) => (
            <Grid item xs={12} sm={6} md={4} lg={4} xl={3} key={index}>
              <Card
                sx={{
                  height: 150,
                  width: '100%',
                  position: 'relative',
                  boxShadow: 2,
                  cursor: 'pointer',
                  transition: '0.3s',
                  '&:hover': {
                    boxShadow: 4,
                    backgroundColor: 'rgba(0, 0, 0, 0.1)'
                  }
                }}
              >
                <CardContent
                  sx={{
                    height: '100%',
                    padding: 0,
                    '&:last-child': { paddingBottom: 0 }
                  }}
                >
                  <Box
                    sx={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <Grid sx={{ padding: 5, width: '100%' }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%'
                        }}
                      >
                        <Skeleton variant='text' sx={{ fontSize: '1rem', width: 50 }} />
                        <Skeleton variant='text' sx={{ fontSize: '1rem', width: 20 }} />
                      </Box>

                      <Skeleton variant='text' sx={{ fontSize: '1rem', width: 100 }} />
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%'
                        }}
                      >
                        <Skeleton variant='text' sx={{ fontSize: '1rem', width: 100 }} />
                        <Skeleton variant='text' sx={{ fontSize: '1rem', width: 70 }} />
                      </Box>
                      <Skeleton variant='text' sx={{ fontSize: '1rem', width: 180, height: 10 }} />
                    </Grid>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  )
}

const base64ToBlob = (base64, mimeType = 'application/pdf') => {
  const binary = Buffer.from(base64, 'base64')

  return new Blob([binary], { type: mimeType })
}

const ViewProposal = ({ dropdown, handleEdit }) => {
  // ** States
  const clientList = dropdown?.client || []
  const [selectedClient, setSelectedClient] = useState(null)
  const types = ['Active', 'Cancelled']
  const [status, setStatus] = useState(types[0])
  const [proposals, setProposals] = useState([])
  const [loading, setLoading] = useState({ fetchAll: false })
  const [loadingProposal, setLoadingProposal] = useState(null)

  // ** Abort Controller
  const controller = new AbortController()
  const signal = controller.signal

  // ** Custom Hooks
  const { apiRequest } = useApi()
  const { showErrorToast } = useCustomToast()

  // ** Fetch proposals of selected client

  useEffect(() => {
    fetchProposals()

    return () => {
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClient])

  const fetchProposals = async () => {
    try {
      setProposals([])
      setLoading(prev => ({ ...prev, fetchAll: true }))
      const data = await apiRequest('get', `/proposals?client_id=${selectedClient}`, null, {}, signal)
      setProposals(data)
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted')
      } else {
        console.error(error)
      }
    } finally {
      setLoading(prev => ({ ...prev, fetchAll: false }))
    }
  }

  // Filter proposals array according to status
  const filteredProposals = useMemo(() => {
    return proposals
      ?.filter(p => p.status.toLowerCase().includes(status.toLowerCase()))
      .map((proposal, index) => ({
        ...proposal,
        sno: index + 1
      }))
  }, [proposals, status])

  // ** Download PDF
  const handleDownload = async item => {
    try {
      setLoadingProposal(item.id)
      const response = await apiRequest('get', `/proposal?id=${item?.id}`, null, {}, signal)

      if (!response?.pdf) {
        showErrorToast('Invalid PDF response', 5000)
      }

      const blob = base64ToBlob(response.pdf, 'application/pdf')
      const pdfUrl = URL.createObjectURL(blob)
      window.open(pdfUrl, '_blank')
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted')
      } else {
        showErrorToast('Something went wrong', 5000)
      }
    } finally {
      setLoadingProposal(null)
    }
  }

  return (
    <Box>
      <Card>
        <CardHeader sx={{ pb: 5 }} title='Proposals' titleTypographyProps={{ variant: 'h6' }} />
        <CardContent>
          <Grid container spacing={6}>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                options={clientList}
                getOptionLabel={option => option?.name || ''}
                onChange={(_, data) => {
                  setSelectedClient(data ? data.id : null)
                }}
                isOptionEqualToValue={(option, value) => option && value && option.id === value.id}
                renderInput={params => <TextField {...params} label='Client' />}
                value={clientList.find(client => Number(client.id) === Number(selectedClient)) || null}
                renderOption={(props, option) => (
                  <li {...props} key={option.id} style={{ display: 'flex', alignItems: 'center' }}>
                    <div>
                      <span style={{ color: '#ff4d49' }}>{`ID: ${option.id}`}</span>
                      <br />
                      <span>{`Name: ${option.name}`}</span>
                    </div>
                  </li>
                )}
              />
            </Grid>
            {selectedClient && (
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    label='Status'
                    value={status}
                    onChange={e => {
                      setStatus(e.target.value)
                    }}
                  >
                    {types.map(type => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>
      <ProposalCard
        filteredProposals={filteredProposals}
        loading={loading}
        loadingProposal={loadingProposal}
        handleDownload={handleDownload}
        handleEdit={handleEdit}
      />
    </Box>
  )
}

export default ViewProposal
