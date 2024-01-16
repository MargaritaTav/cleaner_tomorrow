const { Schema, model } = require("mongoose");

// TODO: Please make sure you edit the User model to whatever makes sense in this case
const scheduleSchema = new Schema(
  {
      region: {
      type: String,
      required: false,
      unique: true
    }, 
    job: {
        type: Object
    }
    
  },
  {
    // this second object adds extra properties: `createdAt` and `updatedAt`
    timestamps: true,
  }
);

const Schedule = model("Schedule", scheduleSchema);

module.exports = Schedule;
