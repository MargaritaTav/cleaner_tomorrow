const express = require('express');
const router = express.Router();
// Corrected the path to the Subscription model
const Subscription = require('../models/Subscription');
const sendEmail = require('../utils/sendEmail'); // Ensure the path to sendEmail is also correct

router.post('/subscribe', async (req, res) => {
  try {
    const { email, region } = req.body;
    const newSubscription = await new Subscription({ email, region }).save();

    // Send confirmation email
    await sendEmail(email, 'Subscription Confirmation', `You've subscribed successfully to receive daily forecasts for ${region}.`);

    res.status(200).json({ message: "Subscription successful", Subscription: newSubscription});
  } catch (error) {
    console.error('Subscription error:', error);
    res.status(500).send('Error processing subscription');
  }
});

module.exports = router;
