// utils/sendEmail.js
const nodemailer = require('nodemailer');

async function sendEmail(to, subject, text) {
  // Configure your SMTP settings
  const transporter = nodemailer.createTransport({
    // SMTP settings
  });

  // Send email
  await transporter.sendMail({
    from: '"A Cleaner Tomorrow" margaritatikis@gmail.com',
    to: to,
    subject: subject,
    text: text
  });
}

module.exports = sendEmail;
