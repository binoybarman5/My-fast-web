import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  Box, 
  TextField,
  Button,
  Chip,
  Rating,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const Jobs = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Get filters from URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    setSearchQuery(searchParams.get('query') || '');
    setCategory(searchParams.get('category') || '');
    setLocationFilter(searchParams.get('location') || '');
    setSort(searchParams.get('sort') || 'newest');
    setPage(parseInt(searchParams.get('page')) || 1);
    fetchJobs();
  }, [location.search]);

  const fetchJobs = async () => {
    try {
      const response = await axios.get('/api/jobs', {
        params: {
          query: searchQuery,
          category: category,
          location: locationFilter,
          sort: sort,
          page: page,
        },
      });
      setJobs(response.data.jobs);
      setTotalPages(response.data.totalPages);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const searchParams = new URLSearchParams({
      query: searchQuery,
      category: category,
      location: locationFilter,
      sort: sort,
      page: 1,
    });
    navigate(`/jobs?${searchParams.toString()}`);
  };

  const handleSortChange = (event) => {
    setSort(event.target.value);
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('sort', event.target.value);
    navigate(`/jobs?${searchParams.toString()}`);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('page', newPage);
    navigate(`/jobs?${searchParams.toString()}`);
  };

  return (
    <Box sx={{ py: 4 }}>
      <Container maxWidth="lg">
        {/* Search Bar */}
        <Paper
          component="form"
          sx={{
            p: 3,
            mb: 4,
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 2,
          }}
        >
          <TextField
            fullWidth
            placeholder="Search jobs..."
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
            <option value="cleaning">Cleaning</option>
            <option value="gardening">Gardening</option>
            <option value="pet-care">Pet Care</option>
            <option value="handyman">Handyman</option>
            <option value="tutoring">Tutoring</option>
            <option value="delivery">Delivery</option>
          </TextField>
          <TextField
            fullWidth
            placeholder="Location"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            variant="outlined"
            size="small"
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleSearch}
            sx={{
              flexShrink: 0,
              minWidth: { md: 150 },
            }}
          >
            Search
          </Button>
        </Paper>

        {/* Sort Options */}
        <Box sx={{ mb: 4 }}>
          <TextField
            select
            fullWidth
            label="Sort by"
            value={sort}
            onChange={handleSortChange}
            variant="outlined"
            size="small"
            SelectProps={{
              native: true,
            }}
          >
            <option value="newest">Newest First</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
          </TextField>
        </Box>

        {/* Jobs List */}
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography>Loading jobs...</Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {jobs.map((job) => (
              <Grid item xs={12} sm={6} md={4} key={job._id}>
                <Paper
                  sx={{
                    p: 2,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" component="h3">
                      {job.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      {job.location}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Rating
                        value={job.rating}
                        readOnly
                        precision={0.5}
                        size="small"
                      />
                      <Typography variant="body2" color="text.secondary">
                        ({job.reviews.length})
                      </Typography>
                    </Box>
                  </Box>

                  <Typography variant="body1" paragraph>
                    {job.description}
                  </Typography>

                  <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {job.tags.map((tag) => (
                        <Chip
                          key={tag}
                          label={tag}
                          size="small"
                          sx={{
                            bgcolor: theme.palette.primary.light,
                            color: theme.palette.primary.contrastText,
                          }}
                        />
                      ))}
                    </Box>
                    <Typography variant="h6" color="primary">
                      {job.price}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="outlined"
              disabled={page === 1}
              onClick={() => handlePageChange(page - 1)}
            >
              Previous
            </Button>
            <Box sx={{ mx: 2 }}>
              <Typography>
                Page {page} of {totalPages}
              </Typography>
            </Box>
            <Button
              variant="outlined"
              disabled={page === totalPages}
              onClick={() => handlePageChange(page + 1)}
            >
              Next
            </Button>
          </Box>
        )}

        {/* Post Job Button */}
        {isAuthenticated && (
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Button
              variant="contained"
              color="secondary"
              onClick={() => navigate('/post-job')}
              sx={{
                px: 4,
                py: 2,
              }}
            >
              Post a Job
            </Button>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default Jobs;
