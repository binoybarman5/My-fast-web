import React, { useState } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  TextField,
  Button,
  Box,
  Grid,
  Chip,
  Alert,
  Autocomplete,
  useTheme
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const PostJob = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const theme = useTheme();

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    details: '',
    price: '',
    location: '',
    deadline: '',
    requirements: [],
    tags: []
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const categories = [
    'Cleaning',
    'Gardening',
    'Pet Care',
    'Handyman',
    'Tutoring',
    'Delivery',
    'Other'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRequirementsChange = (event, newValue) => {
    setFormData(prev => ({
      ...prev,
      requirements: newValue
    }));
  };

  const handleTagsChange = (event, newValue) => {
    setFormData(prev => ({
      ...prev,
      tags: newValue
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await axios.post('/api/jobs', {
        ...formData,
        userId: user._id,
        createdAt: new Date().toISOString(),
        deadline: new Date(formData.deadline).toISOString()
      });

      setSuccess('Job posted successfully!');
      setTimeout(() => {
        navigate('/jobs');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post job');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Post a New Job
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Basic Information */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Basic Information
                </Typography>
                <TextField
                  fullWidth
                  label="Job Title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  sx={{ mb: 2 }}
                />
                <Autocomplete
                  options={categories}
                  value={formData.category}
                  onChange={(event, newValue) => {
                    setFormData(prev => ({ ...prev, category: newValue }));
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Category"
                      required
                    />
                  )}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Budget"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  type="number"
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Deadline"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleInputChange}
                  required
                  type="datetime-local"
                  sx={{ mb: 2 }}
                />
              </Grid>

              {/* Job Description */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Job Description
                </Typography>
                <TextField
                  fullWidth
                  label="Job Description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  multiline
                  rows={4}
                  required
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Detailed Requirements"
                  name="details"
                  value={formData.details}
                  onChange={handleInputChange}
                  multiline
                  rows={4}
                  sx={{ mb: 2 }}
                />
              </Grid>

              {/* Requirements and Tags */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Additional Information
                </Typography>
                <Autocomplete
                  multiple
                  options={[]}
                  freeSolo
                  value={formData.requirements}
                  onChange={handleRequirementsChange}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        variant="outlined"
                        label={option}
                        {...getTagProps({ index })}
                        sx={{
                          bgcolor: theme.palette.primary.light,
                          color: theme.palette.primary.contrastText
                        }}
                      />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Requirements (press Enter to add)"
                      placeholder="e.g., experience required, specific tools needed"
                    />
                  )}
                  sx={{ mb: 2 }}
                />
                <Autocomplete
                  multiple
                  options={[]}
                  freeSolo
                  value={formData.tags}
                  onChange={handleTagsChange}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        variant="outlined"
                        label={option}
                        {...getTagProps({ index })}
                        sx={{
                          bgcolor: theme.palette.secondary.light,
                          color: theme.palette.secondary.contrastText
                        }}
                      />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Tags (press Enter to add)"
                      placeholder="e.g., urgent, flexible hours, experienced"
                    />
                  )}
                  sx={{ mb: 2 }}
                />
              </Grid>

              {/* Submit Button */}
              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  disabled={loading}
                  sx={{
                    px: 4,
                    py: 2,
                  }}
                >
                  {loading ? 'Posting...' : 'Post Job'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default PostJob;
