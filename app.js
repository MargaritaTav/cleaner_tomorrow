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

const app = express();

// ℹ️ This function is getting exported from the config folder. It runs most pieces of middleware
require("./config")(app);

const capitalize = require("./utils/capitalize");
const projectName = "information";
app.locals.appTitle = `${capitalize(projectName)}`;

// Function to fetch and save data for a region
// Function to fetch and save data for a region using POST request
// Function to fetch and save data for a region using POST request
// ...

// Helper function to fetch and save data for a region using POST request
// Define an array of regions once
// Define the async function
// Define an array of regions
async function fetchAndSaveMultipleRegions(regions) {
    try {
        for (const region of regions) {
            const url = `https://europe-west3-engaged-card-410714.cloudfunctions.net/function-6`;
            const response = await axios.post(url, { region });  // Pass the region in the request body
            const newData = new RegionData({ region, data: response.data });
            await newData.save();
            console.log('Data saved successfully for region:', region);
        }
    } catch (error) {
        console.error('Error fetching/saving data:', error);
    }
}


// Define an array of regions
const regions = ['50Hertz', 'TenneT', 'TransnetBW', 'Amprion'];

// Call the function with the array of regions
fetchAndSaveMultipleRegions(regions)
    .then(() => console.log('All regions processed'))
    .catch(error => console.error('An error occurred:', error));





// Schedule the cron job to run at a specific time
// Schedule the cron job to run at a specific time
cron.schedule('47 17 * * *', async () => {
    console.log('Cron job started at', new Date());
    await fetchAndSaveMultipleRegions(regions); // Call the function to fetch and save data for all regions
    console.log('Cron job finished at', new Date());
});






// Route to fetch data for a specific region using POST
// Route to fetch data for a specific region using POST
app.post('/region-data/:region', async (req, res) => {
    try {
        console.log(req.body)
        const region = req.params.region;
        await fetchAndSaveMultipleRegions([region]);  // Pass the region as an array

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

//const authRoutes = require("./routes/auth.routes");
//app.use("/auth", authRoutes);

// ❗ To handle errors. Routes that don't exist or errors that you handle in specific routes
require("./error-handling")(app);

// Export the app
module.exports = app;