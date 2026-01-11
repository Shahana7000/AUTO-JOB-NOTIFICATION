const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  resumeUrl: { type: String },
  linkedinUrl: { type: String },
  indeedUrl: { type: String },
  naukriUrl: { type: String },
  skills: [{ type: String }],
  experience: { type: String },
  experienceYears: { type: Number },
  jobRequirements: {
    roles: [{ type: String }],
    locations: [{ type: String }],
    country: { type: String },
    state: { type: String },
    city: { type: String },
    remote: { type: Boolean, default: false }
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
