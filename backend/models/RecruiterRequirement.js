const mongoose = require('mongoose');

const recruiterRequirementSchema = new mongoose.Schema({
    title: { type: String, required: true },
    skills: [{ type: String }],
    location: { type: String },
    minExperience: { type: Number, default: 0 },
    recruiterEmail: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('RecruiterRequirement', recruiterRequirementSchema);
