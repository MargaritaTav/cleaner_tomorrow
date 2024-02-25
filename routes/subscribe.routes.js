const express = require('express');
const router = express.Router();
const axios = require('axios');
const RegionData = require('../models/RegionData'); // Adjust the path as needed
const Subscription = require("../models/Subscription");


// Corrected the path to the Subscription model
const sendEmail = require('../utils/sendEmail'); // Ensure the path to sendEmail is also correct


async function fetchAndSaveMultipleRegions(regions) {
  console.log('Fetching and saving data for regions:', regions);
  try {
      for (const region of regions) {
          const url = `https://us-central1-engaged-card-410714.cloudfunctions.net/new-function`;
          const response = await axios.post(url, { region });  // Pass the region in the request body
          // only create new when not empty

          // here comes the code to check if dat ais not empty
          const newData = new RegionData({ region, data: response.data });
          await newData.save();
          console.log('Data saved successfully for region:', region);
      }
      console.log('Data fetching and saving completed for all requested regions.');
  } catch (error) {
      console.error('An error occurred during fetch and save:', error);
      throw error;  // Rethrow the error to handle it in the calling function
  }
}

router.post('/subscribe', async (req, res) => {
  const { email, region } = req.body;
    try {
        // Logic to save or update the subscription in the database
        const existingSubscription = await Subscription.findOne({ email, region });
        if (existingSubscription) {
            // Update existing subscription if necessary
            console.log(`Subscription already exists for ${email} in ${region}`);
        } else {
            // Create a new subscription
            const newSubscription = new Subscription({ email, region });
            await newSubscription.save();
            // Send confirmation email
            await sendEmail(email, 'Subscription Confirmation', `You've subscribed successfully to receive daily forecasts for ${region}.`);
            console.log(`New subscription created for ${email} in ${region}`);
        }
        res.status(200).send('Subscription successful');
    } catch (error) {
        console.error('Subscription error:', error);
        res.status(500).send('Error processing subscription');
    }
});

router.post("/report", async (req, res) => {
  // Define an array of regions
  const regions = ['50Hertz', 'TenneT', 'TransnetBW', 'Amprion'];
  try {
      // update data in database
      await fetchAndSaveMultipleRegions(regions);
      console.log('All regions processed');
      
      // send email with updated data to all subscribers
      const subscribers  = await Subscription.find();


      const Hertz = await RegionData.findOne({ region: '50Hertz' }).sort({ createdAt: -1 });
      const TenneT = await RegionData.findOne({ region: 'TenneT' }).sort({ createdAt: -1 });
      const TransnetBW = await RegionData.findOne({ region: 'TransnetBW' }).sort({ createdAt: -1 });
      const Amprion = await RegionData.findOne({ region: 'Amprion' }).sort({ createdAt: -1 });
    console.log(Hertz)

      await sendEmail("schwarz.duscheleit@hotmail.de", "test", "Data")
      // const emailPromises = subscribers.map((sub) => {
      //   switch(sub.region) {
      //     case '50Hertz':
      //       return(sendEmail(sub.email, "YOur daily energy guide subscription", Hertz.data.forecast_result))
      //       break;
      //     case 'TenneT':
      //       return(sendEmail(sub.email, "YOur daily energy guide subscription", TenneT.data.forecast_result))
      //       break;
      //     case 'TransnetBW':
      //     return(sendEmail(sub.email, "YOur daily energy guide subscription", TransnetBW.data.forecast_result))
      //     break;
      //     case 'Amprion':
      //       return(sendEmail(sub.email, "YOur daily energy guide subscription", Amprion.data.forecast_result))
      //       break;
      //   }
        
      // })
      //await Promise.all(emailPromises);
      res.status(200).json({message: "Done"})

  } catch (error) {
    console.log(error)
  }
})

module.exports = router;


// // Retrieve the latest saved data for the region
// const latestData = await RegionData.findOne({ region }).sort({ createdAt: -1 });

// if (!latestData) {
//     return res.status(404).send('No data found for the specified region');
// }

// // Extract forecast_result from the nested "data" object
// const forecastResult = latestData.data.forecast_result;