const express = require('express');
const fs = require('fs');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const { initScheduler, runJobSearchCampaign } = require('./services/schedulerService');
const { parseResume } = require('./services/resumeParser');
const { findMatchesForCandidate } = require('./services/recruiterService');
const { searchAllPlatforms, searchGlobalCandidates } = require('./services/scraperService');

const User = require('./models/User');
const Job = require('./models/Job');
const Application = require('./models/Application');
const RecruiterRequirement = require('./models/RecruiterRequirement');

require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    socket.emit('log', { message: '⚡ System Connected: Real-time logs active.', type: 'info', timestamp: new Date() });
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads directory exists
if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
}

// Cloudinary configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Cloudinary storage for resumes
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'resumes',
        resource_type: 'auto',
        allowed_formats: ['pdf', 'doc', 'docx'],
        public_id: (req, file) => Date.now() + '-' + file.originalname.split('.')[0]
    },
});
const upload = multer({ storage });

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        // Set a timeout to ensure scheduler starts after server is ready
        setTimeout(() => initScheduler(io), 2000);
    })
    .catch(err => console.error('MongoDB connection error:', err));

// WebSocket instance sharing
app.set('socketio', io);

// Candidate API
app.get('/api/recruiter/candidates', async (req, res) => {
    try {
        const { skills, location, minExperience } = req.query;
        let query = {};

        if (skills) {
            const skillArray = skills.split(',').map(s => s.trim());
            query.skills = { $in: skillArray.map(s => new RegExp(s, 'i')) };
        }

        if (location) {
            query.$or = [
                { 'jobRequirements.city': new RegExp(location, 'i') },
                { 'jobRequirements.state': new RegExp(location, 'i') },
                { 'jobRequirements.country': new RegExp(location, 'i') }
            ];
        }

        if (minExperience) {
            query.experienceYears = { $gte: parseInt(minExperience) };
        }

        const candidates = await User.find(query);
        res.json(candidates);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Recruiter Requirements CRUD
app.get('/api/recruiter/requirements', async (req, res) => {
    try {
        const { recruiterEmail } = req.query;
        let query = recruiterEmail ? { recruiterEmail } : {};
        const requirements = await RecruiterRequirement.find(query);
        res.json(requirements);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/recruiter/requirements', async (req, res) => {
    try {
        const requirement = new RecruiterRequirement(req.body);
        await requirement.save();
        res.status(201).json(requirement);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/recruiter/requirements/:id', async (req, res) => {
    try {
        await RecruiterRequirement.findByIdAndDelete(req.params.id);
        res.json({ message: 'Requirement deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/recruiter/requirements/:id/matches', async (req, res) => {
    try {
        const reqDoc = await RecruiterRequirement.findById(req.params.id);
        if (!reqDoc) return res.status(404).send('Requirement not found');

        const query = {
            skills: { $in: reqDoc.skills.map(s => new RegExp(s, 'i')) },
            experienceYears: { $gte: reqDoc.minExperience || 0 }
        };

        if (reqDoc.location) {
            query.$or = [
                { 'jobRequirements.city': new RegExp(reqDoc.location, 'i') },
                { 'jobRequirements.state': new RegExp(reqDoc.location, 'i') },
                { 'jobRequirements.country': new RegExp(reqDoc.location, 'i') }
            ];
        }

        const candidates = await User.find(query);
        res.json(candidates);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/upload', upload.single('resume'), (req, res) => {
    if (!req.file) return res.status(400).send('No file uploaded');
    res.json({ url: req.file.path });
});

app.post('/api/user/toggle-campaign', async (req, res) => {
    try {
        const { email, isActive } = req.body;
        console.log(`Toggling campaign for ${email} to ${isActive}`);
        const user = await User.findOneAndUpdate({ email }, { isActive }, { new: true });
        if (!user) {
            console.error(`Toggle failed: User ${email} not found`);
            return res.status(404).json({ error: 'User profiles not found for this email. Please save your profile first.' });
        }

        // Trigger immediate search if starting
        if (isActive) {
            runJobSearchCampaign(io, email);
        }

        res.json({ success: true, isActive: user.isActive });
    } catch (err) {
        console.error('Toggle Error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/user/profile', async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) return res.status(400).json({ error: 'Email is required' });
        const user = await User.findOne({ email });
        if (!user) return res.status(200).json(null); // Return null if not found (dashboard handles this)
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/user/profile', async (req, res) => {
    try {
        const { email, name, skills, jobRequirements, resumeUrl, experienceYears, linkedinUrl, indeedUrl, naukriUrl } = req.body;
        if (!email || !name) return res.status(400).json({ error: 'Email and Name are required' });

        let user = await User.findOne({ email });

        let finalSkills = skills || [];
        let finalExp = experienceYears || 0;

        if (resumeUrl && (!skills || skills.length === 0)) {
            const fileName = resumeUrl.split('/').pop();
            const filePath = path.join(__dirname, 'uploads', fileName);
            if (fs.existsSync(filePath)) {
                const { keywords, experienceYears: exp } = await parseResume(filePath);
                finalSkills = [...new Set([...(skills || []), ...(keywords || [])])];
                finalExp = exp || experienceYears || 0;
            }
        }

        if (user) {
            user.name = name;
            user.skills = finalSkills;
            user.jobRequirements = jobRequirements;
            user.resumeUrl = resumeUrl;
            user.experienceYears = finalExp;
            user.linkedinUrl = linkedinUrl;
            user.indeedUrl = indeedUrl;
            user.naukriUrl = naukriUrl;
            await user.save();
        } else {
            user = new User({ email, name, skills: finalSkills, jobRequirements, resumeUrl, experienceYears: finalExp, linkedinUrl, indeedUrl, naukriUrl });
            await user.save();
        }

        // Trigger recruiter matching
        findMatchesForCandidate(user, io);

        // Trigger automated job search if requirements are present AND campaign is active
        if (user.isActive && jobRequirements && (jobRequirements.roles?.length > 0 || jobRequirements.skills?.length > 0)) {
            runJobSearchCampaign(user, io);
        }

        res.json(user);
    } catch (err) {
        console.error('Profile Update Error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/users/:email', async (req, res) => {
    try {
        await User.findOneAndDelete({ email: req.params.email });
        res.json({ message: 'Campaign deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/jobs', async (req, res) => {
    try {
        const { email } = req.query;
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        let query = {
            status: { $ne: 'Applied' },
            createdAt: { $gte: twentyFourHoursAgo }
        };

        if (email) query.userEmail = email;
        const jobs = await Job.find(query).sort({ createdAt: -1 });
        res.json(jobs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/jobs/apply/:id', async (req, res) => {
    try {
        const job = await Job.findByIdAndUpdate(req.params.id, { status: 'Applied' }, { new: true });
        const app = new Application({
            jobId: job._id,
            title: job.title,
            company: job.company,
            userEmail: job.userEmail,
            date: new Date()
        });
        await app.save();
        res.json({ message: 'Applied successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/applications', async (req, res) => {
    try {
        const { email } = req.query;
        let query = email ? { userEmail: email } : {};
        const apps = await Application.find(query).sort({ date: -1 });
        res.json(apps);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/applications/:id', async (req, res) => {
    try {
        await Application.findByIdAndDelete(req.params.id);
        res.json({ message: 'History item removed' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/recruiter/global-search', async (req, res) => {
    try {
        const { skills, location, minExperience } = req.query;
        if (!skills || !location) {
            return res.status(400).json({ error: 'Skills and Location are required for global discovery' });
        }
        const candidates = await searchGlobalCandidates(skills, location, io, minExperience);
        res.json(candidates);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/', (req, res) => {
    res.send('Job Notifier Backend is running');
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    initScheduler(io);
});
