const express = require('express');
const router = express.Router();
const axios = require('axios');
const RegionData = require('../models/RegionData'); // Adjust the path as needed
const Subscription = require("../models/Subscription");



async function fetchAndSaveMultipleRegions(regions) {
  console.log('Fetching and saving data for regions:', regions);
  try {
      for (const region of regions) {
          const url = `https://us-central1-engaged-card-410714.cloudfunctions.net/new-function`;
          const response = await axios.post(url, { region });  // Pass the region in the request body
          // only create new when not empty
          console.log(response.data.forecast_result.length)
          if (response.data.forecast_result.length !== 0) {
          // here comes the code to check if dat ais not empty
            const newData = new RegionData({ region, data: response.data });
            await newData.save();
            console.log('Data saved successfully for region:', region);
          }
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
            console.log(`New subscription created for ${email} in ${region}`);
        }
        res.status(200).send('Subscription successful');
    } catch (error) {
        console.error('Subscription error:', error);
        res.status(500).send('Error processing subscription');
    }
});


router.post("/dataupdate", async (req, res) => {
  res.status(200).json({message: "Data update in progress"})
  
  const regions = ['50Hertz', 'TenneT', 'TransnetBW', 'Amprion'];
try {

    fetchAndSaveMultipleRegions(regions)
    
      console.log("Data saved successfully");
    

  
} catch (error) {
  console.log(error)
}
  
})

module.exports = router;


