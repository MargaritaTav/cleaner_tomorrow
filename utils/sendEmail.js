const nodemailer = require('nodemailer');

async function sendEmail(to, subject, text) {
  // Configure your SMTP settings for AOL using environment variables
  const transporter = nodemailer.createTransport({
    service: 'AOL',
    auth: {
      user: process.env.AOL_EMAIL_USER,
      pass: process.env.AOL_EMAIL_PASS
    }
  });

  // Send email
  await transporter.sendMail({
    from: `"Energy Guide" <${process.env.AOL_EMAIL_USER}>`, // Use the same AOL email for sender
    to: to,
    subject: subject,
    text: text
  });
}

module.exports = sendEmail;
