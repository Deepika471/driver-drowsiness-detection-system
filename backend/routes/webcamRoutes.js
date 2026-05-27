// backend/routes/webcamRoutes.js
const express = require("express");
const router = express.Router();
const axios = require("axios");
const authMiddleware = require("../middleware/authMiddleware");
const mongoose = require("mongoose");

// Reuse the already-registered Prediction model from server.js
const getPredictionModel = () => {
  try {
    return mongoose.model("Prediction");
  } catch {
    const predictionSchema = new mongoose.Schema({
      userId:          { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      image:           String,
      predicted_class: String,
      state:           String,
      confidence:      { type: mongoose.Schema.Types.Mixed },
      source:          { type: String, default: "webcam" },
      detectedBy:      { type: String, default: "CNN" },
    }, { timestamps: true });
    return mongoose.model("Prediction", predictionSchema);
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/detect-frame
// Every frame — sends to Flask, returns prediction (not saved).
// Saving is handled separately by /save-drowsy-event.
// ─────────────────────────────────────────────────────────────
router.post("/detect-frame", authMiddleware, async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ message: "No image data received" });
    }

    let flaskResponse;
    try {
      flaskResponse = await axios.post(
        "http://127.0.0.1:5000/predict-base64",
        { image: imageBase64 },
        { headers: { "Content-Type": "application/json" }, timeout: 8000 }
      );
    } catch (err) {
      console.error("❌ Flask error (detect-frame):", err.message);
      return res.status(500).json({ message: "Python server not reachable" });
    }

    // Return prediction result — do NOT save every frame to DB
    res.json(flaskResponse.data);

  } catch (error) {
    console.error("DETECT-FRAME ERROR:", error.message);
    res.status(500).json({ message: "Frame prediction failed" });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/save-drowsy-event
// Called ONCE per drowsy event when streak threshold is hit.
// Saves a single record — no Flask call, data from frontend.
// ─────────────────────────────────────────────────────────────
router.post("/save-drowsy-event", authMiddleware, async (req, res) => {
  try {
    const { predicted_class, state, confidence, detectedBy } = req.body;

    if (!predicted_class || !state) {
      return res.status(400).json({ message: "Missing prediction data" });
    }

    const Prediction = getPredictionModel();
    const record = await Prediction.create({
      userId:          req.user.id,
      image:           "webcam_drowsy_event",
      predicted_class: predicted_class,
      state:           state,
      confidence:      confidence || {},
      source:          "webcam",
      detectedBy:      detectedBy || "CNN",
    });

    console.log(`💾 Drowsy event saved [${detectedBy}]:`, predicted_class);
    res.json(record);

  } catch (error) {
    console.error("SAVE-DROWSY-EVENT ERROR:", error.message);
    res.status(500).json({ message: "Failed to save drowsy event" });
  }
});

module.exports = router;