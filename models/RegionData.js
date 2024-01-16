const mongoose = require('mongoose');

// Schema for RegionData
const regiondataSchema = new mongoose.Schema({
    region: {
        type: String,
        required: true
    },
    data: {
        type: Object,
        required: true
    }
}, { timestamps: true });  // Enable timestamps


// Create the model from the schema
const RegionData = mongoose.model('RegionData', regiondataSchema); // Correct the casing of regiondataSchema

module.exports = RegionData;
