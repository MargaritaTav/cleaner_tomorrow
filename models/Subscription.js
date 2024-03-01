// Example Subscriber model (adjust fields as necessary)
const { Schema, model } = require("mongoose");


const subscriptionSchema = new Schema({
  email: { type: String, required: true },
  region: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});


const Subscription = model('Subscription', subscriptionSchema); // Correct the casing of regiondataSchema

module.exports = Subscription;


