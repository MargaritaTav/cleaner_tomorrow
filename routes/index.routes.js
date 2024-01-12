const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const schedule = require('node-schedule');
const axios = require("axios");

const isLoggedOut = require("../middleware/isLoggedOut");
const isLoggedIn = require("../middleware/isLoggedIn");

const User = require("../models/User.model");
const Schedule = require("../models/Schedule.model");

// Set up nodemailer transporter for Hotmail
const transporter = nodemailer.createTransport({
  service: 'hotmail',
  auth: {
    user: 'schwarz.duscheleit@hotmail.de',  // Replace with your Hotmail email
    pass: process.env.PASSWORD          // Replace with your Hotmail email password or an application-specific password
  }
});



// Function to send email
const sendEmail = (recipient, data) => {
  const mailOptions = {
    from: 'schwarz.duscheleit@hotmail.de',  // Replace with your Hotmail email
    to: recipient,
    subject: 'Daily API Data',
    text: JSON.stringify(data, null, 2)  // Convert data to JSON string for simplicity
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
};

// Function to fetch data (replace this with your actual implementation)
const fetchData = async () => {
  // Implement your data fetching logic here
  // For example, make an API request
  // Return the fetched data
  return { example: 'data' };
};

const callCloudFunction = async (region) => {
  const url = "https://europe-west3-engaged-card-410714.cloudfunctions.net/function-6";
  const params = {"region": region};

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


// POST route to configure daily email sending
router.post('/email', async (req, res) => {
  try {
    const {region} = req.body;

    // get user form database to schedule daily messaging if it has not been done for this region yet
    const user = await User.findById(req.session.currentUser._id);
    const recipient = user.email;

    // Schedule daily messages if this regions has not already been added
    if (!user.scheduled.includes(region)) {
      const scheduledTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

      const scheduledJob = schedule.scheduleJob(scheduledTime, async () => {
        try {

          // Use the recipient from the variable
          const scheduleData = await callCloudFunction(region);
          sendEmail(recipient, {message: scheduleData.message, forecast: scheduleData.forecast_result});
        } catch (error) {
          console.error('Error occurred:', error);
        }
      });
    // // Store the scheduled job information (its id) in the database to be able to remove it later
    const job = await Schedule.create({ region: region, job: scheduledJob.name });

    const updateJob = await User.findByIdAndUpdate(
      req.session.currentUser._id,
      {
       
        $push: { my_schedules: job._id }
      },
      { new: true } // Return the updated document
    );

    const updateRegion = await User.findByIdAndUpdate(
      req.session.currentUser._id,
      {
        $push: { scheduled: region },
        
      },
      { new: true } // Return the updated document
    );

    // Send confirmation Email once
    const apiData = await callCloudFunction(region);
    console.log(apiData)
    sendEmail(recipient, {message: apiData.message, forecast: apiData.forecast_result});

    res.status(200).json({ success: true, message: 'Email sent successfully' });
  } else {
    res.json({message: "You already scheduled a mailing for this region"})
  }
      
  } catch (error) {
    console.error('Error occurred:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});


router.get("/", (req, res) => {

  const myRegions = ["Badenwürtemmberg", "Brandenburg", "Bayern"]

  res.render("index")
});

router.get("/regions", isLoggedIn, (req, res) => {
  const myRegions = ["50Hertz"]

  res.render("regions", {regions: myRegions})
}
);


router.get("/regions/:region", async (req, res) => {
  const myRegion = req.params.region;
  console.log(myRegion)
  try {
      const result = await callCloudFunction(myRegion);
      console.log(result);

      // Here you can use 'result' to do further processing if needed.

      // Render the recommendation view with data
      res.render("recommendation", { region: myRegion, result: result });
  } catch (err) {
      console.error(err.message);

      // Handle errors and respond to the client accordingly
      res.status(500).send('Internal Server Error');
  }
});

router.get("/cancel/:region", async (req, res) => {

  try {
  const region = req.params.region; // Assuming jobId is part of the route parameters

  const myUser = await User.findById(req.session.currentUser._id).populate("my_schedules");

  let jobIdToCancel;

  myUser.my_schedules.forEach(element => {
    if (element.region === region) {
      jobIdToCancel = element._id;
    }
  });

console.log(jobIdToCancel)
// // Retrieve the job document from the database using the jobId
const jobDocument = await Schedule.findOne({ _id: jobIdToCancel });

if (jobDocument) {
  console.log(jobDocument.job)  
  const scheduledJobName = jobDocument.job;
  const scheduledJob = schedule.scheduledJobs[scheduledJobName];

if (scheduledJob) {
  scheduledJob.cancel();
  // Remove the job document from the database if needed
  
  await Schedule.findOneAndDelete({ _id: jobDocument._id });

  // Remove the job reference from the user's my_schedules array
  await User.findByIdAndUpdate(req.session.currentUser._id, { $pull: { my_schedules: jobDocument._id } });

  // Remove the region from the user's scheduled array
  await User.findByIdAndUpdate(req.session.currentUser._id, { $pull: { scheduled: jobDocument.region } });

  res.status(200).json({ success: true, message: 'Job canceled successfully' });
} else {
  //If the Scheduled job is not active anymore (for example becasue of a server restart) I still need to remove it from the database
  // Remove the job document from the database if needed
  
  await Schedule.findOneAndDelete({ _id: jobDocument._id });
  // Remove the job reference from the user's my_schedules array
  await User.findByIdAndUpdate(req.session.currentUser._id, { $pull: { my_schedules: jobDocument._id } });

  // Remove the region from the user's scheduled array
  await User.findByIdAndUpdate(req.session.currentUser._id, { $pull: { scheduled: jobDocument.region } });

  res.status(404).json({ success: false, message: 'Scheduled job not found or not active: Cleaned up related database entries' });
  
}
} else {
  res.status(404).json({ success: false, message: 'Job document not found in the database: There is no active Schedule for this regions' });
}

} catch (err) {
  console.log(err)
}
});


module.exports = router;
