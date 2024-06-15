const express = require("express");
const axios = require("axios");
const router = express.Router();
const RegionData = require("../models/RegionData"); // Adjust the path as needed
const Subscription = require("../models/Subscription");
const emailjs = require("@emailjs/browser");

// Define an array of regions
const regions = ["50Hertz", "TenneT", "TransnetBW", "Amprion"];

async function fetchAndSaveMultipleRegions(regions) {
  console.log("Fetching and saving data for regions:", regions);
  try {
    for (const region of regions) {
      const url = `https://us-central1-engaged-card-410714.cloudfunctions.net/new-function`;
      const response = await axios.post(url, { region }); // Pass the region in the request body
      // only create new when not empty
      
      if (response.data.forecast_result.length !== 0) {
        // here comes the code to check if dat ais not empty
        const newData = new RegionData({ region, data: response.data });
        await newData.save();
        console.log("Data saved successfully for region:", region);
      }
    }
    console.log(
      "Data fetching and saving completed for all requested regions."
    );
  } catch (error) {
    console.log("An error occurred during fetch and save:", error);
  }
}

router.get("/", (req, res) => {
  const currentDate = new Date().toLocaleDateString();
  res.render("index", { currentDate });
});

router.get("/about", (req, res) => {
  res.render("about");
})

// Route to fetch data for a specific region using POST
router.post("/region-data/:region", async (req, res) => {
  const region = req.params.region;
  try {
    console.log(req.body);

    // Retrieve the latest saved data for the region
    const latestData = await RegionData.findOne({ region }).sort({
      createdAt: -1,
    });

    if (!latestData) {
      return res.status(404).send("No data found for the specified region");
    }

    // Extract forecast_result from the nested "data" object
    const forecastResult = latestData.data.forecast_result;

    // Respond with a success message and forecast_result
    res
      .status(200)
      .json({
        message: `Latest data fetched and saved for region: ${region}`,
        forecast_result: forecastResult,
      });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).send("Server error");
  }
});

router.get("/emailjs", async (req, res) => {
  try {
    const regions = ["50Hertz", "TenneT", "TransnetBW", "Amprion"];
    await fetchAndSaveMultipleRegions(regions);
    const Hertz = await RegionData.findOne({ region: "50Hertz" }).sort({
      createdAt: -1,
    });
    const TenneT = await RegionData.findOne({ region: "TenneT" }).sort({
      createdAt: -1,
    });
    const TransnetBW = await RegionData.findOne({ region: "TransnetBW" }).sort({
      createdAt: -1,
    });
    const Amprion = await RegionData.findOne({ region: "Amprion" }).sort({
      createdAt: -1,
    });

    const subscribers = await Subscription.find();


    let hertzArray = [];
    let tennetArray = [];
    let transnetArray = [];
    let amprionArray = [];

    const emailAdresses = subscribers.map((sub) => {
      switch (sub.region) {
        case "50Hertz":
          hertzArray.push(sub.email);
          break;
        case "TenneT":
          tennetArray.push(sub.email);
          break;
        case "TransnetBW":
          transnetArray.push(sub.email);
          break;
        case "Amprion":
          amprionArray.push(sub.email);
          break;
      }
    });

    const hertzbccEmails = hertzArray.join(",");
    const tennetbccEmails = tennetArray.join(",");
    const transnetbccEmails = transnetArray.join(",");
    const amprionbccEmails = amprionArray.join(",");

    // // Construct the email message object
    const messages = [
      {
        to_email: "schwarz.duscheleit@hotmail.de",
        bcc: hertzbccEmails,
        subject: "Hello Energy SAVER - 50Hertz",
        message: Hertz.data.forecast_result,
      },
      {
        to_email: "schwarz.duscheleit@hotmail.de",
        bcc: tennetbccEmails,
        subject: "Hello Energy SAVER - TenneT",
        message: TenneT.data.forecast_result,
      },
      {
        to_email: "schwarz.duscheleit@hotmail.de",
        bcc: transnetbccEmails,
        subject: "Hello Energy SAVER - TransnetBW",
        message: TransnetBW.data.forecast_result,
      },
      {
        to_email: "schwarz.duscheleit@hotmail.de",
        bcc: amprionbccEmails,
        subject: "Hello Energy SAVER - Amprion",
        message: Amprion.data.forecast_result,
      }
    ];

    // emailjs.init(process.env.EMAIL_USER_ID);

    // emailPromises = messages.map((message) => {
      
    //     emailjs.send(
    //       process.env.EMAIL_SERVICE_ID,
    //       process.env.EMAIL_TEMPLATE_ID,
    //       message
    //   )
    // }
    // );

    // await Promise.all(emailPromises);

    res.json({
      messages: messages,
    });
  } catch (error) {
    console.log(error);
  }
});

// Manual test route for data fetching and saving
router.get("/test-fetch", async (req, res) => {
  console.log("Manual test fetch initiated at", new Date());
  try {
    await fetchAndSaveMultipleRegions(regions);
    res.send("Data fetching and saving initiated successfully.");
  } catch (error) {
    console.error("Error during test fetch:", error);
    res.status(500).send("Error during test fetch.");
  }
});

module.exports = router;
