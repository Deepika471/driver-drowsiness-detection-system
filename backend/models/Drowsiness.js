const mongoose = require("mongoose");

const drowsinessSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  eyeState: {
    type: String, // "open" or "closed"
  },
  status: {
    type: String, // "drowsy" or "alert"
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Drowsiness", drowsinessSchema);