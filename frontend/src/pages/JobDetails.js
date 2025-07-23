import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  Grid, 
  Button,
  Chip,
  Rating,
  TextField,
  Alert,
  useTheme
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const { isAuthenticated, user } = useAuth();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newReview, setNewReview] = useState({
    rating: 5,
    comment: ''
  });

  useEffect(() => {
    fetchJobDetails();
  }, [id]);

  const fetchJobDetails = async () => {
    try {
      const response = await axios.get(`/api/jobs/${id}`);
      setJob(response.data.job);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch job details');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    try {
      await axios.post(`/api/jobs/${id}/apply`, {
        userId: user._id,
        status: 'pending'
      });
      setJob(prev => ({
        ...prev,
        applications: [...prev.applications, {
          user: user._id,
          status: 'pending'
        }]
      }));
      navigate('/profile');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to apply for job');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      await axios.post(`/api/jobs/${id}/reviews`, {
        ...newReview,
        jobId: id,
        userId: user._id
      });
      setJob(prev => ({
        ...prev,
        reviews: [...prev.reviews, {
          ...newReview,
          user: user._id,
          date: new Date().toISOString()
        }],
        rating: ((prev.reviews.reduce((sum, review) => sum + review.rating, 0) + newReview.rating) / 
          (prev.reviews.length + 1)).toFixed(1)
      }));
      setNewReview({ rating: 5, comment: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review');
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography>Loading job details...</Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Paper elevation={3}>
          {/* Job Header */}
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Typography variant="h4" component="h1" gutterBottom>
                  {job.title}
                </Typography>
                <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                  {job.category}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Rating value={job.rating} readOnly precision={0.5} size="small" />
                  <Typography variant="body2" color="text.secondary">
                    ({job.reviews.length} reviews)
                  </Typography>
                </Box>
                <Typography variant="body1" paragraph>
                  {job.description}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle1">Budget</Typography>
                    <Typography variant="h6" color="primary">
                      {job.price}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle1">Location</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {job.location}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle1">Posted</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle1">Deadline</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(job.deadline).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>

          {/* Job Details */}
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Job Details
            </Typography>
            <Typography variant="body1" paragraph>
              {job.details}
            </Typography>
          </Box>

          {/* Requirements */}
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Requirements
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {job.requirements?.map((requirement, index) => (
                <Chip
                  key={index}
                  label={requirement}
                  color="primary"
                  size="small"
                />
              ))}
            </Box>
          </Box>

          {/* Apply Button */}
          {isAuthenticated && (
            <Box sx={{ p: 3, textAlign: 'right' }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleApply}
              >
                Apply for Job
              </Button>
            </Box>
          )}

          {/* Reviews Section */}
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Reviews
            </Typography>
            {isAuthenticated && (
              <Box sx={{ mb: 3 }}>
                <form onSubmit={handleReviewSubmit}>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Rating
                      value={newReview.rating}
                      onChange={(event, newValue) => {
                        setNewReview({ ...newReview, rating: newValue });
                      }}
                      size="small"
                    />
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      placeholder="Write your review..."
                      value={newReview.comment}
                      onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                    />
                  </Box>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    size="small"
                  >
                    Submit Review
                  </Button>
                </form>
              </Box>
            )}
            {job.reviews.map((review, index) => (
              <Box key={index} sx={{ mb: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Rating value={review.rating} readOnly size="small" />
                      <Typography variant="subtitle2">
                        {review.user.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(review.date).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      {review.comment}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            ))}
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default JobDetails;
