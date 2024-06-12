const express = require("express");
const axios = require("axios");
const mongoose = require("mongoose");
const router = express.Router();
const { OAuth2Client } = require("google-auth-library");
const { google } = require("googleapis");
const MailComposer = require("nodemailer/lib/mail-composer");
const RegionData = require("../models/RegionData"); // Adjust the path as needed
const Subscription = require("../models/Subscription");
const emailjs = require("@emailjs/browser");


const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const SCOPES = "https://www.googleapis.com/auth/gmail.send";

async function refreshAccessToken(client) {
  try {
    const { tokens } = await client.refreshToken(process.env.REFRESH_TOKEN);

    return tokens;
    // Call your function to send an email using the new access token
  } catch (error) {
    console.error("Error refreshing refresh token:", error.message);
  }
}

async function fetchAndSaveMultipleRegions(regions) {
  console.log("Fetching and saving data for regions:", regions);
  try {
    for (const region of regions) {
      const url = `https://us-central1-engaged-card-410714.cloudfunctions.net/new-function`;
      const response = await axios.post(url, { region }); // Pass the region in the request body
      // only create new when not empty
      console.log(response.data.forecast_result.length);
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
});

const oAuth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

router.get("/authorize", (req, res) => {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
  res.redirect(authUrl);
});

router.get("/callback", async (req, res) => {
  const { code } = req.query;

  try {
    const tokenResponse = await oAuth2Client.getToken(code);
    const accessToken = tokenResponse.tokens.access_token;
    console.log(tokenResponse);
    // Use the accessToken to make requests to the Gmail API or perform other actions

    res.send(
      "Authorization successful! You can now make requests to the Gmail API."
    );
  } catch (error) {
    console.error("Error exchanging code for tokens:", error.message);
    res.status(500).send("Error exchanging code for tokens");
  }
});

router.get("/sendmail", async (req, res) => {
  res.status(200).json({ message: "Email sending in progress" });
  const regions = ["50Hertz", "TenneT", "TransnetBW", "Amprion"];

  let tokens = {
    access_token: process.env.ACCESS_TOKEN,
    refresh_token: process.env.REFRESH_TOKEN,
    scope: "https://www.googleapis.com/auth/gmail.send",
    token_type: "Bearer",
    expiry_date: process.env.EXP_DATE,
    // other properties like token_type, expiry_date, etc., may also be present
  };
  let client = new OAuth2Client(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
  );
  client.setCredentials(tokens);

  async function sendEmail(options) {
    const gmail = google.gmail({ version: "v1", auth: client });

    try {
      const encodeMessage = (message) => {
        return Buffer.from(message)
          .toString("base64")
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, "");
      };

      const createMail = async (options) => {
        const mailComposer = new MailComposer(options);
        const message = await mailComposer.compile().build();
        return encodeMessage(message);
      };

      const sendMail = async (options) => {
        const rawMessage = await createMail(options);
        const { data: { id } = {} } = await gmail.users.messages.send({
          userId: "me",
          resource: {
            raw: rawMessage,
          },
        });
        return id;
      };

      const messageId = await sendMail(options);

      console.log("Email sent successfully:", messageId);
    } catch (error) {
      console.error("Error sending email:", error.message);

      // Check if the error is due to an expired access token
      if (
        error.message.includes("invalid_grant") ||
        error.message.includes("Invalid Credentials")
      ) {
        console.log("Access token expired. Refreshing and retrying...");
        let newAuthClient = new OAuth2Client(
          process.env.CLIENT_ID,
          process.env.CLIENT_SECRET,
          process.env.REDIRECT_URI
        );
        const newTokens = await refreshAccessToken(newAuthClient);

        console.log(newTokens);
        process.env.ACCESS_TOKEN = newTokens.access_token;
        process.env.EXP_DATE = newTokens.expiry_date;
        tokens = {
          access_token: process.env.ACCESS_TOKEN,
          refresh_token: process.env.REFRESH_TOKEN,
          scope: "https://www.googleapis.com/auth/gmail.send",
          token_type: "Bearer",
          expiry_date: process.env.EXP_DATE,
          // other properties like token_type, expiry_date, etc., may also be present
        };
        newAuthClient.setCredentials(tokens);

        client = newAuthClient;

        // Retry sending the email after refreshing the token
        await sendEmail(options);
      } else {
        // Handle other errors or rethrow the error if needed
        throw error;
      }
    }
  }

  try {
    // send email with updated data to all subscribers
    await fetchAndSaveMultipleRegions(regions);
  } catch (error) {
    console.log(error);
  } finally {
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
    console.log(Hertz);
    //await sendEmail("schwarz.duscheleit@hotmail.de", "test", "Data")
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
    const currentDate = new Date().toLocaleDateString();
    const emailOptionsArray = [
      {
        to: "energyguideforecast@gmail.com",
        cc: hertzArray,
        subject: "Hello Energy SAVER - 50Hertz",
        text: "blabla",
        html: `<p>🙋🏻‍♀️  &mdash; This is a <b>report</b> on optimal energy consumption for 50Hertz for ${currentDate} . ${Hertz.data.forecast_result}</p>`,
        // ... other options
      },
      {
        to: "energyguideforecast@gmail.com",
        cc: tennetArray,
        subject: "Hello Energy SAVER - TenneT",
        text: "blabla",
        html: `<p>🙋🏻‍♀️  &mdash; This is a <b>report</b> on optimal energy consumption for TenneT for ${currentDate} .${TenneT.data.forecast_result}</p>`,
        // ... other options
      },
      {
        to: "energyguideforecast@gmail.com",
        cc: transnetArray,
        subject: "Hello Energy SAVER - TenneT",
        text: "blabla",
        html: `<p>🙋🏻‍♀️  &mdash; This is a <b>report</b> on optimal energy consumption for TransnetBW for ${currentDate} .${TransnetBW.data.forecast_result}</p>`,
        // ... other options
      },
      {
        to: "energyguideforecast@gmail.com",
        cc: amprionArray,
        subject: "Hello Energy SAVER - TenneT",
        text: "blabla",
        html: `<p>🙋🏻‍♀️  &mdash; This is a <b>report</b> on optimal energy consumption for Amprion for ${currentDate} .${Amprion.data.forecast_result}</p>`,
        // ... other options
      },
    ];
    //  const options = {
    //   to: 'margaritatikis@gmail.com',
    //   cc: '',
    //   replyTo: '',
    //   subject: 'Hello Energy SAVER',
    //   text: 'This email is sent from Future Tomorrow',
    //   html: `<p>🙋🏻‍♀️  &mdash; This is a <b>report</b> onoptimal energy consumption.</p>`,

    //   textEncoding: 'base64',
    //   headers: [
    //     { key: 'X-Application-Developer', value: 'Amit Agarwal' },
    //     { key: 'X-Application-Version', value: 'v1.0.0.2' },
    //   ],
    // };
    for (const options of emailOptionsArray) {
      try {
        await sendEmail(options);
      } catch (error) {
        console.error(`Error sending email: ${error}`);
        // Handle the error for email sending if needed
      }
    }
  }
});

router.get("/refresh", async (req, res) => {
  try {
    let client = new OAuth2Client(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      process.env.REDIRECT_URI
    );

    const tokens = await refreshAccessToken(client);
    console.log(tokens);
    res.json({ message: "New Token" });
  } catch (error) {
    console.log(error);
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
    console.log(Hertz);
    //await sendEmail("schwarz.duscheleit@hotmail.de", "test", "Data")
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
    const currentDate = new Date().toLocaleDateString();

    const hertzbccEmails = hertzArray.join(",");
    const tennetbccEmails = tennetArray.join(",");
    const transnetbccEmails = transnetArray.join(",");
    const amprionbccEmails = amprionArray.join(",");

    // Construct the email message object
    const hertzMessage = {
      to_email: "schwarz.duscheleit@hotmail.de",
      bcc: hertzbccEmails, // Add CC email addresses here
      subject: "Hello Energy SAVER - 50Hertz",
      message: Hertz.data.forecast_result,
    };
    const tennetMessage = {
      to_email: "schwarz.duscheleit@hotmail.de",
      bcc: tennetbccEmails, // Add CC email addresses here
      subject: "Hello Energy SAVER - 50Hertz",
      message: Hertz.data.forecast_result,
    };
    const transnetMessage = {
      to_email: "schwarz.duscheleit@hotmail.de",
      bcc: transnetbccEmails, // Add CC email addresses here
      subject: "Hello Energy SAVER - 50Hertz",
      message: Hertz.data.forecast_result,
    };
    const amprionMessage = {
      to_email: "schwarz.duscheleit@hotmail.de",
      bcc: amprionbccEmails, // Add CC email addresses here
      subject: "Hello Energy SAVER - 50Hertz",
      message: Hertz.data.forecast_result,
    };


   
    res.json({messages: [hertzMessage, tennetMessage, transnetMessage, amprionMessage]})
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
