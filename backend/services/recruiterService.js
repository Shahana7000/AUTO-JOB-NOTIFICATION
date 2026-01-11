const RecruiterRequirement = require('../models/RecruiterRequirement');

const findMatchesForCandidate = async (candidate, io) => {
    try {
        console.log(`Checking matching recruiter requirements for candidate: ${candidate.name}...`);

        // Find all recruiter requirements
        const requirements = await RecruiterRequirement.find();

        for (const req of requirements) {
            let matches = true;

            // 1. Check Skills (Inclusion)
            if (req.skills && req.skills.length > 0) {
                const candidateSkillsLower = (candidate.skills || []).map(s => s.toLowerCase());
                const matchingSkills = req.skills.filter(s =>
                    candidateSkillsLower.includes(s.toLowerCase())
                );
                if (matchingSkills.length === 0) matches = false;
            }

            // 2. Check Location
            if (matches && req.location) {
                const locRegex = new RegExp(req.location, 'i');
                const userLoc = candidate.jobRequirements || {};
                const candidateLocString = `${userLoc.city} ${userLoc.state} ${userLoc.country}`;
                if (!locRegex.test(candidateLocString)) matches = false;
            }

            // 3. Check Experience
            if (matches && req.minExperience) {
                if ((candidate.experienceYears || 0) < req.minExperience) matches = false;
            }

            if (matches) {
                console.log(`Match found! Notifying recruiter: ${req.recruiterEmail}`);
                // Emit event to all recruiters (simplification: in production, emit to specific recruiter's room)
                io.emit('recruiter-match', {
                    requirementId: req._id,
                    requirementTitle: req.title,
                    candidate: {
                        _id: candidate._id,
                        name: candidate.name,
                        email: candidate.email,
                        skills: candidate.skills,
                        experienceYears: candidate.experienceYears,
                        city: candidate.jobRequirements?.city,
                        country: candidate.jobRequirements?.country,
                        resumeUrl: candidate.resumeUrl
                    }
                });
            }
        }
    } catch (error) {
        console.error('Error in findMatchesForCandidate:', error);
    }
};

module.exports = { findMatchesForCandidate };
