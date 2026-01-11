const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    status: { type: String, enum: ['Interested', 'Applied', 'Rejected'], default: 'Interested' },
    appliedAt: { type: Date },
    notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Application', applicationSchema);
