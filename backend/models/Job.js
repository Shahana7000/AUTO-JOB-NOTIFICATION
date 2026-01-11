const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    title: { type: String, required: true },
    company: { type: String, required: true },
    location: { type: String },
    link: { type: String, required: true, unique: true },
    platform: { type: String, enum: ['LinkedIn', 'Indeed', 'Naukri'], required: true },
    postedAt: { type: Date },
    description: { type: String },
    requirements: [{ type: String }],
    isNewMatch: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Job', jobSchema);
