const nodemailer = require('nodemailer');

const sendEmailNotification = async (job, userEmail) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject: `New Job Match: ${job.title} at ${job.company}`,
        html: `
      <h3>New Job Found!</h3>
      <p><strong>Title:</strong> ${job.title}</p>
      <p><strong>Company:</strong> ${job.company}</p>
      <p><strong>Location:</strong> ${job.location}</p>
      <p><strong>Platform:</strong> ${job.platform}</p>
      <p><a href="${job.link}" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">View Job</a></p>
    `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email sent for job: ${job.title}`);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

const notifyUser = (io, job, user) => {
    // Emit to socket
    io.emit('newJob', {
        ...job,
        message: `New job alert: ${job.title} at ${job.company}`
    });

    // Send email
    if (user && user.email) {
        sendEmailNotification(job, user.email);
    }
};

module.exports = { notifyUser };
