// Example Subscriber model (adjust fields as necessary)
const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  email: { type: String, required: true },
  region: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});


const Subscription = mongoose.model('Subscription', subscriptionSchema); // Correct the casing of regiondataSchema

module.exports = mongoose.model('Subscription', subscriptionSchema);


