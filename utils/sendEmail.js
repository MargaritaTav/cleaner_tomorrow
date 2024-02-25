const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp-mail.outlook.com", // Hotmail/Outlook SMTP server
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: "schwarz.duscheleit@hotmail.de", // your Hotmail email address
    pass: process.env.AOL_EMAIL_PASS, // your Hotmail password
  },
  tls: {
    ciphers: "SSLv3",
  },
});
async function sendEmail(to, subject, text) {
  try {
    // Nodemailer configuration for Hotmail
    
    // Configure your SMTP settings for AOL using environment variables

    // Send email
    await transporter.sendMail({
      from: "schwarz.duscheleit@hotmail.de", // Use the same AOL email for sender
      to: to,
      subject: subject,
      text: text,
    });
  } catch (error) {
    console.log(error);
  }
}

module.exports = sendEmail;
