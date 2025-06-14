// ** MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import { Grid } from '@mui/material'

// ** Custom Hooks
import { useAuth } from 'src/hooks/useAuth'

const Home = () => {
  // ** Hooks
  const { user } = useAuth()

  return (
    <Grid container spacing={6}>
      <Grid item xs={12} sm={6}>
        <Card>
          <CardHeader sx={{ pb: 5 }} title={`Hi, ${user?.name}`} titleTypographyProps={{ variant: 'h6' }} />
          <CardContent>Welcome to Smart Paper</CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

Home.acl = {
  action: 'view',
  subject: 'home'
}

export default Home
