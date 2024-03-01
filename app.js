require("dotenv").config();

// ℹ️ Connects to the database
require("./db");

// Handles http requests (express is node js framework)
const express = require("express");

// Handles the handlebars
const hbs = require("hbs");

// Cron job and data fetching dependencies
const cron = require('node-cron');
const axios = require('axios');
const RegionData = require('./models/RegionData'); // Adjust the path as needed
const Subscription = require('./models/Subscription')

const app = express();

// ℹ️ This function is getting exported from the config folder. It runs most pieces of middleware
require("./config")(app);

const capitalize = require("./utils/capitalize");
const projectName = "information";
app.locals.appTitle = `${capitalize(projectName)}`;

// Define an array of regions
const regions = ['50Hertz', 'TenneT', 'TransnetBW', 'Amprion'];



// Function to fetch and save data for multiple regions
async function fetchAndSaveMultipleRegions(regions) {
    console.log('Fetching and saving data for regions:', regions);
    try {
        for (const region of regions) {
            const url = `https://us-central1-engaged-card-410714.cloudfunctions.net/new-function`;
            const response = await axios.post(url, { region });  // Pass the region in the request body
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


// Manual test route for data fetching and saving
app.get('/test-fetch', async (req, res) => {
    console.log('Manual test fetch initiated at', new Date());
    try {
        await fetchAndSaveMultipleRegions(regions);
        res.send('Data fetching and saving initiated successfully.');
    } catch (error) {
        console.error('Error during test fetch:', error);
        res.status(500).send('Error during test fetch.');
    }
});

// Route to fetch data for a specific region using POST
app.post('/region-data/:region', async (req, res) => {
    const region = req.params.region;
    try {
        console.log(req.body);
        

        // Retrieve the latest saved data for the region
        const latestData = await RegionData.findOne({ region }).sort({ createdAt: -1 });

        if (!latestData) {
            return res.status(404).send('No data found for the specified region');
        }

        // Extract forecast_result from the nested "data" object
        const forecastResult = latestData.data.forecast_result;

        // Respond with a success message and forecast_result
        res.status(200).json({ message: `Latest data fetched and saved for region: ${region}`, forecast_result: forecastResult });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).send('Server error');
    }
});


// 👇 Start handling routes here
const indexRoutes = require("./routes/index.routes");
app.use("/", indexRoutes);

const subscribeRoutes = require('./routes/subscribe.routes'); // Adjust the path as needed
app.use('/', subscribeRoutes);

// ❗ To handle errors. Routes that don't exist or errors that you handle in specific routes
require("./error-handling")(app);

// Export the app
module.exports = app;
