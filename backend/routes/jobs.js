const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Job = require('../models/Job');
const User = require('../models/User');

// @route   GET /api/jobs
// @desc    Get all jobs with filters and pagination
// @access  Public
router.get('/', async (req, res) => {
  try {
    const {
      query,
      category,
      location,
      sort,
      page = 1,
      limit = 10
    } = req.query;

    const queryObj = {};

    // Add search query
    if (query) {
      queryObj.$or = [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { tags: { $regex: query, $options: 'i' } }
      ];
    }

    // Add category filter
    if (category) {
      queryObj.category = category;
    }

    // Add location filter
    if (location) {
      queryObj.location = { $regex: location, $options: 'i' };
    }

    // Add status filter (only show active jobs)
    queryObj.status = 'active';

    // Sort options
    const sortOptions = {
      newest: '-createdAt',
      'price-low': 'price',
      'price-high': '-price',
      rating: '-rating'
    };

    const sortField = sortOptions[sort] || sortOptions.newest;

    // Pagination
    const skip = (page - 1) * limit;

    // Get total count
    const totalJobs = await Job.countDocuments(queryObj);
    const totalPages = Math.ceil(totalJobs / limit);

    const jobs = await Job.find(queryObj)
      .sort(sortField)
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name avatar rating')
      .populate('applications.user', 'name avatar rating')
      .populate('reviews.user', 'name avatar');

    res.json({
      jobs,
      totalJobs,
      totalPages,
      currentPage: page
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/jobs/:id
// @desc    Get a single job by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('userId', 'name avatar rating')
      .populate('applications.user', 'name avatar rating')
      .populate('reviews.user', 'name avatar');

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json(job);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Job not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST /api/jobs
// @desc    Create a new job
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const {
      title,
      category,
      description,
      details,
      price,
      location,
      deadline,
      requirements,
      tags
    } = req.body;

    // Create new job
    const job = new Job({
      title,
      category,
      description,
      details,
      price,
      location,
      deadline,
      requirements,
      tags,
      userId: req.user.id
    });

    // Save job
    await job.save();

    // Add job to user's jobsPosted array
    await User.findByIdAndUpdate(
      req.user.id,
      { $push: { jobsPosted: job._id } },
      { new: true }
    );

    res.status(201).json(job);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/jobs/:id
// @desc    Update a job
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if user owns the job
    if (job.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Update job
    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    res.json(updatedJob);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE /api/jobs/:id
// @desc    Delete a job
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if user owns the job
    if (job.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Remove job from user's jobsPosted array
    await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { jobsPosted: job._id } }
    );

    // Delete job
    await job.remove();

    res.json({ message: 'Job removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/jobs/:id/apply
// @desc    Apply for a job
// @access  Private
router.post('/:id/apply', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if job is active
    if (job.status !== 'active') {
      return res.status(400).json({ message: 'Job is not accepting applications' });
    }

    // Check if user has already applied
    const hasApplied = job.applications.some(
      app => app.user.toString() === req.user.id
    );

    if (hasApplied) {
      return res.status(400).json({ message: 'Already applied for this job' });
    }

    // Add application
    job.applications.push({
      user: req.user.id,
      status: 'pending'
    });

    // Save job
    await job.save();

    // Add job to user's jobsApplied array
    await User.findByIdAndUpdate(
      req.user.id,
      { $push: { jobsApplied: job._id } }
    );

    res.json(job);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/jobs/:id/reviews
// @desc    Add a review for a job
// @access  Private
router.post('/:id/reviews', auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if user has completed the job
    const application = job.applications.find(
      app => app.user.toString() === req.user.id && app.status === 'accepted'
    );

    if (!application) {
      return res.status(400).json({
        message: 'Only users who have completed the job can leave reviews'
      });
    }

    // Check if user has already reviewed
    const hasReviewed = job.reviews.some(
      review => review.user.toString() === req.user.id
    );

    if (hasReviewed) {
      return res.status(400).json({ message: 'Already reviewed this job' });
    }

    // Add review
    job.reviews.push({
      user: req.user.id,
      rating,
      comment
    });

    // Save job
    await job.save();

    res.json(job);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
