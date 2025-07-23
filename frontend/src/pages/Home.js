import React, { useState } from 'react';
import { 
  Container, 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  TextField,
  Button,
  Card,
  CardContent,
  CardMedia,
  Rating,
  useTheme
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');

  const featuredJobs = [
    {
      title: 'House Cleaning',
      category: 'Cleaning',
      price: '$25/hour',
      rating: 4.5,
      image: 'https://source.unsplash.com/800x600/?cleaning',
      description: 'Professional house cleaning services available in your area.',
    },
    {
      title: 'Lawn Mowing',
      category: 'Gardening',
      price: '$30/hour',
      rating: 4.8,
      image: 'https://source.unsplash.com/800x600/?gardening',
      description: 'Keep your lawn looking great with our professional mowing services.',
    },
    {
      title: 'Pet Sitting',
      category: 'Pet Care',
      price: '$20/hour',
      rating: 4.7,
      image: 'https://source.unsplash.com/800x600/?pets',
      description: 'Trusted pet sitting services for your furry friends.',
    },
  ];

  const categories = [
    'Cleaning',
    'Gardening',
    'Pet Care',
    'Handyman',
    'Tutoring',
    'Delivery',
  ];

  const handleSearch = () => {
    // Implement search functionality
    console.log('Searching for:', { searchQuery, category, location });
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: 8,
          mb: 4,
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography
                variant="h2"
                component="h1"
                gutterBottom
                sx={{ fontWeight: 'bold' }}
              >
                Find Local Jobs and Services
              </Typography>
              <Typography variant="h5" paragraph>
                Connect with trusted professionals in your area for any job you need done.
              </Typography>
              {isAuthenticated && (
                <Button
                  variant="contained"
                  color="secondary"
                  size="large"
                  onClick={() => navigate('/post-job')}
                  sx={{ mt: 2 }}
                >
                  Post a Job
                </Button>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper
                component="form"
                sx={{
                  p: 3,
                  display: 'flex',
                  flexDirection: { xs: 'column', md: 'row' },
                  gap: 2,
                }}
              >
                <TextField
                  fullWidth
                  placeholder="What service do you need?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  variant="outlined"
                  size="small"
                />
                <TextField
                  select
                  fullWidth
                  label="Category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  variant="outlined"
                  size="small"
                  SelectProps={{
                    native: true,
                  }}
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </TextField>
                <TextField
                  fullWidth
                  placeholder="Location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  variant="outlined"
                  size="small"
                />
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleSearch}
                  sx={{
                    flexShrink: 0,
                    minWidth: { md: 150 },
                  }}
                >
                  Find Jobs
                </Button>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Featured Jobs Section */}
      <Container maxWidth="lg" sx={{ mb: 4 }}>
        <Typography variant="h4" component="h2" gutterBottom>
          Featured Jobs
        </Typography>
        <Grid container spacing={3}>
          {featuredJobs.map((job, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <CardMedia
                  component="img"
                  height="200"
                  image={job.image}
                  alt={job.title}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h5" component="h3">
                    {job.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {job.description}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Rating value={job.rating} readOnly precision={0.5} size="small" />
                    <Typography variant="body2" color="text.secondary">
                      ({job.rating})
                    </Typography>
                  </Box>
                  <Typography variant="h6" color="primary">
                    {job.price}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Categories Section */}
      <Container maxWidth="lg" sx={{ mb: 4 }}>
        <Typography variant="h4" component="h2" gutterBottom>
          Browse by Category
        </Typography>
        <Grid container spacing={2}>
          {categories.map((category, index) => (
            <Grid item xs={6} sm={4} md={2} key={index}>
              <Button
                variant="outlined"
                fullWidth
                sx={{
                  textTransform: 'none',
                  borderRadius: 2,
                  padding: 2,
                }}
              >
                {category}
              </Button>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default Home;
