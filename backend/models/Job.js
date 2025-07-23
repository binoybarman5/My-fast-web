const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Cleaning', 'Gardening', 'Pet Care', 'Handyman', 'Tutoring', 'Delivery', 'Other']
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  details: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  deadline: {
    type: Date,
    required: true
  },
  requirements: [{
    type: String,
    trim: true
  }],
  tags: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  applications: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    appliedAt: {
      type: Date,
      default: Date.now
    }
  }],
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      required: true,
      min: 0,
      max: 5
    },
    comment: {
      type: String,
      trim: true
    },
    date: {
      type: Date,
      default: Date.now
    }
  }],
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update updatedAt timestamp before saving
jobSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Calculate average rating after saving a review
jobSchema.post('save', async function(doc) {
  if (doc.reviews.length > 0) {
    const totalRating = doc.reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / doc.reviews.length;
    await Job.findByIdAndUpdate(doc._id, { rating: averageRating });
  }
});

// Middleware to populate user information
jobSchema.methods.populateUser = async function() {
  const job = await Job.findById(this._id)
    .populate('userId', 'name avatar')
    .populate('applications.user', 'name avatar rating')
    .populate('reviews.user', 'name avatar');
  return job;
};

const Job = mongoose.model('Job', jobSchema);

module.exports = Job;
