// backend/routes/webcamRoutes.js
const express = require("express");
const router = express.Router();
const axios = require("axios");
const authMiddleware = require("../middleware/authMiddleware");
const mongoose = require("mongoose");

// Reuse the same Prediction model shape from server.js
// We reference the already-registered model to avoid re-registration errors
const getPredictionModel = () => {
  try {
    return mongoose.model("Prediction");
  } catch {
    const predictionSchema = new mongoose.Schema({
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      image: String,
      predicted_class: String,
      state: String,
      confidence: { type: mongoose.Schema.Types.Mixed },
      source: { type: String, default: "webcam" }, // 'upload' or 'webcam'
    }, { timestamps: true });
    return mongoose.model("Prediction", predictionSchema);
  }
};

// POST /api/detect-frame
// Accepts base64 image from webcam, sends to Flask, saves to DB
router.post("/detect-frame", authMiddleware, async (req, res) => {
  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ message: "No image data received" });
    }

    // Forward base64 directly to Flask — Flask handles decode
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

    const result = flaskResponse.data;

    // Save to MongoDB (same Prediction collection, tagged as webcam)
    const Prediction = getPredictionModel();
    const record = await Prediction.create({
      userId: req.user.id,
      image: "webcam_frame",
      predicted_class: result.predicted_class,
      state: result.state,
      confidence: result.confidence,
      source: "webcam",
    });

    res.json(record);
  } catch (error) {
    console.error("DETECT-FRAME ERROR:", error.message);
    res.status(500).json({ message: "Frame prediction failed" });
  }
});

module.exports = router;
