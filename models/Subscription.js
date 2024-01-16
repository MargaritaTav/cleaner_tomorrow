// models/Subscription.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const subscriptionSchema = new Schema({
  email: { type: String, required: true },
  region: { type: String, required: true }
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;
