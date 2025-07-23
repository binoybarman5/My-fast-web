import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchJobs = createAsyncThunk(
  'jobs/fetchJobs',
  async ({ query, category, location, sort, page }) => {
    const response = await axios.get('/api/jobs', {
      params: {
        query,
        category,
        location,
        sort,
        page,
      },
    });
    return response.data;
  }
);

export const fetchJob = createAsyncThunk(
  'jobs/fetchJob',
  async (id) => {
    const response = await axios.get(`/api/jobs/${id}`);
    return response.data.job;
  }
);

export const createJob = createAsyncThunk(
  'jobs/createJob',
  async (jobData, { getState }) => {
    const response = await axios.post('/api/jobs', jobData);
    return response.data;
  }
);

export const applyForJob = createAsyncThunk(
  'jobs/applyForJob',
  async (id) => {
    const response = await axios.post(`/api/jobs/${id}/apply`);
    return response.data;
  }
);

const initialState = {
  jobs: [],
  job: null,
  loading: false,
  error: null,
  totalPages: 1,
  currentPage: 1,
};

const jobsSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchJobs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchJobs.fulfilled, (state, action) => {
        state.loading = false;
        state.jobs = action.payload.jobs;
        state.totalPages = action.payload.totalPages;
        state.currentPage = action.payload.currentPage;
      })
      .addCase(fetchJobs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchJob.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchJob.fulfilled, (state, action) => {
        state.loading = false;
        state.job = action.payload;
      })
      .addCase(fetchJob.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(createJob.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createJob.fulfilled, (state, action) => {
        state.loading = false;
        state.job = action.payload;
      })
      .addCase(createJob.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(applyForJob.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(applyForJob.fulfilled, (state, action) => {
        state.loading = false;
        state.job = action.payload;
      })
      .addCase(applyForJob.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export default jobsSlice.reducer;
