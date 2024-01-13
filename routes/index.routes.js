const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const schedule = require('node-schedule');
const axios = require("axios");

const isLoggedIn = require("../middleware/isLoggedIn");
const User = require("../models/User.model");
const Schedule = require("../models/Schedule.model");

// Set up nodemailer transporter for Hotmail
const transporter = nodemailer.createTransport({
  service: 'hotmail',
  auth: {
    user: 'schwarz.duscheleit@hotmail.de', // Replace with your Hotmail email
    pass: process.env.PASSWORD // Replace with your Hotmail email password or an application-specific password
  }
});

// Function to send email
const sendEmail = (recipient, data) => {
  const mailOptions = {
    from: 'schwarz.duscheleit@hotmail.de', // Replace with your Hotmail email
    to: recipient,
    subject: 'Daily API Data',
    text: JSON.stringify(data, null, 2) // Convert data to JSON string for simplicity
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
};

// Function to call Google Cloud Function
const callCloudFunction = async (region) => {
  const url = "https://europe-west3-engaged-card-410714.cloudfunctions.net/function-6";
  const params = { "region": region };

  try {
    const response = await axios.post(url, params);
    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error(`Error: ${response.status}, ${response.data}`);
    }
  } catch (error) {
    throw new Error(`Request failed: ${error.message}`);
  }
}

// POST route to configure daily email sending for logged-in users
router.post('/email', async (req, res) => {
  try {
    const { region } = req.body;

    if (req.session.currentUser) {
      const user = await User.findById(req.session.currentUser._id);
      const recipient = user.email;

      if (!user.scheduled.includes(region)) {
        const scheduledTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
        const scheduledJob = schedule.scheduleJob(scheduledTime, async () => {
          try {
            const scheduleData = await callCloudFunction(region);
            sendEmail(recipient, { message: scheduleData.message, forecast: scheduleData.forecast_result });
          } catch (error) {
            console.error('Error occurred:', error);
          }
        });

        const job = await Schedule.create({ region: region, job: scheduledJob.name });
        await User.findByIdAndUpdate(req.session.currentUser._id, { $push: { my_schedules: job._id, scheduled: region } }, { new: true });

        const apiData = await callCloudFunction(region);
        sendEmail(recipient, {message: apiData.message, forecast: apiData.forecast_result });
        res.status(200).json({ success: true, message: 'Email sent successfully' });
        } else {
        res.json({ message: "You already scheduled a mailing for this region" });
        }
        } else {
        // For non-logged-in users, no email is scheduled
        res.status(200).json({ success: true, message: 'Region stored successfully' });
        }
        } catch (error) {
        console.error('Error occurred:', error);
        res.status(500).json({ success: false, error: error.message });
        }
        });
        
        // Endpoint to handle fetching data for a specific region
        router.get("/fetch-region-data/:region", async (req, res) => {
        try {
        const { region } = req.params;
        const result = await callCloudFunction(region);
        res.json(result);
        } catch (err) {
        console.error(err.message);
        res.status(500).send('Internal Server Error while fetching region data');
        }
        });
        
        // Other existing routes...
        router.get("/", (req, res) => {
        const myRegions = ["Badenwürtemmberg", "Brandenburg", "Bayern"];
        res.render("index");
        });
        
        router.get("/regions", isLoggedIn, (req, res) => {
        const myRegions = ["50Hertz"];
        res.render("regions", { regions: myRegions });
        });
        
        router.get("/regions/:region", async (req, res) => {
        const myRegion = req.params.region;
        try {
        const result = await callCloudFunction(myRegion);
        // Render the recommendation view with data
        res.render("recommendation", { region: myRegion, result: result });
        } catch (err) {
        console.error(err.message);
        res.status(500).send('Internal Server Error');
        }
        });
        
        router.get("/cancel/:region", async (req, res) => {
        // ... existing logic for canceling scheduled jobs ...
        });
        
        module.exports = router;
