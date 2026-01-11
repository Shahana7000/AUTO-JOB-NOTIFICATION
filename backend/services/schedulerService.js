const cron = require('node-cron');
const { searchAllPlatforms } = require('./scraperService');
const { notifyUser } = require('./notificationService');
const Job = require('../models/Job');
const User = require('../models/User');

const initScheduler = (io) => {
    // Run every hour
    cron.schedule('0 * * * *', async () => {
        console.log('Running background job search...');
        await runJobSearchCampaign(io);
    });
};

const runJobSearchCampaign = async (io) => {
    const sendLog = (message) => {
        console.log(message);
        io.emit('log', { message, timestamp: new Date() });
    };

    try {
        const users = await User.find({ isActive: true });
        sendLog(`Found ${users.length} active campaigns to run.`);

        for (const user of users) {
            sendLog(`Starting search for ${user.name}...`);
            let keywords = user.skills.join(' ');
            if (user.experienceYears) {
                keywords += ` ${user.experienceYears} years experience`;
            }

            const { country, state, city } = user.jobRequirements;
            const location = [city, state, country].filter(Boolean).join(', ') || 'Remote';

            sendLog(`Searching LinkedIn, Indeed, and Naukri for [${keywords}] in [${location}]...`);
            const foundJobs = await searchAllPlatforms(keywords, location);
            sendLog(`Fetched ${foundJobs.length} potential matches.`);

            for (const job of foundJobs) {
                // Check if job already exists in DB
                const existingJob = await Job.findOne({ link: job.link });

                if (!existingJob) {
                    const newJob = new Job(job);
                    await newJob.save();
                    sendLog(`New match found: ${job.title} at ${job.company}. Notifying user...`);

                    // Notify user
                    notifyUser(io, newJob, user);
                }
            }
        }
    } catch (error) {
        console.error('Error in search campaign:', error);
    }
};

module.exports = { initScheduler, runJobSearchCampaign };
